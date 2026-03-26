/**
 * PUAX MCP Server - Hook System Tool Handlers
 * Handles Hook System v2.2.0 MCP tool calls
 */

import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { stateManager, type FeedbackRecord } from '../hooks/state-manager.js';
import { feedbackSystem, type SessionFeedback } from '../hooks/feedback-system.js';
import { EnhancedTriggerDetector, type TriggerContext } from '../hooks/trigger-detector-enhanced.js';
import type { ToolResponse } from '../types.js';

// Hook System tool handlers registry
export const hookToolHandlers: Record<string, (args: Record<string, unknown>) => ToolResponse | Promise<ToolResponse>> = {
    puax_start_session: handleStartSession,
    puax_end_session: handleEndSession,
    puax_get_session_state: handleGetSessionState,
    puax_reset_session: handleResetSession,
    puax_detect_trigger: handleDetectTrigger,
    puax_quick_detect: handleQuickDetect,
    puax_submit_feedback: handleSubmitFeedback,
    puax_get_feedback_summary: handleGetFeedbackSummary,
    puax_get_improvement_suggestions: handleGetImprovementSuggestions,
    puax_generate_pua_loop_report: handleGeneratePuaLoopReport,
    puax_export_feedback: handleExportFeedback,
    puax_get_pressure_level: handleGetPressureLevel
};

function handleStartSession(args: Record<string, unknown>): ToolResponse {
    const sessionId = (args.session_id as string) || crypto.randomUUID();
    const initialContext = (args.initial_context as Record<string, unknown>) || {};
    
    // Create or get session state
    const state = stateManager.getSessionState(sessionId);
    
    // Update with initial context if provided
    if (initialContext.activeRole) {
        state.activeRole = initialContext.activeRole as string;
    }
    if (initialContext.currentFlavor) {
        state.currentFlavor = initialContext.currentFlavor as string;
    }
    stateManager.saveSessionState(state);
    
    return {
        content: [{
            type: 'text',
            text: JSON.stringify({
                success: true,
                session_id: sessionId,
                state: {
                    pressureLevel: state.pressureLevel,
                    failureCount: state.failureCount,
                    triggerCount: state.triggerCount
                },
                message: 'Session started successfully'
            }, null, 2)
        }]
    };
}

function handleEndSession(args: Record<string, unknown>): ToolResponse {
    const sessionId = args.session_id as string;
    
    if (!sessionId) {
        throw new McpError(ErrorCode.InvalidParams, 'session_id is required');
    }
    
    // Clear session state
    stateManager.clearSessionState(sessionId);
    
    return {
        content: [{
            type: 'text',
            text: JSON.stringify({
                success: true,
                message: 'Session ended successfully'
            }, null, 2)
        }]
    };
}

function handleGetSessionState(args: Record<string, unknown>): ToolResponse {
    const sessionId = args.session_id as string;
    
    if (!sessionId) {
        throw new McpError(ErrorCode.InvalidParams, 'session_id is required');
    }
    
    const state = stateManager.getSessionState(sessionId);
    
    return {
        content: [{
            type: 'text',
            text: JSON.stringify({
                session_id: sessionId,
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
                exists: true
            }, null, 2)
        }]
    };
}

function handleResetSession(args: Record<string, unknown>): ToolResponse {
    const sessionId = args.session_id as string;
    
    if (!sessionId) {
        throw new McpError(ErrorCode.InvalidParams, 'session_id is required');
    }
    
    // Reset by clearing and recreating
    stateManager.clearSessionState(sessionId);
    const newState = stateManager.getSessionState(sessionId);
    
    return {
        content: [{
            type: 'text',
            text: JSON.stringify({
                success: true,
                session_id: sessionId,
                state: {
                    pressureLevel: newState.pressureLevel,
                    failureCount: newState.failureCount,
                    triggerCount: newState.triggerCount
                },
                message: 'Session reset successfully'
            }, null, 2)
        }]
    };
}

async function handleDetectTrigger(args: Record<string, unknown>): Promise<ToolResponse> {
    const sessionId = args.session_id as string;
    const context = (args.context as Record<string, unknown>) || {};
    
    if (!sessionId) {
        throw new McpError(ErrorCode.InvalidParams, 'session_id is required');
    }
    
    const detector = new EnhancedTriggerDetector();
    
    const triggerContext: TriggerContext = {
        sessionId,
        eventType: (context.event_type as TriggerContext['eventType']) || 'UserPromptSubmit',
        message: context.message as string,
        toolName: context.tool_name as string,
        toolResult: context.tool_result,
        errorMessage: context.error_message as string,
        conversationHistory: context.conversation_history as Array<{ role: string; content: string }>,
        metadata: context.metadata as Record<string, unknown>
    };
    
    const result = await detector.detect(triggerContext);
    
    // Record trigger if detected
    if (result.triggered) {
        stateManager.recordTrigger(
            sessionId,
            result.triggerType,
            result.confidence,
            result.recommendedRole.id,
            result.pressureLevel || 0
        );
    }
    
    return {
        content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
        }]
    };
}

async function handleQuickDetect(args: Record<string, unknown>): Promise<ToolResponse> {
    const message = args.message as string;
    
    if (!message) {
        throw new McpError(ErrorCode.InvalidParams, 'message is required');
    }
    
    // Create a temporary session for quick detection
    const tempSessionId = crypto.randomUUID();
    const detector = new EnhancedTriggerDetector();
    
    const result = await detector.detect({
        sessionId: tempSessionId,
        eventType: 'UserPromptSubmit',
        message
    });
    
    return {
        content: [{
            type: 'text',
            text: JSON.stringify({
                triggered: result.triggered,
                trigger_type: result.triggerType,
                confidence: result.confidence,
                severity: result.severity,
                recommended_role: result.recommendedRole,
                metadata: result.metadata
            }, null, 2)
        }]
    };
}

