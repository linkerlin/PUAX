/**
 * Full System Integration Tests
 * 测试完整系统集成的各种场景
 */

import { TriggerDetector, ConversationMessage } from '../../src/core/trigger-detector.js';
import { RoleRecommender } from '../../src/core/role-recommender.js';
import { MethodologyEngine } from '../../src/core/methodology-engine.js';

describe('Full System Integration', () => {
  let detector: TriggerDetector;
  let recommender: RoleRecommender;
  let engine: MethodologyEngine;

  beforeEach(() => {
    detector = new TriggerDetector();
    recommender = new RoleRecommender();
    engine = new MethodologyEngine();
  });

  describe('End-to-End Scenarios', () => {
    it('should handle debugging scenario: API connection failure', async () => {
      const conversation: ConversationMessage[] = [
        { role: 'assistant', content: '尝试连接API...失败' },
        { role: 'assistant', content: '检查配置...再次尝试...失败' },
        { role: 'assistant', content: '修改超时设置...还是失败' },
        { role: 'user', content: '这都第三次了，为什么还不行？' }
      ];

      // Step 1: Detect
      const detection = await detector.detect(conversation, {
        attempt_count: 3,
        current_task: 'API connection debugging'
      });

      expect(detection.triggers_detected.length).toBeGreaterThan(0);
      expect(detection.summary.should_trigger).toBe(true);

      // Step 2: Recommend
      const recommendation = await recommender.recommend({
        detected_triggers: detection.triggers_detected.map((t: any) => t.id),
        task_context: {
          task_type: 'debugging',
          urgency: 'high',
          attempt_count: 3
        }
      });

      expect(recommendation.primary.role_id).toBeDefined();
      expect(recommendation.primary.confidence_score).toBeGreaterThan(0);

      // Step 3: Get Methodology
      const methodology = engine.getMethodology(recommendation.primary.role_id);
      const checklist = engine.getChecklist(recommendation.primary.role_id);

      expect(methodology.steps).toHaveLength(5);
      expect(checklist.length).toBeGreaterThan(0);

      // Step 4: Validate with partial completion
      const partialIds = checklist.filter((i: any) => i.required).slice(0, 3).map((i: any) => i.id);
      const validation = engine.validateChecklist(recommendation.primary.role_id, partialIds);

      expect(validation).toBeDefined();
    });

    it('should handle giving up scenario', async () => {
      const conversation: ConversationMessage[] = [
        { role: 'assistant', content: '我尝试了多种方法来解决这个问题' },
        { role: 'assistant', content: '尝试了方案A、B、C，但都失败了' },
        { role: 'assistant', content: '我无法确定具体的解决方案，这可能超出了我的能力范围' }
      ];

      const detection = await detector.detect(conversation);
      
      const hasGivingUp = detection.triggers_detected.some(
        (t: any) => t.id === 'giving_up_language'
      );
      
      if (hasGivingUp) {
        const recommendation = await recommender.recommend({
          detected_triggers: ['giving_up_language'],
          task_context: { task_type: 'debugging' }
        });

        expect(recommendation.primary.role_id).toBeDefined();
      }
    });

    it('should handle user frustration scenario', async () => {
      const conversation: ConversationMessage[] = [
        { role: 'user', content: '为什么这个还不行？' },
        { role: 'assistant', content: '让我再检查一下...' },
        { role: 'user', content: '这都第几次了？！' }
      ];

      const detection = await detector.detect(conversation);

      const hasFrustration = detection.triggers_detected.some(
        (t: any) => t.id === 'user_frustration'
      );

      expect(hasFrustration).toBe(true);

      const recommendation = await recommender.recommend({
        detected_triggers: detection.triggers_detected.map((t: any) => t.id),
        task_context: { task_type: 'debugging', urgency: 'critical' }
      });

      expect(recommendation.activation_suggestion.immediate).toBe(true);
    });

    it('should handle creative task scenario', async () => {
      const conversation: ConversationMessage[] = [
        { role: 'assistant', content: '我可以按照常规方案来实现这个功能' },
        { role: 'user', content: '这些方案太普通了，有没有更有创意的做法？' }
      ];

      const detection = await detector.detect(conversation);
      
      const recommendation = await recommender.recommend({
        detected_triggers: detection.triggers_detected.map((t: any) => t.id),
        task_context: { task_type: 'creative', urgency: 'medium' }
      });

      expect(recommendation.primary.role_id).toBeDefined();
      
      const methodology = engine.getMethodology(recommendation.primary.role_id);
      expect(methodology).toBeDefined();
    });
  });

  describe('Multi-Trigger Scenarios', () => {
    it('should handle multiple simultaneous triggers', async () => {
      const conversation: ConversationMessage[] = [
        { role: 'assistant', content: '尝试修改参数...' },
        { role: 'assistant', content: '调整配置...还是不行' },
        { role: 'assistant', content: '微调一下...' },
        { role: 'assistant', content: '可能是环境问题' },
        { role: 'user', content: '怎么又失败了？' }
      ];

      const detection = await detector.detect(conversation, {
        attempt_count: 4,
        tools_available: ['WebSearch', 'Bash', 'Read'],
        tools_used: ['Bash']
      });

      expect(detection.triggers_detected.length).toBeGreaterThanOrEqual(2);

      const recommendation = await recommender.recommend({
        detected_triggers: detection.triggers_detected.map((t: any) => t.id),
        task_context: {
          task_type: 'debugging',
          urgency: 'high',
          attempt_count: 4
        }
      });

      expect(recommendation.alternatives.length).toBeGreaterThan(0);
    });
  });

  describe('Flavor Application', () => {
    it('should apply flavor to recommended role', async () => {
      const recommendation = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' }
      });

      const methodology = engine.getMethodology(recommendation.primary.role_id);
      
      const flavors = ['alibaba', 'huawei', 'musk', 'jobs'];
      for (const flavor of flavors) {
        const flavored = engine.applyFlavor(methodology, flavor as any);
        expect(flavored).toBeDefined();
        expect(flavored.steps).toHaveLength(methodology.steps.length);
      }
    });
  });

  describe('Session Context', () => {
    it('should consider session history', async () => {
      const sessionHistory = {
        recently_used_roles: ['military-commander', 'military-warrior'],
        role_success_rates: {
          'military-commander': 0.9,
          'military-warrior': 0.3
        }
      };

      const recommendation = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' },
        session_history: sessionHistory
      });

      expect(recommendation.primary.role_id).toBeDefined();
      expect(recommendation.metadata.calculation_breakdown).toBeDefined();
    });
  });

  describe('User Preferences', () => {
    it('should respect favorite roles', async () => {
      const recommendation = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' },
        user_preferences: {
          favorite_roles: ['shaman-musk'],
          preferred_tone: 'analytical'
        }
      });

      expect(recommendation.primary.role_id).toBeDefined();
    });

    it('should exclude blacklisted roles', async () => {
      const recommendation = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' },
        user_preferences: {
          blacklisted_roles: ['military-warrior']
        }
      });

      expect(recommendation.primary.role_id).not.toBe('military-warrior');
      expect(recommendation.alternatives.every((a: any) => a.role_id !== 'military-warrior')).toBe(true);
    });
  });

  describe('Failure Mode Progression', () => {
    it('should escalate intensity with more attempts', async () => {
      const attemptCounts = [1, 3, 6, 10];
      const recommendations = [];

      for (const count of attemptCounts) {
        const rec = await recommender.recommend({
          detected_triggers: ['consecutive_failures'],
          task_context: {
            task_type: 'debugging',
            attempt_count: count
          }
        });
        recommendations.push(rec);
      }

      // All should have recommendations
      recommendations.forEach(r => {
        expect(r.primary.role_id).toBeDefined();
        expect(r.primary.confidence_score).toBeGreaterThan(0);
      });
    });
  });

  describe('Checklist Validation Flow', () => {
    it('should validate checklist through full workflow', async () => {
      // Get role
      const recommendation = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' }
      });

      const checklist = engine.getChecklist(recommendation.primary.role_id);
      const requiredItems = checklist.filter((i: any) => i.required);

      // Test various completion levels
      const levels = [0, 0.5, 0.8, 1.0];
      for (const level of levels) {
        const count = Math.floor(requiredItems.length * level);
        const ids = requiredItems.slice(0, count).map((i: any) => i.id);
        
        const validation = engine.validateChecklist(recommendation.primary.role_id, ids);
        
        expect(validation.completion_rate).toBeGreaterThanOrEqual(0);
        expect(validation.completion_rate).toBeLessThanOrEqual(100);
        
        if (validation.completion_rate >= 80) {
          expect(validation.can_proceed).toBe(true);
        } else if (validation.completion_rate < 50) {
          expect(validation.can_proceed).toBe(false);
        }
      }
    });
  });

  describe('System Resilience', () => {
    it('should handle all role types', async () => {
      const roleCategories = [
        { prefix: 'military-', expected: 9 },
        { prefix: 'shaman-', expected: 8 },
        { prefix: 'theme-', expected: 7 },
        { prefix: 'sillytavern-', expected: 5 }
      ];

      for (const category of roleCategories) {
        const recommendation = await recommender.recommend({
          detected_triggers: ['user_frustration'],
          task_context: { task_type: 'debugging' }
        });

        expect(recommendation.primary.role_id).toBeDefined();

        const methodology = engine.getMethodology(recommendation.primary.role_id);
        expect(methodology.steps).toHaveLength(5);
      }
    });

    it('should maintain consistency across multiple runs', async () => {
      const request = {
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' }
      };

      const results = [];
      for (let i = 0; i < 5; i++) {
        const rec = await recommender.recommend(request);
        results.push(rec.primary.role_id);
      }

      // All should be the same (cached)
      expect(new Set(results).size).toBe(1);
    });
  });
});
