#!/usr/bin/env node
/**
 * PUAX Hook CLI — 原生 hook 的引擎共享层入口
 *
 * 供宿主运行时（Claude Code / Cursor / opencode 等）的事件脚本与进程内插件调用：
 *   npx puax-mcp-server hook session-start [--session-id X] [--harness claude]
 *
 * 设计（见 docs/HOOK-ARCHITECTURE.md）：
 * - Shape A（shell hook）与 Shape B（进程内插件）都经此单一通路调用检测引擎，
 *   避免两份实现漂移（Hook机制演进方案.md 4.3 引擎共享层）。
 * - stdout 只输出宿主 JSON（严格一种形状，防止双重注入），日志走 stderr。
 * - 优雅降级契约：任何异常都以 `{}` 输出并退出 0，绝不中断宿主会话。
 */

import { getGlobalLogger } from '../utils/logger.js';
import { stateManager } from '../hooks/state-manager.js';
import { enhancedTriggerDetector } from '../hooks/trigger-detector-enhanced.js';
import { deterministicTriggersEngine, TriggerType, type TriggerContext } from '../hooks/deterministic-triggers.js';
import { globalAntiCheatGuard } from '../core/anti-cheat-guard.js';
import { isPuaxHookEvent, type PuaxHookEvent } from '../hooks/hook-event.js';
import type { PressureLevel } from '../agents/index.js';

const logger = getGlobalLogger();

// ============================================================================
// 宿主 JSON 形状（per-harness，严格互斥）
// ============================================================================

export type Harness = 'auto' | 'claude' | 'cursor' | 'copilot' | 'sdk';

export interface HookCliOptions {
  event: PuaxHookEvent;
  sessionId?: string;
  message?: string;
  toolName?: string;
  toolResult?: unknown;
  toolArgs?: Record<string, unknown>;
  errorMessage?: string;
  harness?: Harness;
  metadata?: Record<string, unknown>;
}

export interface HookCliOutput {
  /** stdout 原样输出的宿主 JSON（字符串） */
  json: string;
  /** 事件处理是否产生内容（注入/决策） */
  produced: boolean;
}

/** 自动探测宿主：按环境变量区分（与 superpowers 的 session-start 同法） */
export function detectHarness(env: NodeJS.ProcessEnv = process.env): Exclude<Harness, 'auto'> {
  if (env.CURSOR_PLUGIN_ROOT) return 'cursor'; // Cursor 可能同时设置 CLAUDE_PLUGIN_ROOT，须先判
  if (env.CLAUDE_PLUGIN_ROOT && !env.COPILOT_CLI) return 'claude';
  return 'copilot'; // COPILOT_CLI=1 或未知平台 → SDK 标准
}

// ============================================================================
// 事件处理
// ============================================================================

function buildRestoreContext(sessionId: string): string {
  const state = stateManager.getSessionState(sessionId);
  if (state.pressureLevel === 0 && state.failureCount === 0) {
    return '';
  }
  const compaction = stateManager.getCompactionRestoreContext(sessionId);
  const lines = [
    '<EXTREMELY_IMPORTANT>',
    '[PUAX 会话恢复]',
    `压力等级 L${state.pressureLevel}，失败 ${state.failureCount} 次，触发 ${state.triggerCount} 次。`,
    `活跃角色：${state.activeRole || '无'}。`,
    compaction.should_restore ? `断点上下文：${compaction.context}` : '',
    '请继续按 PUAX 激励协议行动：先诊断，再行动，失败即换思路。',
    '</EXTREMELY_IMPORTANT>'
  ];
  return lines.filter(Boolean).join('\n');
}

function handleSessionStart(sessionId: string): string {
  const text = buildRestoreContext(sessionId);
  if (!text) {
    return '';
  }
  stateManager.readBuilderJournal();
  return text;
}

function handleUserPromptSubmit(opts: HookCliOptions): string {
  const result = enhancedTriggerDetector.detect({
    sessionId: opts.sessionId || 'hook-cli',
    eventType: 'UserPromptSubmit',
    message: opts.message || '',
    metadata: opts.metadata
  });
  return result.triggered ? (result.injectionPrompt || '') : '';
}

function handlePostToolUse(opts: HookCliOptions): string {
  const result = enhancedTriggerDetector.detect({
    sessionId: opts.sessionId || 'hook-cli',
    eventType: 'PostToolUse',
    toolName: opts.toolName || 'Bash',
    toolResult: opts.toolResult,
    errorMessage: opts.errorMessage,
    metadata: opts.metadata
  });
  return result.triggered ? (result.injectionPrompt || '') : '';
}

function handlePreCompact(opts: HookCliOptions): string {
  enhancedTriggerDetector.detect({
    sessionId: opts.sessionId || 'hook-cli',
    eventType: 'PreCompact',
    metadata: opts.metadata
  });
  return ''; // 状态已写入 journal，无需向宿主注入
}

