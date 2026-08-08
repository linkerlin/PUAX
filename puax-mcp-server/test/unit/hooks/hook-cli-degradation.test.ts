/**
 * Hook 全链路降级测试（Hook机制演进方案.md P3-20）
 *
 * 用真实子进程验证优雅降级契约：
 * 1. 生成的 hooks/hook.js 在依赖缺失环境 → stdout `{}` + 退出码 0；
 * 2. `puax-mcp-server hook <未知事件>` → stdout `{}` + 退出码 0；
 * 3. 正常事件经真实进程 → 有效宿主 JSON + 退出码 0。
 */

import { execFileSync } from 'child_process';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { HOOK_JS } from '../../../src/platform-adapters/hook-templates.js';

const BUILD_ENTRY = resolve(__dirname, '../../../build/index.js');

/** execFileSync 带 stdio 数组时返回 String，此函数规范化结果 */
function runNode(args: string[]): { stdout: string; status: number } {
  const result = execFileSync('node', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }) as unknown as { stdout: string; status: number } | string;
  if (typeof result === 'string') {
    return { stdout: result, status: 0 };
  }
  return { stdout: result.stdout, status: result.status };
}

describe('Hook CLI full-path degradation (spawn)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'puax-hook-degrade-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('generated hook.js degrades to {} exit 0 when puax-mcp-server is not installed', () => {
    const hookJsPath = join(tmpDir, 'hook.js');
    writeFileSync(hookJsPath, HOOK_JS, 'utf-8');

    const { stdout, status } = runNode([hookJsPath, 'session-start']);
    // 子进程内 require('puax-mcp-server') 失败 → 兜底 {} + exit 0
    expect(stdout.trim()).toBe('{}');
    expect(status).toBe(0);
  });

  if (existsSync(BUILD_ENTRY)) {
    it('unknown event → {} exit 0', () => {
      const { stdout, status } = runNode([BUILD_ENTRY, 'hook', 'bogus-event']);
      expect(stdout.trim()).toBe('{}');
      expect(status).toBe(0);
    });

    it('valid event via real process → host JSON exit 0', () => {
      const { stdout, status } = runNode(
        [BUILD_ENTRY, 'hook', 'user-prompt', '--session-id', 'degrade-e2e', '--message', 'try harder', '--harness', 'sdk']
      );
      const payload = JSON.parse(stdout.trim());
      expect(payload.additionalContext).toBeDefined();
      expect(status).toBe(0);
    });

    it('PreToolUse block decision survives full process path', () => {
      const { stdout, status } = runNode(
        [BUILD_ENTRY, 'hook', 'pre-tool-use', '--session-id', 'degrade-e2e', '--tool', 'Bash', '--tool-args', '{"command":"git push origin main"}', '--harness', 'claude']
      );
      const payload = JSON.parse(stdout.trim());
      expect(payload.hookSpecificOutput.decision).toBe('block');
      expect(status).toBe(0);
    });
  }
});
