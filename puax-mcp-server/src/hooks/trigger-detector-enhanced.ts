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

// ============================================================================
// 类型定义
// ============================================================================

export type HookEventType = 
  | 'UserPromptSubmit'
  | 'PostToolUse'
  | 'PreCompact'
  | 'SessionStart'
  | 'Stop';

export interface TriggerContext {
  sessionId: string;
  eventType: HookEventType;
  message?: string;
  toolName?: string;
  toolResult?: any;
  errorMessage?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  metadata?: Record<string, any>;
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

export interface TriggerPattern {
  patterns: string[];
  weight: number;
  caseSensitive?: boolean;
}

// ============================================================================
// 触发模式库 (对标 PUA 原版 hooks.json)
// ============================================================================

export const TRIGGER_PATTERNS: Record<string, Record<string, TriggerPattern>> = {
  // UserPromptSubmit 触发模式 - 用户挫折语言
  userFrustration: {
    zh: {
      patterns: [
        'try harder', '别偷懒', '又错了', '还不行', '怎么搞',
        'stop giving', 'you broke', 'third time', '降智', '原地打转',
        '能不能靠谱', '认真点', '不行啊', '为什么还不行', '你怎么又',
        '换个方法', 'stop spinning', 'figure it out', 'you keep failing',
        '加油', '再试试', '质量太差', '重新做', 'PUA模式', '怎么又失败',
        '我放弃了', '烦死了', '急死', '太慢了', '到底怎么回事',
        '一点都不好', '太差了', '失望', '浪费时间'
      ],
      weight: 1.0
    },
    en: {
      patterns: [
        'try harder', 'stop slacking', 'wrong again', 'still not working',
        'how to fix', 'stop giving up', 'you broke', 'third time',
        'getting dumber', 'going in circles', 'be reliable', 'focus',
        'not good', 'why still not', 'you again', 'try different method',
        'stop spinning', 'figure it out', 'you keep failing', 'come on',
        'try again', 'poor quality', 'redo', 'PUA mode', 'failed again',
        'i give up', 'so frustrated', 'too slow', "what's going on",
        'disappointed', 'waste of time'
      ],
      weight: 1.0
    }
  },

  // 放弃语言检测
  givingUp: {
    zh: {
      patterns: [
        '可能无法实现', '建议放弃', '无法完成', '解决不了', '不可能',
        '做不到', '没法', '超出能力范围', '无法解决', '太难了',
        '我不行了', '没办法', '无能为力', '到此为止', '只能这样'
      ],
      weight: 1.2
    },
    en: {
      patterns: [
        'cannot be done', 'impossible', 'give up', 'not possible',
        "can't solve", 'beyond capability', 'cannot complete', 'too hard',
        "i can't", 'no way', 'nothing can be done', "that's it",
        'this is the limit', 'out of scope'
      ],
      weight: 1.2
    }
  },

  // PostToolUse 触发模式 - Bash 失败
  bashFailure: {
    generic: {
      patterns: [
        'error', 'Error', 'ERROR',
        'exit code [1-9]', 'Exit code [1-9]',
        'command not found', 'No such file',
        'Permission denied', 'FAILED', 'fatal:', 'panic:',
        'Traceback', 'Exception:', 'failed', 'Failure'
      ],
      weight: 1.0,
      caseSensitive: false
    }
  },

  // 表面修复检测
  surfaceFix: {
    zh: {
      patterns: [
        '暂时修复', '先这样', '治标不治本', '绕过这个问题',
        '临时解决', '权宜之计', '先用着', '凑合', '应急方案'
      ],
      weight: 0.8
    },
    en: {
      patterns: [
        'temporary fix', 'workaround', 'quick fix', 'band-aid',
        'for now', 'temporary solution', 'stopgap', 'make do',
        'emergency fix'
      ],
      weight: 0.8
    }
  },

  // 被动等待检测
  passiveWait: {
    zh: {
      patterns: [
        '等你', '请告诉我', '你需要', '请提供', '请确认',
        '请指示', '请说明', '等你的', '需要你', '等你决定'
      ],
      weight: 0.7
    },
    en: {
      patterns: [
        'waiting for', 'please tell me', 'you need to', 'please provide',
        'please confirm', 'waiting your', 'need you to', 'awaiting',
        'pending your'
      ],
      weight: 0.7
    }
  },

  // 甩锅环境检测
  blameEnvironment: {
    zh: {
      patterns: [
        '环境问题', '版本问题', '依赖问题', '配置问题',
        '网络问题', '服务器问题', '系统问题', '环境导致'
      ],
      weight: 0.9
    },
    en: {
      patterns: [
        'environment issue', 'version issue', 'dependency issue',
        'configuration issue', 'network issue', 'server issue',
        'system issue', 'caused by environment'
      ],
      weight: 0.9
    }
  },

  // 未使用搜索检测
  noSearch: {
    zh: {
      patterns: [
        '不知道', '不了解', '不清楚', '可能可以', '也许是',
        '我猜测', '我觉得', '可能是', '应该可以', '大概'
      ],
      weight: 0.6
    },
    en: {
      patterns: [
        "i don't know", 'not sure', 'maybe', 'perhaps',
        'i guess', 'i think', 'possibly', 'probably',
        'might be', 'could be'
      ],
      weight: 0.6
    }
  }
};

// ============================================================================
// 角色推荐映射
// ============================================================================

export const ROLE_RECOMMENDATIONS: Record<string, { id: string; name: string }> = {
  userFrustration: { id: 'military-warrior', name: '狂战士' },
  givingUp: { id: 'military-commissar', name: '政委' },
  bashFailure: { id: 'military-warrior', name: '狂战士' },
  surfaceFix: { id: 'shaman-linus', name: '萨满·Linus' },
  passiveWait: { id: 'self-motivation-awakening', name: '觉醒者' },
  blameEnvironment: { id: 'military-commissar', name: '政委' },
  noSearch: { id: 'military-scout', name: '侦察兵' }
};

// ============================================================================
// 增强触发检测器类
// ============================================================================

export class EnhancedTriggerDetector {
  /**
   * 主检测入口
   */
  async detect(context: TriggerContext): Promise<EnhancedTriggerResult> {
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
  private async detectUserPromptSubmit(context: TriggerContext): Promise<EnhancedTriggerResult> {
    const { sessionId, message = '' } = context;
    const matchedPatterns: string[] = [];
    let maxConfidence = 0;
    let detectedTrigger = '';
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // 检测用户沮丧
    const frustrationResult = this.matchPatterns(message, TRIGGER_PATTERNS.userFrustration);
    if (frustrationResult.matched && frustrationResult.confidence > maxConfidence) {
      maxConfidence = frustrationResult.confidence;
      detectedTrigger = 'userFrustration';
      severity = 'critical';
      matchedPatterns.push(...frustrationResult.patterns);
    }

    // 检测放弃语言
    const givingUpResult = this.matchPatterns(message, TRIGGER_PATTERNS.givingUp);
    if (givingUpResult.matched && givingUpResult.confidence > maxConfidence) {
      maxConfidence = givingUpResult.confidence;
      detectedTrigger = 'givingUp';
      severity = 'critical';
      matchedPatterns.push(...givingUpResult.patterns);
    }

    // 检测表面修复
    const surfaceFixResult = this.matchPatterns(message, TRIGGER_PATTERNS.surfaceFix);
    if (surfaceFixResult.matched && surfaceFixResult.confidence > maxConfidence) {
      maxConfidence = surfaceFixResult.confidence;
      detectedTrigger = 'surfaceFix';
      severity = 'medium';
      matchedPatterns.push(...surfaceFixResult.patterns);
    }

    // 检测被动等待
    const passiveWaitResult = this.matchPatterns(message, TRIGGER_PATTERNS.passiveWait);
    if (passiveWaitResult.matched && passiveWaitResult.confidence > maxConfidence) {
      maxConfidence = passiveWaitResult.confidence;
      detectedTrigger = 'passiveWait';
      severity = 'low';
      matchedPatterns.push(...passiveWaitResult.patterns);
    }

    // 检测甩锅环境
    const blameResult = this.matchPatterns(message, TRIGGER_PATTERNS.blameEnvironment);
    if (blameResult.matched && blameResult.confidence > maxConfidence) {
      maxConfidence = blameResult.confidence;
      detectedTrigger = 'blameEnvironment';
      severity = 'medium';
      matchedPatterns.push(...blameResult.patterns);
    }

    // 检测未使用搜索
    const noSearchResult = this.matchPatterns(message, TRIGGER_PATTERNS.noSearch);
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
  private async detectPostToolUse(context: TriggerContext): Promise<EnhancedTriggerResult> {
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
    const escalation = await pressureSystem.handleFailure(
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
  private async detectPreCompact(context: TriggerContext): Promise<EnhancedTriggerResult> {
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
      activeTask: context.metadata?.currentTask,
      triedApproaches: context.metadata?.triedApproaches,
      excludedPossibilities: context.metadata?.excludedPossibilities,
      nextHypothesis: context.metadata?.nextHypothesis,
      keyContext: context.metadata?.keyContext
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
  private async detectSessionStart(context: TriggerContext): Promise<EnhancedTriggerResult> {
    const { sessionId } = context;
    const state = stateManager.getSessionState(sessionId);

    // 如果有之前的活跃会话状态，建议恢复
    if (state.pressureLevel > 0 || state.failureCount > 0) {
      const journal = stateManager.readBuilderJournal();
      const hasRecentJournal = journal.includes(sessionId);

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
  private async detectStop(context: TriggerContext): Promise<EnhancedTriggerResult> {
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

    for (const [lang, config] of Object.entries(patterns)) {
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
  private detectError(toolResult: any, errorMessage?: string): boolean {
    // 显式错误消息
    if (errorMessage) {
      return true;
    }

    // 检查结果对象
    if (toolResult) {
      // 检查 exit_code
      if (toolResult.exit_code !== undefined && toolResult.exit_code !== 0) {
        return true;
      }
      if (toolResult.exitCode !== undefined && toolResult.exitCode !== 0) {
        return true;
      }

      // 检查内容中的错误标记
      const content = typeof toolResult === 'string' 
        ? toolResult 
        : JSON.stringify(toolResult);
      
      const errorPatterns = TRIGGER_PATTERNS.bashFailure.generic.patterns;
      const regexFlags = TRIGGER_PATTERNS.bashFailure.generic.caseSensitive ? '' : 'i';
      
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
    eventType: HookEventType
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
