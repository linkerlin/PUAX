#!/usr/bin/env node
/**
 * Recommend Role Tool Unit Tests
 */

import { recommendRoleTool } from '../../src/tools/recommend-role.js';

describe('recommend_role Tool', () => {
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
      expect(recommendRoleTool.inputSchema.type).toBe('object');
    });
  });

  describe('Input Schema', () => {
    it('should require detected_triggers', () => {
      const schema = recommendRoleTool.inputSchema;
      expect(schema.properties.detected_triggers).toBeDefined();
      expect(schema.properties.detected_triggers.type).toBe('array');
    });

    it('should require task_context', () => {
      const schema = recommendRoleTool.inputSchema;
      expect(schema.properties.task_context).toBeDefined();
      expect(schema.properties.task_context.type).toBe('object');
    });

    it('should have optional user_preferences', () => {
      const schema = recommendRoleTool.inputSchema;
      expect(schema.properties.user_preferences).toBeDefined();
    });

    it('should have optional session_history', () => {
      const schema = recommendRoleTool.inputSchema;
      expect(schema.properties.session_history).toBeDefined();
    });
  });

  describe('Task Context Schema', () => {
    it('should have task_type field', () => {
      const taskContext = recommendRoleTool.inputSchema.properties.task_context;
      expect(taskContext.properties.task_type).toBeDefined();
    });

    it('should have urgency enum', () => {
      const taskContext = recommendRoleTool.inputSchema.properties.task_context;
      expect(taskContext.properties.urgency).toBeDefined();
      if (taskContext.properties.urgency.enum) {
        expect(taskContext.properties.urgency.enum).toContain('low');
        expect(taskContext.properties.urgency.enum).toContain('critical');
      }
    });

    it('should have attempt_count field', () => {
      const taskContext = recommendRoleTool.inputSchema.properties.task_context;
      expect(taskContext.properties.attempt_count).toBeDefined();
      expect(taskContext.properties.attempt_count.type).toBe('number');
    });
  });

  describe('User Preferences Schema', () => {
    it('should have favorite_roles field', () => {
      const userPrefs = recommendRoleTool.inputSchema.properties.user_preferences;
      expect(userPrefs.properties.favorite_roles).toBeDefined();
      expect(userPrefs.properties.favorite_roles.type).toBe('array');
    });

    it('should have blacklisted_roles field', () => {
      const userPrefs = recommendRoleTool.inputSchema.properties.user_preferences;
      expect(userPrefs.properties.blacklisted_roles).toBeDefined();
      expect(userPrefs.properties.blacklisted_roles.type).toBe('array');
    });

    it('should have preferred_tone field', () => {
      const userPrefs = recommendRoleTool.inputSchema.properties.user_preferences;
      expect(userPrefs.properties.preferred_tone).toBeDefined();
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
          expect(example.input.detected_triggers).toBeDefined();
          expect(Array.isArray(example.input.detected_triggers)).toBe(true);
          expect(example.input.task_context).toBeDefined();
        });
      }
    });
  });
});
