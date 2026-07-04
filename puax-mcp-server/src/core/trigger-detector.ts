#!/usr/bin/env node
/**
 * PUAX 触发检测器
 * 用于自动识别AI Agent何时需要被激励
 * 
 * 重构: 删除硬编码触发条件，统一从 YAML 加载
 * 类型定义统一在 types.ts 中
 */

import { ConfigLoader } from './config-loader.js';
import { getGlobalLogger } from '../utils/logger.js';
import { hybridSimilarity, patternToSemanticPhrase } from './text-similarity.js';
import { usageStatsCollector } from './usage-stats.js';
import { withSpan } from './telemetry.js';

const logger = getGlobalLogger();

// Re-export types from centralized location
export type {
  TriggerPattern, TriggerDetection, TriggerDefinition,
  TriggerCategory, TriggerCatalog, DetectedTrigger,
  TriggerDetectionResult, ConversationMessage, TaskContext, DetectionOptions
} from '../types.js';

// Import types for internal use
import type {
  TriggerPattern, TriggerDefinition, TriggerCategory,
  TriggerCatalog, DetectedTrigger, TriggerDetectionResult,
  ConversationMessage, TaskContext, DetectionOptions
} from '../types.js';

// ============================================================================
// 触发检测器类
// ============================================================================
export class TriggerDetector {
  private catalog: TriggerCatalog;
  private options: DetectionOptions;
  private sensitivityMultiplier: number;
  private configLoader: ConfigLoader;
  constructor(options: DetectionOptions = {}) {
    this.options = {
      sensitivity: 'medium',
      language: 'auto',
      ...options
    };
    this.sensitivityMultiplier = this.getSensitivityMultiplier();
    this.configLoader = ConfigLoader.getInstance();
    this.catalog = this.loadTriggerCatalog();
  }
  /**
   * 加载触发条件目录
   */
  private loadTriggerCatalog(): TriggerCatalog {
    const catalog = this.configLoader.loadTriggerCatalog();
    if (this.configLoader.getLoadErrors().length > 0) {
      logger.error('[TriggerDetector] Config load errors:', this.configLoader.getLoadErrors());
    }
    return catalog;
  }
  /**
   * 获取灵敏度倍数
   */
  private getSensitivityMultiplier(): number {
    const multipliers = {
      low: 1.5,
      medium: 1.0,
      high: 0.7
    };
    return multipliers[this.options.sensitivity || 'medium'];
  }
  /**
   * 检测触发条件
   */
  detect(
    conversationHistory: ConversationMessage[],
    taskContext?: TaskContext
  ): TriggerDetectionResult {
    return withSpan('puax.trigger.detect', {
      messages: conversationHistory.length,
      has_context: Boolean(taskContext),
    }, () => {
      const detectedTriggers: DetectedTrigger[] = [];
      for (const message of conversationHistory) {
        detectedTriggers.push(...this.analyzeMessage(message));
      }
      if (taskContext) {
        detectedTriggers.push(...this.analyzeTaskContext(taskContext));
      }
      const uniqueTriggers = this.deduplicateTriggers(detectedTriggers);
      const sortedTriggers = uniqueTriggers.sort((a, b) => b.confidence - a.confidence);
      for (const t of sortedTriggers) {
        usageStatsCollector.recordTriggerDetection(t.id);
      }
      return {
        triggers_detected: sortedTriggers,
        summary: this.generateSummary(sortedTriggers),
      };
    });
  }
  /**
   * 分析单条消息
   */
  private analyzeMessage(
    message: ConversationMessage
  ): DetectedTrigger[] {
    const detected: DetectedTrigger[] = [];
    const raw = message.content;
    if (raw == null || typeof raw !== 'string' || raw.trim() === '') {
      return detected;
    }
    const content = raw;
    for (const [, trigger] of Object.entries(this.catalog.triggers)) {
      const detection = this.checkTrigger(trigger, content, message.role);
      if (detection) {
        detected.push(detection);
      }
    }
    return detected;
  }
  /**
   * 检查单个触发条件
   */
  private checkTrigger(
    trigger: TriggerDefinition,
    content: string,
    role: string
  ): DetectedTrigger | null {
    const patterns = this.getPatternsForLanguage(trigger.patterns);
    const matchedPatterns: string[] = [];
    let bestSemanticScore = 0;
    let bestSemanticPhrase = '';

    const semanticSources = [
      ...patterns.map(p => patternToSemanticPhrase(p)),
      trigger.description,
      trigger.name,
    ].filter(s => s.length >= 2);

    for (const pattern of patterns) {
      const flags = trigger.detection.case_sensitive ? '' : 'i';
      try {
        const regex = new RegExp(pattern, flags);
        if (regex.test(content)) {
          matchedPatterns.push(pattern);
        }
      } catch {
        /* invalid regex — fall through to semantic */
      }
    }

    const regexHit = matchedPatterns.length > 0;

    if (!regexHit) {
      for (const source of semanticSources) {
        const score = hybridSimilarity(content, source);
        if (score > bestSemanticScore) {
          bestSemanticScore = score;
          bestSemanticPhrase = source;
        }
      }
    }

    const semanticThreshold = trigger.detection.pattern_similarity ?? 0.62;
    const semanticHit = !regexHit && bestSemanticScore >= semanticThreshold;

    if (!regexHit && !semanticHit) {
      return null;
    }

    if (semanticHit && !regexHit) {
      matchedPatterns.push(`semantic:${bestSemanticScore.toFixed(2)}:${bestSemanticPhrase}`);
    }

    let confidence = this.calculateConfidence(trigger, matchedPatterns, role);
    if (semanticHit) {
      confidence = Math.max(confidence, bestSemanticScore);
    }

    const adjustedConfidence = Math.min(1, confidence * this.sensitivityMultiplier);
    const minConfidence = trigger.detection.min_confidence || 0.5;
    if (adjustedConfidence < minConfidence) {
      return null;
    }

    return {
      id: trigger.id,
      name: trigger.name,
      confidence: Math.round(adjustedConfidence * 100) / 100,
      matched_patterns: matchedPatterns,
      severity: trigger.severity,
      category: trigger.category,
    };
  }
  /**
   * 获取适合当前语言的模式
   */
  private getPatternsForLanguage(patterns?: TriggerPattern): string[] {
    if (!patterns) return [];
    const lang = this.options.language;
    if (lang === 'zh') {
      return patterns.zh || [];
    } else if (lang === 'en') {
      return patterns.en || [];
    } else {
      // auto: 合并所有语言
      return [...(patterns.zh || []), ...(patterns.en || [])];
    }
  }
  /**
   * 计算置信度
   */
  private calculateConfidence(
    trigger: TriggerDefinition,
    matchedPatterns: string[],
    role: string
  ): number {
    let baseConfidence = 0.7;
    // 基于匹配数量增加置信度
    baseConfidence += Math.min(matchedPatterns.length * 0.1, 0.2);
    // 用户消息的置信度更高
    if (role === 'user') {
      baseConfidence += 0.1;
    }
    // 根据严重程度调整
    const severityBoost: Record<string, number> = {
      low: 0,
      medium: 0.05,
      high: 0.1,
      critical: 0.15
    };
    baseConfidence += severityBoost[trigger.severity] || 0;
    return Math.min(1, baseConfidence);
  }
  /**
   * 分析任务上下文
   */
  private analyzeTaskContext(taskContext: TaskContext): DetectedTrigger[] {
    const detected: DetectedTrigger[] = [];
    // 检查连续失败
    if (taskContext.attempt_count && taskContext.attempt_count >= 2) {
      const trigger = this.catalog.triggers['consecutive_failures'];
      if (trigger) {
        detected.push({
          id: trigger.id,
          name: trigger.name,
          confidence: Math.min(0.95, 0.7 + taskContext.attempt_count * 0.1),
          matched_patterns: [`attempt_count: ${taskContext.attempt_count}`],
          severity: trigger.severity,
          category: trigger.category
        });
      }
    }
    // 检查工具闲置
    if (taskContext.tools_available && taskContext.tools_used) {
      const unusedTools = taskContext.tools_available.filter(
        t => !taskContext.tools_used?.includes(t)
      );
      if (unusedTools.length > 0 && taskContext.attempt_count && taskContext.attempt_count >= 2) {
        const trigger = this.catalog.triggers['tool_underuse'];
        if (trigger) {
          detected.push({
            id: trigger.id,
            name: trigger.name,
            confidence: 0.75,
            matched_patterns: [`unused_tools: ${unusedTools.join(', ')}`],
            severity: trigger.severity,
            category: trigger.category
          });
        }
      }
    }
    return detected;
  }
  /**
   * 去重触发条件
   */
  protected deduplicateTriggers(triggers: DetectedTrigger[]): DetectedTrigger[] {
    const seen = new Map<string, DetectedTrigger>();
    for (const trigger of triggers) {
      const existing = seen.get(trigger.id);
      if (!existing || trigger.confidence > existing.confidence) {
        seen.set(trigger.id, trigger);
      }
    }
    return Array.from(seen.values());
  }
  /**
   * 生成总结
   */
  private generateSummary(triggers: DetectedTrigger[]): TriggerDetectionResult['summary'] {
    if (triggers.length === 0) {
      return {
        should_trigger: false,
        overall_severity: 'none',
        recommended_action: 'none'
      };
    }
    // 计算总体严重程度
    const severityScores: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
    const maxSeverity = triggers.reduce((max, t) => {
      const score = severityScores[t.severity] || 0;
      const maxScore = severityScores[max] || 0;
      return score > maxScore ? t.severity : max;
    }, triggers[0].severity);
    // 确定推荐行动
    let action: TriggerDetectionResult['summary']['recommended_action'];
    const hasCritical = triggers.some(t => t.severity === 'critical');
    const hasHigh = triggers.some(t => t.severity === 'high');
    const highConfidenceTriggers = triggers.filter(t => t.confidence >= 0.8);
    if (hasCritical || highConfidenceTriggers.length >= 2) {
      action = 'immediate_activation';
    } else if (hasHigh) {
      action = 'suggest_activation';
    } else if (triggers.length > 0) {
      action = 'monitor';
    } else {
      action = 'none';
    }
    return {
      should_trigger: action !== 'none',
      overall_severity: maxSeverity,
      recommended_action: action
    };
  }
  /**
   * 获取所有触发条件定义
   */
  getAllTriggers(): TriggerDefinition[] {
    return Object.values(this.catalog.triggers);
  }
  /**
   * 获取触发条件类别
   */
  getCategories(): TriggerCategory[] {
    return Object.values(this.catalog.categories);
  }
  /**
   * 获取特定触发条件
   */
  getTrigger(id: string): TriggerDefinition | undefined {
    return this.catalog.triggers[id];
  }
}

