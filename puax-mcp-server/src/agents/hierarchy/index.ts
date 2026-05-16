/**
 * PUAX Agent Hierarchy - P7/P9/P10 Tiered Agents
 *
 * P7: Senior Engineer - Single role execution mode
 * P9: Tech Lead - Multi-agent orchestration
 * P10: CTO - Strategic direction
 */

import { BaseAgent, AgentRole, AgentTier, AgentState, ExecutionContext, AgentResponse, AgentMessage } from '../base-agent.js';
import { getGlobalLogger } from '../../utils/logger.js';

const logger = getGlobalLogger();

// ============================================================================
// P7 Senior Engineer Agent
// ============================================================================

export class P7Agent extends BaseAgent {
  readonly role = AgentRole.P7;
  readonly tier = AgentTier.P7;

  protected initializeState(): AgentState {
    return {
      status: 'idle',
      pressureLevel: 0,
      failureCount: 0,
      successCount: 0,
      lastActiveAt: Date.now(),
      metadata: {
        executionMode: 'single',
        allowedTools: ['read', 'write', 'bash', 'grep', 'edit']
      }
    };
  }

  public async execute(context: ExecutionContext): Promise<AgentResponse> {
    this.updateState({
      status: 'working',
      currentTask: context.task,
      pressureLevel: context.pressureLevel,
      lastActiveAt: Date.now()
    });

    logger.info(`[P7] Senior Engineer executing: ${context.task}`);

    const executionResult = await this.executeTask(context);

    if (executionResult.success) {
      this.updateState({
        status: 'completed',
        successCount: this.state.successCount + 1,
        lastActiveAt: Date.now()
      });
    } else {
      this.updateState({
        status: 'failed',
        failureCount: this.state.failureCount + 1,
        lastActiveAt: Date.now()
      });
    }

    return executionResult;
  }

  private async executeTask(context: ExecutionContext): Promise<AgentResponse> {
    return {
      success: true,
      message: `P7 Senior Engineer completed: ${context.task}`,
      data: {
        executed: true,
        toolsUsed: context.toolsUsed,
        attemptCount: context.attemptCount
      },
      action: 'senior_execution',
      nextSteps: ['self_review'],
      role: AgentRole.P7
    };
  }

  public canHandle(_task: string, context: ExecutionContext): boolean {
    return context.pressureLevel < 3 && context.attemptCount < 5;
  }
}

// ============================================================================
// P9 Tech Lead Agent
// ============================================================================

export class P9Agent extends BaseAgent {
  readonly role = AgentRole.P9;
  readonly tier = AgentTier.P9;

  protected initializeState(): AgentState {
    return {
      status: 'idle',
      pressureLevel: 0,
      failureCount: 0,
      successCount: 0,
      lastActiveAt: Date.now(),
      metadata: {
        executionMode: 'multi_agent',
        teamSize: 4,
        agents: ['action_executor', 'self_reviewer', 'verifier', 'policy_guardian']
      }
    };
  }

  public async execute(context: ExecutionContext): Promise<AgentResponse> {
    this.updateState({
      status: 'working',
      currentTask: context.task,
      pressureLevel: context.pressureLevel,
      lastActiveAt: Date.now()
    });

    logger.info(`[P9] Tech Lead orchestrating team for: ${context.task}`);

    const orchResult = await this.orchestrateTeam(context);

    this.updateState({
      status: orchResult.success ? 'completed' : 'failed',
      successCount: orchResult.success ? this.state.successCount + 1 : this.state.successCount,
      failureCount: orchResult.success ? this.state.failureCount : this.state.failureCount + 1,
      lastActiveAt: Date.now()
    });

    return orchResult;
  }

