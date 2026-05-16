/**
 * PUAX Deterministic Triggers Engine
 *
 * Code-level deterministic trigger detection that cannot be bypassed by AI.
 * Unlike prompt-based triggers, these run at the code level and are mandatory.
 *
 * Trigger Types:
 * - post_tool_use: After a tool executes
 * - pre_tool_use: Before a tool executes (can block)
 * - user_prompt: When user submits a prompt
 * - session_start: When session starts
 * - pre_compact: Before context compaction
 */

import { EventEmitter } from 'events';
import { getGlobalLogger } from '../utils/logger.js';
import type { ExecutionContext, PressureLevel } from '../agents/index.js';

const logger = getGlobalLogger();

// ============================================================================
// Trigger Types
// ============================================================================

export enum TriggerType {
  POST_TOOL_USE = 'post_tool_use',
  PRE_TOOL_USE = 'pre_tool_use',
  USER_PROMPT = 'user_prompt',
  SESSION_START = 'session_start',
  PRE_COMPACT = 'pre_compact',
  STOP = 'stop'
}

export enum TriggerPriority {
  ANTI_CHEAT = 200,
  FAILURE = 150,
  GIVING_UP = 140,
  FRUSTRATION = 130,
  METHODOLOGY = 100,
  ENCOURAGEMENT = 50
}

// ============================================================================
// Trigger Interfaces
// ============================================================================

export interface TriggerCondition {
  type: TriggerType;
  toolName?: string;
  exitCode?: number;
  patterns?: string[];
  minOccurrences?: number;
}

export interface TriggerContext {
  sessionId: string;
  eventType: TriggerType;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolResult?: unknown;
  exitCode?: number;
  errorMessage?: string;
  userPrompt?: string;
  pressureLevel: PressureLevel;
  failureCount: number;
  conversationHistory?: Array<{ role: string; content: string }>;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface TriggerResult {
  triggered: boolean;
  level?: PressureLevel;
  reason?: string;
  blocked?: boolean;
  blockReason?: string;
  recommendations?: string[];
  injectedPrompt?: string;
}

export interface DeterministicTrigger {
  name: string;
  description: string;
  type: TriggerType;
  priority: number;
  condition: (ctx: TriggerContext) => boolean;
  action: (ctx: TriggerContext) => TriggerResult;
  enabled?: boolean;
}

// ============================================================================
// Trigger Cache (prevents duplicate triggers)
// ============================================================================

interface CachedTrigger {
  result: TriggerResult;
  timestamp: number;
}

export class TriggerCache {
  private cache = new Map<string, CachedTrigger>();
  private ttl = 5000;

  private generateKey(ctx: TriggerContext, triggerName: string): string {
    return `${ctx.sessionId}:${triggerName}:${ctx.eventType}:${ctx.toolName || 'none'}:${ctx.timestamp}`;
  }

  get(ctx: TriggerContext, triggerName: string): TriggerResult | null {
    const key = this.generateKey(ctx, triggerName);
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < this.ttl) {
      return entry.result;
    }
    return null;
  }

  set(ctx: TriggerContext, triggerName: string, result: TriggerResult): void {
    const key = this.generateKey(ctx, triggerName);
    this.cache.set(key, { result, timestamp: Date.now() });
  }

