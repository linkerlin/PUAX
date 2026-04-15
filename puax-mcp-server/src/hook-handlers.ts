/**
 * PUAX Hook 系统工具处理器
 * 处理所有 Hook 相关的 MCP 工具调用
 */

import { hookManager } from './hooks/hook-manager.js';
import { stateManager } from './hooks/state-manager.js';
import { feedbackSystem } from './hooks/feedback-system.js';
import { enhancedTriggerDetector } from './hooks/trigger-detector-enhanced.js';
import { pressureSystem } from './hooks/pressure-system.js';
import type { HookEventType } from './hooks/trigger-detector-enhanced.js';

// ============================================================================
// MCP 响应类型
// ============================================================================

interface McpToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

function textResponse(data: unknown): McpToolResponse {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(data, null, 2)
    }]
  };
}

// ============================================================================
// Handler 参数类型
// ============================================================================

interface StartSessionArgs {
  sessionId: string;
  metadata?: Record<string, unknown>;
}

interface EndSessionArgs {
  sessionId: string;
  feedback?: {
    success: boolean;
    rating: number;
    comments?: string;
  };
  generateReport?: boolean;
}

interface SessionIdArgs {
  sessionId: string;
}

interface ResetSessionArgs {
  sessionId: string;
  resetType: 'failures' | 'pressure' | 'all';
}

interface DetectTriggerArgs {
  sessionId: string;
  eventType: HookEventType;
  message?: string;
  toolName?: string;
  toolResult?: unknown;
  errorMessage?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  metadata?: Record<string, unknown>;
}

interface QuickDetectArgs {
  sessionId?: string;
  text: string;
  context?: {
    toolName?: string;
    toolResult?: unknown;
    errorMessage?: string;
  };
}

interface SubmitFeedbackArgs {
  sessionId: string;
  success: boolean;
  rating: number;
  comments?: string;
  assessments?: Record<string, unknown>;
}

interface FeedbackSummaryArgs {
  days?: number;
  sessionId?: string;
}

interface ExportFeedbackArgs {
  format?: 'json' | 'csv';
  days?: number;
}

// ============================================================================
// Hook 会话管理处理器
// ============================================================================

export function handleStartSession(args: StartSessionArgs): McpToolResponse {
  const { sessionId, metadata } = args;
  
  hookManager.startSession(sessionId, metadata);
  const state = stateManager.getSessionState(sessionId);
  const isRestored = state.failureCount > 0 || state.pressureLevel > 0;

  return textResponse({
    success: true,
    sessionId,
    state: {
      pressureLevel: state.pressureLevel,
      failureCount: state.failureCount,
      triggerCount: state.triggerCount
    },
    restored: isRestored,
    message: isRestored 
      ? `会话已恢复。上次压力等级: L${state.pressureLevel}, 失败计数: ${state.failureCount}`
      : '新会话已启动'
  });
}

export async function handleEndSession(args: EndSessionArgs): Promise<McpToolResponse> {
  const { sessionId, feedback, generateReport } = args;
  
  if (feedback) {
    feedbackSystem.quickFeedback(
      sessionId,
      feedback.success,
      feedback.rating,
      feedback.comments
    );
  }

  await hookManager.endSession(sessionId);

  let report: string | null = null;
  if (generateReport) {
    report = feedbackSystem.generatePUALoopReport(sessionId);
  }

  return textResponse({
    success: true,
    sessionId,
    feedbackReceived: !!feedback,
    report
  });
}

export function handleGetSessionState(args: SessionIdArgs): McpToolResponse {
  const { sessionId } = args;
  const state = stateManager.getSessionState(sessionId);
  const triggerHistory = stateManager.getTriggerHistory(sessionId);
  const feedbackHistory = stateManager.getFeedbackHistory(sessionId);

  return textResponse({
    sessionId,
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
    triggerHistory: triggerHistory.slice(-5),
    feedbackHistory,
    isActive: hookManager.getActiveSessions().includes(sessionId)
  });
}

export function handleResetSession(args: ResetSessionArgs): McpToolResponse {
  const { sessionId, resetType } = args;
  const state = stateManager.getSessionState(sessionId);
  const previousState = { ...state };

  switch (resetType) {
    case 'failures':
      stateManager.resetFailureCount(sessionId);
      break;
    case 'pressure':
      stateManager.setPressureLevel(sessionId, 0);
      break;
    case 'all':
      stateManager.resetFailureCount(sessionId);
      stateManager.setPressureLevel(sessionId, 0);
      break;
  }

  return textResponse({
    success: true,
    sessionId,
    resetType,
    previousState: {
      pressureLevel: previousState.pressureLevel,
      failureCount: previousState.failureCount
    },
    message: `会话已重置 (${resetType})`
  });
}

// ============================================================================
// Hook 触发检测处理器
// ============================================================================

export async function handleDetectTriggerEnhanced(args: DetectTriggerArgs): Promise<McpToolResponse> {
  const result = await enhancedTriggerDetector.detect({
    sessionId: args.sessionId,
    eventType: args.eventType,
    message: args.message,
    toolName: args.toolName,
    toolResult: args.toolResult,
    errorMessage: args.errorMessage,
    conversationHistory: args.conversationHistory,
    metadata: args.metadata
  });

  const sessionState = stateManager.getSessionState(args.sessionId);
  
  let action: string = 'none';
  if (result.triggered) {
    if (result.severity === 'critical' || result.severity === 'high') {
      action = 'immediate';
    } else if (result.severity === 'medium') {
      action = 'suggest';
    } else {
      action = 'monitor';
    }
  }

  return textResponse({
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
  });
}

