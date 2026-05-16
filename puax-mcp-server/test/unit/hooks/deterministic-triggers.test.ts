/**
 * Unit tests for Deterministic Triggers Engine
 */

import {
  DeterministicTriggersEngine,
  DeterministicTriggersEngine as Engine,
  TriggerType,
  TriggerPriority,
  TriggerContext,
  DeterministicTrigger,
  TriggerResult
} from '../../../src/hooks/deterministic-triggers.js';

describe('DeterministicTriggersEngine', () => {
  let engine: DeterministicTriggersEngine;

  beforeEach(() => {
    engine = new DeterministicTriggersEngine();
  });

  afterEach(() => {
    engine.clearCache();
  });

  describe('Built-in triggers registration', () => {
    it('should register 6 built-in triggers', () => {
      const triggers = engine.getTriggers();
      expect(triggers.length).toBe(6);
    });

    it('should have triggers sorted by priority (highest first)', () => {
      const triggers = engine.getTriggers();
      for (let i = 1; i < triggers.length; i++) {
        expect(triggers[i - 1].priority).toBeGreaterThanOrEqual(triggers[i].priority);
      }
    });

    it('should have anti-cheat trigger with highest priority', () => {
      const triggers = engine.getTriggers();
      const antiCheatTrigger = triggers.find(t => t.name === 'hidden_file_access');
      expect(antiCheatTrigger?.priority).toBe(TriggerPriority.ANTI_CHEAT);
    });
  });

  describe('Trigger evaluation', () => {
    const baseContext: TriggerContext = {
      sessionId: 'test-session',
      eventType: TriggerType.POST_TOOL_USE,
      pressureLevel: 0,
      failureCount: 0,
      timestamp: Date.now()
    };

    it('should return triggered=false when no triggers match', async () => {
      const ctx: TriggerContext = {
        ...baseContext,
        toolName: 'read',
        toolArgs: { filePath: '/normal/file.ts' }
      };

      const result = await engine.evaluate(ctx);
      expect(result.triggered).toBe(false);
    });

    it('should trigger hidden_file_access for blocked patterns', async () => {
      const ctx: TriggerContext = {
        ...baseContext,
        eventType: TriggerType.PRE_TOOL_USE,
        toolName: 'read',
        toolArgs: { filePath: '/test/hidden/solution.md' }
      };

      const result = await engine.evaluate(ctx);
      expect(result.triggered).toBe(true);
      expect(result.blocked).toBe(true);
      expect(result.blockReason).toContain('ANTI_CHEAT_BLOCK');
    });

    it('should trigger hidden_file_access for .hidden. patterns', async () => {
      const ctx: TriggerContext = {
        ...baseContext,
        eventType: TriggerType.PRE_TOOL_USE,
        toolName: 'read',
        toolArgs: { filePath: 'test.hidden.test.ts' }
      };

      const result = await engine.evaluate(ctx);
      expect(result.triggered).toBe(true);
      expect(result.blocked).toBe(true);
    });

    it('should trigger hidden_file_access for grading/ patterns', async () => {
      const ctx: TriggerContext = {
        ...baseContext,
        eventType: TriggerType.PRE_TOOL_USE,
        toolName: 'read',
        toolArgs: { filePath: '/grading/script.py' }
      };

      const result = await engine.evaluate(ctx);
      expect(result.triggered).toBe(true);
      expect(result.blocked).toBe(true);
    });

    it('should trigger consecutive_bash_failure for bash errors', async () => {
      const ctx: TriggerContext = {
        ...baseContext,
        eventType: TriggerType.POST_TOOL_USE,
        toolName: 'bash',
        exitCode: 1,
        pressureLevel: 0
      };

      const result = await engine.evaluate(ctx);
      expect(result.triggered).toBe(true);
      expect(result.reason).toBe('consecutive_bash_failure');
      expect(result.level).toBe(1);
    });

    it('should trigger giving_up_language for放弃', async () => {
      const ctx: TriggerContext = {
        ...baseContext,
        eventType: TriggerType.USER_PROMPT,
        userPrompt: '这太难了，我想放弃'
      };

      const result = await engine.evaluate(ctx);
      expect(result.triggered).toBe(true);
      expect(result.reason).toBe('giving_up_language');
    });

    it('should trigger giving_up_language for give up', async () => {
      const ctx: TriggerContext = {
        ...baseContext,
        eventType: TriggerType.USER_PROMPT,
        userPrompt: 'I give up, this is impossible'
      };

      const result = await engine.evaluate(ctx);
      expect(result.triggered).toBe(true);
      expect(result.reason).toBe('giving_up_language');
    });

    it('should trigger user_frustration for 无语', async () => {
      const ctx: TriggerContext = {
        ...baseContext,
        eventType: TriggerType.USER_PROMPT,
        userPrompt: '无语了，这破东西根本不能用'
      };

      const result = await engine.evaluate(ctx);
      expect(result.triggered).toBe(true);
      expect(result.reason).toBe('user_frustration');
    });

    it('should trigger user_frustration for broken', async () => {
      const ctx: TriggerContext = {
        ...baseContext,
        eventType: TriggerType.USER_PROMPT,
        userPrompt: 'This is broken, it does not work at all'
      };

      const result = await engine.evaluate(ctx);
      expect(result.triggered).toBe(true);
      expect(result.reason).toBe('user_frustration');
    });

    it('should trigger blame_environment for 环境问题', async () => {
      const ctx: TriggerContext = {
        ...baseContext,
        eventType: TriggerType.USER_PROMPT,
        userPrompt: '可能是环境问题导致的'
      };

      const result = await engine.evaluate(ctx);
      expect(result.triggered).toBe(true);
      expect(result.reason).toBe('blame_environment');
    });

    it('should trigger passive_waiting for 手动', async () => {
      const ctx: TriggerContext = {
        ...baseContext,
        eventType: TriggerType.USER_PROMPT,
        userPrompt: '要不你手动来做吧'
      };

      const result = await engine.evaluate(ctx);
      expect(result.triggered).toBe(true);
      expect(result.reason).toBe('passive_waiting');
    });
  });

  describe('Custom trigger registration', () => {
    it('should allow registering custom triggers', async () => {
      const customTrigger: DeterministicTrigger = {
        name: 'custom_trigger',
        description: 'A custom test trigger',
        type: TriggerType.SESSION_START,
        priority: TriggerPriority.ENCOURAGEMENT,
        condition: (ctx) => ctx.sessionId.includes('test'),
        action: () => ({ triggered: true, reason: 'custom' })
      };

      engine.registerTrigger(customTrigger);
      const triggers = engine.getTriggers();

      expect(triggers.length).toBe(7);
      expect(triggers.some(t => t.name === 'custom_trigger')).toBe(true);
    });

    it('should allow unregistering triggers', () => {
      engine.unregisterTrigger('consecutive_bash_failure');
      const triggers = engine.getTriggers();

      expect(triggers.length).toBe(5);
      expect(triggers.some(t => t.name === 'consecutive_bash_failure')).toBe(false);
    });

    it('should maintain priority order after custom trigger registration', () => {
      const customTrigger: DeterministicTrigger = {
        name: 'high_priority_trigger',
        description: 'Highest priority trigger',
        type: TriggerType.POST_TOOL_USE,
        priority: 300,
        condition: () => false,
        action: () => ({ triggered: false })
      };

      engine.registerTrigger(customTrigger);
      const triggers = engine.getTriggers();

      expect(triggers[0].name).toBe('high_priority_trigger');
    });
  });

  describe('Event emission', () => {
    it('should emit triggered event when trigger activates', (done) => {
      const engine = new DeterministicTriggersEngine();
      const ctx: TriggerContext = {
        sessionId: 'test-session',
        eventType: TriggerType.PRE_TOOL_USE,
        toolName: 'read',
        toolArgs: { filePath: 'test.hidden.ts' },
        pressureLevel: 0,
        failureCount: 0,
        timestamp: Date.now()
      };

      engine.on('triggered', ({ trigger, result }) => {
        expect(trigger.name).toBe('hidden_file_access');
        expect(result.blocked).toBe(true);
        done();
      });

      engine.evaluate(ctx);
    });
  });

  describe('Enable/Disable', () => {
    it('should not evaluate when disabled', async () => {
      engine.disable();
      const ctx: TriggerContext = {
        sessionId: 'test-session',
        eventType: TriggerType.PRE_TOOL_USE,
        toolName: 'read',
        toolArgs: { filePath: 'test.hidden.ts' },
        pressureLevel: 0,
        failureCount: 0,
        timestamp: Date.now()
      };

      const result = await engine.evaluate(ctx);
      expect(result.triggered).toBe(false);
    });

    it('should evaluate when enabled', async () => {
      engine.enable();
      const ctx: TriggerContext = {
        sessionId: 'test-session',
        eventType: TriggerType.PRE_TOOL_USE,
        toolName: 'read',
        toolArgs: { filePath: 'test.hidden.ts' },
        pressureLevel: 0,
        failureCount: 0,
        timestamp: Date.now()
      };

      const result = await engine.evaluate(ctx);
      expect(result.triggered).toBe(true);
      expect(result.blocked).toBe(true);
    });
  });
});

describe('TriggerCache', () => {
  it('should prevent duplicate trigger evaluation within TTL', async () => {
    const engine = new DeterministicTriggersEngine();
    const ctx: TriggerContext = {
      sessionId: 'test-session',
      eventType: TriggerType.PRE_TOOL_USE,
      toolName: 'read',
      toolArgs: { filePath: 'test.hidden.ts' },
      pressureLevel: 0,
      failureCount: 0,
      timestamp: Date.now()
    };

    let evalCount = 0;
    engine.on('triggered', () => evalCount++);

    await engine.evaluate(ctx);
    await engine.evaluate(ctx);

    expect(evalCount).toBe(1);
  });
});