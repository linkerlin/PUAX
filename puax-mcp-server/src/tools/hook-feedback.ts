#!/usr/bin/env node
/**
 * MCP Tools: Hook 反馈与分析
 * 
 * 提供反馈收集和分析工具:
 * - submit_feedback: 提交反馈
 * - get_feedback_summary: 获取反馈汇总
 * - get_improvement_suggestions: 获取改进建议
 * - export_feedback: 导出反馈数据
 */

import { z } from 'zod';
import { feedbackSystem } from '../hooks/feedback-system.js';

// ============================================================================
// submit_feedback
// ============================================================================

const SubmitFeedbackInputSchema = z.object({
  sessionId: z.string().describe('会话ID'),
  success: z.boolean().describe('会话是否成功完成'),
  rating: z.number().min(1).max(5).describe('满意度评分 1-5'),
  comments: z.string().optional().describe('反馈评论'),
  assessments: z.object({
    roleHelpfulness: z.number().min(1).max(5).optional().describe('角色帮助程度'),
    pressureAppropriate: z.number().min(1).max(5).optional().describe('压力等级合适程度'),
    methodologySwitchHelpful: z.boolean().optional().describe('方法论切换是否有帮助'),
    wouldRecommend: z.boolean().optional().describe('是否愿意再次使用')
  }).optional().describe('详细评估')
});

export const submitFeedbackTool = {
  name: 'puax_submit_feedback',
  description: '提交会话反馈，用于改进PUAX系统。',
  
  inputSchema: SubmitFeedbackInputSchema,
  
  handler: async (args: z.infer<typeof SubmitFeedbackInputSchema>) => {
    try {
      feedbackSystem.collectFeedback({
        sessionId: args.sessionId,
        success: args.success,
        rating: args.rating,
        comments: args.comments,
        pressureLevel: 0, // 会从状态自动获取
        triggerCount: 0,  // 会从状态自动获取
        assessments: args.assessments
      });

      return {
        success: true,
        sessionId: args.sessionId,
        message: '反馈已提交，感谢您的评价！'
      };
    } catch (error) {
      console.error('[submit_feedback] Error:', error);
      throw new Error(`Failed to submit feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// ============================================================================
// get_feedback_summary
// ============================================================================

const GetFeedbackSummaryInputSchema = z.object({
  days: z.number().default(30).describe('统计最近多少天的数据'),
  sessionId: z.string().optional().describe('指定会话ID（可选）')
});

export const getFeedbackSummaryTool = {
  name: 'puax_get_feedback_summary',
  description: '获取反馈汇总统计，包括成功率、平均评分、趋势等。',
  
  inputSchema: GetFeedbackSummaryInputSchema,
  
  handler: async (args: z.infer<typeof GetFeedbackSummaryInputSchema>) => {
    try {
      if (args.sessionId) {
        // 获取单个会话的报告
        const report = feedbackSystem.generateSessionReport(args.sessionId);
        return {
          type: 'session',
          ...report
        };
      }

      // 获取汇总统计
      const summary = feedbackSystem.getFeedbackSummary(args.days);

      return {
        type: 'summary',
        period: `${args.days} days`,
        ...summary
      };
    } catch (error) {
      console.error('[get_feedback_summary] Error:', error);
      throw new Error(`Failed to get feedback summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// ============================================================================
// get_improvement_suggestions
// ============================================================================

export const getImprovementSuggestionsTool = {
  name: 'puax_get_improvement_suggestions',
  description: '基于反馈数据分析，生成系统改进建议。',
  
  inputSchema: z.object({}),
  
  handler: async () => {
    try {
      const suggestions = feedbackSystem.generateImprovementSuggestions();

      return {
        suggestions,
        generatedAt: new Date().toISOString(),
        count: suggestions.length
      };
    } catch (error) {
      console.error('[get_improvement_suggestions] Error:', error);
      throw new Error(`Failed to get suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// ============================================================================
// export_feedback
// ============================================================================

const ExportFeedbackInputSchema = z.object({
  format: z.enum(['json', 'csv']).default('json').describe('导出格式'),
  days: z.number().optional().describe('导出最近多少天的数据')
});

export const exportFeedbackTool = {
  name: 'puax_export_feedback',
  description: '导出反馈数据用于外部分析。',
  
  inputSchema: ExportFeedbackInputSchema,
  
  handler: async (args: z.infer<typeof ExportFeedbackInputSchema>) => {
    try {
      const data = feedbackSystem.exportFeedbackData(args.format);

      return {
        format: args.format,
        data,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[export_feedback] Error:', error);
      throw new Error(`Failed to export feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// ============================================================================
// generate_pua_loop_report
// ============================================================================

const GenerateReportInputSchema = z.object({
  sessionId: z.string().describe('会话ID')
});

export const generatePUALoopReportTool = {
  name: 'puax_generate_pua_loop_report',
  description: '生成PUAX Loop报告（对标原版PUA的PUA Loop）。',
  
  inputSchema: GenerateReportInputSchema,
  
  handler: async (args: z.infer<typeof GenerateReportInputSchema>) => {
    try {
      const report = feedbackSystem.generatePUALoopReport(args.sessionId);

      return {
        sessionId: args.sessionId,
        report,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[generate_pua_loop_report] Error:', error);
      throw new Error(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// ============================================================================
// 导出
// ============================================================================

export const hookFeedbackTools = [
  submitFeedbackTool,
  getFeedbackSummaryTool,
  getImprovementSuggestionsTool,
  exportFeedbackTool,
  generatePUALoopReportTool
];

export type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackInputSchema>;
export type GetFeedbackSummaryInput = z.infer<typeof GetFeedbackSummaryInputSchema>;
export type ExportFeedbackInput = z.infer<typeof ExportFeedbackInputSchema>;
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;
