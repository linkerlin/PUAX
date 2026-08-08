/**
 * PUAX 增强版触发检测器
 * 全面对齐 PUA 原版的触发检测能力
 * 
 * 新增触发类型:
 * - UserPromptSubmit: 用户挫折语言检测
 * - PostToolUse: Bash 失败检测
 * - PreCompact: 上下文压缩前状态持久
 * - SessionStart: 会话开始状态恢复
 * - Stop: 会话结束反馈收集
 */

import { stateManager } from './state-manager.js';
import { pressureSystem, PressureResponse } from './pressure-system.js';
import { type HookEventType } from './hook-event.js';
import { getTriggerPatterns } from './hook-config.js';
import { TRIGGER_PATTERNS, ROLE_RECOMMENDATIONS, type TriggerPattern } from './trigger-patterns.js';

// ============================================================================
// 类型定义
// ============================================================================

export type { PuaxHookEvent, HookEventType } from './hook-event.js';

export interface TriggerContext {
  sessionId: string;
  eventType: HookEventType;
  message?: string;
  toolName?: string;
  toolResult?: unknown;
  errorMessage?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  metadata?: Record<string, unknown>;
}

export interface EnhancedTriggerResult {
  triggered: boolean;
  triggerType: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  pressureLevel?: number;
  pressureResponse?: PressureResponse;
  recommendedRole: {
    id: string;
    name: string;
    systemPrompt?: string;
  };
  injectionPrompt?: string;
  metadata: {
    matchedPatterns: string[];
    failureCount: number;
    cooldownRemaining?: number;
  };
}

// 兼容导出：模式库与角色映射已抽至 trigger-patterns.ts（配置外置，见 hook-config.ts）
export { TRIGGER_PATTERNS, ROLE_RECOMMENDATIONS, type TriggerPattern };

// ============================================================================
// 增强触发检测器类
// ============================================================================

export class EnhancedTriggerDetector {
  /**
   * 主检测入口
   */
  detect(context: TriggerContext): EnhancedTriggerResult {
    const { sessionId, eventType } = context;

    const bypassCooldown = eventType === 'PreCompact' || eventType === 'SessionStart' || eventType === 'Stop';

    // 检查冷却时间
    if (!bypassCooldown) {
      const cooldown = pressureSystem.checkCooldown(sessionId);
      if (!cooldown.canTrigger) {
        return this.createEmptyResult(sessionId, cooldown.remainingMs);
      }
    }

    // 根据事件类型路由到不同的检测器
    switch (eventType) {
      case 'UserPromptSubmit':
        return this.detectUserPromptSubmit(context);
      case 'PostToolUse':
        return this.detectPostToolUse(context);
      case 'PreToolUse':
        // 拦截决策由 DeterministicTriggersEngine（确定性引擎）负责，
        // 本检测器只做激励检测，不重复实现拦截逻辑。
        return this.createEmptyResult(sessionId);
      case 'PreCompact':
        return this.detectPreCompact(context);
      case 'SessionStart':
        return this.detectSessionStart(context);
      case 'Stop':
        return this.detectStop(context);
      default:
        return this.createEmptyResult(sessionId);
    }
  }

  /**
   * UserPromptSubmit 检测 - 用户挫折语言
   */
  private detectUserPromptSubmit(context: TriggerContext): EnhancedTriggerResult {
    const { sessionId, message = '' } = context;
    const matchedPatterns: string[] = [];
    let maxConfidence = 0;
    let detectedTrigger = '';
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // 检测用户沮丧
    const frustrationResult = this.matchPatterns(message, getTriggerPatterns().userFrustration);
    if (frustrationResult.matched && frustrationResult.confidence > maxConfidence) {
      maxConfidence = frustrationResult.confidence;
      detectedTrigger = 'userFrustration';
      severity = 'critical';
      matchedPatterns.push(...frustrationResult.patterns);
    }

    // 检测放弃语言
    const givingUpResult = this.matchPatterns(message, getTriggerPatterns().givingUp);
    if (givingUpResult.matched && givingUpResult.confidence > maxConfidence) {
      maxConfidence = givingUpResult.confidence;
      detectedTrigger = 'givingUp';
      severity = 'critical';
      matchedPatterns.push(...givingUpResult.patterns);
    }

    // 检测表面修复
    const surfaceFixResult = this.matchPatterns(message, getTriggerPatterns().surfaceFix);
    if (surfaceFixResult.matched && surfaceFixResult.confidence > maxConfidence) {
      maxConfidence = surfaceFixResult.confidence;
      detectedTrigger = 'surfaceFix';
      severity = 'medium';
      matchedPatterns.push(...surfaceFixResult.patterns);
    }

    // 检测被动等待
    const passiveWaitResult = this.matchPatterns(message, getTriggerPatterns().passiveWait);
    if (passiveWaitResult.matched && passiveWaitResult.confidence > maxConfidence) {
      maxConfidence = passiveWaitResult.confidence;
      detectedTrigger = 'passiveWait';
      severity = 'low';
      matchedPatterns.push(...passiveWaitResult.patterns);
    }

    // 检测甩锅环境
    const blameResult = this.matchPatterns(message, getTriggerPatterns().blameEnvironment);
    if (blameResult.matched && blameResult.confidence > maxConfidence) {
      maxConfidence = blameResult.confidence;
      detectedTrigger = 'blameEnvironment';
      severity = 'medium';
      matchedPatterns.push(...blameResult.patterns);
    }

    // 检测未使用搜索
    const noSearchResult = this.matchPatterns(message, getTriggerPatterns().noSearch);
    if (noSearchResult.matched && noSearchResult.confidence > maxConfidence) {
      maxConfidence = noSearchResult.confidence;
      detectedTrigger = 'noSearch';
      severity = 'medium';
      matchedPatterns.push(...noSearchResult.patterns);
    }

    // 如果检测到触发，记录并构建响应
    if (detectedTrigger && maxConfidence >= 0.5) {
      return this.buildTriggerResult(
        sessionId,
        detectedTrigger,
        maxConfidence,
        severity,
        matchedPatterns,
        'UserPromptSubmit'
      );
    }

    return this.createEmptyResult(sessionId);
  }