export async function handleQuickDetect(args: QuickDetectArgs): Promise<McpToolResponse> {
  const { sessionId, text, context } = args;
  const eventType: HookEventType = context?.toolName ? 'PostToolUse' : 'UserPromptSubmit';
  
  const result = await enhancedTriggerDetector.detect({
    sessionId: sessionId || `quick_${Date.now()}`,
    eventType,
    message: text,
    toolName: context?.toolName,
    toolResult: context?.toolResult,
    errorMessage: context?.errorMessage
  });

  return textResponse({
    triggered: result.triggered,
    triggerType: result.triggerType,
    confidence: result.confidence,
    severity: result.severity,
    recommendedRole: result.recommendedRole,
    injectionPrompt: result.injectionPrompt,
    metadata: result.metadata
  });
}

// ============================================================================
// Hook 反馈处理器
// ============================================================================

export function handleSubmitFeedback(args: SubmitFeedbackArgs): McpToolResponse {
  const { sessionId, success, rating, comments, assessments } = args;
  
  feedbackSystem.collectFeedback({
    sessionId,
    success,
    rating,
    comments,
    pressureLevel: 0,
    triggerCount: 0,
    assessments
  });

  return textResponse({
    success: true,
    sessionId,
    message: '反馈已提交，感谢您的评价！'
  });
}

export function handleGetFeedbackSummary(args: FeedbackSummaryArgs): McpToolResponse {
  const { days, sessionId } = args;
  
  if (sessionId) {
    const report = feedbackSystem.generateSessionReport(sessionId);
    return textResponse({
      type: 'session',
      ...report
    });
  }

  const summary = feedbackSystem.getFeedbackSummary(days);
  return textResponse({
    type: 'summary',
    period: `${days ?? 30} days`,
    ...summary
  });
}

export function handleGetImprovementSuggestions(): McpToolResponse {
  const suggestions = feedbackSystem.generateImprovementSuggestions();

  return textResponse({
    suggestions,
    generatedAt: new Date().toISOString(),
    count: suggestions.length
  });
}

export function handleExportFeedback(args: ExportFeedbackArgs): McpToolResponse {
  const data = feedbackSystem.exportFeedbackData(args.format);

  return textResponse({
    format: args.format ?? 'json',
    data,
    exportedAt: new Date().toISOString()
  });
}

export function handleGeneratePUALoopReport(args: SessionIdArgs): McpToolResponse {
  const report = feedbackSystem.generatePUALoopReport(args.sessionId);

  return textResponse({
    sessionId: args.sessionId,
    report,
    generatedAt: new Date().toISOString()
  });
}

// ============================================================================
// 压力系统处理器
// ============================================================================

export function handleGetPressureLevel(args: SessionIdArgs): McpToolResponse {
  const { sessionId } = args;
  const level = stateManager.getPressureLevel(sessionId);
  const response = pressureSystem.getCurrentResponse(sessionId);

  return textResponse({
    sessionId,
    pressureLevel: level,
    response,
    nextEscalationAt: level < 4 ? stateManager.getFailureCount(sessionId) + 1 : null
  });
}

export function handleEscalatePressure(args: SessionIdArgs): McpToolResponse {
  const { sessionId } = args;
  const newLevel = stateManager.escalatePressure(sessionId);
  const response = pressureSystem.getCurrentResponse(sessionId);

  return textResponse({
    sessionId,
    previousLevel: newLevel - 1,
    currentLevel: newLevel,
    response,
    action: 'escalated'
  });
}

export function handleDeescalatePressure(args: SessionIdArgs): McpToolResponse {
  const { sessionId } = args;
  const newLevel = stateManager.deescalatePressure(sessionId);
  const response = pressureSystem.getCurrentResponse(sessionId);

  return textResponse({
    sessionId,
    previousLevel: newLevel + 1,
    currentLevel: newLevel,
    response,
    action: 'deescalated'
  });
}

// ============================================================================
// 工具路由表
// ============================================================================

export const hookToolHandlers: Record<string, (args: unknown) => Promise<McpToolResponse> | McpToolResponse> = {
  // 会话管理
  'puax_start_session': handleStartSession as (args: unknown) => McpToolResponse,
  'puax_end_session': handleEndSession as (args: unknown) => Promise<McpToolResponse>,
  'puax_get_session_state': handleGetSessionState as (args: unknown) => McpToolResponse,
  'puax_reset_session': handleResetSession as (args: unknown) => McpToolResponse,
  
  // 触发检测
  'puax_detect_trigger': handleDetectTriggerEnhanced as (args: unknown) => Promise<McpToolResponse>,
  'puax_quick_detect': handleQuickDetect as (args: unknown) => Promise<McpToolResponse>,
  
  // 反馈
  'puax_submit_feedback': handleSubmitFeedback as (args: unknown) => McpToolResponse,
  'puax_get_feedback_summary': handleGetFeedbackSummary as (args: unknown) => McpToolResponse,
  'puax_get_improvement_suggestions': handleGetImprovementSuggestions as (_args: unknown) => McpToolResponse,
  'puax_export_feedback': handleExportFeedback as (args: unknown) => McpToolResponse,
  'puax_generate_pua_loop_report': handleGeneratePUALoopReport as (args: unknown) => McpToolResponse,
  
  // 压力管理
  'puax_get_pressure_level': handleGetPressureLevel as (args: unknown) => McpToolResponse,
  'puax_escalate_pressure': handleEscalatePressure as (args: unknown) => McpToolResponse,
  'puax_deescalate_pressure': handleDeescalatePressure as (args: unknown) => McpToolResponse
};
