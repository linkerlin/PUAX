/**
 * AMP 编排器适配：零新增依赖。
 * 不假装能 `callbacks: [obj]` 挂进未声明的 SDK；每家只包它真正会调的执行面。
 */

import { AmpMiddleware, type AmpGateDecision } from './amp-middleware.js';
import type { AmpEnvelope } from './amp.js';

export interface NamedExecuteTool<A = Record<string, unknown>, R = unknown> {
  name: string;
  execute: (args: A, ...rest: unknown[]) => R | Promise<R>;
}

/** 通用工具 execute 包装：OpenAI Agents / Mastra / 自研 loop 都是这个形状 */
export function wrapToolExecute<A extends Record<string, unknown>, R>(
  tool: NamedExecuteTool<A, R>,
  middleware: AmpMiddleware = new AmpMiddleware(),
  sessionId?: string
): NamedExecuteTool<A, R> {
  const sid = sessionId || middleware.defaultSessionId;
  const orig = tool.execute.bind(tool);
  return {
    ...tool,
    execute: (async (args: A, ...rest: unknown[]) => {
      const decision = middleware.onPreToolUse(tool.name, args, sid);
      if (!decision.allowed) {
        throw new Error(decision.reason || 'Blocked by PUAX AMP Gate');
      }
      try {
        const result = await orig(args, ...rest);
        middleware.onPostToolUse(tool.name, result, undefined, sid);
        return result;
      } catch (err) {
        middleware.onPostToolUse(tool.name, null, err as Error, sid);
        throw err;
      }
    }) as NamedExecuteTool<A, R>['execute'],
  };
}

export function wrapTools<T extends NamedExecuteTool>(
  tools: T[],
  middleware: AmpMiddleware = new AmpMiddleware(),
  sessionId?: string
): T[] {
  return tools.map((t) => wrapToolExecute(t, middleware, sessionId) as T);
}

/** OpenAI Agents SDK：包 `tool({ name, execute })`，不是 Agent.callbacks */
export function createOpenAIAgentsAmpGuard(
  middleware: AmpMiddleware = new AmpMiddleware(),
  sessionId = 'openai-agents-session'
) {
  return {
    wrapTool: <A extends Record<string, unknown>, R>(tool: NamedExecuteTool<A, R>) =>
      wrapToolExecute(tool, middleware, sessionId),
    wrapTools: <T extends NamedExecuteTool>(tools: T[]) => wrapTools(tools, middleware, sessionId),
    onUserMessage: (text: string, sid: string = sessionId) => middleware.onUserPrompt(text, sid),
    onAssistantMessage: (text: string, sid: string = sessionId) => middleware.onModelOutput(text, sid),
  };
}

/** Mastra：工具常用 `id` 而非 `name` */
export function createMastraAmpGuard(
  middleware: AmpMiddleware = new AmpMiddleware(),
  sessionId = 'mastra-session'
) {
  return {
    wrapTool: <R>(tool: { id?: string; name?: string; execute: (args: Record<string, unknown>, ...rest: unknown[]) => R | Promise<R> }) => {
      const name = tool.name || tool.id || 'mastra-tool';
      return wrapToolExecute({ name, execute: tool.execute }, middleware, sessionId);
    },
    onUserMessage: (text: string, sid: string = sessionId) => middleware.onUserPrompt(text, sid),
    onAssistantMessage: (text: string, sid: string = sessionId) => middleware.onModelOutput(text, sid),
  };
}

