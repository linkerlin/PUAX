/**
 * PUAX 配置加载器
 * 统一从 YAML 文件加载触发条件、角色映射等配置
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as YAML from 'yaml';

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
  window?: string;
  no_verification?: boolean;
  no_followup?: boolean;
  same_command_threshold?: number;
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

interface RawTriggerDefinition {
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

interface RawTriggerYaml {
  version: string;
  triggers: Record<string, RawTriggerDefinition>;
  categories: Record<string, TriggerCategory>;
}

// ============================================================================
// 配置加载器类
// ============================================================================

export class ConfigLoader {
  private static instance: ConfigLoader;
  private dataDir: string;
  private triggerCatalog: TriggerCatalog | null = null;
  private loadErrors: string[] = [];

  private constructor() {
    this.dataDir = join(__dirname, '..', 'data');
  }

  static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ConfigLoader.instance = null as unknown as ConfigLoader;
  }

  /**
   * 设置数据目录（用于测试）
   */
  setDataDir(dir: string): void {
    this.dataDir = dir;
    this.triggerCatalog = null;
    this.loadErrors = [];
  }

  /**
   * 获取加载错误
   */
  getLoadErrors(): string[] {
    return [...this.loadErrors];
  }

  /**
   * 加载触发条件目录
   */
  loadTriggerCatalog(): TriggerCatalog {
    if (this.triggerCatalog) {
      return this.triggerCatalog;
    }

    const triggersPath = join(this.dataDir, 'triggers.yaml');

    if (!existsSync(triggersPath)) {
      this.loadErrors.push(`Triggers file not found: ${triggersPath}`);
      return this.getDefaultTriggerCatalog();
    }

    try {
      const content = readFileSync(triggersPath, 'utf-8');
      const parsed = YAML.parse(content) as RawTriggerYaml;

      if (!parsed.triggers || !parsed.categories) {
        this.loadErrors.push('Invalid triggers.yaml: missing triggers or categories');
        return this.getDefaultTriggerCatalog();
      }

      this.triggerCatalog = {
        triggers: parsed.triggers,
        categories: parsed.categories
      };

      return this.triggerCatalog;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.loadErrors.push(`Failed to load triggers.yaml: ${errorMsg}`);
      return this.getDefaultTriggerCatalog();
    }
  }

  /**
   * 获取默认触发条件目录（作为兜底）
   */
  private getDefaultTriggerCatalog(): TriggerCatalog {
    return {
      triggers: {
        'consecutive_failures': {
          id: 'consecutive_failures',
          name: '连续失败',
          description: '任务连续失败多次',
          category: 'failure',
          severity: 'high',
          patterns: {
            zh: ['连续.*失败', '多次失败'],
            en: ['failed.*times', 'consecutive failures']
          },
          detection: { type: 'counter', threshold: 2 },
          recommended_roles: {
            primary: 'military-commissar',
            alternatives: ['shaman-musk'],
            reason: '需要强力激励'
          }
        }
      },
      categories: {
        'failure': {
          id: 'failure',
          name: '失败模式',
          description: '与失败相关的模式',
          color: '#ef4444'
        }
      }
    };
  }

  /**
   * 重新加载配置（用于热更新）
   */
  reload(): TriggerCatalog {
    this.triggerCatalog = null;
    return this.loadTriggerCatalog();
  }
}

// 导出单例
export const configLoader = ConfigLoader.getInstance();
