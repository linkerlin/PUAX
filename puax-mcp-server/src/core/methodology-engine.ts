#!/usr/bin/env node
/**
 * PUAX 方法论引擎
 * 提供系统化调试方法论和检查清单
 * 
 * v2: 数据从 methodologies.yaml 加载，实现数据与逻辑分离
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';

// ============================================================================
// 类型定义
// ============================================================================

export interface MethodologyStep {
  name: string;
  description: string;
  actions: string[];
  checkpoint?: string;
}

export interface Methodology {
  name: string;
  description: string;
  steps: MethodologyStep[];
  principles?: string[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  description?: string;
  required: boolean;
  category: string;
}

export interface RoleMethodology {
  role_id: string;
  methodology: Methodology;
  checklist: ChecklistItem[];
  adaptations?: Record<string, string>;
}

// ============================================================================
// YAML 数据结构
// ============================================================================

interface MethodologyYaml {
  base_methodology: Methodology;
  base_checklist: ChecklistItem[];
  role_methodologies: Record<string, {
    name: string;
    description: string;
    steps: Array<{
      name: string;
      description: string;
      actions: string[];
      checkpoint?: string;
    }>;
  }>;
  category_methodologies: Record<string, {
    name: string;
    description: string;
    step_names?: string[];
    step_descriptions?: string[];
  }>;
  flavor_prefixes: Record<string, string>;
}

// ============================================================================
// 数据加载
// ============================================================================

function loadMethodologyData(): MethodologyYaml {
  const yamlPath = join(__dirname, '..', 'data', 'methodologies.yaml');
  try {
    const content = readFileSync(yamlPath, 'utf-8');
    return YAML.parse(content) as MethodologyYaml;
  } catch {
    // 回退到默认空数据
    return {
      base_methodology: { name: '默认方法论', description: '', steps: [] },
      base_checklist: [],
      role_methodologies: {},
      category_methodologies: {},
      flavor_prefixes: {}
    };
  }
}

const data = loadMethodologyData();

// ============================================================================
// 方法论引擎类
// ============================================================================

export class MethodologyEngine {
  /**
   * 获取角色的方法论
   */
  getMethodology(roleId: string): Methodology {
    const roleMethod = data.role_methodologies[roleId];
    
    if (roleMethod) {
      return {
        name: roleMethod.name,
        description: roleMethod.description,
        steps: roleMethod.steps
      };
    }

    // 根据角色类别返回通用适配
    const category = this.getRoleCategory(roleId);
    return this.getCategoryMethodology(category);
  }

  /**
   * 获取检查清单
   */
  getChecklist(_roleId: string): ChecklistItem[] {
    // 所有角色共用基础检查清单
    return data.base_checklist;
  }

  /**
   * 获取完整角色方法论配置
   */
  getFullMethodology(roleId: string): RoleMethodology {
    return {
      role_id: roleId,
      methodology: this.getMethodology(roleId),
      checklist: this.getChecklist(roleId)
    };
  }

  /**
   * 获取角色类别
   */
  private getRoleCategory(roleId: string): string {
    if (!roleId) return 'general';

    if (roleId.startsWith('military')) return 'military';
    if (roleId.startsWith('shaman')) return 'shaman';
    if (roleId === 'strategic-architect') return 'p10';
    if (roleId.startsWith('theme')) return 'theme';
    if (roleId.startsWith('silicon')) return 'silicon';
    if (roleId.startsWith('sillytavern')) return 'sillytavern';
    if (roleId.startsWith('self-motivation')) return 'self-motivation';
    if (roleId.startsWith('special')) return 'special';
    return 'general';
  }

  /**
   * 获取类别方法论
   */
  private getCategoryMethodology(category: string): Methodology {
    const catMethod = data.category_methodologies[category];
    
    if (!catMethod) {
      return data.base_methodology;
    }

    // 如果有 step_names，从基础方法论派生
    if (catMethod.step_names) {
      const baseSteps = data.base_methodology.steps;
      return {
        name: catMethod.name,
        description: catMethod.description,
        steps: baseSteps.map((step, index) => ({
          ...step,
          name: catMethod.step_names![index] || step.name,
          description: catMethod.step_descriptions?.[index] || step.description
        }))
      };
    }

    // 没有自定义步骤名，直接复用基础步骤
    return {
      name: catMethod.name,
      description: catMethod.description,
      steps: data.base_methodology.steps
    };
  }

  /**
   * 应用大厂风味到方法论
   */
  applyFlavor(methodology: Methodology, flavor: string): Methodology {
    const prefix = data.flavor_prefixes[flavor];
    if (!prefix) {
      return methodology;
    }

    return {
      ...methodology,
      name: `${prefix}${methodology.name}`
    };
  }

  /**
   * 生成执行计划
   */
  generateExecutionPlan(roleId: string, taskDescription: string): string {
    const methodology = this.getMethodology(roleId);
    const checklist = this.getChecklist(roleId);

    let plan = `# ${methodology.name} - 执行计划\n\n`;
    plan += `**任务**: ${taskDescription}\n\n`;
    plan += `## 执行步骤\n\n`;

    methodology.steps.forEach((step, index) => {
      plan += `### ${index + 1}. ${step.name}\n`;
      plan += `${step.description}\n\n`;
      plan += `**行动清单**:\n`;
      step.actions.forEach(action => {
        plan += `- [ ] ${action}\n`;
      });
      if (step.checkpoint) {
        plan += `\n**检查点**: ${step.checkpoint}\n`;
      }
      plan += `\n---\n\n`;
    });

    plan += `## 强制检查清单\n\n`;
    checklist.filter(item => item.required).forEach(item => {
      plan += `- [ ] ${item.text}\n`;
      if (item.description) {
        plan += `  - ${item.description}\n`;
      }
    });

    return plan;
  }

  /**
   * 验证检查清单
   */
  validateChecklist(roleId: string, checkedItems: string[]): {
    completed: string[];
    missing: string[];
    completion_rate: number;
    can_proceed: boolean;
  } {
    const checklist = this.getChecklist(roleId);
    const requiredItems = checklist.filter(item => item.required);
    
    const completed = requiredItems.filter(item => 
      checkedItems.includes(item.id)
    );
    const missing = requiredItems.filter(item => 
      !checkedItems.includes(item.id)
    );

    const completionRate = requiredItems.length > 0 
      ? completed.length / requiredItems.length 
      : 1;

    return {
      completed: completed.map(i => i.text),
      missing: missing.map(i => i.text),
      completion_rate: Math.round(completionRate * 100),
      can_proceed: completionRate >= 0.8 // 80%完成率可以继续
    };
  }
}

// 导出单例
export const methodologyEngine = new MethodologyEngine();
