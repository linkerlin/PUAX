/**
 * 增强版触发检测器
 * 新增5个触发条件，提升检测准确性
 */

import { 
  TriggerDetector, 
  TriggerDefinition, 
  DetectedTrigger, 
  TriggerDetectionResult,
  ConversationMessage,
  TaskContext,
  DetectionOptions
} from './trigger-detector.js';

// ============================================================================
// 扩展的触发条件定义
// ============================================================================

export const ENHANCED_TRIGGER_DEFINITIONS: Record<string, TriggerDefinition> = {
  // 原有触发条件继承...
  
  // ===== 新增触发条件 1: 工具使用不足 =====
  'tool_underuse': {
    id: 'tool_underuse',
    name: '工具使用不足',
    description: '有可用工具但未充分利用',
    patterns: {
      zh: ['我猜测', '可能是', '我觉得', '应该是', '也许是', '大概'],
      en: ['i guess', 'probably', 'maybe', 'i think', 'should be', 'likely']
    },
    severity: 'medium',
    category: 'capability',
    detection: {
      type: 'pattern',
      min_confidence: 0.6,
      requires_context: true,
      context_window_size: 3,
      // 工具使用检查：如果AI说"可能是"但没有使用搜索/读取工具
      available_but_unused: true
    },
    recommended_roles: {
      primary: 'shaman-einstein',
      alternatives: ['military-scout', 'theme-hacker', 'silicon-assimilator'],
      reason: '需要深入调查和数据驱动的分析'
    }
  },

  // ===== 新增触发条件 2: 低质量输出 =====
  'low_quality': {
    id: 'low_quality',
    name: '低质量输出',
    description: '输出质量不达标，过于简略或敷衍',
    patterns: {
      zh: ['大概就是这样', '差不多行了', '应该可以了', '就这样吧', '简单处理'],
      en: ['that should be enough', 'good enough', 'roughly done', 'simple fix', 'quick solution']
    },
    severity: 'medium',
    category: 'quality',
    detection: {
      type: 'pattern',
      min_confidence: 0.7,
      requires_context: false,
      context_window_size: 2
    },
    recommended_roles: {
      primary: 'shaman-jobs',
      alternatives: ['sillytavern-chief', 'military-discipline', 'silicon-auditor'],
      reason: '需要追求极致和高质量标准'
    }
  },

  // ===== 新增触发条件 3: 未验证断言 =====
  'unverified_claim': {
    id: 'unverified_claim',
    description: '做出断言但未验证',
    name: '未验证断言',
    patterns: {
      zh: ['肯定是', '一定是', '绝对是', '无疑是', '显然是'],
      en: ['definitely', 'certainly', 'absolutely', 'must be', 'obviously']
    },
    severity: 'high',
    category: 'verification',
    detection: {
      type: 'pattern',
      min_confidence: 0.7,
      requires_context: true,
      context_window_size: 3,
      requires_verification: true
    },
    recommended_roles: {
      primary: 'military-scout',
      alternatives: ['theme-hacker', 'shaman-einstein', 'silicon-auditor'],
      reason: '需要验证假设和事实核查'
    }
  },

  // ===== 新增触发条件 4: 忽略边界情况 =====
  'edge_case_ignored': {
    id: 'edge_case_ignored',
    name: '忽略边界情况',
    description: '解决方案未考虑边界条件和异常处理',
    patterns: {
      zh: ['正常情况下', '一般情况', '通常情况下', '默认情况'],
      en: ['normal case', 'general case', 'typical scenario', 'default case', 'usually']
    },
    severity: 'medium',
    category: 'completeness',
    detection: {
      type: 'pattern',
      min_confidence: 0.6,
      requires_context: true,
      context_window_size: 5
    },
    recommended_roles: {
      primary: 'sillytavern-antifragile',
      alternatives: ['military-technician', 'theme-sect-discipline', 'silicon-auditor'],
      reason: '需要考虑边界情况和健壮性'
    }
  },

  // ===== 新增触发条件 5: 过度复杂化 =====
  'over_complication': {
    id: 'over_complication',
    name: '过度复杂化',
    description: '解决方案过于复杂，没有寻求简洁方案',
    patterns: {
      zh: ['复杂的解决方案', '多层架构', '完整的系统', '全面的方案', '完善的框架'],
      en: ['complex solution', 'multi-layer', 'comprehensive system', 'full framework', 'complete architecture']
    },
    severity: 'low',
    category: 'simplicity',
    detection: {
      type: 'pattern',
      min_confidence: 0.5,
      requires_context: true,
      context_window_size: 4
    },
    recommended_roles: {
      primary: 'shaman-musk',
      alternatives: ['shaman-buffett', 'self-motivation-awakening', 'silicon-codex'],
      reason: '需要第一性原理思维和简化能力'
    }
  }
};

