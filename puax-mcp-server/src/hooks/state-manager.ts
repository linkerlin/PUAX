/**
 * PUAX 状态管理器
 * 实现跨会话状态持久化，全面对齐 PUA 原版能力
 * 
 * 存储位置: ~/.puax/
 * - session-state.json: 会话状态
 * - failure-count.json: 失败计数
 * - builder-journal.md: 构建日志
 * - feedback-history.json: 反馈历史
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// ============================================================================
// 类型定义
// ============================================================================

export interface SessionState {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  pressureLevel: number;  // L0-L4
  failureCount: number;
  triggerCount: number;
  activeRole?: string;
  currentFlavor?: string;
  lastTriggerTime?: number;
  methodologyHistory: string[];
}

export interface FailureRecord {
  timestamp: number;
  sessionId: string;
  errorMessage: string;
  toolName?: string;
  context?: string;
}

export interface TriggerRecord {
  timestamp: number;
  sessionId: string;
  triggerType: string;
  confidence: number;
  roleId: string;
  pressureLevel: number;
}

export interface FeedbackRecord {
  timestamp: number;
  sessionId: string;
  pressureLevel: number;
  rating: number;  // 1-5
  success: boolean;
  comments?: string;
}

export interface PressureEscalationConfig {
  l1Threshold: number;  // 首次触发
  l2Threshold: number;  // 第二次
  l3Threshold: number;  // 第三次
  l4Threshold: number;  // 第四次及以上
  resetAfterSuccess: boolean;
  resetAfterMinutes: number;
}

// ============================================================================
// 状态管理器类
// ============================================================================

export class StateManager {
  private readonly baseDir: string;
  private readonly stateFile: string;
  private readonly failureFile: string;
  private readonly triggerFile: string;
  private readonly feedbackFile: string;
  private readonly journalFile: string;
  private inMemoryCache: Map<string, SessionState> = new Map();

  constructor(customDir?: string) {
    this.baseDir = customDir || join(homedir(), '.puax');
    this.stateFile = join(this.baseDir, 'session-state.json');
    this.failureFile = join(this.baseDir, 'failure-count.json');
    this.triggerFile = join(this.baseDir, 'trigger-history.json');
    this.feedbackFile = join(this.baseDir, 'feedback-history.json');
    this.journalFile = join(this.baseDir, 'builder-journal.md');
    
    this.ensureDirectory();
  }

  private ensureDirectory(): void {
    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true });
    }
  }

  // ============================================================================
  // 会话状态管理
  // ============================================================================

  /**
   * 获取或创建会话状态
   */
  getSessionState(sessionId: string): SessionState {
    // 先检查内存缓存
    if (this.inMemoryCache.has(sessionId)) {
      return this.inMemoryCache.get(sessionId)!;
    }

    // 从文件加载
    const allStates = this.loadAllSessionStates();
    let state = allStates[sessionId];

    if (!state) {
      state = this.createInitialState(sessionId);
      this.saveSessionState(state);
    }

    // 更新最后活动时间
    state.lastActivity = Date.now();
    this.inMemoryCache.set(sessionId, state);

    return state;
  }

  /**
   * 保存会话状态
   */
  saveSessionState(state: SessionState): void {
    state.lastActivity = Date.now();
    this.inMemoryCache.set(state.sessionId, state);
    
    const allStates = this.loadAllSessionStates();
    allStates[state.sessionId] = state;
    
    try {
      writeFileSync(this.stateFile, JSON.stringify(allStates, null, 2));
    } catch (error) {
      console.error('[StateManager] Failed to save session state:', error);
    }
  }

  /**
   * 更新会话状态
   */
  updateSessionState(sessionId: string, updates: Partial<SessionState>): void {
    const state = this.getSessionState(sessionId);
    Object.assign(state, updates);
    this.saveSessionState(state);
  }

  /**
   * 清除会话状态
   */
  clearSessionState(sessionId: string): void {
    this.inMemoryCache.delete(sessionId);
    const allStates = this.loadAllSessionStates();
    delete allStates[sessionId];
    
    try {
      writeFileSync(this.stateFile, JSON.stringify(allStates, null, 2));
    } catch (error) {
      console.error('[StateManager] Failed to clear session state:', error);
    }
  }

  private createInitialState(sessionId: string): SessionState {
    return {
      sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pressureLevel: 0,
      failureCount: 0,
      triggerCount: 0,
      methodologyHistory: []
    };
  }

  private loadAllSessionStates(): Record<string, SessionState> {
    try {
      if (existsSync(this.stateFile)) {
        const content = readFileSync(this.stateFile, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('[StateManager] Failed to load session states:', error);
    }
    return {};
  }

  // ============================================================================
  // 失败计数管理
  // ============================================================================

  /**
   * 记录失败
   */
  recordFailure(sessionId: string, errorMessage: string, toolName?: string): number {
    const state = this.getSessionState(sessionId);
    state.failureCount++;
    this.saveSessionState(state);

    // 记录失败详情
    const failures = this.loadFailures();
    failures.push({
      timestamp: Date.now(),
      sessionId,
      errorMessage,
      toolName
    });
    
    // 只保留最近100条
    const recentFailures = failures.slice(-100);
    try {
      writeFileSync(this.failureFile, JSON.stringify(recentFailures, null, 2));
    } catch (error) {
      console.error('[StateManager] Failed to save failure record:', error);
    }

    return state.failureCount;
  }

  /**
   * 获取失败计数
   */
  getFailureCount(sessionId: string): number {
    return this.getSessionState(sessionId).failureCount;
  }

  /**
   * 重置失败计数
   */
  resetFailureCount(sessionId: string): void {
    this.updateSessionState(sessionId, { failureCount: 0 });
  }

  /**
   * 记录成功（可选：重置失败计数）
   */
  recordSuccess(sessionId: string, resetFailures: boolean = true): void {
    if (resetFailures) {
      this.resetFailureCount(sessionId);
    }
  }

  private loadFailures(): FailureRecord[] {
    try {
      if (existsSync(this.failureFile)) {
        const content = readFileSync(this.failureFile, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('[StateManager] Failed to load failures:', error);
    }
    return [];
  }

  // ============================================================================
  // 触发记录管理
  // ============================================================================

  /**
   * 记录触发事件
   */
  recordTrigger(sessionId: string, triggerType: string, confidence: number, roleId: string, pressureLevel: number): void {
    const state = this.getSessionState(sessionId);
    state.triggerCount++;
    state.lastTriggerTime = Date.now();
    this.saveSessionState(state);

    // 记录触发历史
    const triggers = this.loadTriggers();
    triggers.push({
      timestamp: Date.now(),
      sessionId,
      triggerType,
      confidence,
      roleId,
      pressureLevel
    });

    // 只保留最近200条
    const recentTriggers = triggers.slice(-200);
    try {
      writeFileSync(this.triggerFile, JSON.stringify(recentTriggers, null, 2));
    } catch (error) {
      console.error('[StateManager] Failed to save trigger record:', error);
    }
  }

  /**
   * 获取触发历史
   */
  getTriggerHistory(sessionId: string): TriggerRecord[] {
    const triggers = this.loadTriggers();
    return triggers.filter(t => t.sessionId === sessionId);
  }

  private loadTriggers(): TriggerRecord[] {
    try {
      if (existsSync(this.triggerFile)) {
        const content = readFileSync(this.triggerFile, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('[StateManager] Failed to load triggers:', error);
    }
    return [];
  }

  // ============================================================================
  // 构建日志管理 (Builder Journal)
  // ============================================================================

  /**
   * 写入构建日志
   */
  writeBuilderJournal(sessionId: string, entry: {
    pressureLevel: number;
    failureCount: number;
    currentFlavor?: string;
    activeTask?: string;
    triedApproaches?: string[];
    excludedPossibilities?: string[];
    nextHypothesis?: string;
    keyContext?: string;
  }): void {
    const timestamp = new Date().toISOString();
    const content = `
## Checkpoint - ${timestamp}

**Session:** ${sessionId}  
**Pressure Level:** L${entry.pressureLevel}  
**Failure Count:** ${entry.failureCount}  
**Current Flavor:** ${entry.currentFlavor || 'N/A'}

### Active Task
${entry.activeTask || 'N/A'}

### Tried Approaches
${entry.triedApproaches?.map(a => `- ${a}`).join('\n') || '- None recorded'}

### Excluded Possibilities
${entry.excludedPossibilities?.map(e => `- ${e}`).join('\n') || '- None recorded'}

### Next Hypothesis
${entry.nextHypothesis || 'N/A'}

### Key Context
${entry.keyContext || 'N/A'}

---
`;

    try {
      appendFileSync(this.journalFile, content);
    } catch (error) {
      console.error('[StateManager] Failed to write builder journal:', error);
    }
  }

  /**
   * 读取构建日志
   */
  readBuilderJournal(): string {
    try {
      if (existsSync(this.journalFile)) {
        return readFileSync(this.journalFile, 'utf-8');
      }
    } catch (error) {
      console.error('[StateManager] Failed to read builder journal:', error);
    }
    return '';
  }

  // ============================================================================
  // 反馈收集
  // ============================================================================

  /**
   * 记录反馈
   */
  recordFeedback(sessionId: string, feedback: {
    pressureLevel: number;
    rating: number;
    success: boolean;
    comments?: string;
  }): void {
    const records = this.loadFeedback();
    records.push({
      timestamp: Date.now(),
      sessionId,
      ...feedback
    });

    try {
      writeFileSync(this.feedbackFile, JSON.stringify(records, null, 2));
    } catch (error) {
      console.error('[StateManager] Failed to save feedback:', error);
    }
  }

  /**
   * 获取反馈历史
   */
  getFeedbackHistory(sessionId?: string): FeedbackRecord[] {
    const records = this.loadFeedback();
    if (sessionId) {
      return records.filter(r => r.sessionId === sessionId);
    }
    return records;
  }

  private loadFeedback(): FeedbackRecord[] {
    try {
      if (existsSync(this.feedbackFile)) {
        const content = readFileSync(this.feedbackFile, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('[StateManager] Failed to load feedback:', error);
    }
    return [];
  }

  // ============================================================================
  // 压力等级管理
  // ============================================================================

  /**
   * 获取当前压力等级
   */
  getPressureLevel(sessionId: string): number {
    return this.getSessionState(sessionId).pressureLevel;
  }

  /**
   * 设置压力等级
   */
  setPressureLevel(sessionId: string, level: number): void {
    this.updateSessionState(sessionId, { pressureLevel: Math.max(0, Math.min(4, level)) });
  }

  /**
   * 升级压力等级
   */
  escalatePressure(sessionId: string): number {
    const state = this.getSessionState(sessionId);
    const newLevel = Math.min(4, state.pressureLevel + 1);
    this.updateSessionState(sessionId, { pressureLevel: newLevel });
    return newLevel;
  }

  /**
   * 降级压力等级
   */
  deescalatePressure(sessionId: string): number {
    const state = this.getSessionState(sessionId);
    const newLevel = Math.max(0, state.pressureLevel - 1);
    this.updateSessionState(sessionId, { pressureLevel: newLevel });
    return newLevel;
  }

  // ============================================================================
  // 统计信息
  // ============================================================================

  /**
   * 获取所有活跃会话
   */
  getActiveSessions(): string[] {
    const allStates = this.loadAllSessionStates();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    return Object.values(allStates)
      .filter(s => now - s.lastActivity < oneHour)
      .map(s => s.sessionId);
  }

  /**
   * 获取全局统计
   */
  getGlobalStats(): {
    totalSessions: number;
    totalTriggers: number;
    totalFailures: number;
    averagePressureLevel: number;
    successRate: number;
  } {
    const allStates = Object.values(this.loadAllSessionStates());
    const feedbacks = this.loadFeedback();
    
    const totalSessions = allStates.length;
    const totalTriggers = allStates.reduce((sum, s) => sum + s.triggerCount, 0);
    const totalFailures = allStates.reduce((sum, s) => sum + s.failureCount, 0);
    const averagePressureLevel = totalSessions > 0
      ? allStates.reduce((sum, s) => sum + s.pressureLevel, 0) / totalSessions
      : 0;
    
    const successfulSessions = feedbacks.filter(f => f.success).length;
    const successRate = feedbacks.length > 0
      ? successfulSessions / feedbacks.length
      : 0;

    return {
      totalSessions,
      totalTriggers,
      totalFailures,
      averagePressureLevel,
      successRate
    };
  }

  // ============================================================================
  // 清理方法
  // ============================================================================

  /**
   * 清理过期会话（默认7天）
   */
  cleanupExpiredSessions(maxAgeDays: number = 7): number {
    const allStates = this.loadAllSessionStates();
    const now = Date.now();
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
    let cleaned = 0;

    for (const [sessionId, state] of Object.entries(allStates)) {
      if (now - state.lastActivity > maxAge) {
        delete allStates[sessionId];
        this.inMemoryCache.delete(sessionId);
        cleaned++;
      }
    }

    try {
      writeFileSync(this.stateFile, JSON.stringify(allStates, null, 2));
    } catch (error) {
      console.error('[StateManager] Failed to cleanup sessions:', error);
    }

    return cleaned;
  }
}

// 导出单例
export const stateManager = new StateManager();
export default stateManager;
