/**
 * 触发条件加载器
 * 从 YAML 文件动态加载触发条件配置
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import * as YAML from 'yaml';

export interface TriggerPattern {
  zh?: string[];
  en?: string[];
}

export interface TriggerDetection {
  type: 'regex' | 'semantic' | 'counter' | 'composite';
  threshold?: number;
  case_sensitive?: boolean;
  requires_verification?: boolean;
  same_approach_count?: number;
  no_new_info?: boolean;
  available_but_unused?: boolean;
  min_confidence: number;
  requires_context?: boolean;
  context_window_size?: number;
  min_length?: number;
  max_length?: number;
  available_tools_check?: boolean;
  guess_patterns?: TriggerPattern;
  complexity_indicators?: string[];
  pattern_similarity?: number;
  same_approach_threshold?: number;
}

export interface TriggerDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  patterns?: TriggerPattern;
  detection: TriggerDetection;
  recommended_roles: {
    primary: string;
    alternatives: string[];
    reason: string;
  };
}

export interface TriggerCatalog {
  triggers: Record<string, TriggerDefinition>;
}

export class TriggerLoader {
  private triggersDir: string;
  private cache: Map<string, TriggerDefinition> = new Map();
  private lastLoadTime: number = 0;
  private cacheTTL: number = 60000; // 1分钟缓存

  constructor(triggersDir?: string) {
    this.triggersDir = triggersDir || join(process.cwd(), 'data', 'triggers');
  }

  /**
   * 从目录加载所有触发条件
   */
  async loadAllTriggers(): Promise<Record<string, TriggerDefinition>> {
    const now = Date.now();
    
    // 检查缓存是否有效
    if (this.cache.size > 0 && now - this.lastLoadTime < this.cacheTTL) {
      return Object.fromEntries(this.cache);
    }

    const triggers: Record<string, TriggerDefinition> = {};

    try {
      const files = readdirSync(this.triggersDir).filter(f => f.endsWith('.yaml'));
      
      for (const file of files) {
        const filePath = join(this.triggersDir, file);
        const content = readFileSync(filePath, 'utf-8');
        const data = YAML.parse(content) as TriggerCatalog;
        
        if (data.triggers) {
          for (const [key, trigger] of Object.entries(data.triggers)) {
            triggers[key] = trigger;
            this.cache.set(key, trigger);
          }
        }
      }

      this.lastLoadTime = now;
      console.log(`[TriggerLoader] Loaded ${Object.keys(triggers).length} triggers from ${files.length} files`);
      
    } catch (error) {
      console.error('[TriggerLoader] Error loading triggers:', error);
    }

    return triggers;
  }

  /**
   * 获取单个触发条件
   */
  async getTrigger(id: string): Promise<TriggerDefinition | undefined> {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    const allTriggers = await this.loadAllTriggers();
    return allTriggers[id];
  }

  /**
   * 按类别获取触发条件
   */
  async getTriggersByCategory(category: string): Promise<TriggerDefinition[]> {
    const allTriggers = await this.loadAllTriggers();
    return Object.values(allTriggers).filter(t => t.category === category);
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.lastLoadTime = 0;
  }

  /**
   * 热重载（用于开发环境）
   */
  async hotReload(): Promise<Record<string, TriggerDefinition>> {
    this.clearCache();
    return this.loadAllTriggers();
  }

  /**
   * 验证触发条件配置
   */
  validateTrigger(trigger: TriggerDefinition): string[] {
    const errors: string[] = [];

    if (!trigger.id) errors.push('Missing id');
    if (!trigger.name) errors.push('Missing name');
    if (!trigger.description) errors.push('Missing description');
    if (!trigger.category) errors.push('Missing category');
    if (!trigger.severity) errors.push('Missing severity');
    if (!trigger.detection) errors.push('Missing detection');
    if (!trigger.recommended_roles?.primary) errors.push('Missing primary recommended role');

    // 验证严重程度
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (trigger.severity && !validSeverities.includes(trigger.severity)) {
      errors.push(`Invalid severity: ${trigger.severity}`);
    }

    // 验证检测类型
    const validTypes = ['regex', 'semantic', 'counter', 'composite'];
    if (trigger.detection?.type && !validTypes.includes(trigger.detection.type)) {
      errors.push(`Invalid detection type: ${trigger.detection.type}`);
    }

    return errors;
  }

  /**
   * 获取所有类别
   */
  async getCategories(): Promise<string[]> {
    const allTriggers = await this.loadAllTriggers();
    const categories = new Set(Object.values(allTriggers).map(t => t.category));
    return Array.from(categories);
  }

  /**
   * 获取触发条件统计
   */
  async getStats(): Promise<{
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    const allTriggers = await this.loadAllTriggers();
    const triggers = Object.values(allTriggers);

    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const trigger of triggers) {
      byCategory[trigger.category] = (byCategory[trigger.category] || 0) + 1;
      bySeverity[trigger.severity] = (bySeverity[trigger.severity] || 0) + 1;
    }

    return {
      total: triggers.length,
      byCategory,
      bySeverity
    };
  }
}

// 导出单例
export const triggerLoader = new TriggerLoader();
export default triggerLoader;