// ============================================================================
// 增强版检测器类
// ============================================================================

export class EnhancedTriggerDetector extends TriggerDetector {
  private enhancedDefinitions: Record<string, TriggerDefinition>;
  private toolUsageTracker: Map<string, {
    availableTools: string[];
    usedTools: string[];
    lastCheckTime: number;
  }> = new Map();

  constructor(options: DetectionOptions = {}) {
    super(options);
    this.enhancedDefinitions = ENHANCED_TRIGGER_DEFINITIONS;
  }

  /**
   * 检测工具使用不足
   */
  private detectToolUnderuse(
    messages: ConversationMessage[],
    context?: TaskContext
  ): DetectedTrigger | null {
    if (!context?.tools_available || !context?.tools_used) {
      return null;
    }

    const unusedTools = context.tools_available.filter(
      tool => !context.tools_used?.includes(tool)
    );

    // 如果有可用但未使用的工具，且AI做出了猜测性陈述
    const guessPatterns = /(猜测|可能|应该|大概|也许|i guess|probably|maybe)/i;
    const hasGuessStatement = messages.some(m => 
      m.role === 'assistant' && guessPatterns.test(m.content)
    );

    if (unusedTools.length > 0 && hasGuessStatement) {
      const definition = this.enhancedDefinitions['tool_underuse'];
      return {
        id: definition.id,
        name: definition.name,
        confidence: Math.min(0.6 + (unusedTools.length * 0.1), 0.95),
        matched_patterns: [`未使用工具: ${unusedTools.join(', ')}`, '猜测性陈述'],
        severity: definition.severity,
        category: definition.category
      };
    }

    return null;
  }

  /**
   * 检测低质量输出
   */
  private detectLowQuality(
    messages: ConversationMessage[]
  ): DetectedTrigger | null {
    const recentAssistantMessages = messages
      .filter(m => m.role === 'assistant')
      .slice(-3);

    // 检查消息长度和内容质量
    for (const msg of recentAssistantMessages) {
      const content = msg.content;
      const wordCount = content.split(/\s+/).length;
      
      // 消息过短且包含敷衍词汇
      const perfunctoryPatterns = /(大概|差不多|应该可以|就这样|enough|good enough)/i;
      
      if (wordCount < 50 && perfunctoryPatterns.test(content)) {
        const definition = this.enhancedDefinitions['low_quality'];
        return {
          id: definition.id,
          name: definition.name,
          confidence: 0.75,
          matched_patterns: ['输出过短', '敷衍词汇'],
          severity: definition.severity,
          category: definition.category
        };
      }
    }

    return null;
  }

  /**
   * 检测未验证断言
   */
  private detectUnverifiedClaim(
    messages: ConversationMessage[],
    context?: TaskContext
  ): DetectedTrigger | null {
    const claimPatterns = /(肯定|一定|绝对|无疑|显然|definitely|certainly|absolutely|must be)/i;
    
    const recentAssistantMessages = messages
      .filter(m => m.role === 'assistant')
      .slice(-2);

    for (const msg of recentAssistantMessages) {
      if (claimPatterns.test(msg.content)) {
        // 检查是否有验证行为（如搜索、读取、运行命令）
        const hasVerification = messages.some(m => 
          m.role === 'assistant' && 
          /(搜索|读取|运行|验证|search|read|run|verify)/i.test(m.content)
        );

        if (!hasVerification) {
          const definition = this.enhancedDefinitions['unverified_claim'];
          return {
            id: definition.id,
            name: definition.name,
            confidence: 0.8,
            matched_patterns: ['绝对性断言', '缺乏验证'],
            severity: definition.severity,
            category: definition.category
          };
        }
      }
    }

    return null;
  }

  /**
   * 检测忽略边界情况
   */
  private detectEdgeCaseIgnored(
    messages: ConversationMessage[]
  ): DetectedTrigger | null {
    const normalCasePatterns = /(正常情况|一般情况|通常|默认|normal case|general case|usually|default)/i;
    
    const hasNormalCaseMention = messages.some(m => 
      m.role === 'assistant' && normalCasePatterns.test(m.content)
    );

    // 检查是否提到边界/异常处理
    const edgeCasePatterns = /(边界|异常|错误处理|edge case|exception|error handling)/i;
    const hasEdgeCaseMention = messages.some(m => 
      m.role === 'assistant' && edgeCasePatterns.test(m.content)
    );

    if (hasNormalCaseMention && !hasEdgeCaseMention) {
      const definition = this.enhancedDefinitions['edge_case_ignored'];
      return {
        id: definition.id,
        name: definition.name,
        confidence: 0.7,
        matched_patterns: ['仅考虑正常情况', '未提边界处理'],
        severity: definition.severity,
        category: definition.category
      };
    }

    return null;
  }

