#!/usr/bin/env node
/**
 * Role Recommender Unit Tests
 */

import { RoleRecommender } from '../../src/core/role-recommender.js';

describe('RoleRecommender', () => {
  let recommender: RoleRecommender;

  beforeEach(() => {
    recommender = new RoleRecommender();
  });

  describe('Basic Recommendation', () => {
    it('should recommend role for user frustration', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: {
          task_type: 'debugging',
          urgency: 'critical'
        }
      });

      expect(result.primary.role_id).toBeDefined();
      expect(result.primary.confidence_score).toBeGreaterThan(0);
      expect(result.alternatives.length).toBeGreaterThan(0);
    });

    it('should recommend military-warrior for critical debugging', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration', 'giving_up_language'],
        task_context: {
          task_type: 'debugging',
          urgency: 'critical',
          attempt_count: 3
        }
      });

      expect(result.primary.role_id).toBeDefined();
      expect(result.activation_suggestion.immediate).toBe(true);
    });

    it('should suggest flavor overlay', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: {
          task_type: 'debugging',
          urgency: 'high'
        }
      });

      // Should suggest a flavor for high urgency
      expect(result.primary.suggested_flavor).toBeDefined();
    });
  });

  describe('Task Type Matching', () => {
    it('should recommend appropriate roles for debugging tasks', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['consecutive_failures'],
        task_context: {
          task_type: 'debugging'
        }
      });

      const debuggingRoles = ['military-scout', 'military-technician', 'theme-hacker'];
      const isAppropriate = debuggingRoles.includes(result.primary.role_id) ||
        result.alternatives.some(a => debuggingRoles.includes(a.role_id));
           
      expect(isAppropriate).toBe(true);
    });

    it('should recommend appropriate roles for creative tasks', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['low_quality'],
        task_context: {
          task_type: 'creative'
        }
      });

      const creativeRoles = ['shaman-musk', 'special-creative-spark', 'theme-alchemy'];
      const isAppropriate = creativeRoles.includes(result.primary.role_id) ||
        result.alternatives.some(a => creativeRoles.includes(a.role_id));
        
      expect(isAppropriate).toBe(true);
    });

    it('should recommend appropriate roles for emergency tasks', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['consecutive_failures'],
        task_context: {
          task_type: 'emergency',
          urgency: 'critical'
        }
      });

      const emergencyRoles = ['military-militia', 'special-urgent-sprint', 'military-warrior'];
      const isAppropriate = emergencyRoles.includes(result.primary.role_id) ||
        result.alternatives.some(a => emergencyRoles.includes(a.role_id));
        
      expect(isAppropriate).toBe(true);
    });
  });

  describe('Failure Mode Progression', () => {
    it('should recommend round 1 roles for initial attempts', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['parameter_tweaking'],
        task_context: {
          task_type: 'debugging',
          attempt_count: 1
        }
      });

      // Should recommend less aggressive roles for round 1
      expect(result.primary.confidence_score).toBeGreaterThan(0);
    });

    it('should recommend round 3 roles for many attempts', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['parameter_tweaking'],
        task_context: {
          task_type: 'debugging',
          attempt_count: 6
        }
      });

      // Should recommend more aggressive roles for round 3
      expect(result.primary.confidence_score).toBeGreaterThan(0);
    });
  });

  describe('User Preferences', () => {
    it('should respect favorite roles', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['consecutive_failures'],
        task_context: {
          task_type: 'debugging'
        },
        user_preferences: {
          favorite_roles: ['military-commander']
        }
      });

      // Should boost military-commander score
      const hasFavorite = result.primary.role_id === 'military-commander' ||
        result.alternatives.some(a => a.role_id === 'military-commander');
        
      expect(hasFavorite).toBe(true);
    });

    it('should exclude blacklisted roles', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['consecutive_failures'],
        task_context: {
          task_type: 'debugging'
        },
        user_preferences: {
          blacklisted_roles: ['military-warrior']
        }
      });

      expect(result.primary.role_id).not.toBe('military-warrior');
      expect(result.alternatives.every(a => a.role_id !== 'military-warrior')).toBe(true);
    });

    it('should respect preferred tone', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['low_quality'],
        task_context: {
          task_type: 'coding'
        },
        user_preferences: {
          preferred_tone: 'aggressive'
        }
      });

      // Should recommend aggressive roles
      expect(result.primary.confidence_score).toBeGreaterThan(0);
    });
  });

  describe('Session History', () => {
    it('should consider recently used roles', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['consecutive_failures'],
        task_context: {
          task_type: 'debugging'
        },
        session_history: {
          recently_used_roles: ['military-commander']
        }
      });

      // Should avoid recently used roles
      expect(result.primary.role_id).not.toBe('military-commander');
    });

    it('should consider success rates', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['consecutive_failures'],
        task_context: {
          task_type: 'debugging'
        },
        session_history: {
          role_success_rates: {
            'military-commander': 0.9,
            'military-scout': 0.5
          }
        }
      });

      // Should prefer high success rate roles
      expect(result.primary.confidence_score).toBeGreaterThan(0);
    });
  });

  describe('Result Structure', () => {
    it('should provide match reasons', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: {
          task_type: 'debugging'
        }
      });

      expect(result.primary.match_reasons.length).toBeGreaterThan(0);
    });

    it('should provide alternatives with differences', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['consecutive_failures'],
        task_context: {
          task_type: 'debugging'
        }
      });

      expect(result.alternatives.length).toBeGreaterThan(0);
      expect(result.alternatives[0].difference).toBeDefined();
    });

    it('should provide activation suggestion', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['user_frustration'],
        task_context: {
          task_type: 'debugging',
          urgency: 'critical'
        }
      });

      expect(result.activation_suggestion.immediate).toBeDefined();
      expect(result.activation_suggestion.cooldown_seconds).toBeDefined();
    });

    it('should provide calculation breakdown', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['consecutive_failures'],
        task_context: {
          task_type: 'debugging'
        }
      });

      expect(result.metadata.calculation_breakdown).toBeDefined();
      expect(result.metadata.calculation_breakdown.trigger_match).toBeDefined();
      expect(result.metadata.calculation_breakdown.task_type).toBeDefined();
    });
  });

  describe('Caching', () => {
    it('should cache results for same inputs', async () => {
      const request = {
        detected_triggers: ['consecutive_failures'],
        task_context: {
          task_type: 'debugging'
        }
      };

      const result1 = await recommender.recommend(request);
      const result2 = await recommender.recommend(request);

      // Second result should come from cache
      expect(result2.metadata.cache_hit).toBe(true);
    });

    it('should not cache different inputs', async () => {
      const request1 = {
        detected_triggers: ['consecutive_failures'],
        task_context: {
          task_type: 'debugging'
        }
      };

      const request2 = {
        detected_triggers: ['user_frustration'],
        task_context: {
          task_type: 'debugging'
        }
      };

      await recommender.recommend(request1);
      const result2 = await recommender.recommend(request2);

      expect(result2.metadata.cache_hit).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty triggers', async () => {
      const result = await recommender.recommend({
        detected_triggers: [],
        task_context: {
          task_type: 'debugging'
        }
      });

      expect(result.primary.role_id).toBeDefined();
    });

    it('should handle unknown task types', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['consecutive_failures'],
        task_context: {
          task_type: 'unknown_task' as any
        }
      });

      expect(result.primary.role_id).toBeDefined();
    });

    it('should handle very high attempt counts', async () => {
      const result = await recommender.recommend({
        detected_triggers: ['consecutive_failures'],
        task_context: {
          task_type: 'debugging',
          attempt_count: 100
        }
      });

      expect(result.primary.role_id).toBeDefined();
      expect(result.primary.confidence_score).toBeGreaterThan(0);
    });
  });
});
