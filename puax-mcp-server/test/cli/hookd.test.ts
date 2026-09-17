import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { startHookd, tryRunViaHookd, probeHookd, hookdStatusSync } from '../../src/cli/hookd.js';
import { runHook } from '../../src/cli/hook-cli.js';

describe('hookd 常驻守护', () => {
  const prevSock = process.env.PUAX_HOOKD_SOCK;
  const prevHome = process.env.PUAX_HOME;
  const prevOff = process.env.PUAX_HOOKD;
  let dir: string;
  let closer: (() => Promise<void>) | undefined;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'puax-hookd-'));
    process.env.PUAX_HOME = dir;
    process.env.PUAX_HOOKD_SOCK =
      process.platform === 'win32'
        ? `\\\\.\\pipe\\puax-hookd-test-${process.pid}-${Date.now()}`
        : join(dir, 'hookd.sock');
    delete process.env.PUAX_HOOKD;
  });

  afterEach(async () => {
    if (closer) {
      await closer();
      closer = undefined;
    }
    if (prevSock === undefined) delete process.env.PUAX_HOOKD_SOCK;
    else process.env.PUAX_HOOKD_SOCK = prevSock;
    if (prevHome === undefined) delete process.env.PUAX_HOME;
    else process.env.PUAX_HOME = prevHome;
    if (prevOff === undefined) delete process.env.PUAX_HOOKD;
    else process.env.PUAX_HOOKD = prevOff;
    rmSync(dir, { recursive: true, force: true });
  });

  it('无守护时 tryRunViaHookd 返回 null，本地 runHook 仍可用', async () => {
    expect(await tryRunViaHookd({ event: 'SessionStart', sessionId: 'no-daemon' })).toBeNull();
    const local = runHook({ event: 'SessionStart', sessionId: 'no-daemon', harness: 'sdk' });
    expect(typeof local.json).toBe('string');
  });

  it('守护起来后 ping 通，且与本地 runHook 输出一致', async () => {
    const started = await startHookd({ socketPath: process.env.PUAX_HOOKD_SOCK });
    closer = started.close;
    const ping = await probeHookd();
    expect(ping.alive).toBe(true);
    expect(hookdStatusSync().alive).toBe(true);

    const opts = {
      event: 'UserPromptSubmit' as const,
      sessionId: `hookd-${Date.now()}`,
      message: '这段代码的复杂度是 O(n log n)',
      harness: 'sdk' as const,
    };
    const local = runHook(opts).json;
    const remote = await tryRunViaHookd(opts);
    expect(remote).toBe(local);
  });

  it('PUAX_HOOKD=0 强制回落，即使守护在跑', async () => {
    const started = await startHookd({ socketPath: process.env.PUAX_HOOKD_SOCK });
    closer = started.close;
    process.env.PUAX_HOOKD = '0';
    expect(await tryRunViaHookd({ event: 'Stop', sessionId: 'forced-local' })).toBeNull();
  });
});
