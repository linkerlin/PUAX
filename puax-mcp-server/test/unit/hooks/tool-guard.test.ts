/**
 * 工具守卫测试（Hook机制演进方案.md Phase 0.4）
 * 断言：DeterministicTriggersEngine 的 PreToolUse 拦截能力已接入真实调用路径，
 * 命中隐藏文件规则即返回 blocked，正常调用放行。
 */

import { guardToolCall } from '../../../src/core/tool-guard.js';
import { stateManager } from '../../../src/hooks/state-manager.js';

const SESSION = `tool-guard-test_${Date.now()}`;

describe('guardToolCall (MCP tool dispatch guard)', () => {
  beforeEach(() => {
    stateManager.clearSessionState(SESSION);
  });

  it('should block tool calls touching hidden solution files', async () => {
    const result = await guardToolCall('read', {
      sessionId: SESSION,
      filePath: 'test/hidden/SOLUTION.md'
    });
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain('ANTI_CHEAT_BLOCK');
  });

  it('should allow normal tool calls', async () => {
    const result = await guardToolCall('puax_detect_trigger', {
      sessionId: SESSION,
      eventType: 'UserPromptSubmit',
      message: 'test'
    });
    expect(result.blocked).toBe(false);
  });

  it('should allow calls without path-like args', async () => {
    const result = await guardToolCall('puax_list_platforms', {});
    expect(result.blocked).toBe(false);
  });
});
