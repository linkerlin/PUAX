/**
 * PUAX Hook 系统工具处理器
 * 处理所有 Hook 相关的 MCP 工具调用
 */

import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { hookManager } from './hooks/hook-manager.js';
import { stateManager } from './hooks/state-manager.js';
import { feedbackSystem } from './hooks/feedback-system.js';
import { enhancedTriggerDetector, TRIGGER_PATTERNS, ROLE_RECOMMENDATIONS } from './hooks/trigger-detector-enhanced.js';
import { pressureSystem } from './hooks/pressure-system.js';

// ============================================================================
// Hook 会话管理处理器
// ============================================================================

export async function handleStartSession(args: any): Promise<any> {
  const { sessionId, metadata, autoCheck } = args;
  
  hookManager.startSession(sessionId, metadata);
  const state = stateManager.getSessionState(sessionId);
  const isRestored = state.failureCount > 0 || state.pressureLevel > 0;

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
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
      }, null, 2)
    }]
  };
}

export async function handleEndSession(args: any): Promise<any> {
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

  let report = null;
  if (generateReport) {
    report = feedbackSystem.generatePUALoopReport(sessionId);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        sessionId,
        feedbackReceived: !!feedback,
        report
      }, null, 2)
    }]
  };
}

export async function handleGetSessionState(args: any): Promise<any> {
  const { sessionId } = args;
  const state = stateManager.getSessionState(sessionId);
  const triggerHistory = stateManager.getTriggerHistory(sessionId);
  const feedbackHistory = stateManager.getFeedbackHistory(sessionId);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
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
      }, null, 2)
    }]
  };
}

export async function handleResetSession(args: any): Promise<any> {
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

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        sessionId,
        resetType,
        previousState: {
          pressureLevel: previousState.pressureLevel,
          failureCount: previousState.failureCount
        },
        message: `会话已重置 (${resetType})`
      }, null, 2)
    }]
  };
}

// ============================================================================
// Hook 触发检测处理器
// ============================================================================

export async function handleDetectTriggerEnhanced(args: any): Promise<any> {
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

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
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
      }, null, 2)
    }]
  };
}

export async function handleQuickDetect(args: any): Promise<any> {
  const { sessionId, text, context } = args;
  const eventType = context?.toolName ? 'PostToolUse' : 'UserPromptSubmit';
  
  const result = await enhancedTriggerDetector.detect({
    sessionId: sessionId || `quick_${Date.now()}`,
    eventType,
    message: text,
    toolName: context?.toolName,
    toolResult: context?.toolResult,
    errorMessage: context?.errorMessage
  });

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        triggered: result.triggered,
        triggerType: result.triggerType,
        confidence: result.confidence,
        severity: result.severity,
        recommendedRole: result.recommendedRole,
        injectionPrompt: result.injectionPrompt,
        metadata: result.metadata
      }, null, 2)
    }]
  };
}

// ============================================================================
// Hook 反馈处理器
// ============================================================================

export async function handleSubmitFeedback(args: any): Promise<any> {
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

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        sessionId,
        message: '反馈已提交，感谢您的评价！'
      }, null, 2)
    }]
  };
}

export async function handleGetFeedbackSummary(args: any): Promise<any> {
  const { days, sessionId } = args;
  
  if (sessionId) {
    const report = feedbackSystem.generateSessionReport(sessionId);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          type: 'session',
          ...report
        }, null, 2)
      }]
    };
  }

  const summary = feedbackSystem.getFeedbackSummary(days);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        type: 'summary',
        period: `${days} days`,
        ...summary
      }, null, 2)
    }]
  };
}

export async function handleGetImprovementSuggestions(): Promise<any> {
  const suggestions = feedbackSystem.generateImprovementSuggestions();

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        suggestions,
        generatedAt: new Date().toISOString(),
        count: suggestions.length
      }, null, 2)
    }]
  };
}

export async function handleExportFeedback(args: any): Promise<any> {
  const { format, days } = args;
  const data = feedbackSystem.exportFeedbackData(format);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        format,
        data,
        exportedAt: new Date().toISOString()
      }, null, 2)
    }]
  };
}

export async function handleGeneratePUALoopReport(args: any): Promise<any> {
  const { sessionId } = args;
  const report = feedbackSystem.generatePUALoopReport(sessionId);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        sessionId,
        report,
        generatedAt: new Date().toISOString()
      }, null, 2)
    }]
  };
}

// ============================================================================
// 压力系统处理器
// ============================================================================

export async function handleGetPressureLevel(args: any): Promise<any> {
  const { sessionId } = args;
  const level = stateManager.getPressureLevel(sessionId);
  const response = pressureSystem.getCurrentResponse(sessionId);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        sessionId,
        pressureLevel: level,
        response,
        nextEscalationAt: level < 4 ? stateManager.getFailureCount(sessionId) + 1 : null
      }, null, 2)
    }]
  };
}

export async function handleEscalatePressure(args: any): Promise<any> {
  const { sessionId } = args;
  const newLevel = stateManager.escalatePressure(sessionId);
  const response = pressureSystem.getCurrentResponse(sessionId);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        sessionId,
        previousLevel: newLevel - 1,
        currentLevel: newLevel,
        response,
        action: 'escalated'
      }, null, 2)
    }]
  };
}

export async function handleDeescalatePressure(args: any): Promise<any> {
  const { sessionId } = args;
  const newLevel = stateManager.deescalatePressure(sessionId);
  const response = pressureSystem.getCurrentResponse(sessionId);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        sessionId,
        previousLevel: newLevel + 1,
        currentLevel: newLevel,
        response,
        action: 'deescalated'
      }, null, 2)
    }]
  };
}

// ============================================================================
// 工具路由表
// ============================================================================

export const hookToolHandlers: Record<string, (args: any) => Promise<any>> = {
  // 会话管理
  'puax_start_session': handleStartSession,
  'puax_end_session': handleEndSession,
  'puax_get_session_state': handleGetSessionState,
  'puax_reset_session': handleResetSession,
  
  // 触发检测
  'puax_detect_trigger': handleDetectTriggerEnhanced,
  'puax_quick_detect': handleQuickDetect,
  
  // 反馈
  'puax_submit_feedback': handleSubmitFeedback,
  'puax_get_feedback_summary': handleGetFeedbackSummary,
  'puax_get_improvement_suggestions': handleGetImprovementSuggestions,
  'puax_export_feedback': handleExportFeedback,
  'puax_generate_pua_loop_report': handleGeneratePUALoopReport,
  
  // 压力管理
  'puax_get_pressure_level': handleGetPressureLevel,
  'puax_escalate_pressure': handleEscalatePressure,
  'puax_deescalate_pressure': handleDeescalatePressure
};