function handleStop(sessionId: string): string {
  const state = stateManager.getSessionState(sessionId);
  if (state.triggerCount === 0) {
    return '';
  }
  return [
    '<EXTREMELY_IMPORTANT>',
    '[PUAX 会话结束]',
    `本次会话压力峰值 L${state.peakPressureLevel}，失败 ${state.failureCount} 次，触发 ${state.triggerCount} 次。`,
    '如需反馈与进化基线记录，可调用 puax_end_session。',
    '</EXTREMELY_IMPORTANT>'
  ].join('\n');
}

// ============================================================================
// PreToolUse 拦截（强制决策回路）
// ============================================================================

export interface PreToolUseDecision {
  decision: 'block' | 'approve';
  reason?: string;
}

/** 提取工具参数中的路径/命令字段（兼容多宿主命名） */
function extractTarget(toolName: string, args: Record<string, unknown>): { path: string; isCommand: boolean } {
  const normalized = toolName.toLowerCase();
  if (normalized === 'bash' || normalized === 'shell' || normalized === 'execute') {
    const cmd = (args.command as string) || (args.input as string) || (args.cmd as string) || '';
    return { path: cmd, isCommand: true };
  }
  const path = (args.filePath as string) || (args.path as string) || '';
  return { path, isCommand: false };
}

export function evaluatePreToolUse(
  toolName: string,
  args: Record<string, unknown>,
  sessionId: string
): PreToolUseDecision {
  const normalizedTool = toolName.toLowerCase();
  const { path, isCommand } = extractTarget(toolName, args);

  // 1) 确定性引擎（防作弊，PreToolUse 短路）
  const ctx: TriggerContext = {
    sessionId,
    eventType: TriggerType.PRE_TOOL_USE,
    toolName: normalizedTool,
    toolArgs: args,
    pressureLevel: stateManager.getPressureLevel(sessionId) as PressureLevel,
    failureCount: stateManager.getFailureCount(sessionId),
    timestamp: Date.now(),
    metadata: { source: 'hook-cli' }
  };

  const engineResult = deterministicTriggersEngine.evaluate(ctx);
  if (engineResult.blocked) {
    logger.warn(`[HookCli] Engine blocked: ${engineResult.blockReason}`);
    return { decision: 'block', reason: engineResult.blockReason };
  }

  // 2) AntiCheatGuard（文件路径 + bash 命令）
  if (!path) {
    return { decision: 'approve' };
  }
  const operation = isCommand ? 'execute' : (normalizedTool === 'write' ? 'write' : 'read');
  const result = globalAntiCheatGuard.checkAccess({ operation, path, sessionId, toolName: normalizedTool });
  if (!result.allowed) {
    return { decision: 'block', reason: result.reason };
  }
  return { decision: 'approve' };
}

// ============================================================================
// 主入口
// ============================================================================

/** 事件 → 注入文本（PreToolUse 返回 ''，由决策单独处理） */
function runEventLogic(event: PuaxHookEvent, opts: HookCliOptions): string {
  const sessionId = opts.sessionId || 'hook-cli';
  switch (event) {
    case 'SessionStart':
      return handleSessionStart(sessionId);
    case 'UserPromptSubmit':
      return handleUserPromptSubmit(opts);
    case 'PostToolUse':
      return handlePostToolUse(opts);
    case 'PreCompact':
      return handlePreCompact(opts);
    case 'Stop':
      return handleStop(sessionId);
    case 'PreToolUse':
      return '';
  }
}

/**
 * 执行一次 hook 事件，返回宿主 JSON。
 * 严格互斥：每次输出恰好一种字段形状（Claude Code 会无去重地同时读取
 * additional_context 与 hookSpecificOutput，双发即双重注入）。
 */
export function runHook(opts: HookCliOptions): HookCliOutput {
  const harness = opts.harness === 'auto' || !opts.harness ? detectHarness() : opts.harness;
  const { event, sessionId } = opts;
  const session = sessionId || 'hook-cli';

  try {
    if (event === 'PreToolUse') {
      const decision = evaluatePreToolUse(
        opts.toolName || '',
        opts.toolArgs || {},
        session
      );
      if (harness === 'claude') {
        const payload: Record<string, unknown> = {
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            decision: decision.decision,
            ...(decision.reason ? { reason: decision.reason } : {})
          }
        };
        return { json: JSON.stringify(payload), produced: decision.decision === 'block' };
      }
      // cursor / copilot / sdk：无 PreToolUse 决策协议 → 空输出，静默放行
      return { json: '{}', produced: false };
    }

    const injectionText = runEventLogic(event, opts);
    const payload: Record<string, unknown> = {};
    if (injectionText) {
      if (harness === 'claude') {
        payload.hookSpecificOutput = { hookEventName: event, additionalContext: injectionText };
      } else if (harness === 'cursor') {
        payload.additional_context = injectionText;
      } else {
        payload.additionalContext = injectionText;
      }
    }
    return { json: JSON.stringify(payload), produced: !!injectionText };
  } catch (error) {
    // 优雅降级契约：hook 故障绝不中断宿主会话
    logger.error('[HookCli] Error:', error);
    return { json: '{}', produced: false };
  }
}

// ============================================================================
// CLI 参数解析
// ============================================================================

