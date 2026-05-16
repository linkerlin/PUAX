/**
 * PUAX Agent System - Main Export
 *
 * Four-Power Separation Architecture (四权分离)
 * - ACTION_RIGHT: Execution authority
 * - SELF_EVAL_RIGHT: Self-evaluation
 * - SCORING_RIGHT: Scoring authority
 * - ENVIRON_MOD_RIGHT: Environment modification
 */

export {
  AgentRole,
  AgentTier,
  AgentMessage,
  ExecutionContext,
  PressureLevel,
  BaseAgent,
  AgentState,
  AgentResponse,
  AgentRegistry,
  globalAgentRegistry,
  createAgent
} from './base-agent.js';

export {
  AgentMessageBus,
  AgentStateSync,
  SyncState,
  globalMessageBus,
  globalStateSync
} from './coordination/message-bus.js';

export {
  P7Agent,
  P9Agent,
  P10Agent,
  createP7Agent,
  createP9Agent,
  createP10Agent
} from './hierarchy/index.js';