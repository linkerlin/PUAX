/**
 * PUAX Hook 管理器
 * 模拟真正的事件驱动 Hook 系统
 * 
 * 核心能力:
 * - 事件订阅/发布机制
 * - 自动化触发检测
 * - 周期性检查（轮询模拟实时）
 * - 客户端 SDK 集成支持
 */

import type { StateManager, SessionState } from './state-manager.js';
import { stateManager as defaultStateManager } from './state-manager.js';
import { enhancedTriggerDetector, TriggerContext, HookEventType, EnhancedTriggerResult } from './trigger-detector-enhanced.js';
import { pressureSystem as defaultPressureSystem } from './pressure-system.js';
import type { PressureSystem } from './pressure-system.js';
import { getGlobalLogger } from '../utils/logger.js';

const logger = getGlobalLogger();

// ============================================================================
// 类型定义
// ============================================================================

export type HookCallback = (result: EnhancedTriggerResult, context: TriggerContext) => void | Promise<void>;

export interface HookSubscription {
  id: string;
  eventType: HookEventType | 'all';
  callback: HookCallback;
  filter?: (result: EnhancedTriggerResult) => boolean;
}

export interface AutoCheckConfig {
  enabled: boolean;
  intervalMs: number;
  checkOnMessage: boolean;
  checkOnToolUse: boolean;
  minConfidence: number;
}

export interface HookManagerConfig {
  autoCheck: AutoCheckConfig;
  enablePersistence: boolean;
  enableFeedback: boolean;
}

export interface SessionContext {
  sessionId: string;
  conversationHistory: Array<{ role: string; content: string }>;
  lastMessageTime: number;
  lastToolUseTime?: number;
  metadata: Record<string, unknown>;
}

// ============================================================================
// Hook 管理器类
// ============================================================================

export interface HookManagerDeps {
  stateManager?: StateManager;
  pressureSystem?: PressureSystem;
}

export class HookManager {
  private subscriptions: Map<string, HookSubscription> = new Map();
  private sessions: Map<string, SessionContext> = new Map();
  private checkIntervals: Map<string, NodeJS.Timeout> = new Map();
  private config: HookManagerConfig;
  private isRunning = false;
  private stateManager: StateManager;
  private pressureSystem: PressureSystem;

  constructor(config: Partial<HookManagerConfig> = {}, deps?: HookManagerDeps) {
    this.config = {
      autoCheck: {
        enabled: true,
        intervalMs: 5000,  // 5秒检查一次
        checkOnMessage: true,
        checkOnToolUse: true,
        minConfidence: 0.6,
        ...config.autoCheck
      },
      enablePersistence: true,
      enableFeedback: true,
      ...config
    };
    this.stateManager = deps?.stateManager ?? defaultStateManager;
    this.pressureSystem = deps?.pressureSystem ?? defaultPressureSystem;
  }

  // ============================================================================
  // 订阅管理
  // ============================================================================

  /**
   * 订阅 Hook 事件
   */
  subscribe(
    eventType: HookEventType | 'all',
    callback: HookCallback,
    filter?: (result: EnhancedTriggerResult) => boolean
  ): string {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    this.subscriptions.set(id, {
      id,
      eventType,
      callback,
      filter
    });

    return id;
  }

