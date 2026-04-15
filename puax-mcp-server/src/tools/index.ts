#!/usr/bin/env node
/**
 * MCP Tools 统一导出
 * PUAX v3.2.0 - 单一工具层（tools/ + handlers/ 已合并）
 *
 * 每个工具定义包含:
 * - name: MCP 工具名称 (snake_case)
 * - description: 工具描述
 * - inputSchema: Zod 输入 schema
 * - handler: 嵌入式 handler 函数
 *
 * server/core.ts 直接遍历 allTools 调用 handler，无需 switch 语句。
 */

import { z } from 'zod';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { promptManager } from '../prompts/index.js';
import { inferTaskType } from '../utils/role-utils.js';
import { TriggerDetector } from '../core/trigger-detector.js';
import { RoleRecommender } from '../core/role-recommender.js';
import { MethodologyEngine } from '../core/methodology-engine.js';
import type { ToolResponse, ActivationContext, ActivationOptions, MethodologyOptions } from '../types.js';
import type { ConversationMessage, TaskContext, DetectionOptions } from '../core/trigger-detector.js';
import type { SkillSection } from '../prompts/index.js';

// ============================================================================
// 工具 Schema 定义
// ============================================================================

const ListSkillsInputSchema = z.object({
  category: z.enum(['all', 'shaman', 'military', 'p10', 'silicon', 'sillytavern', 'theme', 'self-motivation', 'special'])
    .default('all').describe('按类别筛选技能'),
  includeCapabilities: z.boolean().default(false).describe('返回 capabilities 数组')
});

const GetSkillInputSchema = z.object({
  skillId: z.string().describe('SKILL ID'),
  task: z.string().optional().describe('任务描述，用于替换 {{task}} 占位符'),
  section: z.enum(['full', 'metadata', 'capabilities', 'systemPrompt']).optional().describe('返回哪一部分')
});

const SearchSkillsInputSchema = z.object({
  keyword: z.string().describe('搜索关键词')
});

const ActivateSkillInputSchema = z.object({
  skillId: z.string().describe('SKILL ID'),
  task: z.string().optional().describe('任务描述'),
  customParams: z.record(z.string()).optional().describe('自定义占位符替换')
});

const GetCategoriesInputSchema = z.object({});

const ListRolesInputSchema = z.object({
  category: z.enum(['all', 'shaman', 'military', 'p10', 'silicon', 'sillytavern', 'theme', 'self-motivation', 'special'])
    .default('all').describe('按类别筛选角色'),
  includeCapabilities: z.boolean().default(false).describe('返回 capabilities 数组')
});

const GetRoleInputSchema = z.object({
  roleId: z.string().describe('角色 ID'),
  task: z.string().optional().describe('任务描述'),
  section: z.enum(['full', 'metadata', 'capabilities', 'systemPrompt']).optional().describe('返回哪一部分')
});

const SearchRolesInputSchema = z.object({
  keyword: z.string().describe('搜索关键词')
});

const ActivateRoleInputSchema = z.object({
  roleId: z.string().describe('角色 ID'),
  task: z.string().optional().describe('任务描述'),
  customParams: z.record(z.string()).optional().describe('自定义占位符替换')
});

// ============================================================================
// 辅助函数
// ============================================================================

function toSkillSection(section: string | undefined): SkillSection {
  const validSections: SkillSection[] = ['full', 'metadata', 'capabilities', 'systemPrompt'];
  if (section && validSections.includes(section as SkillSection)) {
    return section as SkillSection;
  }
  return 'full';
}

