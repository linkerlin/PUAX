/**
 * Performance Tests
 * 验证系统性能指标
 */

import { TriggerDetector, ConversationMessage } from '../../src/core/trigger-detector.js';
import { RoleRecommender } from '../../src/core/role-recommender.js';
import { MethodologyEngine } from '../../src/core/methodology-engine.js';

describe('Performance Tests', () => {
  describe('Trigger Detector Performance', () => {
    let detector: TriggerDetector;

    beforeEach(() => {
      detector = new TriggerDetector({ sensitivity: 'medium' });
    });

    it('should detect triggers within 100ms', async () => {
      const start = Date.now();
      await detector.detect([
        { role: 'user', content: '为什么还不行？' }
      ]);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should handle short conversation quickly', async () => {
      const start = Date.now();
      await detector.detect([
        { role: 'assistant', content: 'Failed' },
        { role: 'user', content: 'Why?' }
      ]);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should handle medium conversation within limit', async () => {
      const history: ConversationMessage[] = Array(20).fill(null).map((_, i) => ({
        role: i % 2 === 0 ? 'assistant' : 'user',
        content: i % 2 === 0 ? '尝试失败' : '还不行？'
      }));
      
      const start = Date.now();
      await detector.detect(history, { attempt_count: 10 });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200);
    });

    it('should maintain performance under concurrent load', async () => {
      const promises = Array(50).fill(null).map(() =>
        detector.detect([{ role: 'user', content: '为什么还不行？' }])
      );
      
      const start = Date.now();
      await Promise.all(promises);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Role Recommender Performance', () => {
    let recommender: RoleRecommender;

    beforeEach(() => {
      recommender = new RoleRecommender();
    });

    it('should recommend role within 100ms', async () => {
      const start = Date.now();
      await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' }
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should handle multiple triggers quickly', async () => {
      const start = Date.now();
      await recommender.recommend({
        detected_triggers: ['user_frustration', 'consecutive_failures', 'giving_up_language'],
        task_context: { task_type: 'debugging', attempt_count: 5 }
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(150);
    });

    it('should maintain cache performance', async () => {
      const request = {
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' }
      };

      const start1 = Date.now();
      const result1 = await recommender.recommend(request);
      const duration1 = Date.now() - start1;

      const start2 = Date.now();
      const result2 = await recommender.recommend(request);
      const duration2 = Date.now() - start2;

      expect(result1.metadata.cache_hit).toBe(false);
      expect(result2.metadata.cache_hit).toBe(true);
      expect(duration2).toBeLessThanOrEqual(duration1);
    });
  });

  describe('Methodology Engine Performance', () => {
    let engine: MethodologyEngine;

    beforeEach(() => {
      engine = new MethodologyEngine();
    });

    it('should get methodology within 50ms', () => {
      const start = Date.now();
      engine.getMethodology('military-commander');
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });

    it('should get checklist within 50ms', () => {
      const start = Date.now();
      engine.getChecklist('military-commander');
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });

    it('should apply flavor within 50ms', () => {
      const methodology = engine.getMethodology('military-commander');
      const start = Date.now();
      engine.applyFlavor(methodology, 'alibaba');
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });
  });

  describe('End-to-End Performance', () => {
    let detector: TriggerDetector;
    let recommender: RoleRecommender;
    let engine: MethodologyEngine;

    beforeEach(() => {
      detector = new TriggerDetector();
      recommender = new RoleRecommender();
      engine = new MethodologyEngine();
    });

    it('should complete full flow within 500ms', async () => {
      const conversation: ConversationMessage[] = [
        { role: 'assistant', content: '尝试连接...失败' },
        { role: 'assistant', content: '再试一次...还是失败' },
        { role: 'user', content: '为什么还不行？' }
      ];

      const start = Date.now();

      const detection = await detector.detect(conversation, { attempt_count: 2 });

      const recommendation = await recommender.recommend({
        detected_triggers: detection.triggers_detected.map((t: any) => t.id),
        task_context: { task_type: 'debugging', urgency: 'high' }
      });

      engine.getMethodology(recommendation.primary.role_id);
      engine.getChecklist(recommendation.primary.role_id);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });
  });
});
