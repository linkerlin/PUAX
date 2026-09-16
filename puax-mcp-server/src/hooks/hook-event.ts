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
 *
 * v4.3 起：随运行时状态层迁至 src/core/hook-event.ts（解 core↔hooks 环），
 * 本文件为兼容转出口，新代码请直接引用 core 侧。
 */

export * from '../core/hook-event.js';
