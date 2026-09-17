/**
 * 事件级触发检测器（EnhancedTriggerDetector）单元测试
 *
 * 本文件原为 trigger-detector.ts 内嵌继承式 EnhancedTriggerDetector 的
 * 孤儿单测；v4.4 该零消费死引擎剟除后，改测真正在跑的事件级引擎
 * （src/core/trigger-detector-enhanced.ts，evolve-cycle 心跳热路径）。
 *
 * 会话态持久于 ~/.puax/，每例用唯一会话 ID 防跨例泄漏；
 * 压力阈值取默认配置（L1=2 次失败，冷却 30s，仅升级时触发）。
 */

import {
  enhancedTriggerDetector,
  type TriggerContext,
} from '../../src/core/trigger-detector-enhanced.js';

function sid(label: string): string {
  return `edt-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function promptContext(sessionId: string, message: string): TriggerContext {
  return { sessionId, eventType: 'UserPromptSubmit', message };
}

describe('事件级触发检测器 EnhancedTriggerDetector', () => {
  describe('UserPromptSubmit 路由', () => {
    it('用户挫折语言 → userFrustration（critical + 狂战士 + 注入提示）', () => {
      const sessionId = sid('frustration');
      const result = enhancedTriggerDetector.detect(
        promptContext(sessionId, '为什么还不行？再试试，太差了，重新做')
      );

      expect(result.triggered).toBe(true);
      expect(result.triggerType).toBe('userFrustration');
      expect(result.severity).toBe('critical');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      expect(result.recommendedRole.id).toBe('military-warrior');
      expect(result.injectionPrompt).toBeDefined();
      expect(result.metadata.matchedPatterns.length).toBeGreaterThan(0);
    });

    it('中性消息 → 空结果', () => {
      const result = enhancedTriggerDetector.detect(
        promptContext(sid('neutral'), '这段代码的复杂度是 O(n log n)')
      );

      expect(result.triggered).toBe(false);
      expect(result.triggerType).toBe('none');
      expect(result.recommendedRole.id).toBe('none');
    });

    it('触发后 30s 冷却窗口内的再检测被拦（cooldownRemaining > 0）', () => {
      const sessionId = sid('cooldown');
      const first = enhancedTriggerDetector.detect(
        promptContext(sessionId, '为什么还不行？再试试，太差了，重新做')
      );
      expect(first.triggered).toBe(true);

      const second = enhancedTriggerDetector.detect(
        promptContext(sessionId, '为什么还不行？再试试，太差了，重新做')
      );
      expect(second.triggered).toBe(false);
      expect(second.metadata.cooldownRemaining).toBeGreaterThan(0);
    });
  });

  describe('PostToolUse 路由', () => {
    it('Bash 首败不触发（L0），连败第 2 次升 L1 → bashFailure', () => {
      const sessionId = sid('bashfail');
      const failCtx = (): TriggerContext => ({
        sessionId,
        eventType: 'PostToolUse',
        toolName: 'Bash',
        toolResult: { exit_code: 1 },
        errorMessage: 'npm ERR code ELIFECYCLE',
      });

      const first = enhancedTriggerDetector.detect(failCtx());
      expect(first.triggered).toBe(false);
      expect(first.metadata.failureCount).toBe(1);

      const second = enhancedTriggerDetector.detect(failCtx());
      expect(second.triggered).toBe(true);
      expect(second.triggerType).toBe('bashFailure');
      expect(second.severity).toBe('high');
      expect(second.confidence).toBe(1.0);
      expect(second.pressureLevel).toBe(1);
      expect(second.recommendedRole.id).toBe('military-warrior');
      expect(second.metadata.matchedPatterns).toContain('bash_exit_code_nonzero');
    });

    it('Bash 成功 → 空结果', () => {
      const result = enhancedTriggerDetector.detect({
        sessionId: sid('bashok'),
        eventType: 'PostToolUse',
        toolName: 'Bash',
        toolResult: { exit_code: 0, stdout: 'ok' },
      });

      expect(result.triggered).toBe(false);
    });

    it('非 Bash 工具失败 → 空结果（只处理 Bash）', () => {
      const result = enhancedTriggerDetector.detect({
        sessionId: sid('readfail'),
        eventType: 'PostToolUse',
        toolName: 'Read',
        toolResult: { isError: true },
        errorMessage: 'File not found',
      });

      expect(result.triggered).toBe(false);
      expect(result.triggerType).toBe('none');
    });
  });

  describe('PreCompact 路由', () => {
    it('有触发史的会话 → preCompact（状态持久）', () => {
      const sessionId = sid('precompact');
      const triggered = enhancedTriggerDetector.detect(
        promptContext(sessionId, '为什么还不行？再试试，太差了，重新做')
      );
      expect(triggered.triggered).toBe(true);

      const result = enhancedTriggerDetector.detect({
        sessionId,
        eventType: 'PreCompact',
        metadata: { currentTask: 'release v4.4' },
      });

      expect(result.triggered).toBe(true);
      expect(result.triggerType).toBe('preCompact');
      expect(result.metadata.matchedPatterns).toContain('session_has_pua_triggers');
    });

    it('零触发的新会话 → 空结果', () => {
      const result = enhancedTriggerDetector.detect({
        sessionId: sid('precompact-fresh'),
        eventType: 'PreCompact',
      });

      expect(result.triggered).toBe(false);
    });
  });

  describe('SessionStart 路由', () => {
    it('带压力/失败状态的回归会话 → sessionRestore', () => {
      const sessionId = sid('restore');
      enhancedTriggerDetector.detect({
        sessionId,
        eventType: 'PostToolUse',
        toolName: 'Bash',
        toolResult: { exit_code: 1 },
        errorMessage: 'build failed',
      });
      enhancedTriggerDetector.detect({
        sessionId,
        eventType: 'PostToolUse',
        toolName: 'Bash',
        toolResult: { exit_code: 1 },
        errorMessage: 'build failed again',
      });

      const result = enhancedTriggerDetector.detect({
        sessionId,
        eventType: 'SessionStart',
      });

      expect(result.triggered).toBe(true);
      expect(result.triggerType).toBe('sessionRestore');
      expect(result.confidence).toBe(0.9);
      expect(result.metadata.matchedPatterns).toContain('previous_session_detected');
    });

    it('干净会话 → 空结果', () => {
      const result = enhancedTriggerDetector.detect({
        sessionId: sid('restore-fresh'),
        eventType: 'SessionStart',
      });

      expect(result.triggered).toBe(false);
    });
  });

  describe('Stop 路由', () => {
    it('PUA 参与过的会话 → stopFeedback', () => {
      const sessionId = sid('stop');
      const triggered = enhancedTriggerDetector.detect(
        promptContext(sessionId, '为什么还不行？再试试，太差了，重新做')
      );
      expect(triggered.triggered).toBe(true);

      const result = enhancedTriggerDetector.detect({ sessionId, eventType: 'Stop' });

      expect(result.triggered).toBe(true);
      expect(result.triggerType).toBe('stopFeedback');
    });

    it('未参与的会话 → 空结果', () => {
      const result = enhancedTriggerDetector.detect({ sessionId: sid('stop-fresh'), eventType: 'Stop' });

      expect(result.triggered).toBe(false);
    });
  });

  describe('PreToolUse 路由', () => {
    it('→ 空结果（拦截决策归 DeterministicTriggersEngine）', () => {
      const result = enhancedTriggerDetector.detect({
        sessionId: sid('pretool'),
        eventType: 'PreToolUse',
        toolName: 'Bash',
      });

      expect(result.triggered).toBe(false);
      expect(result.triggerType).toBe('none');
    });
  });
});