function handleSubmitFeedback(args: Record<string, unknown>): ToolResponse {
    const sessionId = args.session_id as string;
    const feedback = args.feedback as {
        success: boolean;
        rating?: number;
        comments?: string;
        assessments?: {
            roleHelpfulness?: number;
            pressureAppropriate?: number;
            methodologySwitchHelpful?: boolean;
            wouldRecommend?: boolean;
        };
    };
    
    if (!sessionId) {
        throw new McpError(ErrorCode.InvalidParams, 'session_id is required');
    }
    
    if (!feedback) {
        throw new McpError(ErrorCode.InvalidParams, 'feedback is required');
    }
    
    const state = stateManager.getSessionState(sessionId);
    
    const sessionFeedback: SessionFeedback = {
        sessionId,
        success: feedback.success,
        rating: feedback.rating || (feedback.success ? 4 : 2),
        pressureLevel: state.pressureLevel,
        triggerCount: state.triggerCount,
        comments: feedback.comments,
        assessments: feedback.assessments
    };
    
    feedbackSystem.collectFeedback(sessionFeedback);
    
    // Also record in state manager
    stateManager.recordFeedback(sessionId, {
        pressureLevel: state.pressureLevel,
        rating: sessionFeedback.rating,
        success: feedback.success,
        comments: feedback.comments
    });
    
    return {
        content: [{
            type: 'text',
            text: JSON.stringify({
                success: true,
                message: 'Feedback submitted successfully',
                session_id: sessionId,
                recorded: {
                    success: feedback.success,
                    rating: sessionFeedback.rating,
                    pressure_level: state.pressureLevel
                }
            }, null, 2)
        }]
    };
}

function handleGetFeedbackSummary(args: Record<string, unknown>): ToolResponse {
    const days = (args.days as number) || 30;
    
    const summary = feedbackSystem.getFeedbackSummary(days);
    
    return {
        content: [{
            type: 'text',
            text: JSON.stringify(summary, null, 2)
        }]
    };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleGetImprovementSuggestions(_args: Record<string, unknown>): ToolResponse {
    const suggestions = feedbackSystem.generateImprovementSuggestions();
    
    return {
        content: [{
            type: 'text',
            text: JSON.stringify({
                suggestions: suggestions,
                total: suggestions.length,
                generated_at: new Date().toISOString()
            }, null, 2)
        }]
    };
}

function handleGeneratePuaLoopReport(args: Record<string, unknown>): ToolResponse {
    const sessionId = args.session_id as string;
    
    if (!sessionId) {
        throw new McpError(ErrorCode.InvalidParams, 'session_id is required');
    }
    
    const report = feedbackSystem.generateSessionReport(sessionId);
    
    if (!report) {
        throw new McpError(
            ErrorCode.InvalidParams,
            `No report available for session: ${sessionId}`
        );
    }
    
    return {
        content: [{
            type: 'text',
            text: JSON.stringify(report, null, 2)
        }]
    };
}

function handleExportFeedback(args: Record<string, unknown>): ToolResponse {
    const format = (args.format as string) || 'json';
    
    const allFeedback = stateManager.getFeedbackHistory();
    
    let output: string;
    if (format === 'csv') {
        // Simple CSV conversion
        const headers = 'timestamp,session_id,pressure_level,rating,success,comments\n';
        const rows = allFeedback.map((r: FeedbackRecord) => 
            `${r.timestamp},${r.sessionId},${r.pressureLevel},${r.rating},${r.success},"${(r.comments || '').replace(/"/g, '""')}"`
        ).join('\n');
        output = headers + rows;
    } else {
        output = JSON.stringify({
            exported_at: new Date().toISOString(),
            total_records: allFeedback.length,
            records: allFeedback
        }, null, 2);
    }
    
    return {
        content: [{
            type: 'text',
            text: output
        }]
    };
}

function handleGetPressureLevel(args: Record<string, unknown>): ToolResponse {
    const sessionId = args.session_id as string;
    
    if (!sessionId) {
        throw new McpError(ErrorCode.InvalidParams, 'session_id is required');
    }
    
    const state = stateManager.getSessionState(sessionId);
    
    return {
        content: [{
            type: 'text',
            text: JSON.stringify({
                session_id: sessionId,
                pressure_level: state.pressureLevel,
                pressure_name: getPressureName(state.pressureLevel),
                failure_count: state.failureCount,
                trigger_count: state.triggerCount,
                next_escalation_threshold: getNextThreshold(state.pressureLevel)
            }, null, 2)
        }]
    };
}

function getPressureName(level: number): string {
    const names: Record<number, string> = {
        0: 'Normal',
        1: 'Elevated',
        2: 'High',
        3: 'Critical',
        4: 'Emergency'
    };
    return names[level] || 'Unknown';
}

function getNextThreshold(level: number): string {
    const thresholds: Record<number, string> = {
        0: 'First trigger will escalate to L1',
        1: 'Additional triggers may escalate to L2',
        2: 'Additional triggers may escalate to L3',
        3: 'Additional triggers may escalate to L4 (Maximum)'
    };
    return thresholds[level] || 'Maximum level reached';
}
