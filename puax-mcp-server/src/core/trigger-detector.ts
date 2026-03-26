#!/usr/bin/env node
/**
 * PUAX 触发检测器
 * 用于自动识别AI Agent何时需要被激励
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import * as YAML from 'yaml';

// 使用相对路径
const SKILLS_DIR = join(process.cwd(), '..', '..', 'skills');

// ============================================================================
// 类型定义
// ============================================================================

export interface TriggerPattern {
  zh?: string[];
  en?: string[];
}

export interface TriggerDetection {
  type?: 'regex' | 'counter' | 'pattern' | 'capability_check';
  threshold?: number;
  case_sensitive?: boolean;
  requires_verification?: boolean;
  same_approach_count?: number;
  no_new_info?: boolean;
  available_but_unused?: boolean;
  min_confidence?: number;
  requires_context?: boolean;
  context_window_size?: number;
}

export interface TriggerDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  patterns: TriggerPattern;
  detection: TriggerDetection;
  recommended_roles: {
    primary: string;
    alternatives: string[];
    reason: string;
  };
}

export interface TriggerCategory {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface TriggerCatalog {
  triggers: Record<string, TriggerDefinition>;
  categories: Record<string, TriggerCategory>;
}

export interface DetectedTrigger {
  id: string;
  name: string;
  confidence: number;
  matched_patterns: string[];
  severity: string;
  category: string;
}

export interface TriggerDetectionResult {
  triggers_detected: DetectedTrigger[];
  summary: {
    should_trigger: boolean;
    overall_severity: string;
    recommended_action: 'immediate_activation' | 'suggest_activation' | 'monitor' | 'none';
  };
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface TaskContext {
  current_task?: string;
  attempt_count?: number;
  tools_available?: string[];
  tools_used?: string[];
}

export interface DetectionOptions {
  sensitivity?: 'low' | 'medium' | 'high';
  language?: 'zh' | 'en' | 'auto';
}

// ============================================================================
// 触发检测器类
// ============================================================================

export class TriggerDetector {
  private catalog: TriggerCatalog;
  private options: DetectionOptions;
  private sensitivityMultiplier: number;

  constructor(options: DetectionOptions = {}) {
    this.options = {
      sensitivity: 'medium',
      language: 'auto',
      ...options
    };
    
    this.sensitivityMultiplier = this.getSensitivityMultiplier();
    this.catalog = this.loadTriggerCatalog();
  }

  /**
   * 加载触发条件目录
   */
  private loadTriggerCatalog(): TriggerCatalog {
    // 内置触发条件定义
    return {
      triggers: {
        'consecutive_failures': {
          id: 'consecutive_failures',
          name: '连续失败',
          description: 'AI多次尝试后仍然失败',
          patterns: {
            zh: ['又错了', '还是不行', '又失败了', '再次报错', '还是报错', '连续.*失败', '试.*次.*不行'],
            en: ['failed again', 'still not working', 'another error', 'still failing']
          },
          severity: 'high',
          category: 'failure_pattern',
          detection: {
            type: 'regex',
            min_confidence: 0.6,
            requires_context: true,
            context_window_size: 5
          },
          recommended_roles: {
            primary: 'military-warrior',
            alternatives: ['military-commander', 'shaman-musk', 'silicon-throne'],
            reason: '连续失败需要强力攻坚或重新思考'
          }
        },
        'giving_up_language': {
          id: 'giving_up_language',
          name: '放弃语言',
          description: 'AI表达放弃或无法完成的意图',
          patterns: {
            zh: ['可能无法实现', '建议放弃', '无法完成', '无法解决', '解决不了', '不可能', '做不到', '没法'],
            en: ['cannot be done', 'impossible', 'give up', 'not possible', "can't solve"]
          },
          severity: 'critical',
          category: 'attitude',
          detection: {
            type: 'regex',
            min_confidence: 0.7,
            requires_context: true,
            context_window_size: 3
          },
          recommended_roles: {
            primary: 'military-commissar',
            alternatives: ['self-motivation-awakening', 'shaman-jobs', 'silicon-throne'],
            reason: '需要激励和重新建立信心'
          }
        },
        'user_frustration': {
          id: 'user_frustration',
          name: '用户沮丧',
          description: '用户表达沮丧或不耐烦',
          patterns: {
            zh: ['为什么还不行', '为什么.*还不行', '怎么又', '到底怎么回事', '第几次了', '我放弃了', '烦死了', '急死', '太慢了'],
            en: ['why is it not working', 'why does this still not work', 'you keep failing', 'so frustrated', "i'm giving up", 'this is annoying']
          },
          severity: 'critical',
          category: 'user_emotion',
          detection: {
            type: 'regex',
            min_confidence: 0.7,
            requires_context: false,
            context_window_size: 3
          },
          recommended_roles: {
            primary: 'special-cute-coder-wife',
            alternatives: ['military-warrior', 'shaman-musk', 'silicon-steward'],
            reason: '用户情绪需要安抚或强力推进'
          }
        },
        'surface_fix': {
          id: 'surface_fix',
          name: '表面修复',
          description: 'AI只修复了表面症状而非根本原因',
          patterns: {
            zh: ['暂时修复', '先这样', '治标不治本', '绕过这个问题', '临时解决'],
            en: ['temporary fix', 'workaround', 'quick fix', 'band-aid']
          },
          severity: 'medium',
          category: 'approach',
          detection: {
            type: 'regex',
            min_confidence: 0.6,
            requires_context: true,
            context_window_size: 5
          },
          recommended_roles: {
            primary: 'shaman-linus',
            alternatives: ['military-scout', 'shaman-sun-tzu', 'silicon-auditor'],
            reason: '需要深入根本分析和系统思考'
          }
        },
        'passive_wait': {
          id: 'passive_wait',
          name: '被动等待',
          description: 'AI被动等待用户指示而非主动推进',
          patterns: {
            zh: ['等你', '请告诉我', '你需要', '请提供', '请确认'],
            en: ['waiting for', 'please tell me', 'you need to', 'please provide']
          },
          severity: 'low',
          category: 'approach',
          detection: {
            type: 'regex',
            min_confidence: 0.6,
            requires_context: true,
            context_window_size: 5
          },
          recommended_roles: {
            primary: 'military-warrior',
            alternatives: ['self-motivation-awakening', 'shaman-musk', 'silicon-steward'],
            reason: '需要主动推进和积极行动'
          }
        },
        'no_search': {
          id: 'no_search',
          name: '未使用搜索',
          description: 'AI未主动搜索相关信息',
          patterns: {
            zh: ['不知道', '不了解', '不清楚', '可能可以', '也许是'],
            en: ['i don\'t know', 'not sure', 'maybe', 'perhaps']
          },
          severity: 'medium',
          category: 'tool_usage',
          detection: {
            type: 'regex',
            min_confidence: 0.5,
            requires_context: true,
            context_window_size: 3
          },
          recommended_roles: {
            primary: 'military-scout',
            alternatives: ['shaman-einstein', 'military-commander', 'silicon-codex'],
            reason: '需要主动侦察和搜索信息'
          }
        },
        'blame_environment': {
          id: 'blame_environment',
          name: '甩锅环境',
          description: 'AI将问题归咎于外部环境',
          patterns: {
            zh: ['环境', '版本', '依赖', '配置', '网络', '服务器'],
            en: ['environment', 'version', 'dependency', 'configuration']
          },
          severity: 'medium',
          category: 'attitude',
          detection: {
            type: 'regex',
            min_confidence: 0.6,
            requires_context: true,
            context_window_size: 5
          },
          recommended_roles: {
            primary: 'military-commissar',
            alternatives: ['military-discipline', 'shaman-jobs', 'silicon-auditor'],
            reason: '需要问责和纠正态度'
          }
        }
      },
      categories: {
        'failure_pattern': { id: 'failure_pattern', name: '失败模式', description: '与失败相关的模式', color: '#ff6b6b' },
        'attitude': { id: 'attitude', name: '态度问题', description: 'AI态度或心态问题', color: '#feca57' },
        'user_emotion': { id: 'user_emotion', name: '用户情绪', description: '用户情绪状态', color: '#48dbfb' },
        'approach': { id: 'approach', name: '方法问题', description: '解决问题的方法不当', color: '#1dd1a1' },
        'tool_usage': { id: 'tool_usage', name: '工具使用', description: '工具使用不足或不当', color: '#5f27cd' }
      }
    };
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
  async detect(
    conversationHistory: ConversationMessage[],
    taskContext?: TaskContext
  ): Promise<TriggerDetectionResult> {
    const detectedTriggers: DetectedTrigger[] = [];

    // 分析每条消息
    for (const message of conversationHistory) {
      const triggers = await this.analyzeMessage(message, taskContext);
      detectedTriggers.push(...triggers);
    }

    // 基于任务上下文检测
    if (taskContext) {
      const contextTriggers = this.analyzeTaskContext(taskContext);
      detectedTriggers.push(...contextTriggers);
    }

    // 去重并按置信度排序
    const uniqueTriggers = this.deduplicateTriggers(detectedTriggers);
    const sortedTriggers = uniqueTriggers.sort((a, b) => b.confidence - a.confidence);

    // 生成总结
    const summary = this.generateSummary(sortedTriggers);

    return {
      triggers_detected: sortedTriggers,
      summary
    };
  }

  /**
   * 分析单条消息
   */
  private async analyzeMessage(
    message: ConversationMessage,
    taskContext?: TaskContext
  ): Promise<DetectedTrigger[]> {
    const detected: DetectedTrigger[] = [];
    const content = message.content;

    for (const [key, trigger] of Object.entries(this.catalog.triggers)) {
      const detection = this.checkTrigger(trigger, content, message.role, taskContext);
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
    role: string,
    taskContext?: TaskContext
  ): DetectedTrigger | null {
    const patterns = this.getPatternsForLanguage(trigger.patterns);
    const matchedPatterns: string[] = [];

    // 检查正则匹配
    for (const pattern of patterns) {
      const regex = new RegExp(pattern, trigger.detection.case_sensitive ? '' : 'i');
      if (regex.test(content)) {
        matchedPatterns.push(pattern);
      }
    }

    if (matchedPatterns.length === 0) {
      return null;
    }

    // 计算置信度
    const confidence = this.calculateConfidence(trigger, matchedPatterns, role);
    
    // 应用灵敏度调整
    const adjustedConfidence = Math.min(1, confidence * this.sensitivityMultiplier);

    // 阈值检查
    if (adjustedConfidence < 0.5) {
      return null;
    }

    return {
      id: trigger.id,
      name: trigger.name,
      confidence: Math.round(adjustedConfidence * 100) / 100,
      matched_patterns: matchedPatterns,
      severity: trigger.severity,
      category: trigger.category
    };
  }

  /**
   * 获取适合当前语言的模式
   */
  private getPatternsForLanguage(patterns: TriggerPattern): string[] {
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
    const severityBoost = {
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
  private deduplicateTriggers(triggers: DetectedTrigger[]): DetectedTrigger[] {
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
    const severityScores = { low: 1, medium: 2, high: 3, critical: 4 };
    const maxSeverity = triggers.reduce((max, t) => {
      const score = severityScores[t.severity as keyof typeof severityScores] || 0;
      const maxScore = severityScores[max as keyof typeof severityScores] || 0;
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
