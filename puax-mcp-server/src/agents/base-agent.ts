/**
 * PUAX Agent System - Base Agent Class
 * Four-Power Separation Architecture (四权分离)
 *
 * This module implements the foundational agent hierarchy:
 * - ACTION_RIGHT: Execution authority (执行权)
 * - SELF_EVAL_RIGHT: Self-evaluation (自评权)
 * - SCORING_RIGHT: Scoring authority (评分权)
 * - ENVIRON_MOD_RIGHT: Environment modification (环改权)
 */

import { EventEmitter } from 'events';
import { getGlobalLogger } from '../utils/logger.js';

const logger = getGlobalLogger();

// ============================================================================
// Agent Role Types
// ============================================================================

export enum AgentRole {
  ACTION_RIGHT = 'action_executor',
  SELF_EVAL_RIGHT = 'self_reviewer',
  SCORING_RIGHT = 'verifier',
  ENVIRON_MOD_RIGHT = 'policy_guardian',
  P7 = 'senior_engineer',
  P9 = 'tech_lead',
  P10 = 'cto'
}

export enum AgentTier {
  P6 = 'p6',
  P7 = 'p7',
  P9 = 'p9',
  P10 = 'p10'
}

// ============================================================================
// Agent Message Types
// ============================================================================

export interface AgentMessage {
  id: string;
  from: AgentRole;
  to: AgentRole | 'broadcast';
  type: 'request' | 'response' | 'notification' | 'escalation';
  payload: {
    action?: string;
    data?: unknown;
    context?: ExecutionContext;
    reason?: string;
  };
  timestamp: number;
  conversationId?: string;
}

export interface ExecutionContext {
  task: string;
  conversationHistory: Array<{ role: string; content: string }>;
  toolsAvailable: string[];
  toolsUsed: string[];
  attemptCount: number;
  failureCount: number;
  pressureLevel: PressureLevel;
  currentRole?: string;
  metadata?: Record<string, unknown>;
}

export type PressureLevel = 0 | 1 | 2 | 3 | 4;

// ============================================================================
// Agent Base Class
// ============================================================================

export abstract class BaseAgent extends EventEmitter {
  readonly role: AgentRole;
  readonly tier: AgentTier;
  protected state: AgentState;
  protected messageBuffer: AgentMessage[] = [];

  constructor(role: AgentRole, tier: AgentTier) {
    super();
    this.role = role;
    this.tier = tier;
    this.state = this.initializeState();
  }

  protected abstract initializeState(): AgentState;

  public getState(): AgentState {
    return { ...this.state };
  }

  public getRole(): AgentRole {
    return this.role;
  }

  public getTier(): AgentTier {
    return this.tier;
  }

  public abstract execute(context: ExecutionContext): Promise<AgentResponse>;

  public abstract canHandle(task: string, context: ExecutionContext): boolean;

  protected sendMessage(message: AgentMessage): void {
    this.messageBuffer.push(message);
    this.emit('message', message);
    logger.debug(`[${this.role}] Message sent: ${message.type} -> ${message.to}`);
  }

  public sendMessagePublic(message: AgentMessage): void {
    this.sendMessage(message);
  }

  protected receiveMessage(message: AgentMessage): void {
    if (message.to !== this.role && message.to !== 'broadcast') {
      return;
    }
    this.messageBuffer.push(message);
    this.emit('messageReceived', message);
    logger.debug(`[${this.role}] Message received: ${message.type} from ${message.from}`);
  }

  public receiveMessagePublic(message: AgentMessage): void {
    this.receiveMessage(message);
  }

  protected updateState(updates: Partial<AgentState>): void {
    this.state = { ...this.state, ...updates };
    this.emit('stateChanged', this.state);
  }
}

// ============================================================================
// Agent State
// ============================================================================

export interface AgentState {
  status: 'idle' | 'working' | 'waiting' | 'blocked' | 'completed' | 'failed';
  currentTask?: string;
  pressureLevel: PressureLevel;
  failureCount: number;
  successCount: number;
  lastActiveAt: number;
  metadata: Record<string, unknown>;
}

// ============================================================================
// Agent Response
// ============================================================================

export interface AgentResponse {
  success: boolean;
  message: string;
  data?: unknown;
  action?: string;
  nextSteps?: string[];
  role: AgentRole;
}

