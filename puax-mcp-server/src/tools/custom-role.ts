#!/usr/bin/env node
/**
 * MCP Tools: 用户自定义角色
 */

import { z } from 'zod';
import {
  getCustomRoleStore,
  validateCustomRoleId,
  CUSTOM_ROLE_ID_PATTERN,
} from '../core/custom-role-store.js';
import { getRoleRecommender } from '../core/service-registry.js';
import { promptManager } from '../prompts/index.js';
import { getGlobalLogger } from '../utils/logger.js';

const logger = getGlobalLogger();

const RoleMetadataSchema = z.object({
  tone: z.enum(['aggressive', 'supportive', 'analytical', 'creative']).optional(),
  intensity: z.enum(['low', 'medium', 'high', 'extreme']).optional(),
  suitable_for: z.array(z.string()).optional(),
});

const RegisterCustomRoleSchema = z.object({
  id: z.string().regex(CUSTOM_ROLE_ID_PATTERN, 'id 须为 custom- 前缀的 kebab-case').describe('角色 ID，如 custom-my-debugger'),
  name: z.string().min(1).describe('显示名称'),
  description: z.string().min(1).describe('一句话描述'),
  content: z.string().min(20).describe('角色 system prompt / SKILL 正文'),
  tags: z.array(z.string()).optional(),
  task_types: z.array(z.string()).optional().describe('适用任务类型，如 debugging、coding'),
  trigger_conditions: z.array(z.string()).optional(),
  compatible_flavors: z.array(z.string()).optional(),
  recommended_for_triggers: z.array(z.string()).optional().describe('推荐池触发器 ID，如 user_frustration'),
  metadata: RoleMetadataSchema.optional(),
});

const RemoveCustomRoleSchema = z.object({
  id: z.string().describe('要删除的 custom- 角色 ID'),
});

export const registerCustomRoleTool = {
  name: 'puax_register_custom_role',
  description: '注册用户自定义角色到 ~/.puax/custom-roles.json，并加入推荐池与激活列表。id 须 custom- 前缀。',
  inputSchema: RegisterCustomRoleSchema,

  handler: (args: z.infer<typeof RegisterCustomRoleSchema>) => {
    const store = getCustomRoleStore();
    const record = store.register(args);
    getRoleRecommender().refreshCustomRoles();
    promptManager.reloadSkillsIndex();
    logger.info(`[custom-role] Registered ${record.id}`);
    return {
      success: true,
      role: {
        id: record.id,
        name: record.name,
        category: record.category,
        task_types: record.task_types,
        recommended_for_triggers: record.recommended_for_triggers,
      },
      message: `已注册自定义角色「${record.name}」，可通过 puax_recommend_role / puax_activate_role 使用。`,
    };
  },
};

export const listCustomRolesTool = {
  name: 'puax_list_custom_roles',
  description: '列出 ~/.puax 下所有用户自定义角色。',
  inputSchema: z.object({}),

  handler: () => {
    const roles = getCustomRoleStore().list();
    return {
      count: roles.length,
      roles: roles.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        task_types: r.task_types,
        recommended_for_triggers: r.recommended_for_triggers,
        updated_at: r.updated_at,
      })),
    };
  },
};

export const removeCustomRoleTool = {
  name: 'puax_remove_custom_role',
  description: '删除用户自定义角色（不可删除内置 bundle 角色）。',
  inputSchema: RemoveCustomRoleSchema,

  handler: (args: z.infer<typeof RemoveCustomRoleSchema>) => {
    const idCheck = validateCustomRoleId(args.id);
    if (!idCheck.valid) {
      throw new Error(idCheck.errors.join('；'));
    }
    const removed = getCustomRoleStore().remove(args.id);
    if (!removed) {
      throw new Error(`未找到自定义角色: ${args.id}`);
    }
    getRoleRecommender().refreshCustomRoles();
    promptManager.reloadSkillsIndex();
    return { success: true, removed_id: args.id };
  },
};

export const customRoleTools = [
  registerCustomRoleTool,
  listCustomRolesTool,
  removeCustomRoleTool,
];
