/**
 * PUAX 工具守卫（Tool Guard）
 *
 * 将 DeterministicTriggersEngine 的 PreToolUse 拦截能力接入真实工具调用路径。
 * server/core.ts 在每个 puax_* 工具分发前调用本守卫，命中拦截规则即阻断。
 *
 * 历史：deterministic-triggers.ts 的 HIDDEN_FILE_ACCESS_TRIGGER（blocked: true）
 * 长期处于"能拦截但无人调用"状态。v3.11 起在 MCP 分发路径落地（Hook机制演进方案.md
 * Phase 0.4）；宿主侧的真正强制拦截由原生 hook（hook CLI + PreToolUse matcher）承担。
 */

import { deterministicTriggersEngine, TriggerType, type TriggerContext, type TriggerResult } from '../hooks/deterministic-triggers.js';
import { stateManager } from '../hooks/state-manager.js';
import { getGlobalLogger } from '../utils/logger.js';
import type { PressureLevel } from '../agents/index.js';

const logger = getGlobalLogger();

export interface ToolGuardResult {
  blocked: boolean;
  reason?: string;
  recommendations?: string[];
}

/**
 * 拦截检查：在工具分发前调用。
 * 仅评估 PRE_TOOL_USE 类型触发器（防作弊），不评估激励类触发器，
 * 避免对合法工具调用产生无差别干扰。
 */
export function guardToolCall(
  toolName: string,
  args: Record<string, unknown>
): ToolGuardResult {
  const sessionId = typeof args.sessionId === 'string' ? args.sessionId : 'mcp-tool-guard';

  const context: TriggerContext = {
    sessionId,
    eventType: TriggerType.PRE_TOOL_USE,
    toolName,
    toolArgs: args,
    pressureLevel: stateManager.getPressureLevel(sessionId) as PressureLevel,
    failureCount: stateManager.getFailureCount(sessionId),
    timestamp: Date.now(),
    metadata: { source: 'mcp-tool-guard' }
  };

  const result: TriggerResult = deterministicTriggersEngine.evaluate(context);
  if (result.blocked) {
    logger.warn(`[ToolGuard] Blocked tool call "${toolName}": ${result.blockReason}`);
    return {
      blocked: true,
      reason: result.blockReason,
      recommendations: result.recommendations
    };
  }

  return { blocked: false };
}
