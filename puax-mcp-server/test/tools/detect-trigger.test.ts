/**
 * Detect Trigger Tool Unit Tests
 */

import { detectTriggerTool } from '../../src/tools/detect-trigger.js';

describe('detect_trigger Tool', () => {
  const parseInput = (input: unknown) => detectTriggerTool.inputSchema.safeParse(input);

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
      expect(parseInput({ conversation_history: [] }).success).toBe(true);
    });

    it('should define conversation_history in schema', () => {
      expect(parseInput({}).success).toBe(false);
    });

    it('should define task_context in schema', () => {
      expect(parseInput({
        conversation_history: [],
        task_context: { current_task: 'debugging' }
      }).success).toBe(true);
    });

    it('should define options in schema', () => {
      expect(parseInput({
        conversation_history: [],
        options: { sensitivity: 'high', language: 'auto' }
      }).success).toBe(true);
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

      expect(parseInput(validInput).success).toBe(true);
    });

    it('should accept empty conversation history', () => {
      const emptyInput = {
        conversation_history: []
      };

      expect(parseInput(emptyInput).success).toBe(true);
    });

    it('should accept conversation with system messages', () => {
      const inputWithSystem = {
        conversation_history: [
          { role: 'system', content: 'System prompt' },
          { role: 'user', content: 'Hello' }
        ]
      };

      expect(parseInput(inputWithSystem).success).toBe(true);
    });
  });

  describe('Schema Properties', () => {
    it('should have correct role enum', () => {
      expect(parseInput({
        conversation_history: [{ role: 'user', content: 'hi' }]
      }).success).toBe(true);
      expect(parseInput({
        conversation_history: [{ role: 'assistant', content: 'hi' }]
      }).success).toBe(true);
      expect(parseInput({
        conversation_history: [{ role: 'system', content: 'hi' }]
      }).success).toBe(true);
      expect(parseInput({
        conversation_history: [{ role: 'tool', content: 'hi' }]
      }).success).toBe(false);
    });

    it('should require content field', () => {
      expect(parseInput({
        conversation_history: [{ role: 'user' }]
      }).success).toBe(false);
    });

    it('should have optional task_context properties', () => {
      expect(parseInput({
        conversation_history: [],
        task_context: {
          current_task: 'debugging',
          attempt_count: 2,
          tools_available: ['search'],
          tools_used: ['read_file']
        }
      }).success).toBe(true);
    });

    it('should have optional options properties', () => {
      expect(parseInput({
        conversation_history: [],
        options: { sensitivity: 'low' }
      }).success).toBe(true);
      expect(parseInput({
        conversation_history: [],
        options: { sensitivity: 'medium' }
      }).success).toBe(true);
      expect(parseInput({
        conversation_history: [],
        options: { sensitivity: 'high' }
      }).success).toBe(true);
      expect(parseInput({
        conversation_history: [],
        options: { sensitivity: 'extreme' }
      }).success).toBe(false);
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
          expect(example.input).toBeDefined();
          expect(parseInput(example.input).success).toBe(true);
        });
      }
    });
  });
});
