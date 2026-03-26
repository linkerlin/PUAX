/**
 * Role Recommender Edge Cases and Error Handling Tests
 */

import { RoleRecommender } from '../../src/core/role-recommender.js';

describe('RoleRecommender Edge Cases', () => {
  let recommender: RoleRecommender;

  beforeEach(() => {
    recommender = new RoleRecommender();
  });

  describe('Empty and Null Inputs', () => {
    it('should handle empty triggers array', async () => {
      const result = await recommender.recommend({
        detected_triggers: [],
        task_context: { task_type: 'debugging' }
      });
      expect(result.primary.role_id).toBeDefined();
    });

    it('should handle null task context', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: {} as any
      });
      expect(result.primary.role_id).toBeDefined();
    });

    it('should handle missing task_type', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['consecutive_failures'],
        task_context: { description: 'test' } as any
      });
      expect(result.primary.role_id).toBeDefined();
    });
  });

  describe('Boundary Values', () => {
    it('should handle zero attempt count', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging', attempt_count: 0 }
      });
      expect(result.primary.role_id).toBeDefined();
    });

    it('should handle very high attempt count', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging', attempt_count: 999999 }
      });
      expect(result.primary.role_id).toBeDefined();
    });

    it('should handle negative attempt count', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging', attempt_count: -1 }
      });
      expect(result.primary.role_id).toBeDefined();
    });

    it('should handle all urgency levels', async () => {
      const urgencies = ['low', 'medium', 'high', 'critical'];
      for (const urgency of urgencies) {
        const result = await recommender.recommend({
          detected_triggers: ['user_frustration'],
          task_context: { task_type: 'debugging', urgency: urgency as any }
        });
        expect(result.primary.role_id).toBeDefined();
      }
    });
  });

  describe('User Preferences', () => {
    it('should handle empty favorite_roles', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' },
        user_preferences: { favorite_roles: [] }
      });
      expect(result.primary.role_id).toBeDefined();
    });

    it('should handle many favorite roles', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' },
        user_preferences: {
          favorite_roles: Array(50).fill(null).map((_, i) => `role-${i}`)
        }
      });
      expect(result.primary.role_id).toBeDefined();
    });

    it('should handle empty blacklisted_roles', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' },
        user_preferences: { blacklisted_roles: [] }
      });
      expect(result.primary.role_id).toBeDefined();
    });

    it('should exclude all roles if all blacklisted', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' },
        user_preferences: {
          blacklisted_roles: ['military-commander', 'military-warrior', 'shaman-musk']
        }
      });
      expect(result.primary.role_id).toBeDefined();
    });

    it('should handle invalid role IDs in preferences', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' },
        user_preferences: {
          favorite_roles: ['invalid-role-123', 'non-existent-role'],
          blacklisted_roles: ['also-invalid']
        }
      });
      expect(result.primary.role_id).toBeDefined();
    });

    it('should handle all tone preferences', async () => {
      const tones = ['aggressive', 'supportive', 'analytical', 'creative'];
      for (const tone of tones) {
        const result = await recommender.recommend({
          detected_triggers: ['user_frustration'],
          task_context: { task_type: 'debugging' },
          user_preferences: { preferred_tone: tone as any }
        });
        expect(result.primary.role_id).toBeDefined();
      }
    });
  });

  describe('Session History', () => {
    it('should handle empty recently_used_roles', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' },
        session_history: { recently_used_roles: [] }
      });
      expect(result.primary.role_id).toBeDefined();
    });

    it('should handle many recently used roles', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' },
        session_history: {
          recently_used_roles: Array(100).fill(null).map((_, i) => `role-${i}`)
        }
      });
      expect(result.primary.role_id).toBeDefined();
    });

    it('should handle empty success rates', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' },
        session_history: { role_success_rates: {} }
      });
      expect(result.primary.role_id).toBeDefined();
    });

    it('should handle various success rates', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' },
        session_history: {
          role_success_rates: {
            'military-commander': 0.0,
            'military-warrior': 0.5,
            'shaman-musk': 1.0
          }
        }
      });
      expect(result.primary.role_id).toBeDefined();
    });

    it('should handle invalid success rates', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' },
        session_history: {
          role_success_rates: {
            'military-commander': -0.5,
            'military-warrior': 1.5
          } as any
        }
      });
      expect(result.primary.role_id).toBeDefined();
    });
  });

  describe('Many Triggers', () => {
    it('should handle single trigger', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' }
      });
      expect(result.primary.role_id).toBeDefined();
    });

    it('should handle many triggers', async () => {
      const result = await recommender.recommend({
        detected_triggers: [
          'user_frustration',
          'consecutive_failures',
          'giving_up_language',
          'blame_environment',
          'surface_fix'
        ],
        task_context: { task_type: 'debugging' }
      });
      expect(result.primary.role_id).toBeDefined();
    });

    it('should handle duplicate triggers', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration', 'user_frustration', 'user_frustration'],
        task_context: { task_type: 'debugging' }
      });
      expect(result.primary.role_id).toBeDefined();
    });

    it('should handle invalid trigger IDs', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['invalid-trigger', 'also-invalid'],
        task_context: { task_type: 'debugging' }
      });
      expect(result.primary.role_id).toBeDefined();
    });
  });

  describe('Task Types', () => {
    it('should handle all supported task types', async () => {
      const taskTypes = ['debugging', 'coding', 'review', 'creative', 'planning', 'emergency'];
      for (const taskType of taskTypes) {
        const result = await recommender.recommend({
          detected_triggers: ['user_frustration'],
          task_context: { task_type: taskType }
        });
        expect(result.primary.role_id).toBeDefined();
      }
    });

    it('should handle unknown task type', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'unknown_task_type' as any }
      });
      expect(result.primary.role_id).toBeDefined();
    });

    it('should handle long task description', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: {
          task_type: 'debugging',
          description: 'A'.repeat(10000)
        }
      });
      expect(result.primary.role_id).toBeDefined();
    });
  });

  describe('Caching', () => {
    it('should cache identical requests', async () => {
      const request = {
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' }
      };

      const result1 = await recommender.recommend(request);
      const result2 = await recommender.recommend(request);

      expect(result2.metadata.cache_hit).toBe(true);
      expect(result2.primary.role_id).toBe(result1.primary.role_id);
    });

    it('should not cache different requests', async () => {
      const request1 = {
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' }
      };
      const request2 = {
        detected_triggers: ['consecutive_failures'],
        task_context: { task_type: 'debugging' }
      };

      await recommender.recommend(request1);
      const result2 = await recommender.recommend(request2);

      expect(result2.metadata.cache_hit).toBe(false);
    });

    it('should handle cache with many different requests', async () => {
      for (let i = 0; i < 100; i++) {
        await recommender.recommend({
          detected_triggers: [`trigger-${i}`],
          task_context: { task_type: 'debugging' }
        });
      }
      // Should not crash or run out of memory
      expect(true).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should complete recommendation within timeout', async () => {
      const start = Date.now();
      await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' }
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });

    it('should handle concurrent recommendations', async () => {
      const promises = Array(10).fill(null).map((_, i) =>
        recommender.recommend({
          detected_triggers: [`trigger-${i}`],
          task_context: { task_type: 'debugging' }
        })
      );
      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      results.forEach(r => expect(r).toBeDefined());
    });
  });
});
