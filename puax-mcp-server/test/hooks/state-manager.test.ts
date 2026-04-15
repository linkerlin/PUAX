/**
 * StateManager 单元测试
 * 使用临时目录隔离文件系统操作
 */

import { StateManager, SessionState } from '../../src/hooks/state-manager.js';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('StateManager', () => {
  let sm: StateManager;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'puax-test-'));
    sm = new StateManager(tempDir);
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  // ==========================================================================
  // 会话状态管理
  // ==========================================================================

  describe('getSessionState', () => {
    it('should create initial state for new session', () => {
      const state = sm.getSessionState('test-session-1');
      expect(state).toBeDefined();
      expect(state.sessionId).toBe('test-session-1');
      expect(state.pressureLevel).toBe(0);
      expect(state.failureCount).toBe(0);
      expect(state.triggerCount).toBe(0);
      expect(state.methodologyHistory).toEqual([]);
      expect(state.startTime).toBeGreaterThan(0);
    });

    it('should return cached state on subsequent calls', () => {
      const state1 = sm.getSessionState('test-session-1');
      state1.pressureLevel = 3;
      const state2 = sm.getSessionState('test-session-1');
      expect(state2.pressureLevel).toBe(3);
    });

    it('should persist state to disk', () => {
      const state = sm.getSessionState('persist-test');
      state.pressureLevel = 2;
      sm.saveSessionState(state);

      // Create new StateManager instance to verify persistence
      const sm2 = new StateManager(tempDir);
      const loaded = sm2.getSessionState('persist-test');
      expect(loaded.pressureLevel).toBe(2);
    });
  });

  describe('saveSessionState', () => {
    it('should update lastActivity on save', () => {
      const state = sm.getSessionState('save-test');
      const beforeActivity = state.lastActivity;
      // Wait a tiny bit to ensure time difference
      state.failureCount = 5;
      sm.saveSessionState(state);
      const after = sm.getSessionState('save-test');
      expect(after.failureCount).toBe(5);
      expect(after.lastActivity).toBeGreaterThanOrEqual(beforeActivity);
    });
  });

  describe('updateSessionState', () => {
    it('should merge partial updates', () => {
      sm.getSessionState('update-test');
      sm.updateSessionState('update-test', { pressureLevel: 3, failureCount: 7 });
      const state = sm.getSessionState('update-test');
      expect(state.pressureLevel).toBe(3);
      expect(state.failureCount).toBe(7);
      expect(state.sessionId).toBe('update-test');
    });
  });

  describe('clearSessionState', () => {
    it('should remove session from cache and disk', () => {
      sm.getSessionState('clear-test');
      sm.clearSessionState('clear-test');
      // Getting again should create a fresh state
      const state = sm.getSessionState('clear-test');
      expect(state.pressureLevel).toBe(0);
      expect(state.failureCount).toBe(0);
    });
  });

  // ==========================================================================
  // 失败计数管理
  // ==========================================================================

  describe('recordFailure', () => {
    it('should increment failure count and return it', () => {
      const count1 = sm.recordFailure('fail-test', 'error 1', 'bash');
      expect(count1).toBe(1);
      const count2 = sm.recordFailure('fail-test', 'error 2', 'bash');
      expect(count2).toBe(2);
    });

    it('should persist failure records to disk', () => {
      sm.recordFailure('fail-persist', 'test error', 'tool');
      const stateFile = join(tempDir, 'failure-count.json');
      expect(existsSync(stateFile)).toBe(true);
      const records = JSON.parse(readFileSync(stateFile, 'utf-8'));
      expect(records.length).toBe(1);
      expect(records[0].sessionId).toBe('fail-persist');
      expect(records[0].errorMessage).toBe('test error');
      expect(records[0].toolName).toBe('tool');
    });

    it('should limit failure records to 100', () => {
      for (let i = 0; i < 120; i++) {
        sm.recordFailure('limit-test', `error ${i}`);
      }
      const stateFile = join(tempDir, 'failure-count.json');
      const records = JSON.parse(readFileSync(stateFile, 'utf-8'));
      expect(records.length).toBe(100);
      // Should keep the most recent ones
      expect(records[0].errorMessage).toBe('error 20');
    });
  });

  describe('resetFailureCount', () => {
    it('should reset failure count to 0', () => {
      sm.recordFailure('reset-test', 'err1');
      sm.recordFailure('reset-test', 'err2');
      expect(sm.getFailureCount('reset-test')).toBe(2);
      sm.resetFailureCount('reset-test');
      expect(sm.getFailureCount('reset-test')).toBe(0);
    });
  });

  describe('recordSuccess', () => {
    it('should reset failure count by default', () => {
      sm.recordFailure('success-test', 'err');
      expect(sm.getFailureCount('success-test')).toBe(1);
      sm.recordSuccess('success-test');
      expect(sm.getFailureCount('success-test')).toBe(0);
    });

    it('should not reset failures when resetFailures is false', () => {
      sm.recordFailure('success-test-2', 'err');
      sm.recordSuccess('success-test-2', false);
      expect(sm.getFailureCount('success-test-2')).toBe(1);
    });
  });

  // ==========================================================================
  // 压力等级管理
  // ==========================================================================

  describe('getPressureLevel', () => {
    it('should return 0 for new session', () => {
      expect(sm.getPressureLevel('pressure-test')).toBe(0);
    });
  });

  describe('setPressureLevel', () => {
    it('should set pressure level', () => {
      sm.setPressureLevel('pressure-test', 3);
      expect(sm.getPressureLevel('pressure-test')).toBe(3);
    });

    it('should clamp to 0-4 range', () => {
      sm.setPressureLevel('clamp-test', -1);
      expect(sm.getPressureLevel('clamp-test')).toBe(0);
      sm.setPressureLevel('clamp-test', 10);
      expect(sm.getPressureLevel('clamp-test')).toBe(4);
    });
  });

  describe('escalatePressure', () => {
    it('should increment pressure level', () => {
      sm.setPressureLevel('esc-test', 2);
      const newLevel = sm.escalatePressure('esc-test');
      expect(newLevel).toBe(3);
      expect(sm.getPressureLevel('esc-test')).toBe(3);
    });

    it('should not exceed level 4', () => {
      sm.setPressureLevel('esc-max', 4);
      const newLevel = sm.escalatePressure('esc-max');
      expect(newLevel).toBe(4);
    });
  });

  describe('deescalatePressure', () => {
    it('should decrement pressure level', () => {
      sm.setPressureLevel('deesc-test', 3);
      const newLevel = sm.deescalatePressure('deesc-test');
      expect(newLevel).toBe(2);
    });

    it('should not go below level 0', () => {
      sm.setPressureLevel('deesc-min', 0);
      const newLevel = sm.deescalatePressure('deesc-min');
      expect(newLevel).toBe(0);
    });
  });

  // ==========================================================================
  // 触发记录管理
  // ==========================================================================

  describe('recordTrigger', () => {
    it('should increment trigger count', () => {
      sm.recordTrigger('trig-test', 'user_frustration', 0.9, 'military-warrior', 1);
      const state = sm.getSessionState('trig-test');
      expect(state.triggerCount).toBe(1);
      expect(state.lastTriggerTime).toBeGreaterThan(0);
    });

    it('should persist trigger records', () => {
      sm.recordTrigger('trig-persist', 'giving_up', 0.8, 'military-commander', 2);
      const history = sm.getTriggerHistory('trig-persist');
      expect(history.length).toBe(1);
      expect(history[0].triggerType).toBe('giving_up');
      expect(history[0].roleId).toBe('military-commander');
      expect(history[0].pressureLevel).toBe(2);
    });

    it('should limit trigger history to 200', () => {
      for (let i = 0; i < 250; i++) {
        sm.recordTrigger('trig-limit', `type_${i}`, 0.5, 'role', 0);
      }
      const history = sm.getTriggerHistory('trig-limit');
      expect(history.length).toBe(200);
    });
  });

  // ==========================================================================
  // 反馈收集
  // ==========================================================================

  describe('recordFeedback', () => {
    it('should save feedback with timestamp', () => {
      sm.recordFeedback('fb-test', {
        pressureLevel: 3,
        rating: 4,
        success: true,
        comments: 'Good job'
      });
      const history = sm.getFeedbackHistory('fb-test');
      expect(history.length).toBe(1);
      expect(history[0].rating).toBe(4);
      expect(history[0].success).toBe(true);
      expect(history[0].comments).toBe('Good job');
      expect(history[0].timestamp).toBeGreaterThan(0);
    });

    it('should return all feedback when no sessionId', () => {
      sm.recordFeedback('fb-a', { pressureLevel: 1, rating: 3, success: true });
      sm.recordFeedback('fb-b', { pressureLevel: 2, rating: 4, success: false });
      const all = sm.getFeedbackHistory();
      expect(all.length).toBe(2);
    });

    it('should filter by sessionId', () => {
      sm.recordFeedback('fb-c', { pressureLevel: 1, rating: 3, success: true });
      sm.recordFeedback('fb-d', { pressureLevel: 2, rating: 4, success: false });
      const filtered = sm.getFeedbackHistory('fb-c');
      expect(filtered.length).toBe(1);
      expect(filtered[0].sessionId).toBe('fb-c');
    });
  });

  // ==========================================================================
  // 构建日志
  // ==========================================================================

  describe('writeBuilderJournal', () => {
    it('should write journal entry to disk', () => {
      sm.writeBuilderJournal('journal-test', {
        pressureLevel: 2,
        failureCount: 3,
        currentFlavor: 'huawei',
        activeTask: 'Fix bug in module X',
        triedApproaches: ['approach A', 'approach B'],
        excludedPossibilities: ['network issue'],
        nextHypothesis: 'Config file missing',
        keyContext: 'Error at line 42'
      });

      const journal = sm.readBuilderJournal();
      expect(journal).toContain('journal-test');
      expect(journal).toContain('L2');
      expect(journal).toContain('Fix bug in module X');
      expect(journal).toContain('approach A');
      expect(journal).toContain('network issue');
      expect(journal).toContain('Config file missing');
    });

    it('should append multiple entries', () => {
      sm.writeBuilderJournal('multi-journal', { pressureLevel: 1, failureCount: 1 });
      sm.writeBuilderJournal('multi-journal', { pressureLevel: 2, failureCount: 2 });
      const journal = sm.readBuilderJournal();
      expect(journal).toContain('L1');
      expect(journal).toContain('L2');
    });
  });

  // ==========================================================================
  // 统计与清理
  // ==========================================================================

  describe('getActiveSessions', () => {
    it('should return recently active sessions', () => {
      sm.getSessionState('active-1');
      sm.getSessionState('active-2');
      const active = sm.getActiveSessions();
      expect(active).toContain('active-1');
      expect(active).toContain('active-2');
    });
  });

  describe('getGlobalStats', () => {
    it('should compute stats across all sessions', () => {
      sm.setPressureLevel('stats-1', 2);
      sm.recordFailure('stats-1', 'err');
      sm.recordTrigger('stats-1', 'type', 0.5, 'role', 1);
      sm.recordFeedback('stats-1', { pressureLevel: 2, rating: 4, success: true });

      const stats = sm.getGlobalStats();
      expect(stats.totalSessions).toBeGreaterThanOrEqual(1);
      expect(stats.totalTriggers).toBeGreaterThanOrEqual(1);
      expect(stats.totalFailures).toBeGreaterThanOrEqual(1);
      expect(stats.successRate).toBeGreaterThan(0);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should remove sessions older than maxAge', () => {
      // Create a session with aged lastActivity
      sm.getSessionState('old-session');
      // Manually write aged state to disk (bypass cache refresh)
      const allStates: Record<string, SessionState> = {
        'old-session': {
          sessionId: 'old-session',
          startTime: Date.now() - 10 * 24 * 60 * 60 * 1000,
          lastActivity: Date.now() - 10 * 24 * 60 * 60 * 1000,
          pressureLevel: 0,
          failureCount: 0,
          triggerCount: 0,
          methodologyHistory: []
        },
        'fresh-session': {
          sessionId: 'fresh-session',
          startTime: Date.now(),
          lastActivity: Date.now(),
          pressureLevel: 0,
          failureCount: 0,
          triggerCount: 0,
          methodologyHistory: []
        }
      };
      const { writeFileSync } = require('fs');
      const { join } = require('path');
      writeFileSync(join(tempDir, 'session-state.json'), JSON.stringify(allStates));

      // Clear cache so it reads from disk
      const sm2 = new StateManager(tempDir);
      const cleaned = sm2.cleanupExpiredSessions(7);
      expect(cleaned).toBe(1);
    });

    it('should return 0 when no sessions to clean', () => {
      const cleaned = sm.cleanupExpiredSessions(7);
      expect(cleaned).toBe(0);
    });
  });
});
