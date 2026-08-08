/**
 * Hook 事件语义补缺测试（覆盖今日改动中未覆盖的事件路径）
 *
 * 1. SessionStart 断点恢复：有压力/失败状态 → 注入"会话恢复"上下文；
 * 2. Stop 结束反馈：有触发历史 → 注入反馈提示；无历史 → {}；
 * 3. PreToolUse 在增强检测器中路由为空（拦截归确定性引擎）；
 * 4. DeterministicTriggersEngine.evaluate 同步返回（假异步去除回归）；
 * 5. PreCompact 经 CLI 触发不向宿主注入（状态持久化，无注入文本）。
 */

import { runHook } from '../../../src/cli/hook-cli.js';
import { stateManager } from '../../../src/hooks/state-manager.js';
import { enhancedTriggerDetector } from '../../../src/hooks/trigger-detector-enhanced.js';
import { DeterministicTriggersEngine } from '../../../src/hooks/deterministic-triggers.js';
import type { TriggerContext } from '../../../src/hooks/deterministic-triggers.js';
import { TriggerType } from '../../../src/hooks/deterministic-triggers.js';

const SESSION = `hook-events_${Date.now()}`;

describe('SessionStart restore injection', () => {
  beforeEach(() => {
    stateManager.clearSessionState(SESSION);
  });

  it('injects restore context when prior pressure/failures exist', async () => {
    // 预置跨会话状态（模拟上一次会话留下压力）
    stateManager.recordFailure(SESSION, 'Bash command failed');
    stateManager.recordFailure(SESSION, 'Bash command failed');

    const { json } = await runHook({
      event: 'SessionStart',
      sessionId: SESSION,
      harness: 'claude'
    });

    const payload = JSON.parse(json);
    expect(payload.hookSpecificOutput).toBeDefined();
    expect(payload.hookSpecificOutput.additionalContext).toContain('会话恢复');
    expect(payload.hookSpecificOutput.additionalContext).toContain('L');
  });

  it('emits {} when no prior state', async () => {
    const { json } = await runHook({
      event: 'SessionStart',
      sessionId: `${SESSION}_fresh`,
      harness: 'claude'
    });
    expect(json).toBe('{}');
  });
});

describe('Stop event', () => {
  beforeEach(() => {
    stateManager.clearSessionState(SESSION);
  });

  it('injects end-of-session feedback when PUA was active', async () => {
    stateManager.recordTrigger(SESSION, 'userFrustration', 0.9, 'military-warrior', 1);

    const { json } = await runHook({ event: 'Stop', sessionId: SESSION, harness: 'claude' });
    const payload = JSON.parse(json);
    expect(payload.hookSpecificOutput.additionalContext).toContain('会话结束');
  });

  it('emits {} when no triggers recorded', async () => {
    const { json } = await runHook({ event: 'Stop', sessionId: `${SESSION}_quiet`, harness: 'claude' });
    expect(json).toBe('{}');
  });
});

describe('PreCompact via CLI', () => {
  it('persists state without injecting into host', async () => {
    stateManager.clearSessionState(SESSION);
    stateManager.recordTrigger(SESSION, 'userFrustration', 0.9, 'military-warrior', 1);

    const { json } = await runHook({
      event: 'PreCompact',
      sessionId: SESSION,
      metadata: { currentTask: 'debug API', nextHypothesis: 'check config' },
      harness: 'claude'
    });
    // 状态已写入 journal，不向宿主注入文本
    expect(json).toBe('{}');
  });
});

describe('PreToolUse routing in enhanced detector', () => {
  it('returns empty result (interception belongs to deterministic engine)', () => {
    stateManager.clearSessionState(SESSION);
    const result = enhancedTriggerDetector.detect({
      sessionId: SESSION,
      eventType: 'PreToolUse',
      toolName: 'Bash',
      toolResult: { exit_code: 1 }
    });
    expect(result.triggered).toBe(false);
    expect(result.triggerType).toBe('none');
  });
});

describe('DeterministicTriggersEngine evaluate sync (no fake async)', () => {
  it('returns TriggerResult synchronously, not a Promise', () => {
    const engine = new DeterministicTriggersEngine();
    const ctx: TriggerContext = {
      sessionId: 'sync-check',
      eventType: TriggerType.PRE_TOOL_USE,
      toolName: 'read',
      toolArgs: { filePath: 'test/hidden/SOLUTION.md' },
      pressureLevel: 0,
      failureCount: 0,
      timestamp: Date.now()
    };
    const result = engine.evaluate(ctx);
    expect(result).not.toBeInstanceOf(Promise);
    expect(result.blocked).toBe(true);
  });
});
