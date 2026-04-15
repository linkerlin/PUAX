#!/usr/bin/env node
/**
 * MCP Tool: quick_detect
 * 快速检测工具，无需管理会话即可使用
 */

import { z } from 'zod';
import { enhancedTriggerDetector } from '../hooks/trigger-detector-enhanced.js';

const QuickDetectInputSchema = z.object({
  sessionId: z.string().default(`quick_${Date.now()}`).describe('会话ID（可选，自动生成）'),
  text: z.string().describe('要检测的文本'),
  context: z.object({
    toolName: z.string().optional(),
    toolResult: z.unknown().optional(),
    errorMessage: z.string().optional()
  }).optional().describe('额外的上下文')
});

export const quickDetectTool = {
  name: 'puax_quick_detect',
  description: '快速检测文本中是否包含触发条件，无需启动会话。',
  
  inputSchema: QuickDetectInputSchema,
  
  handler: async (args: z.infer<typeof QuickDetectInputSchema>) => {
    try {
      const eventType = args.context?.toolName ? 'PostToolUse' : 'UserPromptSubmit';
      
      const result = await enhancedTriggerDetector.detect({
        sessionId: args.sessionId,
        eventType,
        message: args.text,
        toolName: args.context?.toolName,
        toolResult: args.context?.toolResult,
        errorMessage: args.context?.errorMessage
      });

      return {
        triggered: result.triggered,
        triggerType: result.triggerType,
        confidence: result.confidence,
        severity: result.severity,
        recommendedRole: result.recommendedRole,
        injectionPrompt: result.injectionPrompt,
        metadata: result.metadata
      };
    } catch (error) {
      console.error('[quick_detect] Error:', error);
      throw new Error(`Quick detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

export type QuickDetectInput = z.infer<typeof QuickDetectInputSchema>;
