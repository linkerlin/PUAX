#!/usr/bin/env node
/**
 * MCP Tool: get_role_with_methodology
 * 获取角色的完整内容，包括System Prompt和调试方法论
 */

import { z } from 'zod';
import { methodologyEngine } from '../core/methodology-engine';
import { roleRecommender } from '../core/role-recommender';
import { getBundledSkillById } from '../prompts/prompts-bundle.js';
import { getRoleDisplayName, getFlavorRhetoric } from '../utils/role-utils.js';
import { getGlobalLogger } from '../utils/logger.js';

const logger = getGlobalLogger();

// ============================================================================
// 输入输出Schema定义
// ============================================================================

const GetRoleWithMethodologyInputSchema = z.object({
  role_id: z.string()
    .describe('角色ID，如 military-commander, shaman-musk'),
  
  options: z.object({
    include_methodology: z.boolean().default(true)
      .describe('是否包含方法论'),
    include_checklist: z.boolean().default(true)
      .describe('是否包含检查清单'),
    include_flavor: z.string().optional()
      .describe('叠加的大厂风味，如 huawei, alibaba, musk'),
    format: z.enum(['full', 'compact', 'prompt_only']).default('full')
      .describe('输出格式')
  }).optional().describe('选项')
});

const GetRoleWithMethodologyOutputSchema = z.object({
  role: z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    version: z.string(),
    system_prompt: z.string(),
    methodology: z.object({
      name: z.string(),
      description: z.string(),
      steps: z.array(z.object({
        name: z.string(),
        description: z.string(),
        actions: z.array(z.string()),
        checkpoint: z.string().optional()
      })),
      principles: z.array(z.string()).optional()
    }).optional(),
    checklist: z.array(z.object({
      id: z.string(),
      text: z.string(),
      description: z.string().optional(),
      required: z.boolean(),
      category: z.string()
    })).optional(),
    flavor_overlay: z.object({
      applied: z.string().optional(),
      rhetoric_additions: z.array(z.string()).optional()
    }).optional()
  })
});

// ============================================================================
// 加载角色System Prompt
// ============================================================================

function loadRoleSystemPrompt(roleId: string): string {
  return getBundledSkillById(roleId)?.content || `# ${roleId}\n\n角色内容加载中...`;
}

// ============================================================================
// 工具定义
// ============================================================================

export const getRoleWithMethodologyTool = {
  name: 'get_role_with_methodology',
  description: '获取PUAX角色的完整内容，包括System Prompt、系统化调试方法论和强制执行检查清单。' +
    '可选择叠加大厂风味（阿里味、华为味等）增强效果。' +
    '这是激活角色前的准备步骤。',
  
  inputSchema: GetRoleWithMethodologyInputSchema,
  
  outputSchema: GetRoleWithMethodologyOutputSchema,

  examples: [
    {
      name: '获取完整角色信息',
      input: {
        role_id: 'military-commander',
        options: {
          include_methodology: true,
          include_checklist: true
        }
      }
    },
    {
      name: '叠加华为风味',
      input: {
        role_id: 'military-warrior',
        options: {
          include_flavor: 'huawei',
          format: 'full'
        }
      }
    }
  ],

  handler: (args: z.infer<typeof GetRoleWithMethodologyInputSchema>) => {
    try {
      const { role_id, options = {} } = args as {
        role_id: string;
        options: {
          include_methodology?: boolean;
          include_checklist?: boolean;
          include_flavor?: string;
        }
      };
      
      // 加载System Prompt
      const systemPrompt = loadRoleSystemPrompt(role_id);
      
      // 获取角色元数据
      const metadata = roleRecommender.getRoleMetadata(role_id);
      
      // 获取方法论
      let methodology = options.include_methodology !== false
        ? methodologyEngine.getMethodology(role_id)
        : undefined;
      
      // 应用风味
      if (options.include_flavor && methodology) {
        methodology = methodologyEngine.applyFlavor(methodology, options.include_flavor);
      }
      
      // 获取检查清单
      const checklist = options.include_checklist !== false
        ? methodologyEngine.getChecklist(role_id)
        : undefined;
      
      // 构建风味叠加信息
      const flavorOverlay = options.include_flavor ? {
        applied: options.include_flavor,
        rhetoric_additions: getFlavorRhetoric(options.include_flavor)
      } : undefined;
      
      return {
        role: {
          id: role_id,
          name: getRoleDisplayName(role_id),
          category: metadata?.category || 'unknown',
          version: '2.0',
          system_prompt: systemPrompt,
          methodology,
          checklist,
          flavor_overlay: flavorOverlay
        }
      };
    } catch (error) {
      logger.error('Error in get_role_with_methodology:', error);
      throw new Error(`Failed to get role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// 导出类型
export type GetRoleWithMethodologyInput = z.infer<typeof GetRoleWithMethodologyInputSchema>;
export type GetRoleWithMethodologyOutput = z.infer<typeof GetRoleWithMethodologyOutputSchema>;
