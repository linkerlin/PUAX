/**
 * Activate with Context Tool Unit Tests
 */

import { activateWithContextTool } from '../../src/tools/activate-with-context.js';

describe('activate_with_context Tool', () => {
  const parseInput = (input: unknown) => activateWithContextTool.inputSchema.safeParse(input);

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
      expect(parseInput({
        context: { conversation_history: [] }
      }).success).toBe(true);
    });
  });

  describe('Input Schema', () => {
    it('should require context', () => {
      expect(parseInput({}).success).toBe(false);
    });

    it('should have optional options', () => {
      expect(parseInput({
        context: { conversation_history: [] },
        options: { auto_detect: true }
      }).success).toBe(true);
    });
  });

  describe('Context Schema', () => {
    it('should have conversation_history in context', () => {
      expect(parseInput({
        context: {
          conversation_history: [{ role: 'assistant', content: 'hi' }]
        }
      }).success).toBe(true);
    });

    it('should have optional task_context in context', () => {
      expect(parseInput({
        context: {
          conversation_history: [],
          task_context: { current_task: 'debugging', attempt_count: 2 }
        }
      }).success).toBe(true);
    });
  });

  describe('Options Schema', () => {
    it('should have auto_detect boolean', () => {
      expect(parseInput({
        context: { conversation_history: [] },
        options: { auto_detect: true }
      }).success).toBe(true);
      expect(parseInput({
        context: { conversation_history: [] },
        options: { auto_detect: 'yes' }
      }).success).toBe(false);
    });

    it('should have user_confirmation boolean', () => {
      expect(parseInput({
        context: { conversation_history: [] },
        options: { user_confirmation: true }
      }).success).toBe(true);
      expect(parseInput({
        context: { conversation_history: [] },
        options: { user_confirmation: 'yes' }
      }).success).toBe(false);
    });

    it('should have fallback_role string', () => {
      expect(parseInput({
        context: { conversation_history: [] },
        options: { fallback_role: 'military-commander' }
      }).success).toBe(true);
      expect(parseInput({
        context: { conversation_history: [] },
        options: { fallback_role: 1 }
      }).success).toBe(false);
    });

    it('should have include_methodology boolean', () => {
      expect(parseInput({
        context: { conversation_history: [] },
        options: { include_methodology: true }
      }).success).toBe(true);
      expect(parseInput({
        context: { conversation_history: [] },
        options: { include_methodology: 'yes' }
      }).success).toBe(false);
    });

    it('should have include_checklist boolean', () => {
      expect(parseInput({
        context: { conversation_history: [] },
        options: { include_checklist: true }
      }).success).toBe(true);
      expect(parseInput({
        context: { conversation_history: [] },
        options: { include_checklist: 'yes' }
      }).success).toBe(false);
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
          expect(parseInput(example.input).success).toBe(true);
        });
      }
    });
  });
});
