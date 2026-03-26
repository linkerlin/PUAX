#!/usr/bin/env node
/**
 * MCP Tool: detect_trigger (增强版)
 * 集成新的 Hook 系统，全面对齐 PUA 原版能力
 * 
 * 新增功能:
 * - Event-based 触发检测
 * - 压力等级自动升级
 * - 状态持久化
 * - 自动角色推荐
 */

import { z } from 'zod';
import { 
  enhancedTriggerDetector, 
  TriggerContext, 
  HookEventType,
  type EnhancedTriggerResult 
} from '../hooks/trigger-detector-enhanced.js';
import { hookManager } from '../hooks/hook-manager.js';
import { stateManager } from '../hooks/state-manager.js';

// ============================================================================
// 输入输出Schema定义
// ============================================================================

const DetectTriggerInputSchema = z.object({
  sessionId: z.string().describe('会话ID，用于状态跟踪'),
  
  eventType: z.enum(['UserPromptSubmit', 'PostToolUse', 'PreCompact', 'SessionStart', 'Stop'])
    .default('UserPromptSubmit')
    .describe('触发检测的事件类型'),
  
  message: z.string().optional().describe('用户消息内容（UserPromptSubmit时使用）'),
  
  toolName: z.string().optional().describe('工具名称（PostToolUse时使用）'),
  toolResult: z.any().optional().describe('工具返回结果（PostToolUse时使用）'),
  errorMessage: z.string().optional().describe('错误消息'),
  
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })).optional().describe('对话历史记录'),
  
  metadata: z.record(z.any()).optional().describe('额外的上下文信息')
});

const DetectTriggerOutputSchema = z.object({
  triggered: z.boolean().describe('是否触发了PUAX'),
  triggerType: z.string().describe('触发类型'),
  confidence: z.number().describe('置信度'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).describe('严重程度'),
  
  pressureLevel: z.number().optional().describe('当前压力等级 L0-L4'),
  pressureResponse: z.object({
    level: z.number(),
    title: z.string(),
    icon: z.string(),
    message: z.string(),
    requirements: z.array(z.string()),
    checklist: z.array(z.string()).optional(),
    methodologySwitch: z.object({
      recommended: z.array(z.string()),
      reason: z.string()
    }).optional()
  }).optional().describe('压力响应详情'),
  
  recommendedRole: z.object({
    id: z.string(),
    name: z.string()
  }).describe('推荐角色'),
  
  injectionPrompt: z.string().optional().describe('可直接注入的提示词'),
  
  sessionState: z.object({
    failureCount: z.number(),
    triggerCount: z.number(),
    activeRole: z.string().optional()
  }).describe('当前会话状态'),
  
  action: z.enum(['immediate', 'suggest', 'monitor', 'none']).describe('建议行动')
});

// ============================================================================
// 工具定义
// ============================================================================

export const detectTriggerEnhancedTool = {
  name: 'puax_detect_trigger',
  description: '【增强版】检测对话中是否存在需要PUAX激励的触发条件。' +
    '集成新的Hook系统，支持事件驱动检测、压力等级自动升级(L1-L4)、状态持久化。' +
    '支持检测用户挫折语言、Bash失败、表面修复、被动等待等多种触发条件。',
  
  inputSchema: DetectTriggerInputSchema,
  outputSchema: DetectTriggerOutputSchema,

  examples: [
    {
      name: '检测用户沮丧',
      input: {
        sessionId: 'session-001',
        eventType: 'UserPromptSubmit',
        message: '为什么还不行？试了好多次了！'
      }
    },
    {
      name: '检测Bash失败',
      input: {
        sessionId: 'session-001',
        eventType: 'PostToolUse',
        toolName: 'Bash',
        toolResult: { exit_code: 1, stderr: 'command not found' }
      }
    },
    {
      name: '上下文压缩前保存状态',
      input: {
        sessionId: 'session-001',
        eventType: 'PreCompact',
        metadata: {
          currentTask: 'Debugging API connection',
          triedApproaches: ['Check config', 'Verify network'],
          keyContext: 'API key might be expired'
        }
      }
    }
  ],

  handler: async (args: z.infer<typeof DetectTriggerInputSchema>) => {
    try {
      const context: TriggerContext = {
        sessionId: args.sessionId,
        eventType: args.eventType as HookEventType,
        message: args.message,
        toolName: args.toolName,
        toolResult: args.toolResult,
        errorMessage: args.errorMessage,
        conversationHistory: args.conversationHistory,
        metadata: args.metadata
      };

      // 使用新的 Hook 系统检测
      const result = await enhancedTriggerDetector.detect(context);

      // 构建输出
      return buildOutput(result, args.sessionId);
    } catch (error) {
      console.error('[detect_trigger_enhanced] Error:', error);
      throw new Error(`Trigger detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// ============================================================================
// 辅助函数
// ============================================================================

function buildOutput(result: EnhancedTriggerResult, sessionId: string): z.infer<typeof DetectTriggerOutputSchema> {
  const sessionState = stateManager.getSessionState(sessionId);

  let action: 'immediate' | 'suggest' | 'monitor' | 'none' = 'none';
  if (result.triggered) {
    if (result.severity === 'critical' || result.severity === 'high') {
      action = 'immediate';
    } else if (result.severity === 'medium') {
      action = 'suggest';
    } else {
      action = 'monitor';
    }
  }

  return {
    triggered: result.triggered,
    triggerType: result.triggerType,
    confidence: result.confidence,
    severity: result.severity,
    pressureLevel: result.pressureLevel,
    pressureResponse: result.pressureResponse,
    recommendedRole: result.recommendedRole,
    injectionPrompt: result.injectionPrompt,
    sessionState: {
      failureCount: sessionState.failureCount,
      triggerCount: sessionState.triggerCount,
      activeRole: sessionState.activeRole
    },
    action
  };
}

// 导出类型
export type DetectTriggerEnhancedInput = z.infer<typeof DetectTriggerInputSchema>;
export type DetectTriggerEnhancedOutput = z.infer<typeof DetectTriggerOutputSchema>;

// 为了向后兼容，保留旧的工具定义
export const detectTriggerTool = detectTriggerEnhancedTool;
