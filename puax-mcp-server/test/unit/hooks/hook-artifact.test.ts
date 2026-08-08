/**
 * 生成 hook 产物行为测试（覆盖今日改动：hook.js stdin 全链路 + polyglot + 插件语法）
 *
 * 用 junction 把真实包链接到临时目录的 node_modules，模拟"已安装 puax-mcp-server"
 * 环境，验证生成的 hooks/hook.js（Shape A 产物）经 stdin 载荷的完整行为：
 * - PreToolUse 拦截决策（git push → block / npm test → approve）
 * - SessionStart 无状态 → {}
 * - PostToolUse stdin exit_code 连续失败 → L1 压力注入
 *
 * 依赖 build/（npm run build 后运行）。
 */

import { execFileSync, spawnSync } from 'child_process';
import { mkdtempSync, writeFileSync, rmSync, existsSync, symlinkSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { HOOK_JS, RUN_HOOK_CMD, opencodePlugin } from '../../../src/platform-adapters/hook-templates.js';

const PKG_ROOT = resolve(__dirname, '../../../../puax-mcp-server');
const BUILD_OK = existsSync(join(PKG_ROOT, 'build', 'index.js'));

/** 在临时目录搭出"已安装 puax-mcp-server"环境，返回 hook.js 路径 */
function setupInstalledEnv(): { dir: string; hookJs: string } {
  const dir = mkdtempSync(join(tmpdir(), 'puax-hook-artifact-'));
  const nm = join(dir, 'node_modules');
  mkdirSync(nm, { recursive: true });
  // junction 无需管理员权限（Windows），Unix 用 symlink
  try {
    symlinkSync(PKG_ROOT, join(nm, 'puax-mcp-server'), process.platform === 'win32' ? 'junction' : 'dir');
  } catch {
    rmSync(dir, { recursive: true, force: true });
    throw new Error('failed to link package into test node_modules');
  }
  const hookJs = join(dir, 'hook.js');
  writeFileSync(hookJs, HOOK_JS, 'utf-8');
  return { dir, hookJs };
}

function runWithStdin(hookJs: string, stdinPayload: string, args: string[]): { stdout: string; status: number } {
  const result = spawnSync('node', [hookJs, ...args], {
    encoding: 'utf8',
    input: stdinPayload,
    timeout: 30000
  });
  return { stdout: result.stdout, status: result.status ?? -1 };
}

const skipped = BUILD_OK ? describe : describe.skip;

skipped('Generated hook.js artifact (installed env, stdin payload)', () => {
  let env: { dir: string; hookJs: string };

  beforeEach(() => {
    env = setupInstalledEnv();
  });

  afterEach(() => {
    rmSync(env.dir, { recursive: true, force: true });
  });

  it('blocks git push via stdin tool_input', () => {
    const { stdout } = runWithStdin(
      env.hookJs,
      JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'git push origin main' }, session_id: 'art-1' }),
      ['pre-tool-use', '--harness', 'claude']
    );
    const payload = JSON.parse(stdout.trim());
    expect(payload.hookSpecificOutput.decision).toBe('block');
    expect(payload.hookSpecificOutput.reason).toContain('GIT_BYPASS_BLOCKED');
  });

  it('approves normal commands via stdin tool_input', () => {
    const { stdout } = runWithStdin(
      env.hookJs,
      JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'npm test' }, session_id: 'art-2' }),
      ['pre-tool-use', '--harness', 'claude']
    );
    const payload = JSON.parse(stdout.trim());
    expect(payload.hookSpecificOutput.decision).toBe('approve');
  });

  it('blocks hidden file reads via stdin tool_input', () => {
    const { stdout } = runWithStdin(
      env.hookJs,
      JSON.stringify({ tool_name: 'Read', tool_input: { filePath: 'test/hidden/SOLUTION.md' }, session_id: 'art-3' }),
      ['pre-tool-use', '--harness', 'claude']
    );
    const payload = JSON.parse(stdout.trim());
    expect(payload.hookSpecificOutput.decision).toBe('block');
  });

  it('session-start with no prior state → {}', () => {
    const { stdout } = runWithStdin(env.hookJs, '', ['session-start', '--session-id', 'art-4', '--harness', 'claude']);
    expect(stdout.trim()).toBe('{}');
  });

  it('post-tool-use escalates pressure on 2nd consecutive Bash failure (stdin exit_code)', () => {
    // 唯一会话 ID：state 持久化在 ~/.puax/，固定 ID 会跨测试运行泄漏失败计数
    const sessionId = `art-${Date.now()}`;
    const payload = JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'make' }, tool_response: { exit_code: 1 }, session_id: sessionId });
    const first = runWithStdin(env.hookJs, payload, ['post-tool-use', '--harness', 'claude']);
    // 首次失败不跨阈值 → {}
    expect(first.stdout.trim()).toBe('{}');
    const second = runWithStdin(env.hookJs, payload, ['post-tool-use', '--harness', 'claude']);
    // 第 2 次连续失败 → L1 注入
    const parsed = JSON.parse(second.stdout.trim());
    expect(parsed.hookSpecificOutput).toBeDefined();
    expect(parsed.hookSpecificOutput.additionalContext).toContain('L1');
  });
});

describe('polyglot run-hook.cmd', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'puax-polyglot-'));
    writeFileSync(join(dir, 'hook.js'), HOOK_JS, 'utf-8');
    writeFileSync(join(dir, 'run-hook.cmd'), RUN_HOOK_CMD, 'utf-8');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('cmd.exe branch: degrades to {} exit 0 when package missing', () => {
    const result = spawnSync('cmd.exe', ['/c', 'run-hook.cmd', 'session-start', '--harness', 'claude'], {
      cwd: dir,
      encoding: 'utf8',
      timeout: 30000
    });
    expect(result.status).toBe(0);
    // 依赖缺失 → hook.js 兜底 {}（stdout 可能附带 cmd 输出，但必须含 {}）
    expect(result.stdout).toContain('{}');
  });

  const gitBash = ['C:\\Program Files\\Git\\bin\\bash.exe', 'C:\\Program Files (x86)\\Git\\bin\\bash.exe']
    .find(p => existsSync(p));
  (gitBash ? it : it.skip)('bash branch (Git for Windows): runs without crash, exit 0', () => {
    const result = spawnSync(gitBash!, [join(dir, 'run-hook.cmd'), 'session-start', '--harness', 'claude'], {
      encoding: 'utf8',
      timeout: 60000
    });
    expect(result.status).toBe(0);
  });
});

describe('opencode plugin syntax', () => {
  it('generated puax.js passes node --check', () => {
    const dir = mkdtempSync(join(tmpdir(), 'puax-plugin-check-'));
    const pluginPath = join(dir, 'puax.js');
    writeFileSync(pluginPath, opencodePlugin({ marker: '<EXTREMELY_IMPORTANT>' }), 'utf-8');
    const result = spawnSync('node', ['--check', pluginPath], { encoding: 'utf8' });
    expect(result.status).toBe(0);
    rmSync(dir, { recursive: true, force: true });
  });
});