  /**
   * 取消订阅
   */
  unsubscribe(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId);
  }

  /**
   * 清除所有订阅
   */
  clearSubscriptions(): void {
    this.subscriptions.clear();
  }

  // ============================================================================
  // 事件发布
  // ============================================================================

  /**
   * 发布事件
   */
  emit(eventType: HookEventType, context: Omit<TriggerContext, 'eventType'>): EnhancedTriggerResult {
    const fullContext: TriggerContext = {
      ...context,
      eventType,
    };

    const result = enhancedTriggerDetector.detect(fullContext);

    if (result.triggered) {
      this.notifySubscribers(eventType, result, fullContext);
    }

    return result;
  }

  /**
   * 通知订阅者（支持 sync/async 回调，不阻塞 emit）
   */
  private notifySubscribers(
    eventType: HookEventType,
    result: EnhancedTriggerResult,
    context: TriggerContext
  ): void {
    for (const sub of this.subscriptions.values()) {
      if (sub.eventType !== 'all' && sub.eventType !== eventType) {
        continue;
      }

      if (sub.filter && !sub.filter(result)) {
        continue;
      }

      void Promise.resolve(sub.callback(result, context)).catch(error => {
        logger.error(`[HookManager] Subscription ${sub.id} error:`, error);
      });
    }
  }

  // ============================================================================
  // 会话管理
  // ============================================================================

  /**
   * 启动会话监控
   */
  startSession(sessionId: string, initialMetadata: Record<string, unknown> = {}): void {
    // 初始化会话上下文
    this.sessions.set(sessionId, {
      sessionId,
      conversationHistory: [],
      lastMessageTime: Date.now(),
      metadata: initialMetadata
    });

    // 初始化或恢复会话状态
    const state = this.stateManager.getSessionState(sessionId);
    
    // 触发 SessionStart 事件
    void this.emit('SessionStart', {
      sessionId,
      metadata: {
        ...initialMetadata,
        restoredPressureLevel: state.pressureLevel,
        restoredFailureCount: state.failureCount
      }
    });

    // 启动自动检查（如果启用）
    if (this.config.autoCheck.enabled) {
      this.startAutoCheck(sessionId);
    }

    logger.info(`[HookManager] Session started: ${sessionId}`);
  }

  /**
   * 结束会话
   */
  endSession(sessionId: string, metadata: Record<string, unknown> = {}): void {
    this.stopAutoCheck(sessionId);

    this.emit('Stop', {
      sessionId,
      metadata: {
        ...metadata,
        finalHistory: this.sessions.get(sessionId)?.conversationHistory,
      },
    });

    this.sessions.delete(sessionId);

    logger.info(`[HookManager] Session ended: ${sessionId}`);
  }

  /**
   * 记录用户消息
   */
  recordUserMessage(sessionId: string, message: string): EnhancedTriggerResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      logger.warn(`[HookManager] Session not found: ${sessionId}`);
      return this.createEmptyResult();
    }

    // 更新会话历史
    session.conversationHistory.push({ role: 'user', content: message });
    session.lastMessageTime = Date.now();

    // 限制历史长度
    if (session.conversationHistory.length > 50) {
      session.conversationHistory = session.conversationHistory.slice(-50);
    }

    // 触发 UserPromptSubmit 检测（如果启用）
    if (this.config.autoCheck.checkOnMessage) {
      return this.emit('UserPromptSubmit', {
        sessionId,
        message,
        conversationHistory: session.conversationHistory,
      });
    }

    return this.createEmptyResult();
  }

  /**
   * 记录助手消息
   */
  recordAssistantMessage(sessionId: string, message: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.conversationHistory.push({ role: 'assistant', content: message });
    }
  }

  /**
   * 记录工具使用
   */
  recordToolUse(
    sessionId: string,
    toolName: string,
    toolResult: unknown,
    errorMessage?: string
  ): EnhancedTriggerResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return this.createEmptyResult();
    }

    session.lastToolUseTime = Date.now();

    // 触发 PostToolUse 检测（如果启用）
    if (this.config.autoCheck.checkOnToolUse) {
      return this.emit('PostToolUse', {
        sessionId,
        toolName,
        toolResult,
        errorMessage,
        conversationHistory: session.conversationHistory,
      });
    }

    return this.createEmptyResult();
  }

  /**
   * 记录上下文压缩前
   */
  recordPreCompact(
    sessionId: string,
    contextInfo: {
      currentTask?: string;
      triedApproaches?: string[];
      excludedPossibilities?: string[];
      nextHypothesis?: string;
      keyContext?: string;
    }
  ): EnhancedTriggerResult {
    return this.emit('PreCompact', {
      sessionId,
      metadata: contextInfo,
    });
  }

  // ============================================================================
  // 自动检查（模拟实时 Hook）
  // ============================================================================

  /**
   * 启动自动检查
   */
  private startAutoCheck(sessionId: string): void {
    // 清除已有的检查
    this.stopAutoCheck(sessionId);

    const interval = setInterval(() => {
      void this.performAutoCheck(sessionId);
    }, this.config.autoCheck.intervalMs);

    this.checkIntervals.set(sessionId, interval);
  }

  /**
   * 停止自动检查
   */
  private stopAutoCheck(sessionId: string): void {
    const interval = this.checkIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.checkIntervals.delete(sessionId);
    }
  }

  /**
   * 执行自动检查
   */
  private performAutoCheck(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const state = this.stateManager.getSessionState(sessionId);
    const now = Date.now();

    // 检查是否需要基于历史触发
    if (session.conversationHistory.length >= 2) {
      const recentMessages = session.conversationHistory.slice(-5);
      
      // 检查最近的对话是否有问题
      for (const msg of recentMessages) {
        if (msg.role === 'user') {
          const result = this.emit('UserPromptSubmit', {
            sessionId,
            message: msg.content,
            conversationHistory: session.conversationHistory,
          });

          if (result.triggered && result.confidence >= this.config.autoCheck.minConfidence) {
            // 已经触发，跳出
            break;
          }
        }
      }
    }

    // 检查长时间无活动（被动等待检测）
    const inactiveTime = now - session.lastMessageTime;
    const inactiveThreshold = 5 * 60 * 1000; // 5分钟

    if (inactiveTime > inactiveThreshold && state.pressureLevel < 2) {
      // 可以在这里触发被动等待警告
      logger.info(`[HookManager] Session ${sessionId} inactive for ${Math.round(inactiveTime / 1000)}s`);
    }
  }

  // ============================================================================
  // 快捷方法
  // ============================================================================

  /**
   * 一键检测（用于简单的 API 调用）
   */
  quickCheck(
    sessionId: string,
    text: string,
    context?: { toolName?: string; toolResult?: unknown }
  ): EnhancedTriggerResult {
    if (!this.sessions.has(sessionId)) {
      this.startSession(sessionId);
    }

    if (context?.toolName) {
      return this.recordToolUse(
        sessionId,
        context.toolName,
        context.toolResult
      );
    }

    return this.recordUserMessage(sessionId, text);
  }

  /**
   * 获取会话统计
   */
  getSessionStats(sessionId: string): {
    exists: boolean;
    messageCount: number;
    state: SessionState | null;
  } {
    const session = this.sessions.get(sessionId);
    
    return {
      exists: !!session,
      messageCount: session?.conversationHistory.length || 0,
      state: session ? this.stateManager.getSessionState(sessionId) : null
    };
  }

  /**
   * 获取所有活跃会话
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  // ============================================================================
  // 生命周期
  // ============================================================================

  /**
   * 启动 Hook 管理器
   */
  start(): void {
    this.isRunning = true;
    logger.info('[HookManager] Started');
  }

  /**
   * 停止 Hook 管理器
   */
  stop(): void {
    this.isRunning = false;
    
    // 停止所有自动检查
    for (const sessionId of this.checkIntervals.keys()) {
      this.stopAutoCheck(sessionId);
    }

    logger.info('[HookManager] Stopped');
  }

  /**
   * 获取运行状态
   */
  get isActive(): boolean {
    return this.isRunning;
  }

  // ============================================================================
  // 私有辅助方法
  // ============================================================================

  private createEmptyResult(): EnhancedTriggerResult {
    return {
      triggered: false,
      triggerType: 'none',
      confidence: 0,
      severity: 'low',
      recommendedRole: { id: 'none', name: 'None' },
      metadata: {
        matchedPatterns: [],
        failureCount: 0
      }
    };
  }
}

// 导出单例
export const hookManager = new HookManager();
export default hookManager;
