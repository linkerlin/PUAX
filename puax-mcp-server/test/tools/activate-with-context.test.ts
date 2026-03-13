#!/usr/bin/env node
/**
 * Activate with Context Tool Unit Tests
 */

import { activateWithContextTool } from '../../src/tools/activate-with-context.js';

describe('activate_with_context Tool', () => {
  describe('Tool Definition', () => {
    it('should have correct tool name', () => {
      expect(activateWithContextTool.name).toBe('activate_with_context');
    });

    it('should have description', () => {
      expect(activateWithContextTool.description).toBeDefined();
      expect(activateWithContextTool.description.length).toBeGreaterThan(0);
    });

    it('should have input schema', () => {
      expect(activateWithContextTool.inputSchema).toBeDefined();
      expect(activateWithContextTool.inputSchema.type).toBe('object');
    });
  });

  describe('Input Schema', () => {
    it('should require context', () => {
      const schema = activateWithContextTool.inputSchema;
      expect(schema.properties.context).toBeDefined();
      expect(schema.properties.context.type).toBe('object');
    });

    it('should have optional options', () => {
      const schema = activateWithContextTool.inputSchema;
      expect(schema.properties.options).toBeDefined();
    });
  });

  describe('Context Schema', () => {
    it('should have conversation_history in context', () => {
      const context = activateWithContextTool.inputSchema.properties.context;
      expect(context.properties.conversation_history).toBeDefined();
      expect(context.properties.conversation_history.type).toBe('array');
    });

    it('should have optional task_context in context', () => {
      const context = activateWithContextTool.inputSchema.properties.context;
      expect(context.properties.task_context).toBeDefined();
    });
  });

  describe('Options Schema', () => {
    it('should have auto_detect boolean', () => {
      const options = activateWithContextTool.inputSchema.properties.options;
      expect(options.properties.auto_detect).toBeDefined();
      expect(options.properties.auto_detect.type).toBe('boolean');
    });

    it('should have user_confirmation boolean', () => {
      const options = activateWithContextTool.inputSchema.properties.options;
      expect(options.properties.user_confirmation).toBeDefined();
      expect(options.properties.user_confirmation.type).toBe('boolean');
    });

    it('should have fallback_role string', () => {
      const options = activateWithContextTool.inputSchema.properties.options;
      expect(options.properties.fallback_role).toBeDefined();
      expect(options.properties.fallback_role.type).toBe('string');
    });

    it('should have include_methodology boolean', () => {
      const options = activateWithContextTool.inputSchema.properties.options;
      expect(options.properties.include_methodology).toBeDefined();
      expect(options.properties.include_methodology.type).toBe('boolean');
    });

    it('should have include_checklist boolean', () => {
      const options = activateWithContextTool.inputSchema.properties.options;
      expect(options.properties.include_checklist).toBeDefined();
      expect(options.properties.include_checklist.type).toBe('boolean');
    });
  });

  describe('Examples', () => {
    it('should have examples', () => {
      expect(activateWithContextTool.examples).toBeDefined();
      expect(Array.isArray(activateWithContextTool.examples)).toBe(true);
    });

    it('should have example with context', () => {
      if (activateWithContextTool.examples) {
        activateWithContextTool.examples.forEach(example => {
          expect(example.input.context).toBeDefined();
          expect(example.input.context.conversation_history).toBeDefined();
        });
      }
    });
  });
});
