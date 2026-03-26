/**
 * PUAX MCP Server - SKILL Tool Handlers
 * Handles all SKILL-related MCP tool calls
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

export async function handleListSkills(args: Record<string, unknown>): Promise<ToolResponse> {
    const category = (args?.category as string) || 'all';
    const includeCapabilities = (args?.includeCapabilities as boolean) || false;

    // 如果还没加载技能，先加载
    if (promptManager.getAllSkills().length === 0) {
        await promptManager.initialize();
    }

    const skills = promptManager.getSkillsByCategory(category);

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    total: skills.length,
                    category: category,
                    skills: skills.map(skill => {
                        const base = {
                            id: skill.id,
                            name: skill.name,
                            category: skill.category,
                            description: skill.description
                        };
                        if (includeCapabilities) {
                            return { ...base, capabilities: skill.capabilities, tags: skill.tags };
                        }
                        return base;
                    })
                }, null, 2)
            }
        ]
    };
}

export function handleGetSkill(args: Record<string, unknown>): ToolResponse {
    const skillId = args?.skillId as string;
    const task = args?.task as string | undefined;
    const section = toSkillSection(args?.section as string);

    if (!skillId) {
        throw new McpError(
            ErrorCode.InvalidParams,
            'skillId is required'
        );
    }

    const skill = promptManager.getSkillById(skillId);
    if (!skill) {
        throw new McpError(
            ErrorCode.InvalidParams,
            `Skill not found: ${skillId}`
        );
    }

    // 如果指定了 section，返回对应部分的数据
    if (section !== 'full') {
        const sectionData = promptManager.getSkillBySection(skillId, section);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        skill: sectionData
                    }, null, 2)
                }
            ]
        };
    }

    // 返回完整数据
    const bundledSkill = promptManager.getBundledSkill(skillId);
    let content = promptManager.getPromptContent(skillId) || '内容不可用';

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
                    skill: {
                        id: skill.id,
                        name: skill.name,
                        category: skill.category,
                        description: skill.description,
                        tags: skill.tags,
                        author: skill.author,
                        version: skill.version,
                        capabilities: skill.capabilities,
                        howToUse: bundledSkill?.howToUse,
                        inputFormat: bundledSkill?.inputFormat,
                        outputFormat: bundledSkill?.outputFormat,
                        exampleUsage: bundledSkill?.exampleUsage,
                        filePath: skill.filePath
                    },
                    content: content
                }, null, 2)
            }
        ]
    };
}

export async function handleSearchSkills(args: Record<string, unknown>): Promise<ToolResponse> {
    const keyword = args?.keyword as string;

    if (!keyword) {
        throw new McpError(
            ErrorCode.InvalidParams,
            'keyword is required'
        );
    }

    const skills = promptManager.searchSkills(keyword);

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    keyword: keyword,
                    total: skills.length,
                    skills: skills.map(skill => ({
                        id: skill.id,
                        name: skill.name,
                        category: skill.category,
                        description: skill.description,
                        capabilities: skill.capabilities,
                        tags: skill.tags
                    }))
                }, null, 2)
            }
        ]
    };
}

export function handleActivateSkill(args: Record<string, unknown>): ToolResponse {
    const skillId = args?.skillId as string;
    const task = args?.task as string | undefined;
    const customParams = args?.customParams as Record<string, unknown> | undefined;

    if (!skillId) {
        throw new McpError(
            ErrorCode.InvalidParams,
            'skillId is required'
        );
    }

    const result = promptManager.activateSkill(skillId, task, customParams);

    if (!result) {
        throw new McpError(
            ErrorCode.InvalidParams,
            `Failed to activate skill: ${skillId}`
        );
    }

    const skill = promptManager.getSkillById(skillId);

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    skill: {
                        id: skill?.id,
                        name: skill?.name,
                        category: skill?.category,
                        capabilities: skill?.capabilities
                    },
                    systemPrompt: result,
                    note: task ? 'Prompt 中的任务占位符已替换' : '使用原始 Prompt'
                }, null, 2)
            }
        ]
    };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleGetCategories(_args: Record<string, unknown>): ToolResponse {
    const categories = promptManager.getCategoriesWithInfo();

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    total: categories.length,
                    categories: categories
                }, null, 2)
            }
        ]
    };
}
