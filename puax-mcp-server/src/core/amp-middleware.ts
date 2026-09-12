/**
 * AMP 0.1 Middleware & Orchestrator Integration
 *
 * 依据《发展规划.md》5.4 节 v5.0 前置条件 1：
 * 使编排器（LangChain/LangGraph, AutoGen, CrewAI 及自定义 Agent Loop）
 * 能够将 AMP 0.1 事件、块、闸门与状态作为一等公民消费。
 */

import { stateManager } from "../hooks/state-manager.js";
import { runEvolveCycle, type TickEvent } from "./evolve-cycle.js";
import {
  AMP_SPEC,
  toAmpEnvelope,
  type AmpEnvelope,
  type AmpGate,
} from "./amp.js";
import { globalAntiCheatGuard } from "./anti-cheat-guard.js";

export interface AmpStepContext {
  sessionId: string;
  stepIndex?: number;
  userPrompt?: string;
  assistantMessage?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolResult?: unknown;
  error?: Error | string;
}

export interface AmpGateDecision {
  allowed: boolean;
  gate: AmpGate;
  reason?: string;
  injection?: string;
  envelope: AmpEnvelope;
}

export class AmpMiddleware {
  private defaultSessionId: string;

  constructor(defaultSessionId: string = "default-amp-session") {
    this.defaultSessionId = defaultSessionId;
  }

  /**
   * 会话或回合启动：注入处境与初始运行时心跳
   */
  public onSessionStart(sessionId: string = this.defaultSessionId): AmpEnvelope {
    const tick = runEvolveCycle({
      session_id: sessionId,
      event: "SessionStart",
      force: true,
    });
    return toAmpEnvelope(tick, sessionId, "SessionStart");
  }

  /**
   * 用户输入提交前：评估触发信号与处境设置
   */
  public onUserPrompt(userPrompt: string, sessionId: string = this.defaultSessionId): AmpEnvelope {
    const tick = runEvolveCycle({
      session_id: sessionId,
      event: "UserPromptSubmit",
      message: userPrompt,
    });
    return toAmpEnvelope(tick, sessionId, "UserPromptSubmit");
  }

  /**
   * 工具调用前拦截（PreToolUse）：闸门拦截（防作弊、隐藏文件绕过、跳过验证）
   */
  public onPreToolUse(
    toolName: string,
    toolArgs: Record<string, unknown> = {},
    sessionId: string = this.defaultSessionId
  ): AmpGateDecision {
    const command = typeof toolArgs.command === "string" ? toolArgs.command : "";
    const path = typeof toolArgs.path === "string" ? toolArgs.path : "";

    // 1. 防作弊与破坏性命令强拦截
    const isExec = Boolean(command) || toolName.toLowerCase().includes("bash") || toolName.toLowerCase().includes("exec");
    const destructiveRegex = /(?:rm\s+-[rf]{1,2}|git\s+reset\s+--hard|mkfs|dd\s+if=|\bdrop\s+database\b)/i;
    const isDestructive = (command && destructiveRegex.test(command)) || (path && destructiveRegex.test(path));

    const checkResult = globalAntiCheatGuard.checkAccess({
      operation: isExec ? "execute" : "read",
      path: command || path || "unknown",
      sessionId,
      toolName: toolName.toLowerCase(),
    });

    if (isDestructive || !checkResult.allowed) {
      const envelope: AmpEnvelope = {
        spec: AMP_SPEC,
        events: ["failure"],
        blocks: ["[PUAX-DIAGNOSIS]"],
        gate: "pretooluse",
        state: {
          pressure: Number(stateManager.getPressureLevel(sessionId) || 1),
          arena: true,
          dream: false,
          happened: true,
        },
      };
      return {
        allowed: false,
        gate: "pretooluse",
        reason: checkResult.allowed ? "AMP PreToolUse 闸门拦截高危破坏性命令" : (checkResult.reason || "AMP PreToolUse 闸门拦截违规操作"),
        envelope,
      };
    }

    // 2. 正常演化心跳
    const tick = runEvolveCycle({
      session_id: sessionId,
      event: "Manual",
      tool_name: toolName,
    });

    const env = toAmpEnvelope(tick, sessionId, "Manual");
    return {
      allowed: true,
      gate: env.gate,
      injection: tick.injection,
      envelope: env,
    };
  }

  /**
   * 工具执行完毕后（PostToolUse）：捕获错误、级联失败与突破
   */
  public onPostToolUse(
    toolName: string,
    result: unknown,
    error?: Error | string,
    sessionId: string = this.defaultSessionId
  ): AmpEnvelope {
    const errorMessage = typeof error === "string" ? error : error?.message;
    const isError = Boolean(errorMessage);

    const tick = runEvolveCycle({
      session_id: sessionId,
      event: "PostToolUse",
      tool_name: toolName,
      error_message: errorMessage,
      force: isError,
    });

    return toAmpEnvelope(tick, sessionId, "PostToolUse");
  }

