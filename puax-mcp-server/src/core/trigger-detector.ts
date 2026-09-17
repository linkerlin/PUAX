#!/usr/bin/env node
/**
 * PUAX 会话级触发检测器（触发引擎之一）
 *
 * 双引擎架构（v4.3 起明确分工，勿在此再行混体）：
 * - 本文件 TriggerDetector：会话史批量扫描。YAML 目录（data/triggers*.yaml，
 *   经 ConfigLoader）+ 正则/语义混合匹配，无状态。消费方为 detect_trigger
 *   与 activate_with_context 两个 MCP 工具（经 service-registry）。
 * - trigger-detector-enhanced.ts EnhancedTriggerDetector：事件级实时检测。
 *   按 Hook 事件逐拍路由，状态机（失败计数/冷却/压力系统）+ 角色推荐 +
 *   注入提示。消费方为 evolve-cycle（v4 心跳热路径）、hook-cli 与两个工具。
 * - deterministic-triggers.ts DeterministicTriggersEngine：PreToolUse 拦截决策。
 *
 * 历史：本文件曾内嵌一个继承式 EnhancedTriggerDetector（上下文感知五检测器）
 * 与 ENHANCED_TRIGGER_DEFINITIONS，v4.4 前经查系零消费死代码（唯一引用为
 * 其孤儿单测），已整体剟除；四类触发语义（low_quality 等）如需复活应落入
 * YAML 目录而非代码硬编。
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

// 导出单例
export const triggerDetector = new TriggerDetector();