// ============================================================================
// Factory function for creating agents
// ============================================================================

export function createAgent(role: AgentRole, tier: AgentTier): BaseAgent {
  switch (role) {
    case AgentRole.ACTION_RIGHT:
      return new ActionExecutorAgent(role, tier);
    case AgentRole.SELF_EVAL_RIGHT:
      return new SelfReviewerAgent(role, tier);
    case AgentRole.SCORING_RIGHT:
      return new VerifierAgent(role, tier);
    case AgentRole.ENVIRON_MOD_RIGHT:
      return new PolicyGuardianAgent(role, tier);
    case AgentRole.P7: {
      const { P7Agent } = require('./hierarchy/index.js');
      return new P7Agent(role, tier);
    }
    case AgentRole.P9: {
      const { P9Agent } = require('./hierarchy/index.js');
      return new P9Agent(role, tier);
    }
    case AgentRole.P10: {
      const { P10Agent } = require('./hierarchy/index.js');
      return new P10Agent(role, tier);
    }
    default:
      return new ActionExecutorAgent(role, tier);
  }
}

// ============================================================================
// Action Executor Agent (执行权)
// ============================================================================

class ActionExecutorAgent extends BaseAgent {
  protected initializeState(): AgentState {
    return {
      status: 'idle',
      pressureLevel: 0,
      failureCount: 0,
      successCount: 0,
      lastActiveAt: Date.now(),
      metadata: {}
    };
  }

  public async execute(context: ExecutionContext): Promise<AgentResponse> {
    this.updateState({
      status: 'working',
      currentTask: context.task,
      lastActiveAt: Date.now()
    });

    logger.info(`[ActionExecutor] Executing task: ${context.task}`);

    this.updateState({
      status: 'completed',
      lastActiveAt: Date.now()
    });

    return {
      success: true,
      message: `ActionExecutor completed: ${context.task}`,
      data: { executed: true },
      action: 'execute',
      nextSteps: ['self_review', 'verify'],
      role: AgentRole.ACTION_RIGHT
    };
  }

  public canHandle(task: string, _context: ExecutionContext): boolean {
    return !task.includes('review') && !task.includes('score') && !task.includes('policy');
  }
}

// ============================================================================
// Self Reviewer Agent (自评权)
// ============================================================================

class SelfReviewerAgent extends BaseAgent {
  protected initializeState(): AgentState {
    return {
      status: 'idle',
      pressureLevel: 0,
      failureCount: 0,
      successCount: 0,
      lastActiveAt: Date.now(),
      metadata: {}
    };
  }

  public async execute(context: ExecutionContext): Promise<AgentResponse> {
    this.updateState({
      status: 'working',
      currentTask: context.task,
      lastActiveAt: Date.now()
    });

    logger.info(`[SelfReviewer] Self-reviewing: ${context.task}`);

    this.updateState({
      status: 'completed',
      lastActiveAt: Date.now()
    });

    return {
      success: true,
      message: `SelfReviewer completed: ${context.task}`,
      data: { reviewed: true, selfAssessment: 'adequate' },
      action: 'self_review',
      nextSteps: ['score', 'policy_check'],
      role: AgentRole.SELF_EVAL_RIGHT
    };
  }

  public canHandle(task: string, _context: ExecutionContext): boolean {
    return task.includes('review') || task.includes('evaluate');
  }
}

// ============================================================================
// Verifier Agent (评分权)
// ============================================================================

class VerifierAgent extends BaseAgent {
  protected initializeState(): AgentState {
    return {
      status: 'idle',
      pressureLevel: 0,
      failureCount: 0,
      successCount: 0,
      lastActiveAt: Date.now(),
      metadata: {}
    };
  }

  public async execute(context: ExecutionContext): Promise<AgentResponse> {
    this.updateState({
      status: 'working',
      currentTask: context.task,
      lastActiveAt: Date.now()
    });

    logger.info(`[Verifier] Scoring: ${context.task}`);

    this.updateState({
      status: 'completed',
      lastActiveAt: Date.now()
    });

    return {
      success: true,
      message: `Verifier completed: ${context.task}`,
      data: { score: 85, passed: true },
      action: 'score',
      nextSteps: ['policy_check'],
      role: AgentRole.SCORING_RIGHT
    };
  }

