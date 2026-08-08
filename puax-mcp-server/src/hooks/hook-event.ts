/**
 * PUAX 统一 Hook 事件枚举
 *
 * 对齐宿主运行时（Claude Code / Cursor / opencode 等）的事件语义。
 * 六个事件为一等公民，PreToolUse 是唯一可在动作执行前阻断的事件，
 * 是强制决策回路（hook CLI / 原生 hook）的根基。
 *
 * 历史：原增强系统 HookEventType（PascalCase，缺 PreToolUse）与确定性引擎
 * TriggerType（snake_case，有 PreToolUse）为两套并行枚举，语义重叠且命名冲突。
 * v3.11 起统一为 PuaxHookEvent（见 Hook机制演进方案.md Phase 0.1）。
 */

export type PuaxHookEvent =
  | 'UserPromptSubmit'
  | 'PostToolUse'
  | 'PreToolUse'
  | 'PreCompact'
  | 'SessionStart'
  | 'Stop';

export const PUAX_HOOK_EVENTS: readonly PuaxHookEvent[] = [
  'UserPromptSubmit',
  'PostToolUse',
  'PreToolUse',
  'PreCompact',
  'SessionStart',
  'Stop'
];

/** 运行时类型守卫：判断字符串是否为合法 Hook 事件 */
export function isPuaxHookEvent(value: unknown): value is PuaxHookEvent {
  return typeof value === 'string' && (PUAX_HOOK_EVENTS as readonly string[]).includes(value);
}

/** @deprecated 使用 PuaxHookEvent（统一事件枚举） */
export type HookEventType = PuaxHookEvent;
