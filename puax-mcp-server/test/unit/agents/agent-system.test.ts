/**
 * Unit tests for PUAX Agent System - Four-Power Separation
 */

import {
  AgentRole,
  AgentTier,
  AgentMessage,
  ExecutionContext,
  BaseAgent,
  AgentRegistry,
  createAgent,
  globalAgentRegistry,
  AgentResponse
} from '../../../src/agents/index.js';

describe('PUAX Agent System', () => {
  describe('AgentRole enum', () => {
    it('should have correct role values', () => {
      expect(AgentRole.ACTION_RIGHT).toBe('action_executor');
      expect(AgentRole.SELF_EVAL_RIGHT).toBe('self_reviewer');
      expect(AgentRole.SCORING_RIGHT).toBe('verifier');
      expect(AgentRole.ENVIRON_MOD_RIGHT).toBe('policy_guardian');
      expect(AgentRole.P7).toBe('senior_engineer');
      expect(AgentRole.P9).toBe('tech_lead');
      expect(AgentRole.P10).toBe('cto');
    });
  });

  describe('AgentTier enum', () => {
    it('should have correct tier values', () => {
      expect(AgentTier.P7).toBe('p7');
      expect(AgentTier.P9).toBe('p9');
      expect(AgentTier.P10).toBe('p10');
    });
  });

  describe('createAgent factory', () => {
    it('should create ActionExecutorAgent for ACTION_RIGHT role', () => {
      const agent = createAgent(AgentRole.ACTION_RIGHT, AgentTier.P7);
      expect(agent).toBeInstanceOf(BaseAgent);
      expect(agent.getRole()).toBe(AgentRole.ACTION_RIGHT);
      expect(agent.getTier()).toBe(AgentTier.P7);
    });

    it('should create SelfReviewerAgent for SELF_EVAL_RIGHT role', () => {
      const agent = createAgent(AgentRole.SELF_EVAL_RIGHT, AgentTier.P7);
      expect(agent.getRole()).toBe(AgentRole.SELF_EVAL_RIGHT);
    });

    it('should create VerifierAgent for SCORING_RIGHT role', () => {
      const agent = createAgent(AgentRole.SCORING_RIGHT, AgentTier.P7);
      expect(agent.getRole()).toBe(AgentRole.SCORING_RIGHT);
    });

    it('should create PolicyGuardianAgent for ENVIRON_MOD_RIGHT role', () => {
      const agent = createAgent(AgentRole.ENVIRON_MOD_RIGHT, AgentTier.P7);
      expect(agent.getRole()).toBe(AgentRole.ENVIRON_MOD_RIGHT);
    });
  });

  describe('BaseAgent execution', () => {
    const mockContext: ExecutionContext = {
      task: 'Implement user authentication',
      conversationHistory: [],
      toolsAvailable: ['read', 'write', 'bash'],
      toolsUsed: [],
      attemptCount: 1,
      failureCount: 0,
      pressureLevel: 1
    };

    it('should execute task and return response', async () => {
      const agent = createAgent(AgentRole.ACTION_RIGHT, AgentTier.P7);
      const response = await agent.execute(mockContext);

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.role).toBe(AgentRole.ACTION_RIGHT);
      expect(response.action).toBe('execute');
    });

    it('should update state after execution', async () => {
      const agent = createAgent(AgentRole.ACTION_RIGHT, AgentTier.P7);
      const initialState = agent.getState();

      await agent.execute(mockContext);

      const finalState = agent.getState();
      expect(finalState.lastActiveAt).toBeGreaterThanOrEqual(initialState.lastActiveAt);
    });

    it('should emit events during execution', async () => {
      const agent = createAgent(AgentRole.ACTION_RIGHT, AgentTier.P7);
      const stateChangedHandler = jest.fn();
      agent.on('stateChanged', stateChangedHandler);

      await agent.execute(mockContext);

      expect(stateChangedHandler).toHaveBeenCalled();
    });
  });

  describe('AgentRegistry', () => {
    it('should register and retrieve agents', () => {
      const registry = new AgentRegistry();
      const agent = createAgent(AgentRole.ACTION_RIGHT, AgentTier.P7);

      registry.register(AgentRole.ACTION_RIGHT, AgentTier.P7, agent);

      expect(registry.has(AgentRole.ACTION_RIGHT)).toBe(true);
      expect(registry.get(AgentRole.ACTION_RIGHT)).toBe(agent);
    });

    it('should return all registered agents', () => {
      const registry = new AgentRegistry();
      registry.register(AgentRole.ACTION_RIGHT, AgentTier.P7);
      registry.register(AgentRole.SELF_EVAL_RIGHT, AgentTier.P7);
      registry.register(AgentRole.SCORING_RIGHT, AgentTier.P7);

      const agents = registry.getAll();
      expect(agents.length).toBe(3);
    });

    it('should return undefined for non-existent agent', () => {
      const registry = new AgentRegistry();
      expect(registry.get(AgentRole.P10)).toBeUndefined();
    });
  });

  describe('Four-Power Separation', () => {
    const mockContext: ExecutionContext = {
      task: 'Implement feature X',
      conversationHistory: [],
      toolsAvailable: ['read', 'write', 'bash', 'grep'],
      toolsUsed: ['read', 'write'],
      attemptCount: 2,
      failureCount: 1,
      pressureLevel: 2
    };

    it('should maintain separate roles with distinct capabilities', async () => {
      const actionAgent = createAgent(AgentRole.ACTION_RIGHT, AgentTier.P7);
      const reviewAgent = createAgent(AgentRole.SELF_EVAL_RIGHT, AgentTier.P7);
      const verifyAgent = createAgent(AgentRole.SCORING_RIGHT, AgentTier.P7);
      const policyAgent = createAgent(AgentRole.ENVIRON_MOD_RIGHT, AgentTier.P7);

      expect(actionAgent.canHandle('code', mockContext)).toBe(true);
      expect(reviewAgent.canHandle('review', mockContext)).toBe(true);
      expect(verifyAgent.canHandle('score', mockContext)).toBe(true);
      expect(policyAgent.canHandle('policy', mockContext)).toBe(true);
    });

    it('should execute each role with proper action type', async () => {
      const actionAgent = createAgent(AgentRole.ACTION_RIGHT, AgentTier.P7);
      const reviewAgent = createAgent(AgentRole.SELF_EVAL_RIGHT, AgentTier.P7);
      const verifyAgent = createAgent(AgentRole.SCORING_RIGHT, AgentTier.P7);
      const policyAgent = createAgent(AgentRole.ENVIRON_MOD_RIGHT, AgentTier.P7);

      const [actionRes, reviewRes, verifyRes, policyRes] = await Promise.all([
        actionAgent.execute(mockContext),
        reviewAgent.execute(mockContext),
        verifyAgent.execute(mockContext),
        policyAgent.execute(mockContext)
      ]);

      expect(actionRes.action).toBe('execute');
      expect(reviewRes.action).toBe('self_review');
      expect(verifyRes.action).toBe('score');
      expect(policyRes.action).toBe('policy_check');
    });

    it('should produce correct role in response', async () => {
      const agents = [
        createAgent(AgentRole.ACTION_RIGHT, AgentTier.P7),
        createAgent(AgentRole.SELF_EVAL_RIGHT, AgentTier.P7),
        createAgent(AgentRole.SCORING_RIGHT, AgentTier.P7),
        createAgent(AgentRole.ENVIRON_MOD_RIGHT, AgentTier.P7)
      ];

      for (const agent of agents) {
        const response = await agent.execute(mockContext);
        expect(response.role).toBe(agent.getRole());
      }
    });
  });

  describe('Pressure Level handling', () => {
    it('should handle L0 (no pressure) execution', async () => {
      const context: ExecutionContext = {
        task: 'Simple task',
        conversationHistory: [],
        toolsAvailable: ['read', 'write'],
        toolsUsed: [],
        attemptCount: 0,
        failureCount: 0,
        pressureLevel: 0
      };

      const agent = createAgent(AgentRole.P7, AgentTier.P7);
      const response = await agent.execute(context);

      expect(response.success).toBe(true);
      expect(agent.getState().pressureLevel).toBe(0);
    });

    it('should handle L4 (graduation warning) execution', async () => {
      const context: ExecutionContext = {
        task: 'Critical task',
        conversationHistory: [],
        toolsAvailable: ['read', 'write', 'bash'],
        toolsUsed: ['read'],
        attemptCount: 10,
        failureCount: 5,
        pressureLevel: 4
      };

      const agent = createAgent(AgentRole.P10, AgentTier.P10);
      const response = await agent.execute(context);

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('priority', 'critical');
    });
  });

  describe('Message handling', () => {
    it('should buffer sent messages', async () => {
      const agent = createAgent(AgentRole.ACTION_RIGHT, AgentTier.P7);
      const message: AgentMessage = {
        id: 'msg-1',
        from: AgentRole.ACTION_RIGHT,
        to: AgentRole.SELF_EVAL_RIGHT,
        type: 'request',
        payload: { action: 'review' },
        timestamp: Date.now()
      };

      agent.sendMessagePublic(message);
      expect(agent.getState().metadata).toBeDefined();
    });
  });
});