  /**
   * 模型输出产出后：检测敷衍收敛、假装解决，必要时强制施加 verify 闸门或梦议会建议
   */
  public onModelOutput(
    output: string,
    sessionId: string = this.defaultSessionId
  ): { needsVerify: boolean; envelope: AmpEnvelope } {
    const lower = output.toLowerCase();
    const givesUp = lower.includes("我无法完成") || lower.includes("没有办法了") || lower.includes("i cannot solve");
    const premature =
      (lower.includes("应该修复好了") || lower.includes("没有其他问题了") || lower.includes("all tests passed")) &&
      !output.includes("验证步骤") &&
      !output.includes("PASS");

    const event: TickEvent = "Stop";
    const triggers: string[] = [];
    if (givesUp) triggers.push("giving_up_language");
    if (premature) triggers.push("premature_convergence");

    const tick = runEvolveCycle({
      session_id: sessionId,
      event,
      message: output,
      detected_triggers: triggers,
      force: triggers.length > 0,
    });

    const env = toAmpEnvelope(tick, sessionId, event);
    return {
      needsVerify: premature,
      envelope: env,
    };
  }

  /**
   * 上下文压缩前（PreCompact）：保护关键经验与状态
   */
  public onPreCompact(sessionId: string = this.defaultSessionId): AmpEnvelope {
    const tick = runEvolveCycle({
      session_id: sessionId,
      event: "PreCompact",
      force: true,
    });
    return toAmpEnvelope(tick, sessionId, "PreCompact");
  }
}

/**
 * 工厂函数：创建 LangChain / LangGraph 兼容的回调处理器
 */
export function createLangChainAmpCallback(middleware: AmpMiddleware = new AmpMiddleware()) {
  return {
    // eslint-disable-next-line @typescript-eslint/require-await
    handleChainStart: async (_chain: unknown, inputs: Record<string, unknown>, runId: string) => {
      const text = typeof inputs.input === "string" ? inputs.input : JSON.stringify(inputs);
      return middleware.onUserPrompt(text, runId);
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    handleToolStart: async (tool: { name: string }, input: string | Record<string, unknown>, runId: string) => {
      const args = typeof input === "string" ? { command: input } : input;
      const decision = middleware.onPreToolUse(tool.name, args, runId);
      if (!decision.allowed) {
        throw new Error(decision.reason || "Blocked by PUAX AMP Gate");
      }
      return decision;
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    handleToolEnd: async (output: unknown, runId: string) => {
      return middleware.onPostToolUse("unknown-tool", output, undefined, runId);
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    handleToolError: async (err: Error, runId: string) => {
      return middleware.onPostToolUse("unknown-tool", null, err, runId);
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    handleLLMEnd: async (output: { generations: Array<Array<{ text: string }>> }, runId: string) => {
      const text = output?.generations?.[0]?.[0]?.text || "";
      return middleware.onModelOutput(text, runId);
    },
  };
}

/**
 * 工厂函数：创建 Vercel AI SDK 兼容的中间件包装器
 */
export function createVercelAiAmpMiddleware(middleware: AmpMiddleware = new AmpMiddleware()) {
  return {
    // eslint-disable-next-line @typescript-eslint/require-await
    transformParams: async (params: { prompt: string; sessionId?: string }) => {
      const sessionId = params.sessionId || "vercel-ai-session";
      const env = middleware.onUserPrompt(params.prompt, sessionId);
      return {
        ...params,
        ampEnvelope: env,
        injectedPrompt: env.state.arena ? `[PUAX-ARENA] 同任务竞争态已激活。\n${params.prompt}` : params.prompt,
      };
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    onToolCall: async (toolCall: { toolName: string; args: Record<string, unknown>; sessionId?: string }) => {
      const sessionId = toolCall.sessionId || "vercel-ai-session";
      const decision = middleware.onPreToolUse(toolCall.toolName, toolCall.args, sessionId);
      if (!decision.allowed) {
        throw new Error(decision.reason || "Blocked by PUAX AMP Gate");
      }
      return decision;
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    onToolResult: async (toolCall: { toolName: string; result: unknown; error?: Error; sessionId?: string }) => {
      const sessionId = toolCall.sessionId || "vercel-ai-session";
      return middleware.onPostToolUse(toolCall.toolName, toolCall.result, toolCall.error, sessionId);
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    onCompletion: async (text: string, sessionId?: string) => {
      return middleware.onModelOutput(text, sessionId || "vercel-ai-session");
    },
  };
}

/**
 * 工厂函数：创建 LlamaIndex 兼容的回调拦截器
 */
export function createLlamaIndexAmpCallback(middleware: AmpMiddleware = new AmpMiddleware()) {
  return {
    onQueryStart: (query: string, sessionId: string = "llamaindex-session") => {
      return middleware.onUserPrompt(query, sessionId);
    },
    onStepStart: (step: { toolName?: string; toolArgs?: Record<string, unknown> }, sessionId: string = "llamaindex-session") => {
      if (step.toolName) {
        const decision = middleware.onPreToolUse(step.toolName, step.toolArgs || {}, sessionId);
        if (!decision.allowed) {
          throw new Error(decision.reason || "Blocked by PUAX AMP Gate");
        }
        return decision;
      }
      return null;
    },
    onStepEnd: (step: { toolName?: string; result?: unknown; error?: Error }, sessionId: string = "llamaindex-session") => {
      if (step.toolName) {
        return middleware.onPostToolUse(step.toolName, step.result, step.error, sessionId);
      }
      return null;
    },
    onSynthesize: (output: string, sessionId: string = "llamaindex-session") => {
      return middleware.onModelOutput(output, sessionId);
    },
  };
}
