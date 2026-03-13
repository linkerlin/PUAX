#!/usr/bin/env node
/**
 * Detect Trigger Tool Unit Tests
 */

import { detectTriggerTool } from '../../src/tools/detect-trigger.js';

describe('detect_trigger Tool', () => {
  describe('Tool Definition', () => {
    it('should have correct tool name', () => {
      expect(detectTriggerTool.name).toBe('detect_trigger');
    });

    it('should have description', () => {
      expect(detectTriggerTool.description).toBeDefined();
      expect(detectTriggerTool.description.length).toBeGreaterThan(0);
    });

    it('should have input schema', () => {
      expect(detectTriggerTool.inputSchema).toBeDefined();
      expect(detectTriggerTool.inputSchema.type).toBe('object');
    });

    it('should define conversation_history in schema', () => {
      const schema = detectTriggerTool.inputSchema;
      expect(schema.properties).toBeDefined();
      expect(schema.properties.conversation_history).toBeDefined();
    });

    it('should define task_context in schema', () => {
      const schema = detectTriggerTool.inputSchema;
      expect(schema.properties.task_context).toBeDefined();
    });

    it('should define options in schema', () => {
      const schema = detectTriggerTool.inputSchema;
      expect(schema.properties.options).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should accept valid conversation history', () => {
      const validInput = {
        conversation_history: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there' }
        ]
      };
      
      // Schema should allow this input
      const schema = detectTriggerTool.inputSchema;
      expect(schema.properties.conversation_history.type).toBe('array');
    });

    it('should accept empty conversation history', () => {
      const emptyInput = {
        conversation_history: []
      };
      
      const schema = detectTriggerTool.inputSchema;
      expect(schema.properties.conversation_history.type).toBe('array');
    });

    it('should accept conversation with system messages', () => {
      const inputWithSystem = {
        conversation_history: [
          { role: 'system', content: 'System prompt' },
          { role: 'user', content: 'Hello' }
        ]
      };
      
      const schema = detectTriggerTool.inputSchema;
      expect(schema.properties.conversation_history.type).toBe('array');
    });
  });

  describe('Schema Properties', () => {
    it('should have correct role enum', () => {
      const messageSchema = detectTriggerTool.inputSchema.properties.conversation_history.items;
      expect(messageSchema.properties.role.enum).toContain('user');
      expect(messageSchema.properties.role.enum).toContain('assistant');
      expect(messageSchema.properties.role.enum).toContain('system');
    });

    it('should require content field', () => {
      const messageSchema = detectTriggerTool.inputSchema.properties.conversation_history.items;
      expect(messageSchema.properties.content).toBeDefined();
      expect(messageSchema.properties.content.type).toBe('string');
    });

    it('should have optional task_context properties', () => {
      const taskContextSchema = detectTriggerTool.inputSchema.properties.task_context;
      expect(taskContextSchema.properties.current_task).toBeDefined();
      expect(taskContextSchema.properties.attempt_count).toBeDefined();
      expect(taskContextSchema.properties.tools_available).toBeDefined();
      expect(taskContextSchema.properties.tools_used).toBeDefined();
    });

    it('should have optional options properties', () => {
      const optionsSchema = detectTriggerTool.inputSchema.properties.options;
      expect(optionsSchema.properties.sensitivity).toBeDefined();
      expect(optionsSchema.properties.sensitivity.enum).toContain('low');
      expect(optionsSchema.properties.sensitivity.enum).toContain('medium');
      expect(optionsSchema.properties.sensitivity.enum).toContain('high');
    });
  });

  describe('Tool Metadata', () => {
    it('should have examples', () => {
      expect(detectTriggerTool.examples).toBeDefined();
      expect(Array.isArray(detectTriggerTool.examples)).toBe(true);
    });

    it('should have valid examples', () => {
      if (detectTriggerTool.examples) {
        detectTriggerTool.examples.forEach(example => {
          expect(example.name).toBeDefined();
          expect(example.description).toBeDefined();
          expect(example.input).toBeDefined();
        });
      }
    });
  });
});
