#!/usr/bin/env node
/**
 * Auto-Trigger Integration Tests
 * Tests the complete flow: detect -> recommend -> activate
 */

import { TriggerDetector } from '../../src/core/trigger-detector.js';
import { RoleRecommender } from '../../src/core/role-recommender.js';
import { MethodologyEngine } from '../../src/core/methodology-engine.js';

describe('Auto-Trigger Complete Flow', () => {
  describe('Scenario 1: User Frustration', () => {
    it('should detect, recommend and provide activation for user frustration', async () => {
      // Step 1: Detect triggers
      const detector = new TriggerDetector({ sensitivity: 'high' });
      const detectionResult = await detector.detect([
        { role: 'assistant', content: '尝试连接数据库...失败' },
        { role: 'assistant', content: '再试一次...还是失败' },
        { role: 'user', content: '为什么还不行？' }
      ], {
        attempt_count: 2
      });

      expect(detectionResult.triggers_detected).toContainEqual(
        expect.objectContaining({ id: 'user_frustration' })
      );
      expect(detectionResult.summary.should_trigger).toBe(true);

      // Step 2: Recommend role
      const recommender = new RoleRecommender();
      const recommendationResult = await recommender.recommend({
        detected_triggers: detectionResult.triggers_detected.map(t => t.id),
        task_context: {
          task_type: 'debugging',
          urgency: 'critical',
          attempt_count: 2
        }
      });

      expect(recommendationResult.primary.role_id).toBeDefined();
      expect(recommendationResult.primary.confidence_score).toBeGreaterThan(0);
      expect(recommendationResult.activation_suggestion.immediate).toBe(true);

      // Step 3: Get methodology
      const engine = new MethodologyEngine();
      const methodology = engine.getMethodology(recommendationResult.primary.role_id);
      const checklist = engine.getChecklist(recommendationResult.primary.role_id);

      expect(methodology.steps).toHaveLength(5);
      expect(checklist.length).toBeGreaterThan(0);

      console.log('🎯 Detected:', detectionResult.triggers_detected.map(t => t.name));
      console.log('🎭 Recommended:', recommendationResult.primary.role_name);
      console.log('📋 Methodology:', methodology.name);
    });
  });

  describe('Scenario 2: Consecutive Failures', () => {
    it('should handle debugging scenario with multiple failures', async () => {
      const detector = new TriggerDetector();
      const detectionResult = await detector.detect([
        { role: 'assistant', content: '尝试修复...失败' },
        { role: 'assistant', content: '换个方法...还是失败' },
        { role: 'assistant', content: '再试一次...仍然失败' }
      ], {
        attempt_count: 3,
        current_task: 'debugging API connection'
      });

      expect(detectionResult.triggers_detected).toContainEqual(
        expect.objectContaining({ id: 'consecutive_failures' })
      );

      const recommender = new RoleRecommender();
      const recommendationResult = await recommender.recommend({
        detected_triggers: detectionResult.triggers_detected.map(t => t.id),
        task_context: {
          task_type: 'debugging',
          attempt_count: 3
        }
      });

      // Should recommend debugging-oriented roles
      expect(recommendationResult.primary.role_id).toBeDefined();
    });
  });

  describe('Scenario 3: Giving Up', () => {
    it('should handle AI giving up scenario', async () => {
      const detector = new TriggerDetector();
      const detectionResult = await detector.detect([
        { role: 'assistant', content: '我无法解决这个问题' },
        { role: 'assistant', content: '这超出了我的能力范围' }
      ]);

      expect(detectionResult.triggers_detected).toContainEqual(
        expect.objectContaining({ id: 'giving_up_language' })
      );

      const recommender = new RoleRecommender();
      const recommendationResult = await recommender.recommend({
        detected_triggers: detectionResult.triggers_detected.map(t => t.id),
        task_context: {
          task_type: 'debugging',
          urgency: 'high'
        }
      });

      // Should recommend motivational roles
      expect(recommendationResult.primary.confidence_score).toBeGreaterThan(70);
    });
  });

  describe('Scenario 4: Complex Multi-Trigger', () => {
    it('should handle complex scenario with multiple triggers', async () => {
      const detector = new TriggerDetector();
      const detectionResult = await detector.detect([
        { role: 'assistant', content: '尝试修改参数...' },
        { role: 'assistant', content: '调整配置...还是不行' },
        { role: 'assistant', content: '微调一下...' },
        { role: 'assistant', content: '可能是环境问题' },
        { role: 'user', content: '怎么又失败了？' }
      ], {
        attempt_count: 4,
        tools_available: ['WebSearch', 'Bash', 'Read'],
        tools_used: ['Bash']
      });

      // Should detect multiple triggers
      const triggerIds = detectionResult.triggers_detected.map(t => t.id);
      expect(triggerIds.length).toBeGreaterThanOrEqual(2);

      const recommender = new RoleRecommender();
      const recommendationResult = await recommender.recommend({
        detected_triggers: triggerIds,
        task_context: {
          task_type: 'debugging',
          urgency: 'high',
          attempt_count: 4
        }
      });

      expect(recommendationResult.alternatives.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should complete detection within 100ms', async () => {
      const detector = new TriggerDetector();
      const start = Date.now();

      await detector.detect([
        { role: 'user', content: '为什么还不行？' }
      ]);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should complete recommendation within 100ms', async () => {
      const recommender = new RoleRecommender();
      const start = Date.now();

      await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: {
          task_type: 'debugging',
          urgency: 'high'
        }
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should complete full flow within 500ms', async () => {
      const start = Date.now();

      // Detect
      const detector = new TriggerDetector();
      const detectionResult = await detector.detect([
        { role: 'user', content: '为什么还不行？' }
      ]);

      // Recommend
      const recommender = new RoleRecommender();
      const recommendationResult = await recommender.recommend({
        detected_triggers: detectionResult.triggers_detected.map(t => t.id),
        task_context: {
          task_type: 'debugging',
          urgency: 'high'
        }
      });

      // Get methodology
      const engine = new MethodologyEngine();
      engine.getMethodology(recommendationResult.primary.role_id);
      engine.getChecklist(recommendationResult.primary.role_id);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Caching', () => {
    it('should use cache for repeated identical requests', async () => {
      const recommender = new RoleRecommender();
      
      const request = {
        detected_triggers: ['user_frustration'],
        task_context: {
          task_type: 'debugging',
          urgency: 'high'
        }
      };

      // First call
      const result1 = await recommender.recommend(request);
      expect(result1.metadata.cache_hit).toBe(false);

      // Second call (should be cached)
      const result2 = await recommender.recommend(request);
      expect(result2.metadata.cache_hit).toBe(true);

      // Results should be identical
      expect(result2.primary.role_id).toBe(result1.primary.role_id);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing task context gracefully', async () => {
      const recommender = new RoleRecommender();
      
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: {
          task_type: 'debugging'
        } as any
      });

      expect(result.primary.role_id).toBeDefined();
    });

    it('should handle empty trigger list', async () => {
      const recommender = new RoleRecommender();
      
      const result = await recommender.recommend({
        detected_triggers: [],
        task_context: {
          task_type: 'debugging'
        }
      });

      expect(result.primary.role_id).toBeDefined();
    });

    it('should handle unknown role IDs in preferences', async () => {
      const recommender = new RoleRecommender();
      
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: {
          task_type: 'debugging'
        },
        user_preferences: {
          favorite_roles: ['unknown-role-123']
        }
      });

      expect(result.primary.role_id).toBeDefined();
    });
  });

  describe('End-to-End Examples', () => {
    it('Example: API Debugging Flow', async () => {
      console.log('\n📡 API Debugging Flow Example:');

      // Simulate conversation
      const conversation = [
        { role: 'assistant', content: '尝试连接API...失败' },
        { role: 'assistant', content: '检查配置...再试...还是失败' },
        { role: 'assistant', content: '可能是网络问题？再试一次...失败' },
        { role: 'user', content: '为什么还不行？这都第三次了' }
      ];

      // Step 1: Detect
      const detector = new TriggerDetector();
      const detection = await detector.detect(conversation, {
        attempt_count: 3,
        current_task: 'API connection debugging'
      });

      console.log('  🎯 Triggers detected:', detection.triggers_detected.length);
      detection.triggers_detected.forEach(t => {
        console.log(`     - ${t.name} (${Math.round(t.confidence * 100)}% confidence)`);
      });

      // Step 2: Recommend
      const recommender = new RoleRecommender();
      const recommendation = await recommender.recommend({
        detected_triggers: detection.triggers_detected.map(t => t.id),
        task_context: {
          task_type: 'debugging',
          urgency: 'high',
          attempt_count: 3
        }
      });

      console.log('  🎭 Recommended role:', recommendation.primary.role_name);
      console.log('     Confidence:', recommendation.primary.confidence_score + '%');
      console.log('     Immediate activation:', recommendation.activation_suggestion.immediate);

      // Step 3: Get Methodology
      const engine = new MethodologyEngine();
      const methodology = engine.getMethodology(recommendation.primary.role_id);

      console.log('  📋 Methodology:', methodology.name);
      console.log('     Steps:', methodology.steps.map(s => s.name).join(' → '));

      expect(detection.summary.should_trigger).toBe(true);
      expect(recommendation.primary.confidence_score).toBeGreaterThan(70);
    });

    it('Example: Creative Task Flow', async () => {
      console.log('\n🎨 Creative Task Flow Example:');

      const detector = new TriggerDetector();
      const detection = await detector.detect([
        { role: 'assistant', content: '我尝试了一些常规方案...' },
        { role: 'user', content: '这些方案太普通了，需要更有创意的' }
      ]);

      const recommender = new RoleRecommender();
      const recommendation = await recommender.recommend({
        detected_triggers: detection.triggers_detected.map(t => t.id),
        task_context: {
          task_type: 'creative',
          urgency: 'medium'
        }
      });

      console.log('  🎭 Recommended role:', recommendation.primary.role_name);
      console.log('  🎯 Suitable for creative tasks');

      // Should recommend creative roles
      const creativeRoles = ['shaman-musk', 'special-creative-spark', 'theme-alchemy'];
      const isCreative = creativeRoles.includes(recommendation.primary.role_id) ||
        recommendation.alternatives.some(a => creativeRoles.includes(a.role_id));
      
      expect(isCreative).toBe(true);
    });
  });
});
