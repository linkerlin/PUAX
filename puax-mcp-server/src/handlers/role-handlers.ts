/**
 * PUAX MCP Server - Legacy Role Tool Handlers
 * Handles legacy role-related MCP tool calls (now delegate to SKILL handlers)
 * @deprecated Use skill-handlers.ts instead
 */

import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { promptManager, type SkillSection } from '../prompts/index.js';
import type { ToolResponse } from '../types.js';

function toSkillSection(section: string | undefined): SkillSection {
    const validSections: SkillSection[] = ['full', 'metadata', 'capabilities', 'systemPrompt'];
    if (section && validSections.includes(section as SkillSection)) {
        return section as SkillSection;
    }
    return 'full';
}

export async function handleListRoles(args: Record<string, unknown>): Promise<ToolResponse> {
    const category = (args?.category as string) || 'all';
    const includeCapabilities = (args?.includeCapabilities as boolean) || false;

    // 如果还没加载角色，先加载
    if (promptManager.getAllRoles().length === 0) {
        await promptManager.initialize();
    }

    const roles = promptManager.getRolesByCategory(category);

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    total: roles.length,
                    category: category,
                    roles: roles.map(role => {
                        const base = {
                            id: role.id,
                            name: role.name,
                            category: role.category,
                            description: role.description
                        };
                        if (includeCapabilities) {
                            return { ...base, capabilities: role.capabilities, tags: role.tags };
                        }
                        return base;
                    })
                }, null, 2)
            }
        ]
    };
}

export function handleGetRole(args: Record<string, unknown>): ToolResponse {
    const roleId = args?.roleId as string;
    const task = args?.task as string | undefined;
    const section = toSkillSection(args?.section as string);

    if (!roleId) {
        throw new McpError(
            ErrorCode.InvalidParams,
            'roleId is required'
        );
    }

    const role = promptManager.getRoleById(roleId);
    if (!role) {
        throw new McpError(
            ErrorCode.InvalidParams,
            `Role not found: ${roleId}`
        );
    }

    // 如果指定了 section，返回对应部分的数据
    if (section !== 'full') {
        const sectionData = promptManager.getSkillBySection(roleId, section);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        role: sectionData
                    }, null, 2)
                }
            ]
        };
    }

    let content = promptManager.getPromptContent(roleId) || '内容不可用';

    // 如果有任务，替换占位符
    if (task) {
        content = content.replace(/{{任务描述}}/g, task);
        content = content.replace(/{{占位符}}/g, task);
        content = content.replace(/{{task}}/gi, task);
    }

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    role: {
                        id: role.id,
                        name: role.name,
                        category: role.category,
                        description: role.description,
                        capabilities: role.capabilities,
                        tags: role.tags,
                        filePath: role.filePath
                    },
                    content: content
                }, null, 2)
            }
        ]
    };
}

export async function handleSearchRoles(args: Record<string, unknown>): Promise<ToolResponse> {
    const keyword = args?.keyword as string;

    if (!keyword) {
        throw new McpError(
            ErrorCode.InvalidParams,
            'keyword is required'
        );
    }

    const roles = promptManager.searchRoles(keyword);

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    keyword: keyword,
                    total: roles.length,
                    roles: roles.map(role => ({
                        id: role.id,
                        name: role.name,
                        category: role.category,
                        description: role.description,
                        capabilities: role.capabilities,
                        tags: role.tags
                    }))
                }, null, 2)
            }
        ]
    };
}

export function handleActivateRole(args: Record<string, unknown>): ToolResponse {
    const roleId = args?.roleId as string;
    const task = args?.task as string | undefined;
    const customParams = args?.customParams as Record<string, unknown> | undefined;

    if (!roleId) {
        throw new McpError(
            ErrorCode.InvalidParams,
            'roleId is required'
        );
    }

    const result = promptManager.activateRole(roleId, task, customParams);

    if (!result) {
        throw new McpError(
            ErrorCode.InvalidParams,
            `Failed to activate role: ${roleId}`
        );
    }

    const role = promptManager.getRoleById(roleId);

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    role: {
                        id: role?.id,
                        name: role?.name,
                        category: role?.category,
                        capabilities: role?.capabilities
                    },
                    systemPrompt: result,
                    note: task ? 'Prompt 中的任务占位符已替换' : '使用原始 Prompt'
                }, null, 2)
            }
        ]
    };
}