  /**
   * PostToolUse 检测 - Bash 失败 + 压力升级
   */
  private detectPostToolUse(context: TriggerContext): EnhancedTriggerResult {
    const { sessionId, toolName, toolResult, errorMessage } = context;

    // 只处理 Bash 工具
    if (toolName !== 'Bash' && toolName !== 'bash') {
      return this.createEmptyResult(sessionId);
    }

    // 检查是否失败
    const isError = this.detectError(toolResult, errorMessage);
    if (!isError) {
      // 成功时可能重置失败计数
      return this.createEmptyResult(sessionId);
    }

    // 记录失败并获取压力升级结果
    const escalation = pressureSystem.handleFailure(
      sessionId,
      errorMessage || 'Bash command failed',
      toolName,
      { currentFlavor: stateManager.getSessionState(sessionId).currentFlavor }
    );

    if (escalation.shouldTrigger) {
      const recommendedRole = ROLE_RECOMMENDATIONS.bashFailure;
      
      // 记录触发
      stateManager.recordTrigger(
        sessionId,
        'bashFailure',
        1.0,
        recommendedRole.id,
        escalation.currentLevel
      );

      // 构建注入提示词
      const injectionPrompt = pressureSystem.buildInjectionPrompt(
        escalation.response,
        undefined // 可以在后续添加角色系统提示词
      );

      return {
        triggered: true,
        triggerType: 'bashFailure',
        confidence: 1.0,
        severity: 'high',
        pressureLevel: escalation.currentLevel,
        pressureResponse: escalation.response,
        recommendedRole,
        injectionPrompt,
        metadata: {
          matchedPatterns: ['bash_exit_code_nonzero'],
          failureCount: stateManager.getFailureCount(sessionId)
        }
      };
    }

    return this.createEmptyResult(sessionId);
  }

  /**
   * PreCompact 检测 - 上下文压缩前状态持久
   */
  private detectPreCompact(context: TriggerContext): EnhancedTriggerResult {
    const { sessionId } = context;
    const state = stateManager.getSessionState(sessionId);

    // 只在有 PUA 触发时记录
    if (state.triggerCount === 0) {
      return this.createEmptyResult(sessionId);
    }

    // 写入构建日志
    stateManager.writeBuilderJournal(sessionId, {
      pressureLevel: state.pressureLevel,
      failureCount: state.failureCount,
      currentFlavor: state.currentFlavor,
      activeTask: context.metadata?.currentTask as string | undefined,
      triedApproaches: context.metadata?.triedApproaches as string[] | undefined,
      excludedPossibilities: context.metadata?.excludedPossibilities as string[] | undefined,
      nextHypothesis: context.metadata?.nextHypothesis as string | undefined,
      keyContext: context.metadata?.keyContext as string | undefined
    });

    return {
      triggered: true,
      triggerType: 'preCompact',
      confidence: 1.0,
      severity: 'low',
      recommendedRole: { id: 'system', name: 'System' },
      metadata: {
        matchedPatterns: ['session_has_pua_triggers'],
        failureCount: state.failureCount
      }
    };
  }

  /**
   * SessionStart 检测 - 会话开始状态恢复
   */
  private detectSessionStart(context: TriggerContext): EnhancedTriggerResult {
    const { sessionId } = context;
    const state = stateManager.getSessionState(sessionId);

    // 如果有之前的活跃会话状态，建议恢复
    if (state.pressureLevel > 0 || state.failureCount > 0) {
      // Journal check could be used for additional validation in future
      stateManager.readBuilderJournal();

      return {
        triggered: true,
        triggerType: 'sessionRestore',
        confidence: 0.9,
        severity: 'medium',
        recommendedRole: { id: 'system', name: 'SessionRestore' },
        metadata: {
          matchedPatterns: ['previous_session_detected', `prev_level_${state.pressureLevel}`],
          failureCount: state.failureCount
        }
      };
    }

    return this.createEmptyResult(sessionId);
  }

