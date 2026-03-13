#!/usr/bin/env node
/**
 * MCP Tool: get_role_with_methodology
 * 获取角色的完整内容，包括System Prompt和调试方法论
 */

import { z } from 'zod';
import { methodologyEngine } from '../core/methodology-engine.js';
import { roleRecommender } from '../core/role-recommender.js';

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

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function loadRoleSystemPrompt(roleId: string): string {
  // 尝试从skills目录加载
  const skillPath = join(process.cwd(), '..', '..', 'skills', roleId, 'SKILL.md');
  
  if (existsSync(skillPath)) {
    const content = readFileSync(skillPath, 'utf-8');
    // 解析YAML frontmatter后的内容
    const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
    return match ? match[1].trim() : content;
  }
  
  // 如果找不到，返回默认提示
  return `# ${roleId}\n\n角色内容加载中...`;
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

  handler: async (args: z.infer<typeof GetRoleWithMethodologyInputSchema>) => {
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
      console.error('Error in get_role_with_methodology:', error);
      throw new Error(`Failed to get role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// ============================================================================
// 辅助函数
// ============================================================================

function getRoleDisplayName(roleId: string): string {
  const displayNames: Record<string, string> = {
    'military-commander': '军事化组织·指挥员',
    'military-commissar': '军事化组织·政委',
    'military-warrior': '军事化组织·战士',
    'military-scout': '军事化组织·侦察兵',
    'military-discipline': '军事化组织·督战队',
    'military-technician': '军事化组织·技术员',
    'military-militia': '军事化组织·民兵',
    'military-communicator': '军事化组织·通信员',
    'military-manual': '军事化组织·手册',
    'shaman-musk': '萨满·马斯克',
    'shaman-jobs': '萨满·乔布斯',
    'shaman-einstein': '萨满·爱因斯坦',
    'shaman-sun-tzu': '萨满·孙子',
    'shaman-buffett': '萨满·巴菲特',
    'shaman-tesla': '萨满·特斯拉',
    'shaman-davinci': '萨满·达芬奇',
    'shaman-linus': '萨满·Linus',
    'self-motivation-awakening': '自激励·觉醒',
    'self-motivation-bootstrap-pua': '自激励·自举PUA',
    'theme-hacker': '主题·赛博黑客',
    'theme-alchemy': '主题·修仙炼丹',
    'theme-apocalypse': '主题·末日生存',
    'theme-arena': '主题·八角笼格斗',
    'theme-starfleet': '主题·星际舰队',
    'sillytavern-antifragile': '反脆弱复盘官',
    'sillytavern-chief': '铁血幕僚长',
    'sillytavern-iterator': '极限迭代写手'
  };

  return displayNames[roleId] || roleId;
}

function getFlavorRhetoric(flavor: string): string[] {
  const rhetoric: Record<string, string[]> = {
    alibaba: [
      '今天最好的表现，是明天最低的要求',
      '你的思考和**方法论沉淀**是什么？'
    ],
    huawei: [
      '以奋斗者为本',
      '胜则举杯相庆，败则拼死相救'
    ],
    musk: [
      'We need to be extremely hardcore',
      'Only exceptional performance will constitute a passing grade'
    ],
    jobs: [
      'A players hire A players',
      'We need Reality Distortion Field'
    ]
  };

  return rhetoric[flavor] || [];
}

// 导出类型
export type GetRoleWithMethodologyInput = z.infer<typeof GetRoleWithMethodologyInputSchema>;
export type GetRoleWithMethodologyOutput = z.infer<typeof GetRoleWithMethodologyOutputSchema>;