/** LangGraph JS：包节点函数，对齐 Python create_langgraph_node_interceptor */
export function wrapLangGraphNode<S extends Record<string, unknown>>(
  nodeFn: (state: S, ...args: unknown[]) => S | Promise<S>,
  middleware: AmpMiddleware = new AmpMiddleware(),
  sessionKey = 'session_id'
) {
  return async (state: S, ...args: unknown[]): Promise<S> => {
    const sid = String(state[sessionKey] || middleware.defaultSessionId);
    const action = (state.tool_action || state.action) as
      | { name?: string; args?: Record<string, unknown> }
      | undefined;
    if (action && typeof action === 'object' && action.name) {
      const decision = middleware.onPreToolUse(action.name, action.args || {}, sid);
      if (!decision.allowed) {
        throw new Error(decision.reason || 'Blocked by PUAX AMP Gate');
      }
    }
    let next: S;
    try {
      next = await nodeFn(state, ...args);
    } catch (err) {
      middleware.onPostToolUse('langgraph_node', null, err as Error, sid);
      throw err;
    }
    const output = next && typeof next === 'object' ? String(next.output || next.response || '') : '';
    if (output) {
      const check = middleware.onModelOutput(output, sid);
      return { ...next, amp: check.envelope, force_verify: check.needsVerify };
    }
    return next;
  };
}

/**
 * Claude Agent SDK / Claude Code 进程内 hook 形状
 * （PreToolUse 用 permissionDecision，与 hook-cli 的 decision 字段对应）
 */
export function createClaudeAgentSdkHooks(
  middleware: AmpMiddleware = new AmpMiddleware(),
  sessionId = 'claude-agent-sdk'
) {
  return {
    PreToolUse: (input: {
      tool_name: string;
      tool_input?: Record<string, unknown>;
      session_id?: string;
    }): Promise<{
      hookSpecificOutput?: {
        hookEventName: 'PreToolUse';
        permissionDecision: 'deny';
        permissionDecisionReason?: string;
      };
    }> => {
      const sid = input.session_id || sessionId;
      const decision = middleware.onPreToolUse(input.tool_name, input.tool_input || {}, sid);
      if (!decision.allowed) {
        return Promise.resolve({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'deny',
            permissionDecisionReason: decision.reason,
          },
        });
      }
      return Promise.resolve({});
    },
    PostToolUse: (input: {
      tool_name: string;
      tool_response?: unknown;
      session_id?: string;
      is_error?: boolean;
    }) => {
      const sid = input.session_id || sessionId;
      const err = input.is_error ? new Error(String(input.tool_response || 'tool error')) : undefined;
      middleware.onPostToolUse(input.tool_name, input.tool_response, err, sid);
      return Promise.resolve({});
    },
    Stop: (input: { last_assistant_message?: string; session_id?: string }) => {
      const sid = input.session_id || sessionId;
      return Promise.resolve(middleware.onModelOutput(input.last_assistant_message || '', sid));
    },
  };
}

/** Dify 工具插件调用体：{ tool_name, tool_parameters, conversation_id } */
export function createDifyAmpHandler(
  middleware: AmpMiddleware = new AmpMiddleware()
) {
  return (req: {
    tool_name?: string;
    tool_parameters?: Record<string, unknown>;
    conversation_id?: string;
  }): AmpGateDecision => {
    const sid = req.conversation_id || 'dify-session';
    const name = req.tool_name || 'dify-tool';
    return middleware.onPreToolUse(name, req.tool_parameters || {}, sid);
  };
}

/** n8n node execute 包装：有 command/path 则走闸门 */
export function wrapN8nExecute<R>(
  execute: (...args: unknown[]) => R | Promise<R>,
  middleware: AmpMiddleware = new AmpMiddleware(),
  sessionId = 'n8n-session'
) {
  return async (...args: unknown[]): Promise<R> => {
    const first = args[0];
    const params =
      first && typeof first === 'object' ? (first as Record<string, unknown>) : {};
    const command = typeof params.command === 'string' ? params.command : undefined;
    const path = typeof params.path === 'string' ? params.path : undefined;
    if (command || path) {
      const decision = middleware.onPreToolUse('n8n', { command: command || '', path: path || '' }, sessionId);
      if (!decision.allowed) {
        throw new Error(decision.reason || 'Blocked by PUAX AMP Gate');
      }
    }
    try {
      const result = await execute(...args);
      middleware.onPostToolUse('n8n', result, undefined, sessionId);
      return result;
    } catch (err) {
      middleware.onPostToolUse('n8n', null, err as Error, sessionId);
      throw err;
    }
  };
}

export type { AmpEnvelope, AmpGateDecision };
