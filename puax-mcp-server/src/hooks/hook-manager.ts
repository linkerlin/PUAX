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
import { enhancedTriggerDetector, TriggerContext, HookEventType, EnhancedTriggerResult } from './trigger-detector-enhanced.js';
import type { PressureSystem } from './pressure-system.js';

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
    // Lazy import to avoid circular deps; allow injection for testing
    this.stateManager = deps?.stateManager ?? require('./state-manager.js').stateManager;
    this.pressureSystem = deps?.pressureSystem ?? require('./pressure-system.js').pressureSystem;
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
  async emit(eventType: HookEventType, context: Omit<TriggerContext, 'eventType'>): Promise<EnhancedTriggerResult> {
    const fullContext: TriggerContext = {
      ...context,
      eventType
    };

    // 执行触发检测
    const result = await enhancedTriggerDetector.detect(fullContext);

    // 如果触发了，通知所有订阅者
    if (result.triggered) {
      await this.notifySubscribers(eventType, result, fullContext);
    }

    return result;
  }

  /**
   * 通知订阅者
   */
  private async notifySubscribers(
    eventType: HookEventType,
    result: EnhancedTriggerResult,
    context: TriggerContext
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const sub of this.subscriptions.values()) {
      // 检查事件类型匹配
      if (sub.eventType !== 'all' && sub.eventType !== eventType) {
        continue;
      }

      // 检查过滤器
      if (sub.filter && !sub.filter(result)) {
        continue;
      }

      // 执行回调
      promises.push(
        Promise.resolve(sub.callback(result, context)).catch(error => {
          console.error(`[HookManager] Subscription ${sub.id} error:`, error);
        })
      );
    }

    await Promise.all(promises);
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
    this.emit('SessionStart', {
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

    console.log(`[HookManager] Session started: ${sessionId}`);
  }

  /**
   * 结束会话
   */
  async endSession(sessionId: string, metadata: Record<string, any> = {}): Promise<void> {
    // 停止自动检查
    this.stopAutoCheck(sessionId);

    // 触发 Stop 事件
    await this.emit('Stop', {
      sessionId,
      metadata: {
        ...metadata,
        finalHistory: this.sessions.get(sessionId)?.conversationHistory
      }
    });

    // 清理会话
    this.sessions.delete(sessionId);

    console.log(`[HookManager] Session ended: ${sessionId}`);
  }

  /**
   * 记录用户消息
   */
  async recordUserMessage(sessionId: string, message: string): Promise<EnhancedTriggerResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[HookManager] Session not found: ${sessionId}`);
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
      return await this.emit('UserPromptSubmit', {
        sessionId,
        message,
        conversationHistory: session.conversationHistory
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
  async recordToolUse(
    sessionId: string,
    toolName: string,
    toolResult: unknown,
    errorMessage?: string
  ): Promise<EnhancedTriggerResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return this.createEmptyResult();
    }

    session.lastToolUseTime = Date.now();

    // 触发 PostToolUse 检测（如果启用）
    if (this.config.autoCheck.checkOnToolUse) {
      return await this.emit('PostToolUse', {
        sessionId,
        toolName,
        toolResult,
        errorMessage,
        conversationHistory: session.conversationHistory
      });
    }

    return this.createEmptyResult();
  }

  /**
   * 记录上下文压缩前
   */
  async recordPreCompact(
    sessionId: string,
    contextInfo: {
      currentTask?: string;
      triedApproaches?: string[];
      excludedPossibilities?: string[];
      nextHypothesis?: string;
      keyContext?: string;
    }
  ): Promise<EnhancedTriggerResult> {
    return await this.emit('PreCompact', {
      sessionId,
      metadata: contextInfo
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

    const interval = setInterval(async () => {
      await this.performAutoCheck(sessionId);
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
  private async performAutoCheck(sessionId: string): Promise<void> {
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
          const result = await this.emit('UserPromptSubmit', {
            sessionId,
            message: msg.content,
            conversationHistory: session.conversationHistory
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
      console.log(`[HookManager] Session ${sessionId} inactive for ${Math.round(inactiveTime / 1000)}s`);
    }
  }

  // ============================================================================
  // 快捷方法
  // ============================================================================

  /**
   * 一键检测（用于简单的 API 调用）
   */
  async quickCheck(
    sessionId: string,
    text: string,
    context?: { toolName?: string; toolResult?: unknown }
  ): Promise<EnhancedTriggerResult> {
    // 确保会话存在
    if (!this.sessions.has(sessionId)) {
      this.startSession(sessionId);
    }

    // 根据上下文决定检测类型
    if (context?.toolName) {
      return await this.recordToolUse(
        sessionId,
        context.toolName,
        context.toolResult
      );
    } else {
      return await this.recordUserMessage(sessionId, text);
    }
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
    console.log('[HookManager] Started');
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

    console.log('[HookManager] Stopped');
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
