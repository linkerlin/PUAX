/**
 * Recommend Role Tool Unit Tests
 */

import { recommendRoleTool } from '../../src/tools/recommend-role.js';

describe('recommend_role Tool', () => {
  const parseInput = (input: unknown) => recommendRoleTool.inputSchema.safeParse(input);

  describe('Tool Definition', () => {
    it('should have correct tool name', () => {
      expect(recommendRoleTool.name).toBe('recommend_role');
    });

    it('should have description', () => {
      expect(recommendRoleTool.description).toBeDefined();
      expect(recommendRoleTool.description.length).toBeGreaterThan(0);
    });

    it('should have input schema', () => {
      expect(recommendRoleTool.inputSchema).toBeDefined();
      expect(parseInput({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' }
      }).success).toBe(true);
    });
  });

  describe('Input Schema', () => {
    it('should require detected_triggers', () => {
      expect(parseInput({
        task_context: { task_type: 'debugging' }
      }).success).toBe(false);
    });

    it('should require task_context', () => {
      expect(parseInput({
        detected_triggers: ['user_frustration']
      }).success).toBe(false);
    });

    it('should have optional user_preferences', () => {
      expect(parseInput({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' },
        user_preferences: {
          favorite_roles: ['military-warrior'],
          blacklisted_roles: ['shaman-jobs'],
          preferred_tone: 'aggressive',
          preferred_categories: ['military']
        }
      }).success).toBe(true);
    });

    it('should have optional session_history', () => {
      expect(parseInput({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' },
        session_history: {
          recently_used_roles: ['military-warrior'],
          role_success_rates: { 'military-warrior': 0.9 },
          role_usage_count: { 'military-warrior': 3 }
        }
      }).success).toBe(true);
    });
  });

  describe('Task Context Schema', () => {
    it('should have task_type field', () => {
      expect(parseInput({
        detected_triggers: ['user_frustration'],
        task_context: {}
      }).success).toBe(false);
    });

    it('should have urgency enum', () => {
      expect(parseInput({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging', urgency: 'low' }
      }).success).toBe(true);
      expect(parseInput({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging', urgency: 'critical' }
      }).success).toBe(true);
      expect(parseInput({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging', urgency: 'urgent' }
      }).success).toBe(false);
    });

    it('should have attempt_count field', () => {
      expect(parseInput({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging', attempt_count: 2 }
      }).success).toBe(true);
      expect(parseInput({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging', attempt_count: '2' }
      }).success).toBe(false);
    });
  });

  describe('User Preferences Schema', () => {
    it('should have favorite_roles field', () => {
      expect(parseInput({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' },
        user_preferences: { favorite_roles: ['military-warrior'] }
      }).success).toBe(true);
    });

    it('should have blacklisted_roles field', () => {
      expect(parseInput({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' },
        user_preferences: { blacklisted_roles: ['shaman-jobs'] }
      }).success).toBe(true);
    });

    it('should have preferred_tone field', () => {
      expect(parseInput({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' },
        user_preferences: { preferred_tone: 'supportive' }
      }).success).toBe(true);
      expect(parseInput({
        detected_triggers: ['user_frustration'],
        task_context: { task_type: 'debugging' },
        user_preferences: { preferred_tone: 'invalid-tone' }
      }).success).toBe(false);
    });
  });

  describe('Examples', () => {
    it('should have examples', () => {
      expect(recommendRoleTool.examples).toBeDefined();
      expect(Array.isArray(recommendRoleTool.examples)).toBe(true);
    });

    it('should have valid example inputs', () => {
      if (recommendRoleTool.examples) {
        recommendRoleTool.examples.forEach(example => {
          expect(parseInput(example.input).success).toBe(true);
        });
      }
    });
  });
});