  /**
   * Stop 检测 - 会话结束反馈收集
   */
  private detectStop(context: TriggerContext): EnhancedTriggerResult {
    const { sessionId } = context;
    const state = stateManager.getSessionState(sessionId);

    // 只在有 PUA 参与时触发
    if (state.triggerCount === 0) {
      return this.createEmptyResult(sessionId);
    }

    return {
      triggered: true,
      triggerType: 'stopFeedback',
      confidence: 1.0,
      severity: 'low',
      recommendedRole: { id: 'system', name: 'FeedbackCollector' },
      metadata: {
        matchedPatterns: ['pua_was_active', `triggers_${state.triggerCount}`],
        failureCount: state.failureCount
      }
    };
  }

  // ============================================================================
  // 辅助方法
  // ============================================================================

  /**
   * 模式匹配
   */
  private matchPatterns(text: string, patterns: Record<string, TriggerPattern>): {
    matched: boolean;
    confidence: number;
    patterns: string[];
  } {
    const matchedPatterns: string[] = [];
    let totalWeight = 0;
    let matchedWeight = 0;

    for (const config of Object.values(patterns)) {
      const regexFlags = config.caseSensitive ? '' : 'i';

      for (const pattern of config.patterns) {
        totalWeight += config.weight;
        
        try {
          const regex = new RegExp(pattern, regexFlags);
          if (regex.test(text)) {
            matchedPatterns.push(pattern);
            matchedWeight += config.weight;
          }
        } catch (e) {
          // 简单字符串匹配作为回退
          const textLower = text.toLowerCase();
          const patternLower = pattern.toLowerCase();
          if (textLower.includes(patternLower)) {
            matchedPatterns.push(pattern);
            matchedWeight += config.weight;
          }
        }
      }
    }

    const confidence = matchedPatterns.length > 0
      ? Math.min(1, 0.5 + (totalWeight > 0 ? (matchedWeight / totalWeight) * 0.5 : 0))
      : 0;
    
    return {
      matched: matchedPatterns.length > 0,
      confidence: Math.min(1, confidence),
      patterns: matchedPatterns
    };
  }

  /**
   * 检测错误
   */
  private detectError(toolResult: unknown, errorMessage?: string): boolean {
    // 显式错误消息
    if (errorMessage) {
      return true;
    }

    // 检查结果对象
    if (toolResult && typeof toolResult === 'object') {
      const resultObj = toolResult as Record<string, unknown>;
      // 检查 exit_code
      if (resultObj.exit_code !== undefined && resultObj.exit_code !== 0) {
        return true;
      }
      if (resultObj.exitCode !== undefined && resultObj.exitCode !== 0) {
        return true;
      }

      // 检查内容中的错误标记
      const content = typeof toolResult === 'string' 
        ? toolResult 
        : JSON.stringify(toolResult);
      
      const errorPatterns = getTriggerPatterns().bashFailure.generic.patterns;
      const regexFlags = getTriggerPatterns().bashFailure.generic.caseSensitive ? '' : 'i';
      
      for (const pattern of errorPatterns) {
        try {
          const regex = new RegExp(pattern, regexFlags);
          if (regex.test(content)) {
            return true;
          }
        } catch {
          if (content.toLowerCase().includes(pattern.toLowerCase())) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * 构建触发结果
   */
  private buildTriggerResult(
    sessionId: string,
    triggerType: string,
    confidence: number,
    severity: 'low' | 'medium' | 'high' | 'critical',
    matchedPatterns: string[],
    _eventType: HookEventType
  ): EnhancedTriggerResult {
    const recommendedRole = ROLE_RECOMMENDATIONS[triggerType] || { id: 'military-warrior', name: '狂战士' };
    const currentPressure = stateManager.getPressureLevel(sessionId);

    // 记录触发
    stateManager.recordTrigger(sessionId, triggerType, confidence, recommendedRole.id, currentPressure);

    // 获取压力响应
    const pressureResponse = pressureSystem.getCurrentResponse(sessionId, {
      failureCount: stateManager.getFailureCount(sessionId)
    });

    // 构建注入提示词
    const injectionPrompt = pressureSystem.buildInjectionPrompt(pressureResponse);

    return {
      triggered: true,
      triggerType,
      confidence,
      severity,
      pressureLevel: currentPressure,
      pressureResponse,
      recommendedRole,
      injectionPrompt,
      metadata: {
        matchedPatterns,
        failureCount: stateManager.getFailureCount(sessionId)
      }
    };
  }

  /**
   * 创建空结果
   */
  private createEmptyResult(sessionId: string, cooldownRemaining?: number): EnhancedTriggerResult {
    return {
      triggered: false,
      triggerType: 'none',
      confidence: 0,
      severity: 'low',
      recommendedRole: { id: 'none', name: 'None' },
      metadata: {
        matchedPatterns: [],
        failureCount: stateManager.getFailureCount(sessionId),
        cooldownRemaining
      }
    };
  }
}

// 导出单例
export const enhancedTriggerDetector = new EnhancedTriggerDetector();
export default enhancedTriggerDetector;
