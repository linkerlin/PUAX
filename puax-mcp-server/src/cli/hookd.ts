/**
 * PUAX hook 常驻守护（可选）。
 *
 * 每事件 `exec node hook.js` 会付一次冷启动税。`puax hookd` 把引擎留在进程里，
 * 经本机 socket 接请求。宿主脚本不改：`mainHookCliWithStdin` 先探守护，失败则
 * 回落进程内 `runHook`（PUAX_HOOKD=0 强制回落）。
 */

import { createServer, createConnection, type Server, type Socket } from 'net';
import { chmodSync, existsSync, mkdirSync, unlinkSync, writeFileSync, readFileSync } from 'fs';
import { dirname } from 'path';
import { getPuaxHome, getPuaxPath } from '../utils/storage-paths.js';
import type { HookCliOptions } from './hook-cli.js';

const CONNECT_MS = 40;
const REQUEST_MS = 5000;

export function hookdSocketPath(): string {
  if (process.env.PUAX_HOOKD_SOCK) return process.env.PUAX_HOOKD_SOCK;
  if (process.platform === 'win32') return '\\\\.\\pipe\\puax-hookd';
  return getPuaxPath('hookd.sock');
}

export function hookdPidPath(): string {
  return getPuaxPath('hookd.pid');
}

export interface HookdPing {
  alive: boolean;
  socket: string;
  pid?: number;
}

interface WireRequest {
  v: 1;
  ping?: boolean;
  opts?: HookCliOptions;
}

interface WireResponse {
  v: 1;
  pong?: boolean;
  pid?: number;
  json?: string;
  error?: string;
}

function isPosixSock(path: string): boolean {
  return process.platform !== 'win32' && !path.startsWith('\\\\');
}

function readLine(socket: Socket, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('timeout'));
    }, timeoutMs);
    const onData = (chunk: Buffer | string) => {
      buf += chunk.toString();
      const nl = buf.indexOf('\n');
      if (nl >= 0) {
        cleanup();
        resolve(buf.slice(0, nl));
      }
    };
    const onErr = (err: Error) => {
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      clearTimeout(timer);
      socket.off('data', onData);
      socket.off('error', onErr);
    };
    socket.on('data', onData);
    socket.on('error', onErr);
  });
}

function connectOnce(path: string, timeoutMs: number): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ path });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('connect-timeout'));
    }, timeoutMs);
    socket.once('connect', () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function rpc(req: WireRequest): Promise<WireResponse | null> {
  if (process.env.PUAX_HOOKD === '0') return null;
  const path = hookdSocketPath();
  let socket: Socket;
  try {
    socket = await connectOnce(path, CONNECT_MS);
  } catch {
    return null;
  }
  try {
    socket.write(`${JSON.stringify(req)}\n`);
    const line = await readLine(socket, REQUEST_MS);
    const parsed = JSON.parse(line) as WireResponse;
    if (parsed && parsed.v === 1) return parsed;
    return null;
  } catch {
    return null;
  } finally {
    socket.destroy();
  }
}

/** doctor 同步探活：pid 文件 + kill(pid, 0)。CLI --status 用 ping。 */
export function hookdStatusSync(): HookdPing {
  const socket = hookdSocketPath();
  try {
    if (!existsSync(hookdPidPath())) return { alive: false, socket };
    const pid = Number.parseInt(readFileSync(hookdPidPath(), 'utf-8'), 10);
    if (!Number.isInteger(pid) || pid <= 0) return { alive: false, socket };
    process.kill(pid, 0);
    return { alive: true, socket, pid };
  } catch {
    return { alive: false, socket };
  }
}

/** CLI --status：探活，不跑检测引擎 */
export async function probeHookd(): Promise<HookdPing> {
  const socket = hookdSocketPath();
  const res = await rpc({ v: 1, ping: true });
  if (!res?.pong) return { alive: false, socket };
  return { alive: true, socket, pid: res.pid };
}

/** 经守护跑一拍；守护不在或超时返回 null，由调用方回落本地 */
export async function tryRunViaHookd(opts: HookCliOptions): Promise<string | null> {
  const res = await rpc({ v: 1, opts });
  if (!res || typeof res.json !== 'string') return null;
  return res.json;
}

export async function startHookd(options?: { socketPath?: string }): Promise<{ close: () => Promise<void>; path: string }> {
  const path = options?.socketPath || hookdSocketPath();
  if (isPosixSock(path)) {
    mkdirSync(dirname(path), { recursive: true });
    if (existsSync(path)) {
      const alive = await rpc({ v: 1, ping: true });
      if (alive?.pong) {
        throw new Error(`hookd already running at ${path}`);
      }
      try {
        unlinkSync(path);
      } catch {
        // ignore
      }
    }
  } else {
    mkdirSync(getPuaxHome(), { recursive: true });
  }

  const { runHook } = await import('./hook-cli.js');
  const server: Server = createServer((sock) => {
    void (async () => {
      try {
        const line = await readLine(sock, REQUEST_MS);
        const req = JSON.parse(line) as WireRequest;
        if (req.ping) {
          sock.write(`${JSON.stringify({ v: 1, pong: true, pid: process.pid } satisfies WireResponse)}\n`);
          return;
        }
        if (!req.opts || !req.opts.event) {
          sock.write(`${JSON.stringify({ v: 1, error: 'missing opts' } satisfies WireResponse)}\n`);
          return;
        }
        const { json } = runHook(req.opts);
        sock.write(`${JSON.stringify({ v: 1, json } satisfies WireResponse)}\n`);
      } catch (err) {
        try {
          sock.write(
            `${JSON.stringify({ v: 1, error: err instanceof Error ? err.message : 'hookd-error' } satisfies WireResponse)}\n`
          );
        } catch {
          // ignore
        }
      } finally {
        sock.end();
      }
    })();
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(path, () => resolve());
  });

  if (isPosixSock(path)) {
    try {
      chmodSync(path, 0o600);
    } catch {
      // ignore
    }
  }
  try {
    mkdirSync(getPuaxHome(), { recursive: true });
    writeFileSync(hookdPidPath(), String(process.pid), 'utf-8');
  } catch {
    // pid 文件失败不挡守护
  }

  const close = async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    if (isPosixSock(path)) {
      try {
        unlinkSync(path);
      } catch {
        // ignore
      }
    }
    try {
      unlinkSync(hookdPidPath());
    } catch {
      // ignore
    }
  };

  return { close, path };
}

export function stopHookdByPid(): boolean {
  try {
    if (!existsSync(hookdPidPath())) return false;
    const pid = Number.parseInt(readFileSync(hookdPidPath(), 'utf-8'), 10);
    if (!Number.isInteger(pid) || pid <= 0) return false;
    process.kill(pid, 'SIGTERM');
    return true;
  } catch {
    return false;
  }
}
