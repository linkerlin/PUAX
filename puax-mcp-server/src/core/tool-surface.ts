/**
 * 按会话工具面：默认 13 黄金动词；心跳触发后揭示随访工具并通知 list_changed。
 * 绑定 MCP Server 实例（ALS + WeakMap），HTTP 多会话互不串台。
 */

import { AsyncLocalStorage } from 'async_hooks';
import { V4_PUBLIC_VERBS, getToolSurface } from './v4-dashboard.js';

export type SurfaceTickAction = 'silent' | 'inject' | 'switch' | 'dream_suggest' | 'arena' | 'gate';
export type SurfaceTickEvent =
  | 'SessionStart'
  | 'UserPromptSubmit'
  | 'PostToolUse'
  | 'PreCompact'
  | 'Stop'
  | 'Manual';

export interface ToolSurfaceOwner {
  notification(n: { method: 'notifications/tools/list_changed' }): Promise<void>;
}

/** 心跳动作 → 随访工具（均不在 13 黄金动词内） */
export const TICK_SURFACE_DELTA: Record<SurfaceTickAction, readonly string[]> = {
  silent: [],
  inject: ['puax_detect_trigger', 'get_role_with_methodology'],
  switch: ['puax_switch_on_failure', 'puax_handle_breakthrough'],
  dream_suggest: [],
  arena: [],
  gate: [],
};

const extrasByOwner = new WeakMap<object, Set<string>>();
const ownerAls = new AsyncLocalStorage<ToolSurfaceOwner>();
const publicSet = new Set<string>(V4_PUBLIC_VERBS as unknown as string[]);

export function runWithToolSurfaceOwner<T>(owner: ToolSurfaceOwner, work: () => T): T {
  return ownerAls.run(owner, work);
}

export function extraToolsForTick(
  action: SurfaceTickAction,
  signals: readonly string[],
  event: SurfaceTickEvent
): string[] {
  const names = new Set<string>(TICK_SURFACE_DELTA[action] ?? []);
  if (event === 'PreCompact' || signals.includes('preCompact')) {
    names.add('puax_update_reasoning_state');
  }
  if (signals.includes('consecutive_failures')) {
    names.add('puax_switch_on_failure');
    names.add('puax_handle_breakthrough');
  }
  return [...names];
}

export function listedExtraNames(owner?: object): string[] {
  const key = owner ?? ownerAls.getStore();
  if (!key) return [];
  return [...(extrasByOwner.get(key) ?? [])];
}

export function resetListedTools(owner: object): void {
  extrasByOwner.delete(owner);
}

/**
 * 把随访工具并入该会话的 list 面。有新增则发 notifications/tools/list_changed。
 * 通知失败不挡心跳（客户端未开 SSE 时常见）。
 */
export async function revealListedTools(
  names: readonly string[],
  owner?: ToolSurfaceOwner
): Promise<string[]> {
  const target = owner ?? ownerAls.getStore();
  if (!target || names.length === 0) return [];
  if (getToolSurface() === 'full') return [];

  let set = extrasByOwner.get(target);
  if (!set) {
    set = new Set();
    extrasByOwner.set(target, set);
  }

  const added: string[] = [];
  for (const name of names) {
    if (!name || publicSet.has(name) || set.has(name)) continue;
    set.add(name);
    added.push(name);
  }
  if (added.length === 0) return [];

  try {
    await target.notification({ method: 'notifications/tools/list_changed' });
  } catch {
    // 未开通知通道时仍保留 extras，下次 tools/list 可见
  }
  return added;
}
