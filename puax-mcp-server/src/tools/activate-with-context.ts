#!/usr/bin/env node
/**
 * MCP Tool: activate_with_context
 * 根据当前上下文自动检测并激活最合适的角色（一键激活）
 */

import { z } from 'zod';
import { TriggerDetector } from '../core/trigger-detector';
import { RoleRecommender } from '../core/role-recommender';
import { methodologyEngine } from '../core/methodology-engine';
import { getBundledSkillById } from '../prompts/prompts-bundle.js';

// ============================================================================
// 输入输出Schema定义
// ============================================================================

const ActivateWithContextInputSchema = z.object({
  context: z.object({
    conversation_history: z.array(z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string()
    })).describe('对话历史'),
    task_context: z.object({
      current_task: z.string().optional(),
      attempt_count: z.number().default(0),
      tools_available: z.array(z.string()).default([]),
      tools_used: z.array(z.string()).default([])
    }).optional()
  }).describe('当前上下文'),
  
  options: z.object({
    auto_detect: z.boolean().default(true)
      .describe('是否自动检测触发条件'),
    user_confirmation: z.boolean().default(false)
      .describe('是否需要用户确认'),
    fallback_role: z.string().default('military-commander')
      .describe('无法检测时的默认角色'),
    include_methodology: z.boolean().default(true)
      .describe('是否包含方法论'),
    include_checklist: z.boolean().default(true)
      .describe('是否包含检查清单')
  }).optional().describe('激活选项')
});

const ActivateWithContextOutputSchema = z.object({
  activated: z.boolean(),
  role: z.object({
    id: z.string(),
    name: z.string()
  }),
  activation_reason: z.object({
    triggers_detected: z.array(z.string()),
    match_confidence: z.number(),
    reasoning: z.string()
  }),
  system_prompt: z.string(),
  methodology: z.object({
    name: z.string(),
    steps: z.array(z.object({
      name: z.string(),
      description: z.string(),
      actions: z.array(z.string())
    }))
  }).optional(),
  checklist: z.array(z.object({
    text: z.string(),
    required: z.boolean()
  })).optional(),
  next_steps: z.array(z.string()),
  metadata: z.object({
    detection_time_ms: z.number(),
    recommendation_time_ms: z.number(),
    total_time_ms: z.number()
  })
});

// ============================================================================
// 工具定义
// ============================================================================

export const activateWithContextTool = {
  name: 'activate_with_context',
  description: '一键激活：根据当前对话上下文自动检测触发条件、推荐并激活最合适的PUAX角色。' +
    '这是完整的自动化流程：检测 → 推荐 → 获取 → 返回完整激活信息。' +
    '适合需要快速响应的场景。',
  
  inputSchema: ActivateWithContextInputSchema,
  
  outputSchema: ActivateWithContextOutputSchema,

  examples: [
    {
      name: '自动激活',
      input: {
        context: {
          conversation_history: [
            { role: 'assistant', content: '尝试连接数据库...失败' },
            { role: 'assistant', content: '再试一次...还是失败' },
            { role: 'user', content: '怎么又失败了？' }
          ],
          task_context: {
            current_task: 'debugging database connection',
            attempt_count: 2
          }
        },
        options: {
          auto_detect: true
        }
      }
    }
  ],

  handler: (args: z.infer<typeof ActivateWithContextInputSchema>) => {
    const startTime = Date.now();
    
    try {
      const { context, options = {} } = args as { 
        context: {
          conversation_history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
          task_context?: {
            current_task?: string;
            attempt_count: number;
            tools_available: string[];
            tools_used: string[];
          };
        }; 
        options: {
          auto_detect?: boolean;
          user_confirmation?: boolean;
          fallback_role?: string;
          include_methodology?: boolean;
          include_checklist?: boolean;
        }
      };
      
      // Step 1: 检测触发条件
      const detectionStart = Date.now();
      let detectedTriggers: string[] = [];
      let shouldActivate = false;
      
      if (options.auto_detect) {
        const detector = new TriggerDetector();
        const detectionResult = detector.detect(
          context.conversation_history,
          context.task_context
        );
        
        detectedTriggers = detectionResult.triggers_detected.map(t => t.id);
        shouldActivate = detectionResult.summary.should_trigger;
      }
      
      const detectionTime = Date.now() - detectionStart;
      
      // 如果没有检测到触发条件且不需要强制激活，返回未激活
      if (!shouldActivate && !options.user_confirmation) {
        return {
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
        };
      }
      
      // Step 2: 推荐角色
      const recommendationStart = Date.now();
      const recommender = new RoleRecommender();
      
      const recommendation = recommender.recommend({
        detected_triggers: detectedTriggers.length > 0 
          ? detectedTriggers 
          : [options.fallback_role || 'military-commander'],
        task_context: {
          task_type: inferTaskType(context.task_context?.current_task || ''),
          description: context.task_context?.current_task,
          urgency: detectedTriggers.includes('user_frustration') ? 'critical' : 'high',
          attempt_count: context.task_context?.attempt_count || 0
        }
      });
      
      const recommendationTime = Date.now() - recommendationStart;
      
      // Step 3: 获取角色完整信息
      const roleId = recommendation.primary.role_id;
      const systemPrompt = loadRoleSystemPrompt(roleId);
      const methodology = options.include_methodology !== false
        ? methodologyEngine.getMethodology(roleId)
        : undefined;
      const checklist = options.include_checklist !== false
        ? methodologyEngine.getChecklist(roleId)
        : undefined;
      
      return {
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
        system_prompt: systemPrompt,
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
      };
      
    } catch (error) {
      console.error('Error in activate_with_context:', error);
      throw new Error(`Activation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// ============================================================================
// 辅助函数
// ============================================================================

function loadRoleSystemPrompt(roleId: string): string {
  return getBundledSkillById(roleId)?.content || `# ${roleId}\n\n角色内容加载中...`;
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
  
  return 'debugging'; // 默认
}

// 导出类型
export type ActivateWithContextInput = z.infer<typeof ActivateWithContextInputSchema>;
export type ActivateWithContextOutput = z.infer<typeof ActivateWithContextOutputSchema>;
