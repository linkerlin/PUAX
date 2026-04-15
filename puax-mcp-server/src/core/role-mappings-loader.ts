/**
 * 角色映射加载器
 * 从 YAML 文件加载角色映射配置
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import * as YAML from 'yaml';

export interface TriggerRoleMapping {
  primary: string;
  alternatives: string[];
  reason: string;
}

export interface TaskTypeRoleMapping {
  primary: string;
  alternatives: string[];
  reason: string;
}

export interface FailureModeRoleMapping {
  switch_to: string;
  reason: string;
}

export interface RoleMetadata {
  category: string;
  tone: string;
  intensity: 'low' | 'medium' | 'high';
  suitable_for: string[];
  tags: string[];
}

export interface RoleCombination {
  primary: string;
  supporting: string[];
  reason: string;
}

export interface RoleMappings {
  trigger_role_mappings: Record<string, TriggerRoleMapping>;
  task_type_role_mappings: Record<string, TaskTypeRoleMapping>;
  failure_mode_role_mappings: Record<string, FailureModeRoleMapping>;
  role_metadata: Record<string, RoleMetadata>;
  role_combinations: Record<string, RoleCombination>;
}

export class RoleMappingsLoader {
  private configPath: string;
  private cache: RoleMappings | null = null;
  private lastLoadTime: number = 0;
  private cacheTTL: number = 60000; // 1分钟缓存

  constructor(configPath?: string) {
    this.configPath = configPath || join(process.cwd(), 'data', 'role-mappings.yaml');
  }

  /**
   * 加载角色映射配置
   */
  loadMappings(): RoleMappings {
    const now = Date.now();
    
    // 检查缓存
    if (this.cache && now - this.lastLoadTime < this.cacheTTL) {
      return this.cache;
    }

    try {
      const content = readFileSync(this.configPath, 'utf-8');
      const data = YAML.parse(content) as RoleMappings;
      
      this.cache = data;
      this.lastLoadTime = now;
      
      console.log('[RoleMappingsLoader] Loaded role mappings');
      return data;
      
    } catch (error) {
      console.error('[RoleMappingsLoader] Error loading mappings:', error);
      // 返回默认空配置
      return {
        trigger_role_mappings: {},
        task_type_role_mappings: {},
        failure_mode_role_mappings: {},
        role_metadata: {},
        role_combinations: {}
      };
    }
  }

  /**
   * 获取触发条件到角色的映射
   */
  getTriggerRoleMapping(triggerId: string): Promise<TriggerRoleMapping | undefined> {
    return Promise.resolve(this.loadMappings().trigger_role_mappings[triggerId]);
  }

  /**
   * 获取任务类型到角色的映射
   */
  getTaskTypeRoleMapping(taskType: string): Promise<TaskTypeRoleMapping | undefined> {
    return Promise.resolve(this.loadMappings().task_type_role_mappings[taskType]);
  }

  /**
   * 获取失败模式切换建议
   */
  getFailureModeSwitch(failureMode: string): Promise<FailureModeRoleMapping | undefined> {
    return Promise.resolve(this.loadMappings().failure_mode_role_mappings[failureMode]);
  }

  /**
   * 获取角色元数据
   */
  getRoleMetadata(roleId: string): Promise<RoleMetadata | undefined> {
    return Promise.resolve(this.loadMappings().role_metadata[roleId]);
  }

  /**
   * 获取角色组合
   */
  getRoleCombination(scenario: string): Promise<RoleCombination | undefined> {
    return Promise.resolve(this.loadMappings().role_combinations[scenario]);
  }

  /**
   * 按类别获取角色
   */
  getRolesByCategory(category: string): Promise<string[]> {
    const mappings = this.loadMappings();
    return Promise.resolve(
      Object.entries(mappings.role_metadata)
        .filter(([_, meta]) => meta.category === category)
        .map(([roleId]) => roleId)
    );
  }

  /**
   * 按标签获取角色
   */
  getRolesByTag(tag: string): Promise<string[]> {
    const mappings = this.loadMappings();
    return Promise.resolve(
      Object.entries(mappings.role_metadata)
        .filter(([_, meta]) => meta.tags.includes(tag))
        .map(([roleId]) => roleId)
    );
  }

  /**
   * 获取适合特定任务的角色
   */
  getRolesForTask(taskType: string): Promise<string[]> {
    return this.getTaskTypeRoleMapping(taskType).then(mapping => {
      if (!mapping) return [];
      return [mapping.primary, ...mapping.alternatives];
    });
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache = null;
    this.lastLoadTime = 0;
  }

  /**
   * 热重载
   */
  hotReload(): Promise<RoleMappings> {
    this.clearCache();
    return Promise.resolve(this.loadMappings());
  }

  /**
   * 验证映射配置
   */
  validateMappings(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const mappings = this.loadMappings();
      
      // 验证触发条件映射
      for (const [triggerId, mapping] of Object.entries(mappings.trigger_role_mappings)) {
        if (!mapping.primary) errors.push(`Trigger ${triggerId}: missing primary role`);
        if (!mapping.reason) errors.push(`Trigger ${triggerId}: missing reason`);
      }
      
      // 验证任务类型映射
      for (const [taskType, mapping] of Object.entries(mappings.task_type_role_mappings)) {
        if (!mapping.primary) errors.push(`Task ${taskType}: missing primary role`);
      }
      
      // 验证角色元数据
      for (const [roleId, meta] of Object.entries(mappings.role_metadata)) {
        if (!meta.category) errors.push(`Role ${roleId}: missing category`);
        if (!meta.tone) errors.push(`Role ${roleId}: missing tone`);
        if (!meta.intensity) errors.push(`Role ${roleId}: missing intensity`);
      }
      
    } catch (error) {
      errors.push(`Failed to load mappings: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return Promise.resolve({
      valid: errors.length === 0,
      errors
    });
  }

  /**
   * 获取统计信息
   */
  getStats(): Promise<{
    totalMappings: number;
    triggerMappings: number;
    taskTypeMappings: number;
    failureModeMappings: number;
    roleMetadataCount: number;
    roleCombinations: number;
    categories: string[];
  }> {
    const mappings = this.loadMappings();
    
    const categories = new Set(
      Object.values(mappings.role_metadata).map(m => m.category)
    );
    
    return Promise.resolve({
      totalMappings: Object.keys(mappings.trigger_role_mappings).length +
        Object.keys(mappings.task_type_role_mappings).length +
        Object.keys(mappings.failure_mode_role_mappings).length,
      triggerMappings: Object.keys(mappings.trigger_role_mappings).length,
      taskTypeMappings: Object.keys(mappings.task_type_role_mappings).length,
      failureModeMappings: Object.keys(mappings.failure_mode_role_mappings).length,
      roleMetadataCount: Object.keys(mappings.role_metadata).length,
      roleCombinations: Object.keys(mappings.role_combinations).length,
      categories: Array.from(categories)
    });
  }
}

// 导出单例
export const roleMappingsLoader = new RoleMappingsLoader();
export default roleMappingsLoader;