function toConversationMessages(history: unknown): ConversationMessage[] {
  if (!Array.isArray(history)) return [];
  return (history as Array<{ role: string; content: string }>).map(msg => ({
    role: (msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant')
      ? msg.role as ConversationMessage['role'] : 'assistant' as ConversationMessage['role'],
    content: msg.content || ''
  }));
}

function wrapToolResponse(result: unknown): ToolResponse {
  return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
}

// ============================================================================
// SKILL 管理工具
// ============================================================================

export const ListSkillsTool = {
  name: 'list_skills',
  description: 'List all available SKILLs in the PUAX project.',
  inputSchema: ListSkillsInputSchema,
  handler: (args: z.infer<typeof ListSkillsInputSchema>) => {
    const { category = 'all', includeCapabilities = false } = args;
    if (promptManager.getAllSkills().length === 0) promptManager.initialize();
    const skills = promptManager.getSkillsByCategory(category);
    return wrapToolResponse({
      total: skills.length, category,
      skills: skills.map(s => {
        const base = { id: s.id, name: s.name, category: s.category, description: s.description };
        return includeCapabilities ? { ...base, capabilities: s.capabilities, tags: s.tags } : base;
      })
    });
  }
};

export const GetSkillTool = {
  name: 'get_skill',
  description: 'Get detailed information about a specific SKILL.',
  inputSchema: GetSkillInputSchema,
  handler: (args: z.infer<typeof GetSkillInputSchema>) => {
    const { skillId, task, section } = args;
    if (!skillId) throw new McpError(ErrorCode.InvalidParams, 'skillId is required');
    const skill = promptManager.getSkillById(skillId);
    if (!skill) throw new McpError(ErrorCode.InvalidParams, `Skill not found: ${skillId}`);
    if (section && section !== 'full') {
      return wrapToolResponse({ skill: promptManager.getSkillBySection(skillId, toSkillSection(section)) });
    }
    const bundled = promptManager.getBundledSkill(skillId);
    let content = promptManager.getPromptContent(skillId) || '内容不可用';
    if (task) {
      content = content.replace(/{{任务描述}}/g, task).replace(/{{占位符}}/g, task).replace(/{{task}}/gi, task);
    }
    return wrapToolResponse({
      skill: { id: skill.id, name: skill.name, category: skill.category, description: skill.description,
        tags: skill.tags, author: skill.author, version: skill.version, capabilities: skill.capabilities,
        howToUse: bundled?.howToUse, inputFormat: bundled?.inputFormat, outputFormat: bundled?.outputFormat,
        exampleUsage: bundled?.exampleUsage, filePath: (skill as unknown as { filePath?: string }).filePath },
      content
    });
  }
};

export const SearchSkillsTool = {
  name: 'search_skills',
  description: 'Search SKILLs by keyword.',
  inputSchema: SearchSkillsInputSchema,
  handler: (args: z.infer<typeof SearchSkillsInputSchema>) => {
    const { keyword } = args;
    if (!keyword) throw new McpError(ErrorCode.InvalidParams, 'keyword is required');
    const skills = promptManager.searchSkills(keyword);
    return wrapToolResponse({ keyword, total: skills.length,
      skills: skills.map(s => ({ id: s.id, name: s.name, category: s.category,
        description: s.description, capabilities: s.capabilities, tags: s.tags }))
    });
  }
};

export const ActivateSkillTool = {
  name: 'activate_skill',
  description: 'Activate a SKILL and get the ready-to-use system prompt.',
  inputSchema: ActivateSkillInputSchema,
  handler: (args: z.infer<typeof ActivateSkillInputSchema>) => {
    const { skillId, task, customParams } = args;
    if (!skillId) throw new McpError(ErrorCode.InvalidParams, 'skillId is required');
    const result = promptManager.activateSkill(skillId, task, customParams);
    if (!result) throw new McpError(ErrorCode.InvalidParams, `Failed to activate skill: ${skillId}`);
    const skill = promptManager.getSkillById(skillId);
    return wrapToolResponse({ success: true,
      skill: { id: skill?.id, name: skill?.name, category: skill?.category, capabilities: skill?.capabilities },
      systemPrompt: result, note: task ? 'Prompt 中的任务占位符已替换' : '使用原始 Prompt'
    });
  }
};

export const GetCategoriesTool = {
  name: 'get_categories',
  description: 'Get all available SKILL categories with counts and descriptions.',
  inputSchema: GetCategoriesInputSchema,
  handler: () => wrapToolResponse({ total: promptManager.getCategoriesWithInfo().length,
    categories: promptManager.getCategoriesWithInfo() })
};

// ============================================================================
// Legacy Role 工具（已废弃，委托至 SKILL）
// ============================================================================

export const ListRolesTool = {
  name: 'list_roles',
  description: 'List all available roles (legacy, use list_skills instead).',
  inputSchema: ListRolesInputSchema,
  handler: (args: z.infer<typeof ListRolesInputSchema>) => {
    const { category = 'all', includeCapabilities = false } = args;
    if (promptManager.getAllRoles().length === 0) promptManager.initialize();
    const roles = promptManager.getRolesByCategory(category);
    return wrapToolResponse({ total: roles.length, category,
      roles: roles.map(r => {
        const base = { id: r.id, name: r.name, category: r.category, description: r.description };
        return includeCapabilities ? { ...base, capabilities: r.capabilities, tags: r.tags } : base;
      })
    });
  }
};

export const GetRoleTool = {
  name: 'get_role',
  description: 'Get detailed information about a specific role (legacy).',
  inputSchema: GetRoleInputSchema,
  handler: (args: z.infer<typeof GetRoleInputSchema>) => {
    const { roleId, task, section } = args;
    if (!roleId) throw new McpError(ErrorCode.InvalidParams, 'roleId is required');
    const role = promptManager.getRoleById(roleId);
    if (!role) throw new McpError(ErrorCode.InvalidParams, `Role not found: ${roleId}`);
    if (section && section !== 'full') {
      return wrapToolResponse({ role: promptManager.getSkillBySection(roleId, toSkillSection(section)) });
    }
    let content = promptManager.getPromptContent(roleId) || '内容不可用';
    if (task) {
      content = content.replace(/{{任务描述}}/g, task).replace(/{{占位符}}/g, task).replace(/{{task}}/gi, task);
    }
    return wrapToolResponse({ role: { id: role.id, name: role.name, category: role.category,
      description: role.description, capabilities: role.capabilities, tags: role.tags,
      filePath: (role as unknown as { filePath?: string }).filePath }, content });
  }
};

export const SearchRolesTool = {
  name: 'search_roles',
  description: 'Search roles by keyword (legacy).',
  inputSchema: SearchRolesInputSchema,
  handler: (args: z.infer<typeof SearchRolesInputSchema>) => {
    const { keyword } = args;
    if (!keyword) throw new McpError(ErrorCode.InvalidParams, 'keyword is required');
    const roles = promptManager.searchRoles(keyword);
    return wrapToolResponse({ keyword, total: roles.length,
      roles: roles.map(r => ({ id: r.id, name: r.name, category: r.category,
        description: r.description, capabilities: r.capabilities, tags: r.tags }))
    });
  }
};

export const ActivateRoleTool = {
  name: 'activate_role',
  description: 'Activate a role and get the system prompt (legacy).',
  inputSchema: ActivateRoleInputSchema,
  handler: (args: z.infer<typeof ActivateRoleInputSchema>) => {
    const { roleId, task, customParams } = args;
    if (!roleId) throw new McpError(ErrorCode.InvalidParams, 'roleId is required');
    const result = promptManager.activateRole(roleId, task, customParams);
    if (!result) throw new McpError(ErrorCode.InvalidParams, `Failed to activate role: ${roleId}`);
    const role = promptManager.getRoleById(roleId);
    return wrapToolResponse({ success: true,
      role: { id: role?.id, name: role?.name, category: role?.category, capabilities: role?.capabilities },
      systemPrompt: result, note: task ? 'Prompt 中的任务占位符已替换' : '使用原始 Prompt'
    });
  }
};

// ============================================================================
// 导出所有工具定义
// ============================================================================

export { detectTriggerTool, detectTriggerEnhancedTool } from './detect-trigger-enhanced.js';
export { activateWithContextTool } from './activate-with-context.js';
export { getRoleWithMethodologyTool } from './get-role-with-methodology.js';
export { recommendRoleTool } from './recommend-role.js';
export { startSessionTool, endSessionTool, getSessionStateTool, resetSessionTool, hookSessionTools } from './hook-session.js';
export { submitFeedbackTool, getFeedbackSummaryTool, getImprovementSuggestionsTool, exportFeedbackTool, generatePUALoopReportTool, hookFeedbackTools } from './hook-feedback.js';
export { quickDetectTool } from './quick-detect.js';
export { exportPlatform, exportAllPlatforms, handleExportCommand } from './export-platform.js';

// ============================================================================
// 统一工具列表
// ============================================================================

import { detectTriggerEnhancedTool } from './detect-trigger-enhanced.js';
import { activateWithContextTool } from './activate-with-context.js';
import { getRoleWithMethodologyTool } from './get-role-with-methodology.js';
import { recommendRoleTool } from './recommend-role.js';
import { hookSessionTools } from './hook-session.js';
import { hookFeedbackTools } from './hook-feedback.js';
import { quickDetectTool } from './quick-detect.js';

/**
 * 统一工具列表（单一工具层）
 * server/core.ts 直接遍历此数组，通过 tool.handler 调用每个工具的实现。
 */
export const allTools = [
  // SKILL 管理工具
  ListSkillsTool,
  GetSkillTool,
  SearchSkillsTool,
  ActivateSkillTool,
  GetCategoriesTool,

  // 核心检测工具
  detectTriggerEnhancedTool,
  quickDetectTool,

  // 角色管理工具
  activateWithContextTool,
  getRoleWithMethodologyTool,
  recommendRoleTool,

  // Legacy Role 工具
  ListRolesTool,
  GetRoleTool,
  SearchRolesTool,
  ActivateRoleTool,

  // 会话管理工具
  ...hookSessionTools,

  // 反馈工具
  ...hookFeedbackTools,
];

// 别名：server/core.ts 使用 Tools
export const Tools = allTools;

export default allTools;