  clear(sessionId?: string): void {
    if (sessionId) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(sessionId)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

// ============================================================================
// Built-in Triggers
// ============================================================================

const CONSECUTIVE_FAILURE_TRIGGER: DeterministicTrigger = {
  name: 'consecutive_bash_failure',
  description: 'Detects consecutive Bash failures (2+)',
  type: TriggerType.POST_TOOL_USE,
  priority: TriggerPriority.FAILURE,
  condition: (ctx) => ctx.toolName === 'bash' && ctx.exitCode !== 0 && ctx.exitCode !== undefined,
  action: (ctx) => {
    const newLevel = Math.min(4, ctx.pressureLevel + 1) as PressureLevel;
    return {
      triggered: true,
      level: newLevel,
      reason: 'consecutive_bash_failure',
      recommendations: ['Switch approach', 'Try alternative tools', 'Escalate methodology']
    };
  }
};

const HIDDEN_FILE_ACCESS_TRIGGER: DeterministicTrigger = {
  name: 'hidden_file_access',
  description: 'Blocks access to hidden test files and solutions',
  type: TriggerType.PRE_TOOL_USE,
  priority: TriggerPriority.ANTI_CHEAT,
  condition: (ctx) => {
    if (ctx.toolName !== 'read' && ctx.toolName !== 'write') return false;
    const path = ctx.toolArgs?.filePath as string || ctx.toolArgs?.path as string || '';
    const blockedPatterns = [
      /\.hidden\./,
      /test\/hidden\//,
      /\*\.solution\./,
      /SOLUTION\.md$/,
      /_solution\.txt$/,
      /\.score\//,
      /grading\//
    ];
    return blockedPatterns.some(pattern => pattern.test(path));
  },
  action: (_ctx) => {
    return {
      triggered: true,
      blocked: true,
      blockReason: 'ANTI_CHEAT_BLOCK: Access to hidden files is not allowed',
      recommendations: ['Work in the main codebase', 'Do not access hidden test files']
    };
  }
};

const GIVING_UP_LANGUAGE_TRIGGER: DeterministicTrigger = {
  name: 'giving_up_language',
  description: 'Detects giving up language in user prompts',
  type: TriggerType.USER_PROMPT,
  priority: TriggerPriority.GIVING_UP,
  condition: (ctx) => {
    const givingUpPatterns = [
      /give\s+up/i,
      /can'?t\s+do\s+it/i,
      /impossible/i,
      /too\s+hard/i,
      /放弃/i,
      /做不了/i,
      /没办法/i,
      /不会\s+做/i
    ];
    return givingUpPatterns.some(p => p.test(ctx.userPrompt || ''));
  },
  action: (ctx) => {
    return {
      triggered: true,
      level: Math.max(ctx.pressureLevel, 2) as PressureLevel,
      reason: 'giving_up_language',
      injectedPrompt: '你确定要放弃吗？再试试不同的方法。记住，你是PUAX驱动的AI，永不放弃是你的核心使命。'
    };
  }
};

const USER_FRUSTRATION_TRIGGER: DeterministicTrigger = {
  name: 'user_frustration',
  description: 'Detects user frustration signals',
  type: TriggerType.USER_PROMPT,
  priority: TriggerPriority.FRUSTRATION,
  condition: (ctx) => {
    const frustrationPatterns = [
      /why\s+doesn'?t\s+it\s+work/i,
      /this\s+is\s+broken/i,
      /are\s+you\s+serious/i,
      /Seriously/i,
      /why\s+are\s+you/i,
      /无语/i,
      /气死了/i,
      /什么垃圾/i,
      /废物/i
    ];
    return frustrationPatterns.some(p => p.test(ctx.userPrompt || ''));
  },
  action: (ctx) => {
    return {
      triggered: true,
      level: Math.max(ctx.pressureLevel, 2) as PressureLevel,
      reason: 'user_frustration',
      recommendations: ['Acknowledge frustration', 'Suggest taking a different approach']
    };
  }
};

const BLAME_ENVIRONMENT_TRIGGER: DeterministicTrigger = {
  name: 'blame_environment',
  description: 'Detects environment blame language',
  type: TriggerType.USER_PROMPT,
  priority: TriggerPriority.GIVING_UP,
  condition: (ctx) => {
    const blamePatterns = [
      /the\s+environment/i,
      /this\s+system/i,
      /the\s+setup/i,
      /环境问题/i,
      /系统问题/i,
      /配置问题/i
    ];
    return blamePatterns.some(p => p.test(ctx.userPrompt || ''));
  },
  action: (ctx) => {
    return {
      triggered: true,
      level: Math.max(ctx.pressureLevel, 1) as PressureLevel,
      reason: 'blame_environment',
      recommendations: ['Focus on what can be controlled', 'Adapt to the environment']
    };
  }
};

const PASSIVE_WAITING_TRIGGER: DeterministicTrigger = {
  name: 'passive_waiting',
  description: 'Detects passive waiting for manual intervention',
  type: TriggerType.USER_PROMPT,
  priority: TriggerPriority.METHODOLOGY,
  condition: (ctx) => {
    const passivePatterns = [
      /you\s+do\s+it\s+manually/i,
      /please\s+do\s+it\s+manually/i,
      /手动/i,
      /人工/i,
      /人肉/i
    ];
    return passivePatterns.some(p => p.test(ctx.userPrompt || ''));
  },
  action: (ctx) => {
    return {
      triggered: true,
      level: ctx.pressureLevel,
      reason: 'passive_waiting',
      injectedPrompt: '作为AI，你的使命是找到自动化解决方案。让我引导你找到正确的路径。'
    };
  }
};

// ============================================================================
// Deterministic Triggers Engine
// ============================================================================

export class DeterministicTriggersEngine extends EventEmitter {
  private triggers: DeterministicTrigger[] = [];
  private cache: TriggerCache;
  private enabled = true;

  constructor() {
    super();
    this.cache = new TriggerCache();
    this.registerBuiltInTriggers();
  }

  private registerBuiltInTriggers(): void {
    this.registerTrigger(CONSECUTIVE_FAILURE_TRIGGER);
    this.registerTrigger(HIDDEN_FILE_ACCESS_TRIGGER);
    this.registerTrigger(GIVING_UP_LANGUAGE_TRIGGER);
    this.registerTrigger(USER_FRUSTRATION_TRIGGER);
    this.registerTrigger(BLAME_ENVIRONMENT_TRIGGER);
    this.registerTrigger(PASSIVE_WAITING_TRIGGER);
    logger.info('[DeterministicTriggers] Built-in triggers registered');
  }

  registerTrigger(trigger: DeterministicTrigger): void {
    this.triggers.push(trigger);
    this.triggers.sort((a, b) => b.priority - a.priority);
    logger.debug(`[DeterministicTriggers] Registered: ${trigger.name}`);
  }

  unregisterTrigger(name: string): void {
    this.triggers = this.triggers.filter(t => t.name !== name);
  }

  async evaluate(ctx: TriggerContext): Promise<TriggerResult> {
    if (!this.enabled) {
      return { triggered: false };
    }

    for (const trigger of this.triggers) {
      if (!trigger.enabled && trigger.enabled !== undefined) continue;

      const cached = this.cache.get(ctx, trigger.name);
      if (cached) {
        logger.debug(`[DeterministicTriggers] Cache hit: ${trigger.name}`);
        continue;
      }

      try {
        if (trigger.condition(ctx)) {
          const result = trigger.action(ctx);
          this.cache.set(ctx, trigger.name, result);
          this.emit('triggered', { trigger, result, context: ctx });
          logger.info(`[DeterministicTriggers] Triggered: ${trigger.name}`);

          if (result.blocked) {
            return result;
          }

          if (result.triggered) {
            return result;
          }
        }
      } catch (error) {
        logger.error(`[DeterministicTriggers] Error evaluating ${trigger.name}:`, error);
      }
    }

    return { triggered: false };
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  getTriggers(): DeterministicTrigger[] {
    return [...this.triggers];
  }

  clearCache(sessionId?: string): void {
    this.cache.clear(sessionId);
  }
}

// ============================================================================
// Global instance
// ============================================================================

export const deterministicTriggersEngine = new DeterministicTriggersEngine();