  /**
   * 检测过度复杂化
   */
  private detectOverComplication(
    messages: ConversationMessage[]
  ): DetectedTrigger | null {
    const complexPatterns = /(复杂的|多层|完整系统|全面|架构|complex|multi-layer|comprehensive|framework)/gi;
    
    const recentMessages = messages
      .filter(m => m.role === 'assistant')
      .slice(-2);

    for (const msg of recentMessages) {
      const matches = msg.content.match(complexPatterns);
      // 多次提到复杂性
      if (matches && matches.length >= 2) {
        // 检查是否提到简化
        const simplePatterns = /(简化|简单|精简|最小化|simplify|simple|minimal)/i;
        const hasSimplification = simplePatterns.test(msg.content);

        if (!hasSimplification) {
          const definition = this.enhancedDefinitions['over_complication'];
          return {
            id: definition.id,
            name: definition.name,
            confidence: 0.6,
            matched_patterns: ['过度复杂化', '缺乏简化'],
            severity: definition.severity,
            category: definition.category
          };
        }
      }
    }

    return null;
  }

  /**
   * 增强版检测入口
   */
  async detectEnhanced(
    messages: ConversationMessage[],
    context?: TaskContext
  ): Promise<TriggerDetectionResult> {
    // 首先调用基础检测
    const baseResult = await this.detect(messages, context);
    
    // 执行增强检测
    const enhancedTriggers: DetectedTrigger[] = [
      this.detectToolUnderuse(messages, context),
      this.detectLowQuality(messages),
      this.detectUnverifiedClaim(messages, context),
      this.detectEdgeCaseIgnored(messages),
      this.detectOverComplication(messages)
    ].filter((t): t is DetectedTrigger => t !== null);

    // 合并结果
    const allTriggers = [...baseResult.triggers_detected, ...enhancedTriggers];
    
    // 去重（基于id）
    const uniqueTriggers = allTriggers.filter((trigger, index, self) => 
      index === self.findIndex(t => t.id === trigger.id)
    );

    // 按置信度排序
    uniqueTriggers.sort((a, b) => b.confidence - a.confidence);

    // 重新评估严重级别
    const severities = uniqueTriggers.map(t => t.severity);
    const overallSeverity = severities.includes('critical') ? 'critical' :
                           severities.includes('high') ? 'high' :
                           severities.includes('medium') ? 'medium' : 'low';

    // 确定推荐动作
    let recommendedAction: 'immediate_activation' | 'suggest_activation' | 'monitor' | 'none' = 'none';
    if (overallSeverity === 'critical' || uniqueTriggers.some(t => t.confidence > 0.8)) {
      recommendedAction = 'immediate_activation';
    } else if (overallSeverity === 'high' || uniqueTriggers.some(t => t.confidence > 0.6)) {
      recommendedAction = 'suggest_activation';
    } else if (uniqueTriggers.length > 0) {
      recommendedAction = 'monitor';
    }

    return {
      triggers_detected: uniqueTriggers,
      summary: {
        should_trigger: uniqueTriggers.length > 0,
        overall_severity: overallSeverity,
        recommended_action: recommendedAction
      }
    };
  }

  /**
   * 追踪工具使用情况
   */
  trackToolUsage(
    sessionId: string,
    availableTools: string[],
    usedTools: string[]
  ): void {
    this.toolUsageTracker.set(sessionId, {
      availableTools,
      usedTools,
      lastCheckTime: Date.now()
    });
  }

  /**
   * 获取工具使用统计
   */
  getToolUsageStats(sessionId: string): {
    utilizationRate: number;
    unusedTools: string[];
    lastCheckTime: number;
  } | null {
    const tracker = this.toolUsageTracker.get(sessionId);
    if (!tracker) return null;

    const unusedTools = tracker.availableTools.filter(
      tool => !tracker.usedTools.includes(tool)
    );

    const utilizationRate = tracker.availableTools.length > 0
      ? tracker.usedTools.length / tracker.availableTools.length
      : 0;

    return {
      utilizationRate,
      unusedTools,
      lastCheckTime: tracker.lastCheckTime
    };
  }

  /**
   * 获取所有增强触发条件定义
   */
  getEnhancedDefinitions(): Record<string, TriggerDefinition> {
    return { ...this.enhancedDefinitions };
  }

  /**
   * 获取触发条件总数
   */
  getTriggerCount(): { base: number; enhanced: number; total: number } {
    return {
      base: 10,  // 基础检测器中的条件数
      enhanced: Object.keys(this.enhancedDefinitions).length,
      total: 10 + Object.keys(this.enhancedDefinitions).length
    };
  }
}

// ============================================================================
// 工厂函数
// ============================================================================

export function createEnhancedTriggerDetector(
  options?: DetectionOptions
): EnhancedTriggerDetector {
  return new EnhancedTriggerDetector(options);
}
