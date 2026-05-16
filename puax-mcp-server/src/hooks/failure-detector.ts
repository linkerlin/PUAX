/**
 * PUAX Failure Detector
 *
 * Deterministic failure detection with pressure escalation (L0-L4).
 * Based on consecutive failures, tool-specific failures, and error patterns.
 */

import { EventEmitter } from 'events';
import { getGlobalLogger } from '../utils/logger.js';
import type { PressureLevel } from '../agents/index.js';

const logger = getGlobalLogger();

// ============================================================================
// Failure Types
// ============================================================================

export interface FailureEvent {
  toolName: string;
  exitCode?: number;
  errorMessage?: string;
  timestamp: number;
  sessionId: string;
}

export interface FailureState {
  consecutiveFailures: number;
  totalFailures: number;
  lastFailureAt: number;
  lastFailureTool?: string;
  toolSpecificFailures: Map<string, number>;
  pressureLevel: PressureLevel;
  previousPressureLevel: PressureLevel;
}

// ============================================================================
// Failure Detector
// ============================================================================

export class FailureDetector extends EventEmitter {
  private states = new Map<string, FailureState>();
  private escalationThresholds = {
    l1: 1,
    l2: 3,
    l3: 5,
    l4: 8
  };

  /**
   * Get or create failure state for a session
   */
  getState(sessionId: string): FailureState {
    if (!this.states.has(sessionId)) {
      this.states.set(sessionId, {
        consecutiveFailures: 0,
        totalFailures: 0,
        lastFailureAt: 0,
        toolSpecificFailures: new Map(),
        pressureLevel: 0,
        previousPressureLevel: 0
      });
    }
    return this.states.get(sessionId)!;
  }

  /**
   * Record a failure event
   */
  recordFailure(event: FailureEvent): FailureState {
    const state = this.getState(event.sessionId);

    state.previousPressureLevel = state.pressureLevel;
    state.consecutiveFailures++;
    state.totalFailures++;
    state.lastFailureAt = event.timestamp;
    state.lastFailureTool = event.toolName;

    const toolCount = state.toolSpecificFailures.get(event.toolName) || 0;
    state.toolSpecificFailures.set(event.toolName, toolCount + 1);

    state.pressureLevel = this.calculatePressureLevel(state);

    this.emit('failure', { event, state });
    logger.info(`[FailureDetector] Failure recorded: ${event.toolName}, consecutive: ${state.consecutiveFailures}`);

    return state;
  }

  /**
   * Record a success (reset consecutive failures)
   */
  recordSuccess(sessionId: string): void {
    const state = this.states.get(sessionId);
    if (state) {
      state.consecutiveFailures = 0;
      state.previousPressureLevel = state.pressureLevel;
      this.emit('success', { sessionId, state });
      logger.debug(`[FailureDetector] Success recorded for ${sessionId}`);
    }
  }

  /**
   * Calculate pressure level based on failure state
   */
  private calculatePressureLevel(state: FailureState): PressureLevel {
    const consecutive = state.consecutiveFailures;
    const total = state.totalFailures;

    if (consecutive >= this.escalationThresholds.l4 || total >= this.escalationThresholds.l4 * 2) {
      return 4;
    }
    if (consecutive >= this.escalationThresholds.l3 || total >= this.escalationThresholds.l3 * 2) {
      return 3;
    }
    if (consecutive >= this.escalationThresholds.l2 || total >= this.escalationThresholds.l2 * 2) {
      return 2;
    }
    if (consecutive >= this.escalationThresholds.l1) {
      return 1;
    }
    return 0;
  }

  /**
   * Get pressure level for a session
   */
  getPressureLevel(sessionId: string): PressureLevel {
    const state = this.states.get(sessionId);
    return state?.pressureLevel || 0;
  }

  /**
   * Check if pressure escalation is needed
   */
  shouldEscalate(sessionId: string): boolean {
    const state = this.states.get(sessionId);
    if (!state) return false;

    return state.pressureLevel > state.previousPressureLevel;
  }

  /**
   * Get current failure count
   */
  getConsecutiveFailures(sessionId: string): number {
    return this.states.get(sessionId)?.consecutiveFailures || 0;
  }

  /**
   * Get tool-specific failure count
   */
  getToolFailures(sessionId: string, toolName: string): number {
    return this.states.get(sessionId)?.toolSpecificFailures.get(toolName) || 0;
  }

  /**
   * Reset failure state
   */
  reset(sessionId: string, level?: 'consecutive' | 'all'): void {
    const state = this.states.get(sessionId);
    if (!state) return;

    if (level === 'consecutive' || level === 'all') {
      state.consecutiveFailures = 0;
      state.pressureLevel = 0;
      state.previousPressureLevel = 0;
    }
    if (level === 'all') {
      state.totalFailures = 0;
      state.lastFailureAt = 0;
      state.lastFailureTool = undefined;
      state.toolSpecificFailures.clear();
      state.pressureLevel = 0;
      state.previousPressureLevel = 0;
    }

    this.emit('reset', { sessionId, level });
    logger.info(`[FailureDetector] Reset ${level || 'all'} for ${sessionId}`);
  }

  /**
   * Clear all failure states
   */
  clear(): void {
    this.states.clear();
    logger.info('[FailureDetector] All states cleared');
  }
}

// ============================================================================
// Bash-specific failure detector
// ============================================================================

export class BashFailureDetector {
  private detector: FailureDetector;
  private sessionId: string;

  constructor(sessionId: string, detector?: FailureDetector) {
    this.detector = detector || new FailureDetector();
    this.sessionId = sessionId;
  }

  /**
   * Check if a bash command failed
   */
  isFailure(exitCode: number | undefined, stderr?: string): boolean {
    if (exitCode === undefined) return false;
    if (exitCode !== 0) return true;

    if (stderr) {
      const errorPatterns = [
        /command\s+not\s+found/i,
        /no\s+such\s+file/i,
        /permission\s+denied/i,
        /error/i,
        /failed/i
      ];
      return errorPatterns.some(p => p.test(stderr));
    }

    return false;
  }

  /**
   * Record a bash failure
   */
  record(event: Omit<FailureEvent, 'sessionId'>): FailureState {
    return this.detector.recordFailure({
      ...event,
      sessionId: this.sessionId
    });
  }

  /**
   * Record a bash success
   */
  success(): void {
    this.detector.recordSuccess(this.sessionId);
  }

  /**
   * Get current pressure level
   */
  getPressureLevel(): PressureLevel {
    return this.detector.getPressureLevel(this.sessionId);
  }

  /**
   * Get consecutive failure count
   */
  getConsecutiveFailures(): number {
    return this.detector.getConsecutiveFailures(this.sessionId);
  }
}

// ============================================================================
// Global instances
// ============================================================================

export const globalFailureDetector = new FailureDetector();