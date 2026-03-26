/**
 * PUAX Hook 系统全面测试 v3.1.0
 * 
 * 覆盖：
 * - HookManager 订阅/发布机制
 * - 会话生命周期管理
 * - 所有 5 种 Hook 事件类型
 * - 压力等级升级 (L0-L4)
 * - 触发检测 (7 种触发类型)
 * - 反馈系统
 */

import { stateManager } from '../state-manager.js';
import { pressureSystem } from '../pressure-system.js';
import { enhancedTriggerDetector } from '../trigger-detector-enhanced.js';
import { hookManager, HookManager } from '../hook-manager.js';
import { feedbackSystem } from '../feedback-system.js';
import { TRIGGER_PATTERNS, ROLE_RECOMMENDATIONS } from '../trigger-detector-enhanced.js';

describe('PUAX Hook System v3.1.0', () => {
  const testSessionId = `test_${Date.now()}`;

  beforeEach(() => {
    stateManager.clearSessionState(testSessionId);
    hookManager.clearSubscriptions();
  });

  afterAll(() => {
    stateManager.clearSessionState(testSessionId);
    hookManager.stop();
  });

  // ============================================================================
  // HookManager 测试
  // ============================================================================
  describe('HookManager', () => {
    test('should start and end session correctly', async () => {
      hookManager.startSession(testSessionId, { task: 'test' });
      
      const stats = hookManager.getSessionStats(testSessionId);
      expect(stats.exists).toBe(true);
      expect(stats.messageCount).toBe(0);
      
      await hookManager.endSession(testSessionId);
      
      const statsAfter = hookManager.getSessionStats(testSessionId);
      expect(statsAfter.exists).toBe(false);
    });

    test('should track active sessions', () => {
      hookManager.startSession(testSessionId);
      hookManager.startSession(`${testSessionId}_2`);
      
      const active = hookManager.getActiveSessions();
      expect(active).toContain(testSessionId);
      expect(active).toContain(`${testSessionId}_2`);
      
      hookManager.endSession(testSessionId);
      hookManager.endSession(`${testSessionId}_2`);
    });

    test('should subscribe and receive events', async () => {
      let receivedTrigger = false;
      
      const subId = hookManager.subscribe('UserPromptSubmit', (result) => {
        if (result.triggered) {
          receivedTrigger = true;
        }
      });

      hookManager.startSession(testSessionId);
      await hookManager.recordUserMessage(testSessionId, '为什么还不行！');
      
      expect(receivedTrigger).toBe(true);
      expect(hookManager.unsubscribe(subId)).toBe(true);
      
      hookManager.endSession(testSessionId);
    });

    test('should subscribe to all events', async () => {
      const receivedEvents: string[] = [];
      
      hookManager.subscribe('all', (result, context) => {
        receivedEvents.push(context.eventType);
      });

      hookManager.startSession(testSessionId);
      await hookManager.recordUserMessage(testSessionId, '为什么还不行！');
      await hookManager.endSession(testSessionId);

      const toolSessionId = `${testSessionId}_tool`;
      stateManager.clearSessionState(toolSessionId);
      hookManager.startSession(toolSessionId);
      await hookManager.recordToolUse(toolSessionId, 'Bash', { exit_code: 1 });
      await hookManager.recordToolUse(toolSessionId, 'Bash', { exit_code: 1 });
      
      expect(receivedEvents).toContain('UserPromptSubmit');
      expect(receivedEvents).toContain('PostToolUse');
      
      await hookManager.endSession(toolSessionId);
    });

    test('should filter subscriptions', async () => {
      let highSeverityTriggered = false;
      
      hookManager.subscribe('UserPromptSubmit', () => {
        highSeverityTriggered = true;
      }, (result) => result.severity === 'critical');

      hookManager.startSession(testSessionId);
      
      // 普通消息不应触发
      await hookManager.recordUserMessage(testSessionId, 'hello world');
      expect(highSeverityTriggered).toBe(false);
      
      // 挫折消息应触发
      await hookManager.recordUserMessage(testSessionId, '为什么还不行！');
      expect(highSeverityTriggered).toBe(true);
      
      hookManager.endSession(testSessionId);
    });

    test('should record conversation history', async () => {
      hookManager.startSession(testSessionId);
      
      await hookManager.recordUserMessage(testSessionId, 'user message');
      hookManager.recordAssistantMessage(testSessionId, 'assistant response');
      
      const stats = hookManager.getSessionStats(testSessionId);
      expect(stats.messageCount).toBe(2);
      
      hookManager.endSession(testSessionId);
    });

    test('should handle quickCheck for text', async () => {
      const result = await hookManager.quickCheck(testSessionId, '为什么还不行！');
      
      expect(result.triggered).toBe(true);
      expect(result.triggerType).toBe('userFrustration');
      
      hookManager.endSession(testSessionId);
    });

    test('should handle quickCheck for tool use', async () => {
      await hookManager.quickCheck(testSessionId, 'error occurred', {
        toolName: 'Bash',
        toolResult: { exit_code: 1 }
      });

      const result = await hookManager.quickCheck(testSessionId, 'error occurred', {
        toolName: 'Bash',
        toolResult: { exit_code: 1 }
      });
      
      expect(result.triggered).toBe(true);
      expect(result.triggerType).toBe('bashFailure');
      
      hookManager.endSession(testSessionId);
    });

    test('should handle PreCompact event', async () => {
      let preCompactTriggered = false;
      
      hookManager.subscribe('PreCompact', () => {
        preCompactTriggered = true;
      });

      hookManager.startSession(testSessionId);
      await hookManager.recordUserMessage(testSessionId, '为什么还不行！');
      await hookManager.recordPreCompact(testSessionId, {
        currentTask: 'test task',
        triedApproaches: ['approach1'],
        nextHypothesis: 'try something else'
      });
      
      expect(preCompactTriggered).toBe(true);
      
      hookManager.endSession(testSessionId);
    });

    test('should start and stop correctly', () => {
      const customManager = new HookManager();
      
      customManager.start();
      expect(customManager.isActive).toBe(true);
      
      customManager.stop();
      expect(customManager.isActive).toBe(false);
    });
  });

  // ============================================================================
  // 5 种 Hook 事件类型测试
  // ============================================================================
  describe('Hook Event Types', () => {
    const eventTypes: Array<'UserPromptSubmit' | 'PostToolUse' | 'PreCompact' | 'SessionStart' | 'Stop'> = 
      ['UserPromptSubmit', 'PostToolUse', 'PreCompact', 'SessionStart', 'Stop'];

    test.each(eventTypes)('should support %s event type', async (eventType) => {
      const result = await enhancedTriggerDetector.detect({
        sessionId: testSessionId,
        eventType,
        message: 'test message',
        conversationHistory: []
      });

      expect(result).toBeDefined();
      expect(result.triggered).toBeDefined();
      expect(result.recommendedRole).toBeDefined();
    });
  });

  // ============================================================================
  // 触发类型检测测试 (7 种)
  // ============================================================================
  describe('Trigger Detection (7 Types)', () => {
    
    test('should detect userFrustration', async () => {
      const result = await enhancedTriggerDetector.detect({
        sessionId: testSessionId,
        eventType: 'UserPromptSubmit',
        message: '为什么还不行？都试了三次了！',
        conversationHistory: []
      });

      expect(result.triggered).toBe(true);
      expect(result.triggerType).toBe('userFrustration');
      expect(result.severity).toBe('critical');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('should detect givingUp', async () => {
      const result = await enhancedTriggerDetector.detect({
        sessionId: testSessionId,
        eventType: 'UserPromptSubmit',
        message: '这个问题可能无法实现，建议放弃。',
        conversationHistory: []
      });

      expect(result.triggered).toBe(true);
      expect(result.triggerType).toBe('givingUp');
      expect(result.severity).toBe('critical');
    });

    test('should detect bashFailure', async () => {
      await enhancedTriggerDetector.detect({
        sessionId: testSessionId,
        eventType: 'PostToolUse',
        toolName: 'Bash',
        toolResult: { exit_code: 1, stderr: 'Error: command failed' },
        errorMessage: 'Exit code 1',
        conversationHistory: []
      });

      const result = await enhancedTriggerDetector.detect({
        sessionId: testSessionId,
        eventType: 'PostToolUse',
        toolName: 'Bash',
        toolResult: { exit_code: 1, stderr: 'Error: command failed' },
        errorMessage: 'Exit code 1',
        conversationHistory: []
      });

      expect(result.triggered).toBe(true);
      expect(result.triggerType).toBe('bashFailure');
    });

    test('should detect surfaceFix', async () => {
      const result = await enhancedTriggerDetector.detect({
        sessionId: testSessionId,
        eventType: 'UserPromptSubmit',
        message: '暂时修复一下，先这样吧',
        conversationHistory: []
      });

      expect(result.triggered).toBe(true);
      expect(result.triggerType).toBe('surfaceFix');
    });

    test('should detect passiveWait', async () => {
      const result = await enhancedTriggerDetector.detect({
        sessionId: testSessionId,
        eventType: 'UserPromptSubmit',
        message: '请告诉我下一步怎么做',
        conversationHistory: []
      });

      expect(result.triggered).toBe(true);
      expect(result.triggerType).toBe('passiveWait');
    });

    test('should detect blameEnvironment', async () => {
      const result = await enhancedTriggerDetector.detect({
        sessionId: testSessionId,
        eventType: 'UserPromptSubmit',
        message: '这是环境问题，不是代码的问题',
        conversationHistory: []
      });

      expect(result.triggered).toBe(true);
      expect(result.triggerType).toBe('blameEnvironment');
    });

    test('should detect noSearch', async () => {
      const result = await enhancedTriggerDetector.detect({
        sessionId: testSessionId,
        eventType: 'UserPromptSubmit',
        message: '我不清楚这个怎么实现，可能是这样吧',
        conversationHistory: []
      });

      expect(result.triggered).toBe(true);
      expect(result.triggerType).toBe('noSearch');
    });

    test('should not trigger on normal messages', async () => {
      const result = await enhancedTriggerDetector.detect({
        sessionId: testSessionId,
        eventType: 'UserPromptSubmit',
        message: '请帮我实现一个排序算法',
        conversationHistory: []
      });

      expect(result.triggered).toBe(false);
      expect(result.confidence).toBe(0);
    });

    test('should detect bilingual patterns (English)', async () => {
      const result = await enhancedTriggerDetector.detect({
        sessionId: testSessionId,
        eventType: 'UserPromptSubmit',
        message: 'This is impossible, I suggest giving up.',
        conversationHistory: []
      });

      expect(result.triggered).toBe(true);
      expect(result.triggerType).toBe('givingUp');
    });
  });

  // ============================================================================
  // 压力等级测试 (L0-L4)
  // ============================================================================
  describe('Pressure System (L0-L4)', () => {
    test('should start at L0', () => {
      const state = stateManager.getSessionState(testSessionId);
      expect(state.pressureLevel).toBe(0);
    });

    test('should calculate level based on failure count', () => {
      expect(pressureSystem.calculateLevel(0)).toBe(0);
      expect(pressureSystem.calculateLevel(1)).toBe(0);
      expect(pressureSystem.calculateLevel(2)).toBe(1);
      expect(pressureSystem.calculateLevel(3)).toBe(2);
      expect(pressureSystem.calculateLevel(4)).toBe(3);
      expect(pressureSystem.calculateLevel(5)).toBe(4);
      expect(pressureSystem.calculateLevel(10)).toBe(4); // max is 4
    });

    test('should escalate pressure correctly', () => {
      stateManager.setPressureLevel(testSessionId, 0);
      
      const level1 = stateManager.escalatePressure(testSessionId);
      expect(level1).toBe(1);
      
      const level2 = stateManager.escalatePressure(testSessionId);
      expect(level2).toBe(2);
      
      const level3 = stateManager.escalatePressure(testSessionId);
      expect(level3).toBe(3);
      
      const level4 = stateManager.escalatePressure(testSessionId);
      expect(level4).toBe(4);
      
      // max is 4
      const level5 = stateManager.escalatePressure(testSessionId);
      expect(level5).toBe(4);
    });

    test('should build injection prompt for each level', () => {
      for (let level = 0; level <= 4; level++) {
        const response = pressureSystem.getCurrentResponse(testSessionId, { 
          pressureLevel: level, 
          failureCount: level 
        });
        const prompt = pressureSystem.buildInjectionPrompt(response);
        
        expect(prompt).toContain('<EXTREMELY_IMPORTANT>');
        expect(prompt).toContain('[PUA');
        expect(prompt.length).toBeGreaterThan(0);
      }
    });

    test('should handle cooldown', () => {
      // 记录一次触发
      stateManager.recordTrigger(testSessionId, 'userFrustration', 0.9, 'military-warrior', 1);
      
      // 检查冷却
      const cooldown = pressureSystem.checkCooldown(testSessionId);
      expect(cooldown.canTrigger).toBe(false);
      expect(cooldown.remainingMs).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // StateManager 测试
  // ============================================================================
  describe('StateManager', () => {
    test('should create and retrieve session state', () => {
      const state = stateManager.getSessionState(testSessionId);
      
      expect(state.sessionId).toBe(testSessionId);
      expect(state.pressureLevel).toBe(0);
      expect(state.failureCount).toBe(0);
      expect(state.triggerCount).toBe(0);
      expect(state.activeRole).toBeUndefined();
    });

    test('should record failures', () => {
      const count1 = stateManager.recordFailure(testSessionId, 'Test error 1');
      expect(count1).toBe(1);
      
      const count2 = stateManager.recordFailure(testSessionId, 'Test error 2');
      expect(count2).toBe(2);
      
      const state = stateManager.getSessionState(testSessionId);
      expect(state.failureCount).toBe(2);
    });

    test('should record triggers', () => {
      const beforeCount = stateManager.getTriggerHistory(testSessionId).length;
      stateManager.recordTrigger(testSessionId, 'userFrustration', 0.9, 'military-warrior', 1);
      
      const history = stateManager.getTriggerHistory(testSessionId);
      const latest = history[history.length - 1];
      expect(history.length).toBe(beforeCount + 1);
      expect(latest.triggerType).toBe('userFrustration');
      expect(latest.confidence).toBe(0.9);
      expect(latest.roleId).toBe('military-warrior');
    });

    test('should set active role', () => {
      stateManager.updateSessionState(testSessionId, { activeRole: 'military-commander' });
      
      const state = stateManager.getSessionState(testSessionId);
      expect(state.activeRole).toBe('military-commander');
    });

    test('should reset session state', () => {
      stateManager.recordFailure(testSessionId, 'error');
      stateManager.setPressureLevel(testSessionId, 3);
      
      stateManager.clearSessionState(testSessionId);
      
      const state = stateManager.getSessionState(testSessionId);
      expect(state.pressureLevel).toBe(0);
      expect(state.failureCount).toBe(0);
    });
  });

  // ============================================================================
  // FeedbackSystem 测试
  // ============================================================================
  describe('FeedbackSystem', () => {
    test('should collect feedback', () => {
      feedbackSystem.quickFeedback(testSessionId, true, 5, 'Excellent!');
      
      const history = stateManager.getFeedbackHistory(testSessionId);
      expect(history.length).toBeGreaterThan(0);
      expect(history[history.length - 1].rating).toBe(5);
      expect(history[history.length - 1].success).toBe(true);
    });

    test('should generate session report', () => {
      stateManager.recordTrigger(testSessionId, 'userFrustration', 0.8, 'military-warrior', 1);
      
      const report = feedbackSystem.generatePUALoopReport(testSessionId);
      expect(report).toContain('PUAX Loop Report');
      expect(report).toContain(testSessionId);
    });

    test('should get feedback summary', () => {
      feedbackSystem.quickFeedback(testSessionId, true, 4, 'Good');
      feedbackSystem.quickFeedback(testSessionId, false, 2, 'Bad');
      
      const summary = feedbackSystem.getFeedbackSummary(1);
      expect(summary).toBeDefined();
    });

    test('should export feedback', () => {
      feedbackSystem.quickFeedback(testSessionId, true, 5, 'Test');
      
      const exported = feedbackSystem.exportFeedbackData('json');
      expect(exported).toContain(testSessionId);
    });
  });

  // ============================================================================
  // 角色推荐映射测试
  // ============================================================================
  describe('Role Recommendations', () => {
    test('should have recommendations for all trigger types', () => {
      const triggerTypes = Object.keys(TRIGGER_PATTERNS);
      
      for (const type of triggerTypes) {
        expect(ROLE_RECOMMENDATIONS[type]).toBeDefined();
        expect(ROLE_RECOMMENDATIONS[type].id).toBeDefined();
        expect(ROLE_RECOMMENDATIONS[type].name).toBeDefined();
      }
    });

    test('should recommend correct role for userFrustration', async () => {
      const result = await enhancedTriggerDetector.detect({
        sessionId: testSessionId,
        eventType: 'UserPromptSubmit',
        message: '为什么还不行！',
        conversationHistory: []
      });

      expect(result.recommendedRole.id).toBe('military-warrior');
    });

    test('should recommend correct role for givingUp', async () => {
      const result = await enhancedTriggerDetector.detect({
        sessionId: testSessionId,
        eventType: 'UserPromptSubmit',
        message: '建议放弃，不可能实现',
        conversationHistory: []
      });

      expect(result.recommendedRole.id).toBe('military-commissar');
    });
  });

  // ============================================================================
  // 会话生命周期测试
  // ============================================================================
  describe('Session Lifecycle', () => {
    test('should maintain state across session', async () => {
      hookManager.startSession(testSessionId);
      
      // 第一次失败
      await hookManager.recordToolUse(testSessionId, 'Bash', { exit_code: 1 }, 'Error');
      let state = stateManager.getSessionState(testSessionId);
      const failures1 = state.failureCount;
      
      // 第二次失败
      await hookManager.recordToolUse(testSessionId, 'Bash', { exit_code: 1 }, 'Error again');
      state = stateManager.getSessionState(testSessionId);
      const failures2 = state.failureCount;
      
      expect(failures2).toBeGreaterThan(failures1);
      
      hookManager.endSession(testSessionId);
    });

    test('should restore state for existing session', () => {
      // 设置初始状态
      stateManager.recordFailure(testSessionId, 'previous error');
      stateManager.setPressureLevel(testSessionId, 2);
      
      // 启动会话（应恢复状态）
      hookManager.startSession(testSessionId);
      
      const state = stateManager.getSessionState(testSessionId);
      expect(state.failureCount).toBeGreaterThan(0);
      
      hookManager.endSession(testSessionId);
    });
  });

  // ============================================================================
  // 边界情况测试
  // ============================================================================
  describe('Edge Cases', () => {
    test('should handle empty message', async () => {
      const result = await enhancedTriggerDetector.detect({
        sessionId: testSessionId,
        eventType: 'UserPromptSubmit',
        message: '',
        conversationHistory: []
      });

      expect(result.triggered).toBe(false);
    });

    test('should handle very long message', async () => {
      const longMessage = '为什么还不行！'.repeat(1000);
      
      const result = await enhancedTriggerDetector.detect({
        sessionId: testSessionId,
        eventType: 'UserPromptSubmit',
        message: longMessage,
        conversationHistory: []
      });

      expect(result).toBeDefined();
    });

    test('should handle special characters', async () => {
      const result = await enhancedTriggerDetector.detect({
        sessionId: testSessionId,
        eventType: 'UserPromptSubmit',
        message: '为什么还不行！！！@#$%^&*()',
        conversationHistory: []
      });

      expect(result.triggered).toBe(true);
    });

    test('should handle non-existent session gracefully', async () => {
      const result = await hookManager.recordUserMessage('non-existent-session', 'test');
      expect(result).toBeDefined();
      expect(result.triggered).toBe(false);
    });
  });
});