  private async orchestrateTeam(context: ExecutionContext): Promise<AgentResponse> {
    const teamResults = await Promise.all([
      this.deployAgent(AgentRole.ACTION_RIGHT, context),
      this.deployAgent(AgentRole.SELF_EVAL_RIGHT, context),
      this.deployAgent(AgentRole.SCORING_RIGHT, context),
      this.deployAgent(AgentRole.ENVIRON_MOD_RIGHT, context)
    ]);

    const allSuccess = teamResults.every(r => r.success);

    return {
      success: allSuccess,
      message: `P9 Tech Lead orchestrated ${teamResults.length} agents`,
      data: {
        teamSize: teamResults.length,
        results: teamResults.map(r => ({ role: r.role, success: r.success }))
      },
      action: 'orchestrate',
      nextSteps: allSuccess ? [] : ['escalate_to_p10'],
      role: AgentRole.P9
    };
  }

  private async deployAgent(role: AgentRole, context: ExecutionContext): Promise<AgentResponse> {
    logger.debug(`[P9] Deploying ${role}`);
    return {
      success: true,
      message: `${role} deployed`,
      action: 'deploy',
      role
    };
  }

  public canHandle(_task: string, context: ExecutionContext): boolean {
    return context.pressureLevel >= 2 && context.pressureLevel < 4;
  }
}

// ============================================================================
// P10 CTO Agent
// ============================================================================

export class P10Agent extends BaseAgent {
  readonly role = AgentRole.P10;
  readonly tier = AgentTier.P10;

  protected initializeState(): AgentState {
    return {
      status: 'idle',
      pressureLevel: 0,
      failureCount: 0,
      successCount: 0,
      lastActiveAt: Date.now(),
      metadata: {
        executionMode: 'strategic',
        priority: 'critical',
        resourceAllocation: 'maximum'
      }
    };
  }

  public async execute(context: ExecutionContext): Promise<AgentResponse> {
    this.updateState({
      status: 'working',
      currentTask: context.task,
      pressureLevel: context.pressureLevel,
      lastActiveAt: Date.now()
    });

    logger.info(`[P10] CTO providing strategic direction for: ${context.task}`);

    const strategy = await this.formulateStrategy(context);

    this.updateState({
      status: 'completed',
      successCount: this.state.successCount + 1,
      lastActiveAt: Date.now()
    });

    return strategy;
  }

  private async formulateStrategy(context: ExecutionContext): Promise<AgentResponse> {
    const taskComplexity = this.assessComplexity(context);
    const resourcePlan = this.allocateResources(taskComplexity);

    return {
      success: true,
      message: `P10 CTO strategic direction for: ${context.task}`,
      data: {
        priority: taskComplexity > 7 ? 'critical' : 'high',
        resourceAllocation: resourcePlan,
        timeline: taskComplexity > 7 ? 'immediate' : 'urgent',
        recommendations: this.generateRecommendations(context)
      },
      action: 'strategize',
      nextSteps: [],
      role: AgentRole.P10
    };
  }

  private assessComplexity(context: ExecutionContext): number {
    let score = 0;
    score += Math.min(context.attemptCount, 5);
    score += context.pressureLevel * 2;
    score += context.failureCount;
    score += context.toolsUsed.length === 0 ? 3 : 0;
    return Math.min(score, 10);
  }

  private allocateResources(complexity: number): string {
    if (complexity >= 8) return 'maximum';
    if (complexity >= 5) return 'high';
    return 'normal';
  }

  private generateRecommendations(context: ExecutionContext): string[] {
    const recs: string[] = [];
    if (context.failureCount > 3) {
      recs.push('Consider methodology switch');
    }
    if (context.toolsUsed.length < 3) {
      recs.push('Explore alternative tools');
    }
    if (context.attemptCount > 5) {
      recs.push('Escalate to human review');
    }
    return recs;
  }

  public canHandle(_task: string, context: ExecutionContext): boolean {
    return context.pressureLevel >= 4 || context.attemptCount >= 10;
  }
}

// ============================================================================
// Factory functions
// ============================================================================

export function createP7Agent(): P7Agent {
  return new P7Agent(AgentRole.P7, AgentTier.P7);
}

export function createP9Agent(): P9Agent {
  return new P9Agent(AgentRole.P9, AgentTier.P9);
}

export function createP10Agent(): P10Agent {
  return new P10Agent(AgentRole.P10, AgentTier.P10);
}