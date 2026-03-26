/**
 * PUAX MCP Server - Trigger Detection & Methodology Tool Handlers
 * Handles trigger detection, role recommendation, and methodology tools
 */

import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { promptManager } from '../prompts/index.js';
import { getGlobalLogger } from '../utils/logger.js';
import type { ToolResponse, ActivationContext, ActivationOptions, MethodologyOptions } from '../types.js';
import type { ConversationMessage, TaskContext, DetectionOptions } from '../core/trigger-detector.js';

const logger = getGlobalLogger();

/**
 * Convert conversation history to properly typed format
 */
function toConversationMessages(history: unknown): ConversationMessage[] {
    if (!Array.isArray(history)) {
        return [];
    }
    
    return history.map(msg => {
        const role = (msg as Record<string, string>).role;
        const content = (msg as Record<string, string>).content;
        
        // Ensure role is one of the valid types
        const validRole: ConversationMessage['role'] = 
            role === 'system' || role === 'user' || role === 'assistant' 
                ? role 
                : 'assistant';
        
        return {
            role: validRole,
            content: content || ''
        };
    });
}

export async function handleDetectTrigger(args: Record<string, unknown>): Promise<ToolResponse> {
    try {
        // Dynamic import to avoid circular dependency issues
        const { TriggerDetector } = await import('../core/trigger-detector.js');
        
        const detector = new TriggerDetector((args.options as DetectionOptions) || {});
        
        // Convert conversation_history to proper type
        const conversationHistory = toConversationMessages(args.conversation_history);
        
        // Build task context
        const taskContext: TaskContext | undefined = args.task_context ? {
            current_task: (args.task_context as Record<string, unknown>).current_task as string,
            attempt_count: (args.task_context as Record<string, unknown>).attempt_count as number,
            tools_available: (args.task_context as Record<string, unknown>).tools_available as string[],
            tools_used: (args.task_context as Record<string, unknown>).tools_used as string[]
        } : undefined;
        
        const result = await detector.detect(conversationHistory, taskContext);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    } catch (error) {
        logger.error('Detect trigger error:', error);
        throw new McpError(
            ErrorCode.InternalError,
            `Trigger detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

export async function handleRecommendRole(args: Record<string, unknown>): Promise<ToolResponse> {
    try {
        const { RoleRecommender } = await import('../core/role-recommender.js');
        
        const recommender = new RoleRecommender();
        
        // Build task context with proper typing
        const rawTaskContext = args.task_context as Record<string, unknown> || {};
        const taskContext = {
            task_type: (rawTaskContext.task_type as string) || 'general',
            description: rawTaskContext.description as string,
            urgency: (rawTaskContext.urgency as 'low' | 'medium' | 'high' | 'critical') || 'medium',
            attempt_count: (rawTaskContext.attempt_count as number) || 0
        };
        
        const result = await recommender.recommend({
            detected_triggers: (args.detected_triggers as string[]) || [],
            task_context: taskContext,
            user_preferences: args.user_preferences as {
                favorite_roles?: string[];
                blacklisted_roles?: string[];
                preferred_tone?: 'aggressive' | 'supportive' | 'analytical' | 'creative';
                preferred_categories?: string[];
            },
            session_history: args.session_history as {
                recently_used_roles?: string[];
                role_success_rates?: Record<string, number>;
                role_usage_count?: Record<string, number>;
            }
        });

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    } catch (error) {
        logger.error('Recommend role error:', error);
        throw new McpError(
            ErrorCode.InternalError,
            `Role recommendation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

export async function handleGetRoleWithMethodology(args: Record<string, unknown>): Promise<ToolResponse> {
    try {
        const { MethodologyEngine } = await import('../core/methodology-engine.js');
        const engine = new MethodologyEngine();
        
        const roleId = args.role_id as string;
        const options = (args.options as MethodologyOptions) || {};
        
        // Get skill info
        const skill = promptManager.getSkillById(roleId);
        if (!skill) {
            throw new McpError(
                ErrorCode.InvalidParams,
                `Role not found: ${roleId}`
            );
        }

        // Get methodology
        let methodology = options.include_methodology !== false
            ? engine.getMethodology(roleId)
            : undefined;

        // Apply flavor if specified
        if (options.include_flavor && methodology) {
            methodology = engine.applyFlavor(methodology, options.include_flavor);
        }

        // Get checklist
        const checklist = options.include_checklist !== false
            ? engine.getChecklist(roleId)
            : undefined;

        // Load system prompt
        let systemPrompt = skill.content;
        
        // If compact format requested, reduce content
        if (options.format === 'compact') {
            systemPrompt = systemPrompt.substring(0, 1000) + '...';
        } else if (options.format === 'prompt_only') {
            // Extract only the system prompt section
            const match = systemPrompt.match(/## System Prompt\s*```[\s\S]*?```/);
            systemPrompt = match ? match[0] : systemPrompt;
        }

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        role: {
                            id: skill.id,
                            name: skill.name,
                            category: skill.category,
                            version: skill.version
                        },
                        system_prompt: systemPrompt,
                        methodology: methodology,
                        checklist: checklist,
                        flavor_overlay: options.include_flavor ? {
                            applied: options.include_flavor
                        } : undefined
                    }, null, 2)
                }
            ]
        };
    } catch (error) {
        logger.error('Get role with methodology error:', error);
        throw new McpError(
            ErrorCode.InternalError,
            `Failed to get role with methodology: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

export async function handleActivateWithContext(args: Record<string, unknown>): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
        const context = args.context as ActivationContext;
        const options = (args.options as ActivationOptions) || {};
        
        const { TriggerDetector } = await import('../core/trigger-detector.js');
        const { RoleRecommender } = await import('../core/role-recommender.js');
        const { MethodologyEngine } = await import('../core/methodology-engine.js');
        
        // Step 1: Detect triggers
        const detectionStart = Date.now();
        let detectedTriggers: string[] = [];
        let shouldActivate = false;
        
        if (options.auto_detect !== false) {
            const detector = new TriggerDetector();
            
            const conversationHistory = toConversationMessages(context?.conversation_history);
            const taskContext: TaskContext | undefined = context?.task_context ? {
                current_task: context.task_context.current_task,
                attempt_count: context.task_context.attempt_count
            } : undefined;
            
            const detectionResult = await detector.detect(conversationHistory, taskContext);
            
            detectedTriggers = detectionResult.triggers_detected.map(t => t.id);
            shouldActivate = detectionResult.summary.should_trigger;
        }
        
        const detectionTime = Date.now() - detectionStart;
        
        // If no triggers and no force activation, return early
        if (!shouldActivate && !options.user_confirmation) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            activated: false,
                            role: { id: '', name: '' },
                            activation_reason: {
                                triggers_detected: [],
                                match_confidence: 0,
                                reasoning: '未检测到需要激活的触发条件'
                            },
                            system_prompt: '',
                            next_steps: ['继续当前对话，无需特殊干预'],
                            metadata: {
                                detection_time_ms: detectionTime,
                                recommendation_time_ms: 0,
                                total_time_ms: Date.now() - startTime
                            }
                        }, null, 2)
                    }
                ]
            };
        }
        
        // Step 2: Recommend role
        const recommendationStart = Date.now();
        const recommender = new RoleRecommender();
        
        // Infer task type from task description
        const taskType = inferTaskType(context?.task_context?.current_task || '');
        
        const recommendation = await recommender.recommend({
            detected_triggers: detectedTriggers.length > 0 
                ? detectedTriggers 
                : [options.fallback_role || 'military-commander'],
            task_context: {
                task_type: taskType,
                description: context?.task_context?.current_task,
                urgency: detectedTriggers.includes('user_frustration') ? 'critical' : 'high',
                attempt_count: context?.task_context?.attempt_count || 0
            }
        });
        
        const recommendationTime = Date.now() - recommendationStart;
        
        // Step 3: Get role content
        const roleId = recommendation.primary.role_id;
        const skill = promptManager.getSkillById(roleId);
        
        if (!skill) {
            throw new McpError(
                ErrorCode.InvalidParams,
                `Role not found: ${roleId}`
            );
        }
        
        // Get methodology and checklist
        const engine = new MethodologyEngine();
        const methodology = options.include_methodology !== false
            ? engine.getMethodology(roleId)
            : undefined;
        const checklist = options.include_checklist !== false
            ? engine.getChecklist(roleId)
            : undefined;
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        activated: true,
                        role: {
                            id: roleId,
                            name: recommendation.primary.role_name
                        },
                        activation_reason: {
                            triggers_detected: detectedTriggers,
                            match_confidence: recommendation.primary.confidence_score,
                            reasoning: recommendation.primary.match_reasons.join('；')
                        },
                        system_prompt: skill.content,
                        methodology: methodology ? {
                            name: methodology.name,
                            steps: methodology.steps.map(s => ({
                                name: s.name,
                                description: s.description,
                                actions: s.actions
                            }))
                        } : undefined,
                        checklist: checklist?.filter(c => c.required).map(c => ({
                            text: c.text,
                            required: c.required
                        })),
                        next_steps: [
                            '将System Prompt注入对话上下文',
                            '向用户说明已激活的角色和原因',
                            '按照方法论执行调试步骤',
                            '完成检查清单中的必要项',
                            '持续监控对话状态'
                        ],
                        metadata: {
                            detection_time_ms: detectionTime,
                            recommendation_time_ms: recommendationTime,
                            total_time_ms: Date.now() - startTime
                        }
                    }, null, 2)
                }
            ]
        };
    } catch (error) {
        logger.error('Activate with context error:', error);
        throw new McpError(
            ErrorCode.InternalError,
            `Activation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

function inferTaskType(taskDescription: string): string {
    const desc = taskDescription.toLowerCase();
    
    if (desc.includes('debug') || desc.includes('fix') || desc.includes('error')) {
        return 'debugging';
    }
    if (desc.includes('code') || desc.includes('implement') || desc.includes('develop')) {
        return 'coding';
    }
    if (desc.includes('review') || desc.includes('audit')) {
        return 'review';
    }
    if (desc.includes('write') || desc.includes('document')) {
        return 'writing';
    }
    if (desc.includes('design') || desc.includes('plan')) {
        return 'planning';
    }
    if (desc.includes('urgent') || desc.includes('emergency') || desc.includes('asap')) {
        return 'emergency';
    }
    if (desc.includes('analyze') || desc.includes('research')) {
        return 'analysis';
    }
    
    return 'debugging'; // Default
}
