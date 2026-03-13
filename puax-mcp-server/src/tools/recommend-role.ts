#!/usr/bin/env node
/**
 * MCP Tool: recommend_role
 * 基于上下文推荐最合适的PUAX角色
 */

import { z } from 'zod';
import { RoleRecommender } from '../core/role-recommender.js';

// ============================================================================
// 输入输出Schema定义
// ============================================================================

const RecommendRoleInputSchema = z.object({
  detected_triggers: z.array(z.string())
    .describe('detect_trigger工具检测到的触发条件ID列表'),
  
  task_context: z.object({
    task_type: z.enum([
      'coding', 'debugging', 'writing', 'review', 
      'creative', 'analysis', 'emergency', 'planning'
    ]).describe('任务类型'),
    description: z.string().optional().describe('任务描述'),
    urgency: z.enum(['low', 'medium', 'high', 'critical']).default('medium')
      .describe('紧急程度'),
    attempt_count: z.number().default(0).describe('尝试次数')
  }).describe('任务上下文'),
  
  user_preferences: z.object({
    favorite_roles: z.array(z.string()).default([])
      .describe('用户收藏的角色ID'),
    blacklisted_roles: z.array(z.string()).default([])
      .describe('用户拉黑的角色ID'),
    preferred_tone: z.enum(['aggressive', 'supportive', 'analytical', 'creative'])
      .optional().describe('用户偏好的语调风格'),
    preferred_categories: z.array(z.string()).default([])
      .describe('用户偏好的角色类别')
  }).optional().describe('用户偏好设置'),
  
  session_history: z.object({
    recently_used_roles: z.array(z.string()).default([])
      .describe('最近使用的角色ID'),
    role_success_rates: z.record(z.number()).default({})
      .describe('角色历史成功率'),
    role_usage_count: z.record(z.number()).default({})
      .describe('角色使用次数')
  }).optional().describe('会话历史数据')
});

const RecommendRoleOutputSchema = z.object({
  primary_recommendation: z.object({
    role_id: z.string(),
    role_name: z.string(),
    category: z.string(),
    confidence_score: z.number(),
    match_reasons: z.array(z.string()),
    suggested_flavor: z.string().optional(),
    estimated_effectiveness: z.enum(['low', 'medium', 'high'])
  }),
  alternatives: z.array(z.object({
    role_id: z.string(),
    role_name: z.string(),
    confidence_score: z.number(),
    difference: z.string()
  })),
  activation_suggestion: z.object({
    immediate: z.boolean(),
    cooldown_seconds: z.number(),
    user_confirmation: z.boolean(),
    suggested_prompt_injection: z.string().optional()
  }),
  metadata: z.object({
    identified_failure_mode: z.string().optional(),
    calculation_breakdown: z.record(z.number()),
    algorithm_version: z.string(),
    cache_hit: z.boolean()
  })
});

// ============================================================================
// 工具定义
// ============================================================================

export const recommendRoleTool = {
  name: 'recommend_role',
  description: '基于检测到的触发条件和任务上下文，智能推荐最合适的PUAX角色。' +
    '综合考虑触发条件匹配、任务类型、失败模式、历史表现和用户偏好，' +
    '返回最佳匹配角色及备选方案，包含置信度评分和匹配原因。',
  
  inputSchema: RecommendRoleInputSchema,
  
  outputSchema: RecommendRoleOutputSchema,

  examples: [
    {
      name: '调试场景推荐',
      input: {
        detected_triggers: ['consecutive_failures', 'blame_environment'],
        task_context: {
          task_type: 'debugging',
          description: 'API connection issue',
          urgency: 'high',
          attempt_count: 3
        }
      }
    },
    {
      name: '用户沮丧场景',
      input: {
        detected_triggers: ['user_frustration', 'giving_up_language'],
        task_context: {
          task_type: 'debugging',
          urgency: 'critical',
          attempt_count: 4
        },
        user_preferences: {
          preferred_tone: 'aggressive'
        }
      }
    }
  ],

  handler: async (args: z.infer<typeof RecommendRoleInputSchema>) => {
    try {
      const recommender = new RoleRecommender();
      const result = await recommender.recommend({
        detected_triggers: args.detected_triggers,
        task_context: args.task_context,
        user_preferences: args.user_preferences,
        session_history: args.session_history
      });
      
      return result;
    } catch (error) {
      console.error('Error in recommend_role:', error);
      throw new Error(`Role recommendation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// 导出类型
export type RecommendRoleInput = z.infer<typeof RecommendRoleInputSchema>;
export type RecommendRoleOutput = z.infer<typeof RecommendRoleOutputSchema>;