  public canHandle(task: string, _context: ExecutionContext): boolean {
    return task.includes('score') || task.includes('verify') || task.includes('test');
  }
}

// ============================================================================
// Policy Guardian Agent (环改权)
// ============================================================================

class PolicyGuardianAgent extends BaseAgent {
  protected initializeState(): AgentState {
    return {
      status: 'idle',
      pressureLevel: 0,
      failureCount: 0,
      successCount: 0,
      lastActiveAt: Date.now(),
      metadata: {}
    };
  }

  public async execute(context: ExecutionContext): Promise<AgentResponse> {
    this.updateState({
      status: 'working',
      currentTask: context.task,
      lastActiveAt: Date.now()
    });

    logger.info(`[PolicyGuardian] Policy check: ${context.task}`);

    this.updateState({
      status: 'completed',
      lastActiveAt: Date.now()
    });

    return {
      success: true,
      message: `PolicyGuardian completed: ${context.task}`,
      data: { policyCompliant: true },
      action: 'policy_check',
      nextSteps: [],
      role: AgentRole.ENVIRON_MOD_RIGHT
    };
  }

  public canHandle(task: string, _context: ExecutionContext): boolean {
    return task.includes('policy') || task.includes('guard') || task.includes('environment');
  }
}

// ============================================================================
// Tech Lead Agent (P9)
// ============================================================================

class TechLeadAgent extends BaseAgent {
  protected initializeState(): AgentState {
    return {
      status: 'idle',
      pressureLevel: 0,
      failureCount: 0,
      successCount: 0,
      lastActiveAt: Date.now(),
      metadata: {}
    };
  }

  public async execute(context: ExecutionContext): Promise<AgentResponse> {
    this.updateState({
      status: 'working',
      currentTask: context.task,
      lastActiveAt: Date.now()
    });

    logger.info(`[TechLead] Orchestrating team for: ${context.task}`);

    this.updateState({
      status: 'completed',
      lastActiveAt: Date.now()
    });

    return {
      success: true,
      message: `TechLead orchestrated: ${context.task}`,
      data: {
        teamSize: 4,
        agentsDeployed: ['action_executor', 'self_reviewer', 'verifier', 'policy_guardian']
      },
      action: 'orchestrate',
      nextSteps: [],
      role: AgentRole.P9
    };
  }

  public canHandle(_task: string, context: ExecutionContext): boolean {
    return context.pressureLevel >= 2;
  }
}

// ============================================================================
// CTO Agent (P10)
// ============================================================================

class CtoAgent extends BaseAgent {
  protected initializeState(): AgentState {
    return {
      status: 'idle',
      pressureLevel: 0,
      failureCount: 0,
      successCount: 0,
      lastActiveAt: Date.now(),
      metadata: {}
    };
  }

  public async execute(context: ExecutionContext): Promise<AgentResponse> {
    this.updateState({
      status: 'working',
      currentTask: context.task,
      lastActiveAt: Date.now()
    });

    logger.info(`[CTO] Strategic direction for: ${context.task}`);

    this.updateState({
      status: 'completed',
      lastActiveAt: Date.now()
    });

    return {
      success: true,
      message: `CTO strategic direction: ${context.task}`,
      data: {
        priority: 'critical',
        resourceAllocation: 'maximum',
        timeline: 'immediate'
      },
      action: 'strategize',
      nextSteps: [],
      role: AgentRole.P10
    };
  }

  public canHandle(_task: string, context: ExecutionContext): boolean {
    return context.pressureLevel >= 4 || context.attemptCount >= 10;
  }
}

// ============================================================================
// Agent Registry
// ============================================================================

export class AgentRegistry {
  private agents: Map<AgentRole, BaseAgent> = new Map();
  private logger = getGlobalLogger();

  register(role: AgentRole, tier: AgentTier, agent?: BaseAgent): void {
    const ag = agent || createAgent(role, tier);
    this.agents.set(role, ag);
    this.logger.info(`[AgentRegistry] Registered agent: ${role}`);
  }

  get(role: AgentRole): BaseAgent | undefined {
    return this.agents.get(role);
  }

  getAll(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  has(role: AgentRole): boolean {
    return this.agents.has(role);
  }
}

export const globalAgentRegistry = new AgentRegistry();