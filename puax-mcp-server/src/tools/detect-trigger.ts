#!/usr/bin/env node
/**
 * MCP Tool: detect_trigger
 * 检测对话中是否存在需要激励的触发条件
 */

import { z } from 'zod';
import { TriggerDetector } from '../core/trigger-detector';

// ============================================================================
// 输入输出Schema定义
// ============================================================================

const DetectTriggerInputSchema = z.object({
  conversation_history: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })).describe('对话历史记录'),
  
  task_context: z.object({
    current_task: z.string().optional().describe('当前任务描述'),
    attempt_count: z.number().default(0).describe('尝试次数'),
    tools_available: z.array(z.string()).default([]).describe('可用工具列表'),
    tools_used: z.array(z.string()).default([]).describe('已使用工具列表')
  }).optional().describe('任务上下文信息'),
  
  options: z.object({
    sensitivity: z.enum(['low', 'medium', 'high']).default('medium')
      .describe('检测灵敏度'),
    language: z.enum(['zh', 'en', 'auto']).default('auto')
      .describe('检测语言')
  }).optional().describe('检测选项')
});

const DetectTriggerOutputSchema = z.object({
  triggers_detected: z.array(z.object({
    id: z.string(),
    name: z.string(),
    confidence: z.number(),
    matched_patterns: z.array(z.string()),
    severity: z.string(),
    category: z.string()
  })),
  summary: z.object({
    should_trigger: z.boolean(),
    overall_severity: z.string(),
    recommended_action: z.enum(['immediate_activation', 'suggest_activation', 'monitor', 'none'])
  })
});

// ============================================================================
// 工具定义
// ============================================================================

export const detectTriggerTool = {
  name: 'detect_trigger',
  description: '分析对话上下文，自动检测是否存在需要PUAX激励的触发条件。' +
    '支持检测14种触发条件：连续失败、放弃语言、甩锅行为、磨洋工、被动等待、用户沮丧等。' +
    '返回检测到的触发条件、置信度和推荐行动。',
  
  inputSchema: DetectTriggerInputSchema,
  
  outputSchema: DetectTriggerOutputSchema,

  examples: [
    {
      name: '检测用户沮丧',
      input: {
        conversation_history: [
          { role: 'assistant', content: '尝试连接API...失败' },
          { role: 'assistant', content: '再试一次...还是失败' },
          { role: 'user', content: '为什么还不行？' }
        ],
        task_context: {
          current_task: 'debugging API connection',
          attempt_count: 2
        }
      }
    },
    {
      name: '检测甩锅行为',
      input: {
        conversation_history: [
          { role: 'assistant', content: '这个问题可能是环境配置导致的，建议您手动检查一下。' }
        ],
        options: { sensitivity: 'high' }
      }
    }
  ],

  handler: async (args: z.infer<typeof DetectTriggerInputSchema>) => {
    try {
      const detector = new TriggerDetector(args.options);
      const result = await detector.detect(
        args.conversation_history,
        args.task_context
      );
      
      return result;
    } catch (error) {
      console.error('Error in detect_trigger:', error);
      throw new Error(`Trigger detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// 导出类型
export type DetectTriggerInput = z.infer<typeof DetectTriggerInputSchema>;
export type DetectTriggerOutput = z.infer<typeof DetectTriggerOutputSchema>;
