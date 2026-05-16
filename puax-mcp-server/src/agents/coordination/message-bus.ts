/**
 * PUAX Agent Coordination - Message Bus
 * Handles inter-agent communication and state synchronization
 */

import { EventEmitter } from 'events';
import { getGlobalLogger } from '../../utils/logger.js';
import {
  AgentMessage,
  AgentRole,
  ExecutionContext,
  globalAgentRegistry,
  AgentRegistry
} from '../base-agent.js';

const logger = getGlobalLogger();

// ============================================================================
// Message Bus
// ============================================================================

export class AgentMessageBus extends EventEmitter {
  private messageHistory: AgentMessage[] = [];
  private pendingRequests: Map<string, AgentMessage> = new Map();
  private timeout = 30000; // 30 seconds timeout
  private registry: AgentRegistry;

  constructor(registry: AgentRegistry = globalAgentRegistry) {
    super();
    this.registry = registry;
  }

  /**
   * Send a message to an agent
   */
  async send(message: AgentMessage): Promise<AgentMessage | null> {
    this.messageHistory.push(message);
    logger.debug(`[MessageBus] Sending ${message.type} from ${message.from} to ${message.to}`);

    if (message.type === 'request') {
      return this.sendRequest(message);
    } else {
      this.emit('message', message);
      return message;
    }
  }

  /**
   * Send a request and wait for response
   */
  private async sendRequest(message: AgentMessage): Promise<AgentMessage | null> {
    if (message.to === 'broadcast') {
      return null;
    }
    const agent = this.registry.get(message.to);
    if (!agent) {
      logger.error(`[MessageBus] Agent not found: ${message.to}`);
      return null;
    }

    this.pendingRequests.set(message.id, message);
    agent.receiveMessagePublic(message);

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(message.id);
        logger.warn(`[MessageBus] Timeout for message ${message.id}`);
        resolve(null);
      }, this.timeout);

      const handler = (response: AgentMessage) => {
        if (response.type === 'response' && response.payload.action === message.id) {
          clearTimeout(timeoutId);
          this.pendingRequests.delete(message.id);
          this.messageHistory.push(response);
          resolve(response);
        }
      };

      this.once('message', handler);
    });
  }

  /**
   * Broadcast to all agents
   */
  async broadcast(message: Omit<AgentMessage, 'to'>): Promise<void> {
    const fullMessage: AgentMessage = {
      ...message,
      to: 'broadcast'
    };
    this.messageHistory.push(fullMessage);
    this.emit('broadcast', fullMessage);
    logger.debug(`[MessageBus] Broadcasting ${message.type} from ${message.from}`);
  }

  /**
   * Get message history
   */
  getHistory(agentId?: AgentRole): AgentMessage[] {
    if (agentId) {
      return this.messageHistory.filter(
        m => m.from === agentId || m.to === agentId || m.to === 'broadcast'
      );
    }
    return [...this.messageHistory];
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.messageHistory = [];
    logger.info('[MessageBus] History cleared');
  }
}

// ============================================================================
// Agent State Synchronizer
// ============================================================================

export interface SyncState {
  conversationId: string;
  pressureLevel: number;
  failureCount: number;
  activeAgents: AgentRole[];
  lastSyncAt: number;
}

export class AgentStateSync extends EventEmitter {
  private stateCache: Map<string, SyncState> = new Map();
  private logger = getGlobalLogger();

  /**
   * Get or create sync state for a conversation
   */
  getState(conversationId: string): SyncState {
    if (!this.stateCache.has(conversationId)) {
      this.stateCache.set(conversationId, {
        conversationId,
        pressureLevel: 0,
        failureCount: 0,
        activeAgents: [],
        lastSyncAt: Date.now()
      });
    }
    return this.stateCache.get(conversationId)!;
  }

  /**
   * Update sync state
   */
  updateState(conversationId: string, updates: Partial<SyncState>): void {
    const state = this.getState(conversationId);
    const updated = { ...state, ...updates, lastSyncAt: Date.now() };
    this.stateCache.set(conversationId, updated);
    this.emit('stateChanged', { conversationId, state: updated });
    this.logger.debug(`[StateSync] Updated state for ${conversationId}`);
  }

  /**
   * Add active agent
   */
  addActiveAgent(conversationId: string, role: AgentRole): void {
    const state = this.getState(conversationId);
    if (!state.activeAgents.includes(role)) {
      state.activeAgents.push(role);
      this.updateState(conversationId, { activeAgents: state.activeAgents });
    }
  }

  /**
   * Remove active agent
   */
  removeActiveAgent(conversationId: string, role: AgentRole): void {
    const state = this.getState(conversationId);
    state.activeAgents = state.activeAgents.filter(r => r !== role);
    this.updateState(conversationId, { activeAgents: state.activeAgents });
  }

  /**
   * Increment failure count
   */
  incrementFailure(conversationId: string): number {
    const state = this.getState(conversationId);
    state.failureCount++;
    const newPressure = Math.min(4, Math.floor(state.failureCount / 2));
    this.updateState(conversationId, {
      failureCount: state.failureCount,
      pressureLevel: newPressure
    });
    return newPressure;
  }

  /**
   * Reset state
   */
  reset(conversationId: string): void {
    this.stateCache.delete(conversationId);
    this.logger.info(`[StateSync] Reset state for ${conversationId}`);
  }
}

// ============================================================================
// Global instances
// ============================================================================

export const globalMessageBus = new AgentMessageBus();
export const globalStateSync = new AgentStateSync();