/** CLI kebab-case 事件名 → 统一枚举（也接受直接 PascalCase） */
const EVENT_ALIASES: Record<string, PuaxHookEvent> = {
  'session-start': 'SessionStart',
  'user-prompt': 'UserPromptSubmit',
  'user-prompt-submit': 'UserPromptSubmit',
  'post-tool-use': 'PostToolUse',
  'pre-tool-use': 'PreToolUse',
  'pre-compact': 'PreCompact',
  stop: 'Stop'
};

export function parseHookArgs(args: string[]): { event: PuaxHookEvent; opts: HookCliOptions } | null {
  const [event, ...rest] = args;
  if (!event) {
    return null;
  }
  const normalizedEvent: PuaxHookEvent | null =
    EVENT_ALIASES[event] || (isPuaxHookEvent(event) ? event : null);
  if (!normalizedEvent) {
    return null;
  }

  const opts: HookCliOptions = { event: normalizedEvent, harness: 'auto' };
  // 只对已知带值 flag 消耗下一个 token；未知 token 直接跳过，
  // 避免未知 flag 吞掉相邻参数导致错位（如 --foo --message X 时 message 丢失）。
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    switch (arg) {
      case '--session-id':
        opts.sessionId = rest[++i];
        break;
      case '--message':
        opts.message = rest[++i];
        break;
      case '--tool':
        opts.toolName = rest[++i];
        break;
      case '--error':
        opts.errorMessage = rest[++i];
        break;
      case '--harness':
        opts.harness = rest[++i] as Harness;
        break;
      case '--tool-args': {
        const raw = rest[++i];
        if (raw !== undefined) {
          try { opts.toolArgs = JSON.parse(raw) as Record<string, unknown>; } catch { /* 忽略非法 JSON */ }
        }
        break;
      }
      case '--result': {
        const raw = rest[++i];
        if (raw === undefined) break;
        try { opts.toolResult = JSON.parse(raw) as unknown; } catch { opts.toolResult = raw; }
        break;
      }
      case '--metadata': {
        const raw = rest[++i];
        if (raw !== undefined) {
          try { opts.metadata = JSON.parse(raw) as Record<string, unknown>; } catch { /* 忽略非法 JSON */ }
        }
        break;
      }
      default:
        // 未知 flag：不消耗任何 token，跳过
        break;
    }
  }
  return { event: normalizedEvent, opts };
}

// ============================================================================
// stdin JSON 补充（Claude Code 等宿主在事件时经 stdin 传入工具上下文）
// ============================================================================

interface StdinHookPayload {
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_response?: unknown;
  session_id?: string;
  source?: string;
}

/**
 * 从 stdin 读取宿主 JSON（非阻塞读取，读不到返回 null）。
 * 竞态防护：无管道输入（TTY/stdio ignore）时 stdin 永不 end，200ms 后放行；
 * 一旦收到过 data 就等 end，避免"宿主慢写导致 200ms 超时丢载荷"。
 */
export function readStdinPayload(): Promise<StdinHookPayload | null> {
  return new Promise(resolve => {
    let data = '';
    let received = false;
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk: Buffer | string) => {
      received = true;
      data += chunk.toString();
    });
    process.stdin.on('end', () => {
      if (!data.trim()) return resolve(null);
      try { resolve(JSON.parse(data) as StdinHookPayload); }
      catch { resolve(null); }
    });
    // 无输入时（stdin 非管道）迅速放行
    process.stdin.on('error', () => resolve(null));
    setTimeout(() => {
      if (!received) resolve(null);
    }, 200);
  });
}

/** 用 stdin 载荷补充 CLI 参数（缺省字段才补，显式参数优先） */
export function mergeStdinPayload(opts: HookCliOptions, payload: StdinHookPayload | null): HookCliOptions {
  if (!payload) return opts;
  const merged: HookCliOptions = { ...opts };
  if (!merged.sessionId) merged.sessionId = payload.session_id;
  if (!merged.toolName) merged.toolName = payload.tool_name;
  if (payload.tool_input && !merged.toolArgs) merged.toolArgs = payload.tool_input;
  if (payload.tool_response !== undefined && merged.toolResult === undefined) {
    merged.toolResult = payload.tool_response;
  }
  if (payload.tool_response && typeof payload.tool_response === 'object') {
    const tr = payload.tool_response as Record<string, unknown>;
    if (!merged.errorMessage && (typeof tr.error === 'string' || tr.exit_code !== 0)) {
      merged.errorMessage = typeof tr.error === 'string' ? tr.error : 'command exited non-zero';
    }
  }
  return merged;
}

/** 完整进程入口：解析参数 → 合并 stdin → 执行 → 输出宿主 JSON */
export async function mainHookCliWithStdin(args: string[]): Promise<void> {
  const parsed = parseHookArgs(args);
  if (!parsed) {
    process.stdout.write('{}\n');
    process.exit(0);
  }
  const payload = await readStdinPayload();
  const opts = mergeStdinPayload(parsed.opts, payload);
  const { json } = runHook(opts);
  process.stdout.write(`${json}\n`);
  process.exit(0);
}
