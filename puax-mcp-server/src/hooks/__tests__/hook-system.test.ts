/**
 * PUAX Hook 系统测试
 */

import { stateManager } from '../state-manager.js';
import { pressureSystem } from '../pressure-system.js';
import { enhancedTriggerDetector } from '../trigger-detector-enhanced.js';
import { hookManager } from '../hook-manager.js';
import { feedbackSystem } from '../feedback-system.js';

describe('PUAX Hook System', () => {
  const testSessionId = `test_${Date.now()}`;

  beforeEach(() => {
    // 清理测试会话状态
    stateManager.clearSessionState(testSessionId);
  });

  afterAll(() => {
    // 清理测试会话
    stateManager.clearSessionState(testSessionId);
  });

  describe('StateManager', () => {
    test('should create and retrieve session state', () => {
      const state = stateManager.getSessionState(testSessionId);
      
      expect(state.sessionId).toBe(testSessionId);
      expect(state.pressureLevel).toBe(0);
      expect(state.failureCount).toBe(0);
      expect(state.triggerCount).toBe(0);
    });

    test('should record failures', () => {
      const count1 = stateManager.recordFailure(testSessionId, 'Test error 1');
      expect(count1).toBe(1);
      
      const count2 = stateManager.recordFailure(testSessionId, 'Test error 2');
      expect(count2).toBe(2);
      
      const state = stateManager.getSessionState(testSessionId);
      expect(state.failureCount).toBe(2);
    });

    test('should manage pressure levels', () => {
      stateManager.setPressureLevel(testSessionId, 2);
      
      const level = stateManager.getPressureLevel(testSessionId);
      expect(level).toBe(2);
    });

    test('should escalate pressure', () => {
      stateManager.setPressureLevel(testSessionId, 1);
      
      const newLevel = stateManager.escalatePressure(testSessionId);
      expect(newLevel).toBe(2);
      
      const state = stateManager.getSessionState(testSessionId);
      expect(state.pressureLevel).toBe(2);
    });

    test('should record triggers', () => {
      stateManager.recordTrigger(testSessionId, 'userFrustration', 0.9, 'military-warrior', 1);
      
      const history = stateManager.getTriggerHistory(testSessionId);
      expect(history.length).toBe(1);
      expect(history[0].triggerType).toBe('userFrustration');
    });
  });

  describe('PressureSystem', () => {
    test('should calculate pressure level based on failure count', () => {
      expect(pressureSystem.calculateLevel(0)).toBe(0);
      expect(pressureSystem.calculateLevel(1)).toBe(0);
      expect(pressureSystem.calculateLevel(2)).toBe(1);
      expect(pressureSystem.calculateLevel(3)).toBe(2);
      expect(pressureSystem.calculateLevel(4)).toBe(3);
      expect(pressureSystem.calculateLevel(5)).toBe(4);
    });

    test('should build injection prompt', () => {
      const response = pressureSystem.getCurrentResponse(testSessionId, { failureCount: 2 });
      const prompt = pressureSystem.buildInjectionPrompt(response);
      
      expect(prompt).toContain('[PUAX');
      expect(prompt.length).toBeGreaterThan(0);
    });
  });

  describe('EnhancedTriggerDetector', () => {
    test('should detect user frustration', async () => {
      const result = await enhancedTriggerDetector.detect({
        sessionId: testSessionId,
        eventType: 'UserPromptSubmit',
        message: '为什么还不行？试了好多次了！',
        conversationHistory: []
      });

      expect(result.triggered).toBe(true);
      expect(result.triggerType).toBe('userFrustration');
      expect(result.severity).toBe('critical');
      expect(result.recommendedRole).toBeDefined();
    });

    test('should detect giving up language', async () => {
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

    test('should return empty result for normal message', async () => {
      const result = await enhancedTriggerDetector.detect({
        sessionId: testSessionId,
        eventType: 'UserPromptSubmit',
        message: '这是一个正常的对话消息。',
        conversationHistory: []
      });

      expect(result.triggered).toBe(false);
      expect(result.confidence).toBe(0);
    });
  });

  describe('FeedbackSystem', () => {
    test('should collect feedback', () => {
      // 收集一些测试反馈
      feedbackSystem.quickFeedback(testSessionId, true, 5, 'Great!');
      
      const history = stateManager.getFeedbackHistory(testSessionId);
      expect(history.length).toBeGreaterThan(0);
      expect(history[history.length - 1].rating).toBe(5);
    });

    test('should generate session report', () => {
      // 确保会话有状态
      stateManager.recordTrigger(testSessionId, 'test', 0.8, 'test-role', 1);
      
      const report = feedbackSystem.generatePUALoopReport(testSessionId);
      expect(report).toContain('PUAX Loop Report');
      expect(report).toContain(testSessionId);
    });
  });
});
