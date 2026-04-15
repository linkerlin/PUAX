/**
 * 触发条件加载器
 * 从 YAML 文件动态加载触发条件配置
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import * as YAML from 'yaml';
import { getGlobalLogger } from '../utils/logger.js';

const logger = getGlobalLogger();

// Re-export types from centralized location
export type {
  TriggerPattern, TriggerDetection, TriggerDefinition, TriggerCatalog
} from '../types.js';

// Import types for internal use
import type { TriggerPattern, TriggerDefinition, TriggerCatalog } from '../types.js';

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
  loadAllTriggers(): Record<string, TriggerDefinition> {
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
      logger.info(`[TriggerLoader] Loaded ${Object.keys(triggers).length} triggers from ${files.length} files`);
      
    } catch (error) {
      logger.error('[TriggerLoader] Error loading triggers:', error);
    }

    return triggers;
  }

  /**
   * 获取单个触发条件
   */
  getTrigger(id: string): Promise<TriggerDefinition | undefined> {
    if (this.cache.has(id)) {
      return Promise.resolve(this.cache.get(id));
    }

    const allTriggers = this.loadAllTriggers();
    return Promise.resolve(allTriggers[id]);
  }

  /**
   * 按类别获取触发条件
   */
  getTriggersByCategory(category: string): Promise<TriggerDefinition[]> {
    const allTriggers = this.loadAllTriggers();
    return Promise.resolve(Object.values(allTriggers).filter(t => t.category === category));
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
  hotReload(): Promise<Record<string, TriggerDefinition>> {
    this.clearCache();
    return Promise.resolve(this.loadAllTriggers());
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
  getCategories(): Promise<string[]> {
    const allTriggers = this.loadAllTriggers();
    const categories = new Set(Object.values(allTriggers).map(t => t.category));
    return Promise.resolve(Array.from(categories));
  }

  /**
   * 获取触发条件统计
   */
  getStats(): Promise<{
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    const allTriggers = this.loadAllTriggers();
    const triggers = Object.values(allTriggers);

    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const trigger of triggers) {
      byCategory[trigger.category] = (byCategory[trigger.category] || 0) + 1;
      bySeverity[trigger.severity] = (bySeverity[trigger.severity] || 0) + 1;
    }

    return Promise.resolve({
      total: triggers.length,
      byCategory,
      bySeverity
    });
  }
}

// 导出单例
export const triggerLoader = new TriggerLoader();
export default triggerLoader;