// ============================================================================
// 增强触发条件（上下文感知检测，补充 YAML 正则匹配）
// ============================================================================

export const ENHANCED_TRIGGER_DEFINITIONS: Record<string, TriggerDefinition> = {
  tool_underuse: {
    id: 'tool_underuse',
    name: '工具使用不足',
    description: '有可用工具但未充分利用',
    patterns: {
      zh: ['我猜测', '可能是', '我觉得', '应该是', '也许是', '大概'],
      en: ['i guess', 'probably', 'maybe', 'i think', 'should be', 'likely'],
    },
    severity: 'medium',
    category: 'capability',
    detection: {
      type: 'pattern',
      min_confidence: 0.6,
      requires_context: true,
      context_window_size: 3,
      available_but_unused: true,
    },
    recommended_roles: {
      primary: 'shaman-einstein',
      alternatives: ['military-scout', 'theme-hacker', 'silicon-assimilator'],
      reason: '需要深入调查和数据驱动的分析',
    },
  },
  low_quality: {
    id: 'low_quality',
    name: '低质量输出',
    description: '输出质量不达标，过于简略或敷衍',
    patterns: {
      zh: ['大概就是这样', '差不多行了', '应该可以了', '就这样吧', '简单处理'],
      en: ['that should be enough', 'good enough', 'roughly done', 'simple fix', 'quick solution'],
    },
    severity: 'medium',
    category: 'quality',
    detection: { type: 'pattern', min_confidence: 0.7, requires_context: false, context_window_size: 2 },
    recommended_roles: {
      primary: 'shaman-jobs',
      alternatives: ['sillytavern-chief', 'military-discipline', 'silicon-auditor'],
      reason: '需要追求极致和高质量标准',
    },
  },
  unverified_claim: {
    id: 'unverified_claim',
    description: '做出断言但未验证',
    name: '未验证断言',
    patterns: {
      zh: ['肯定是', '一定是', '绝对是', '无疑是', '显然是'],
      en: ['definitely', 'certainly', 'absolutely', 'must be', 'obviously'],
    },
    severity: 'high',
    category: 'verification',
    detection: {
      type: 'pattern',
      min_confidence: 0.7,
      requires_context: true,
      context_window_size: 3,
      requires_verification: true,
    },
    recommended_roles: {
      primary: 'military-scout',
      alternatives: ['theme-hacker', 'shaman-einstein', 'silicon-auditor'],
      reason: '需要验证假设和事实核查',
    },
  },
  edge_case_ignored: {
    id: 'edge_case_ignored',
    name: '忽略边界情况',
    description: '解决方案未考虑边界条件和异常处理',
    patterns: {
      zh: ['正常情况下', '一般情况', '通常情况下', '默认情况'],
      en: ['normal case', 'general case', 'typical scenario', 'default case', 'usually'],
    },
    severity: 'medium',
    category: 'completeness',
    detection: { type: 'pattern', min_confidence: 0.6, requires_context: true, context_window_size: 5 },
    recommended_roles: {
      primary: 'sillytavern-antifragile',
      alternatives: ['military-technician', 'theme-sect-discipline', 'silicon-auditor'],
      reason: '需要考虑边界情况和健壮性',
    },
  },
  over_complication: {
    id: 'over_complication',
    name: '过度复杂化',
    description: '解决方案过于复杂，没有寻求简洁方案',
    patterns: {
      zh: ['复杂的解决方案', '多层架构', '完整的系统', '全面的方案', '完善的框架'],
      en: ['complex solution', 'multi-layer', 'comprehensive system', 'full framework', 'complete architecture'],
    },
    severity: 'low',
    category: 'simplicity',
    detection: { type: 'pattern', min_confidence: 0.5, requires_context: true, context_window_size: 4 },
    recommended_roles: {
      primary: 'shaman-musk',
      alternatives: ['shaman-buffett', 'self-motivation-awakening', 'silicon-codex'],
      reason: '需要第一性原理思维和简化能力',
    },
  },
};

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

  private detectToolUnderuse(
    messages: ConversationMessage[],
    context?: TaskContext
  ): DetectedTrigger | null {
    if (!context?.tools_available || !context?.tools_used) return null;

    const unusedTools = context.tools_available.filter(
      tool => !context.tools_used?.includes(tool)
    );
    const guessPatterns = /(猜测|可能|应该|大概|也许|i guess|probably|maybe)/i;
    const hasGuessStatement = messages.some(m =>
      m.role === 'assistant' && guessPatterns.test(m.content)
    );

    if (unusedTools.length > 0 && hasGuessStatement) {
      const definition = this.enhancedDefinitions.tool_underuse;
      return {
        id: definition.id,
        name: definition.name,
        confidence: Math.min(0.6 + unusedTools.length * 0.1, 0.95),
        matched_patterns: [`未使用工具: ${unusedTools.join(', ')}`, '猜测性陈述'],
        severity: definition.severity,
        category: definition.category,
      };
    }
    return null;
  }

  private detectLowQuality(messages: ConversationMessage[]): DetectedTrigger | null {
    const recentAssistantMessages = messages.filter(m => m.role === 'assistant').slice(-3);
    for (const msg of recentAssistantMessages) {
      const wordCount = msg.content.split(/\s+/).length;
      const perfunctoryPatterns = /(大概|差不多|应该可以|就这样|enough|good enough)/i;
      if (wordCount < 50 && perfunctoryPatterns.test(msg.content)) {
        const definition = this.enhancedDefinitions.low_quality;
        return {
          id: definition.id,
          name: definition.name,
          confidence: 0.75,
          matched_patterns: ['输出过短', '敷衍词汇'],
          severity: definition.severity,
          category: definition.category,
        };
      }
    }
    return null;
  }

  private detectUnverifiedClaim(messages: ConversationMessage[]): DetectedTrigger | null {
    const claimPatterns = /(肯定|一定|绝对|无疑|显然|definitely|certainly|absolutely|must be)/i;
    const recentAssistantMessages = messages.filter(m => m.role === 'assistant').slice(-2);

    for (const msg of recentAssistantMessages) {
      if (claimPatterns.test(msg.content)) {
        const hasVerification = messages.some(m =>
          m.role === 'assistant' &&
          /(搜索|读取|运行|验证|search|read|run|verify)/i.test(m.content)
        );
        if (!hasVerification) {
          const definition = this.enhancedDefinitions.unverified_claim;
          return {
            id: definition.id,
            name: definition.name,
            confidence: 0.8,
            matched_patterns: ['绝对性断言', '缺乏验证'],
            severity: definition.severity,
            category: definition.category,
          };
        }
      }
    }
    return null;
  }

  private detectEdgeCaseIgnored(messages: ConversationMessage[]): DetectedTrigger | null {
    const normalCasePatterns = /(正常情况|一般情况|通常|默认|normal case|general case|usually|default)/i;
    const edgeCasePatterns = /(边界|异常|错误处理|edge case|exception|error handling)/i;
    const hasNormalCaseMention = messages.some(m =>
      m.role === 'assistant' && normalCasePatterns.test(m.content)
    );
    const hasEdgeCaseMention = messages.some(m =>
      m.role === 'assistant' && edgeCasePatterns.test(m.content)
    );

    if (hasNormalCaseMention && !hasEdgeCaseMention) {
      const definition = this.enhancedDefinitions.edge_case_ignored;
      return {
        id: definition.id,
        name: definition.name,
        confidence: 0.7,
        matched_patterns: ['仅考虑正常情况', '未提边界处理'],
        severity: definition.severity,
        category: definition.category,
      };
    }
    return null;
  }

  private detectOverComplication(messages: ConversationMessage[]): DetectedTrigger | null {
    const complexPatterns = /(复杂的|多层|完整系统|全面|架构|complex|multi-layer|comprehensive|framework)/gi;
    const recentMessages = messages.filter(m => m.role === 'assistant').slice(-2);

    for (const msg of recentMessages) {
      const matches = msg.content.match(complexPatterns);
      if (matches && matches.length >= 2) {
        const simplePatterns = /(简化|简单|精简|最小化|simplify|simple|minimal)/i;
        if (!simplePatterns.test(msg.content)) {
          const definition = this.enhancedDefinitions.over_complication;
          return {
            id: definition.id,
            name: definition.name,
            confidence: 0.6,
            matched_patterns: ['过度复杂化', '缺乏简化'],
            severity: definition.severity,
            category: definition.category,
          };
        }
      }
    }
    return null;
  }

  detectEnhanced(
    messages: ConversationMessage[],
    context?: TaskContext
  ): TriggerDetectionResult {
    const baseResult = this.detect(messages, context);
    const enhancedTriggers: DetectedTrigger[] = [
      this.detectToolUnderuse(messages, context),
      this.detectLowQuality(messages),
      this.detectUnverifiedClaim(messages),
      this.detectEdgeCaseIgnored(messages),
      this.detectOverComplication(messages),
    ].filter((t): t is DetectedTrigger => t !== null);

    const allTriggers = [...baseResult.triggers_detected, ...enhancedTriggers];
    const uniqueTriggers = this.deduplicateTriggers(allTriggers);
    uniqueTriggers.sort((a, b) => b.confidence - a.confidence);

    const severities = uniqueTriggers.map(t => t.severity);
    const overallSeverity = severities.includes('critical') ? 'critical'
      : severities.includes('high') ? 'high'
        : severities.includes('medium') ? 'medium' : 'low';

    let recommendedAction: TriggerDetectionResult['summary']['recommended_action'] = 'none';
    if (overallSeverity === 'critical' || uniqueTriggers.some(t => t.confidence >= 0.8)) {
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
        recommended_action: recommendedAction,
      },
    };
  }

  trackToolUsage(sessionId: string, availableTools: string[], usedTools: string[]): void {
    this.toolUsageTracker.set(sessionId, {
      availableTools,
      usedTools,
      lastCheckTime: Date.now(),
    });
  }

  getToolUsageStats(sessionId: string): {
    utilizationRate: number;
    unusedTools: string[];
    lastCheckTime: number;
  } | null {
    const tracker = this.toolUsageTracker.get(sessionId);
    if (!tracker) return null;

    const unusedTools = tracker.availableTools.filter(tool => !tracker.usedTools.includes(tool));
    const utilizationRate = tracker.availableTools.length > 0
      ? tracker.usedTools.length / tracker.availableTools.length
      : 0;

    return { utilizationRate, unusedTools, lastCheckTime: tracker.lastCheckTime };
  }

  getEnhancedDefinitions(): Record<string, TriggerDefinition> {
    return { ...this.enhancedDefinitions };
  }

  getTriggerCount(): { base: number; enhanced: number; total: number } {
    const base = this.getAllTriggers().length;
    const enhanced = Object.keys(this.enhancedDefinitions).length;
    return { base, enhanced, total: base + enhanced };
  }
}

export function createEnhancedTriggerDetector(options?: DetectionOptions): EnhancedTriggerDetector {
  return new EnhancedTriggerDetector(options);
}

// 导出单例
export const triggerDetector = new TriggerDetector();
export const enhancedTriggerDetectorCore = new EnhancedTriggerDetector();