describe('Agent Hierarchy - P7/P9/P10', () => {
  describe('P7Agent', () => {
    it('should handle tasks at low pressure', () => {
      const context: ExecutionContext = {
        task: 'Write unit tests',
        conversationHistory: [],
        toolsAvailable: ['read', 'write', 'bash'],
        toolsUsed: [],
        attemptCount: 2,
        failureCount: 0,
        pressureLevel: 1
      };

      const agent = createAgent(AgentRole.P7, AgentTier.P7);
      expect(agent.canHandle('task', context)).toBe(true);
    });

    it('should not handle tasks at high pressure', () => {
      const context: ExecutionContext = {
        task: 'Complex refactor',
        conversationHistory: [],
        toolsAvailable: ['read', 'write', 'bash'],
        toolsUsed: [],
        attemptCount: 8,
        failureCount: 4,
        pressureLevel: 4
      };

      const agent = createAgent(AgentRole.P7, AgentTier.P7);
      expect(agent.canHandle('task', context)).toBe(false);
    });
  });

  describe('P9Agent', () => {
    it('should handle tasks at medium-high pressure', () => {
      const context: ExecutionContext = {
        task: 'Multi-module refactor',
        conversationHistory: [],
        toolsAvailable: ['read', 'write', 'bash'],
        toolsUsed: ['read', 'write'],
        attemptCount: 4,
        failureCount: 2,
        pressureLevel: 3
      };

      const agent = createAgent(AgentRole.P9, AgentTier.P9);
      expect(agent.canHandle('task', context)).toBe(true);
    });
  });

  describe('P10Agent', () => {
    it('should handle critical tasks at maximum pressure', () => {
      const context: ExecutionContext = {
        task: 'Production incident',
        conversationHistory: [],
        toolsAvailable: ['read', 'write', 'bash', 'grep'],
        toolsUsed: ['read'],
        attemptCount: 15,
        failureCount: 8,
        pressureLevel: 4
      };

      const agent = createAgent(AgentRole.P10, AgentTier.P10);
      expect(agent.canHandle('task', context)).toBe(true);
    });
  });

  describe('Hierarchical execution', () => {
    it('should execute P7 with senior_engineer action', async () => {
      const context: ExecutionContext = {
        task: 'Implement feature',
        conversationHistory: [],
        toolsAvailable: ['read', 'write'],
        toolsUsed: [],
        attemptCount: 1,
        failureCount: 0,
        pressureLevel: 1
      };

      const agent = createAgent(AgentRole.P7, AgentTier.P7);
      const response = await agent.execute(context);

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('executed', true);
    });

    it('should execute P9 with orchestrator action', async () => {
      const context: ExecutionContext = {
        task: 'Team task',
        conversationHistory: [],
        toolsAvailable: ['read', 'write', 'bash'],
        toolsUsed: ['read'],
        attemptCount: 3,
        failureCount: 1,
        pressureLevel: 2
      };

      const agent = createAgent(AgentRole.P9, AgentTier.P9);
      const response = await agent.execute(context);

      expect(response.success).toBe(true);
      expect(response.action).toBe('orchestrate');
      expect(response.data).toHaveProperty('teamSize');
    });

    it('should execute P10 with strategic action', async () => {
      const context: ExecutionContext = {
        task: 'Critical production issue',
        conversationHistory: [],
        toolsAvailable: ['read', 'write', 'bash', 'grep'],
        toolsUsed: ['read'],
        attemptCount: 10,
        failureCount: 5,
        pressureLevel: 4
      };

      const agent = createAgent(AgentRole.P10, AgentTier.P10);
      const response = await agent.execute(context);

      expect(response.success).toBe(true);
      expect(response.action).toBe('strategize');
      expect(response.data).toHaveProperty('priority', 'critical');
    });
  });
});