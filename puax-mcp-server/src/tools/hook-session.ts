#!/usr/bin/env node
/**
 * MCP Tools: Hook 会话管理
 * 
 * 提供会话生命周期管理工具:
 * - start_session: 启动会话
 * - end_session: 结束会话并收集反馈
 * - get_session_state: 获取会话状态
 */

import { z } from 'zod';
import { hookManager } from '../hooks/hook-manager.js';
import { stateManager } from '../hooks/state-manager.js';
import { feedbackSystem } from '../hooks/feedback-system.js';

// ============================================================================
// start_session
// ============================================================================

const StartSessionInputSchema = z.object({
  sessionId: z.string().describe('会话ID'),
  metadata: z.record(z.unknown()).optional().describe('初始元数据'),
  autoCheck: z.boolean().default(true).describe('是否启用自动检查')
});

export const startSessionTool = {
  name: 'puax_start_session',
  description: '启动一个新的PUAX会话，初始化状态监控。',
  
  inputSchema: StartSessionInputSchema,
  
  handler: (args: z.infer<typeof StartSessionInputSchema>) => {
    try {
      // 启动会话监控
      hookManager.startSession(args.sessionId, args.metadata);
      
      // 获取恢复的状态
      const state = stateManager.getSessionState(args.sessionId);
      const isRestored = state.failureCount > 0 || state.pressureLevel > 0;

      return {
        success: true,
        sessionId: args.sessionId,
        state: {
          pressureLevel: state.pressureLevel,
          failureCount: state.failureCount,
          triggerCount: state.triggerCount
        },
        restored: isRestored,
        message: isRestored 
          ? `会话已恢复。上次压力等级: L${state.pressureLevel}, 失败计数: ${state.failureCount}`
          : '新会话已启动'
      };
    } catch (error) {
      console.error('[start_session] Error:', error);
      throw new Error(`Failed to start session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// ============================================================================
// end_session
// ============================================================================

const EndSessionInputSchema = z.object({
  sessionId: z.string().describe('会话ID'),
  feedback: z.object({
    success: z.boolean().describe('会话是否成功完成'),
    rating: z.number().min(1).max(5).describe('满意度评分 1-5'),
    comments: z.string().optional().describe('反馈评论')
  }).optional().describe('会话反馈'),
  generateReport: z.boolean().default(false).describe('是否生成PUAX Loop报告')
});

export const endSessionTool = {
  name: 'puax_end_session',
  description: '结束PUAX会话，可选收集反馈并生成报告。',
  
  inputSchema: EndSessionInputSchema,
  
  handler: async (args: z.infer<typeof EndSessionInputSchema>) => {
    try {
      // 收集反馈
      if (args.feedback) {
        feedbackSystem.quickFeedback(
          args.sessionId,
          args.feedback.success,
          args.feedback.rating,
          args.feedback.comments
        );
      }

      // 结束会话
      await hookManager.endSession(args.sessionId);

      // 生成报告
      let report = null;
      if (args.generateReport) {
        report = feedbackSystem.generatePUALoopReport(args.sessionId);
      }

      return {
        success: true,
        sessionId: args.sessionId,
        feedbackReceived: !!args.feedback,
        report
      };
    } catch (error) {
      console.error('[end_session] Error:', error);
      throw new Error(`Failed to end session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// ============================================================================
// get_session_state
// ============================================================================

const GetSessionStateInputSchema = z.object({
  sessionId: z.string().describe('会话ID')
});

export const getSessionStateTool = {
  name: 'puax_get_session_state',
  description: '获取当前会话的详细状态，包括压力等级、失败计数等。',
  
  inputSchema: GetSessionStateInputSchema,
  
  handler: (args: z.infer<typeof GetSessionStateInputSchema>) => {
    try {
      const state = stateManager.getSessionState(args.sessionId);
      const triggerHistory = stateManager.getTriggerHistory(args.sessionId);
      const feedbackHistory = stateManager.getFeedbackHistory(args.sessionId);

      return {
        sessionId: args.sessionId,
        state: {
          sessionId: state.sessionId,
          startTime: state.startTime,
          lastActivity: state.lastActivity,
          pressureLevel: state.pressureLevel,
          failureCount: state.failureCount,
          triggerCount: state.triggerCount,
          activeRole: state.activeRole,
          currentFlavor: state.currentFlavor,
          lastTriggerTime: state.lastTriggerTime
        },
        triggerHistory: triggerHistory.slice(-5),  // 最近5条
        feedbackHistory: feedbackHistory,
        isActive: hookManager.getActiveSessions().includes(args.sessionId)
      };
    } catch (error) {
      console.error('[get_session_state] Error:', error);
      throw new Error(`Failed to get session state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// ============================================================================
// reset_session
// ============================================================================

const ResetSessionInputSchema = z.object({
  sessionId: z.string().describe('会话ID'),
  resetType: z.enum(['all', 'failures', 'pressure']).default('all')
    .describe('重置类型: all-全部, failures-仅失败计数, pressure-仅压力等级')
});

export const resetSessionTool = {
  name: 'puax_reset_session',
  description: '重置会话状态。用于清除失败计数或压力等级。',
  
  inputSchema: ResetSessionInputSchema,
  
  handler: (args: z.infer<typeof ResetSessionInputSchema>) => {
    try {
      const state = stateManager.getSessionState(args.sessionId);

      switch (args.resetType) {
        case 'failures':
          stateManager.resetFailureCount(args.sessionId);
          break;
        case 'pressure':
          stateManager.setPressureLevel(args.sessionId, 0);
          break;
        case 'all':
          stateManager.resetFailureCount(args.sessionId);
          stateManager.setPressureLevel(args.sessionId, 0);
          break;
      }

      return {
        success: true,
        sessionId: args.sessionId,
        resetType: args.resetType,
        previousState: {
          pressureLevel: state.pressureLevel,
          failureCount: state.failureCount
        },
        message: `会话已重置 (${args.resetType})`
      };
    } catch (error) {
      console.error('[reset_session] Error:', error);
      throw new Error(`Failed to reset session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// ============================================================================
// 导出
// ============================================================================

export const hookSessionTools = [
  startSessionTool,
  endSessionTool,
  getSessionStateTool,
  resetSessionTool
];

export type StartSessionInput = z.infer<typeof StartSessionInputSchema>;
export type EndSessionInput = z.infer<typeof EndSessionInputSchema>;
export type GetSessionStateInput = z.infer<typeof GetSessionStateInputSchema>;
export type ResetSessionInput = z.infer<typeof ResetSessionInputSchema>;
