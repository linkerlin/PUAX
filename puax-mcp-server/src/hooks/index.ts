/**
 * PUAX Hook 系统 - 统一导出
 * 
 * 全面对齐 PUA 原版 Hook 系统的能力：
 * - StateManager: 跨会话状态持久化
 * - PressureSystem: L1-L4 压力等级升级
 * - EnhancedTriggerDetector: 增强版触发检测
 * - HookManager: 模拟事件驱动的 Hook 管理
 * - FeedbackSystem: 反馈收集与分析
 */

// 状态管理
export {
  StateManager,
  stateManager,
  type SessionState,
  type FailureRecord,
  type TriggerRecord,
  type FeedbackRecord,
  type PressureEscalationConfig
} from './state-manager.js';

// 压力系统
export {
  PressureSystem,
  pressureSystem,
  type PressureLevel,
  type PressureConfig,
  type PressureResponse,
  type EscalationResult,
  DEFAULT_PRESSURE_CONFIG,
  PRESSURE_RESPONSES
} from './pressure-system.js';

// 增强触发检测器
export {
  EnhancedTriggerDetector,
  enhancedTriggerDetector,
  type HookEventType,
  type TriggerContext,
  type EnhancedTriggerResult,
  type TriggerPattern,
  TRIGGER_PATTERNS,
  ROLE_RECOMMENDATIONS
} from './trigger-detector-enhanced.js';

// Hook 管理器
export {
  HookManager,
  hookManager,
  type HookCallback,
  type HookSubscription,
  type AutoCheckConfig,
  type HookManagerConfig,
  type SessionContext
} from './hook-manager.js';

// 反馈系统
export {
  FeedbackSystem,
  feedbackSystem,
  type SessionFeedback,
  type FeedbackSummary,
  type ImprovementSuggestion
} from './feedback-system.js';

// 默认导出
export { stateManager as default } from './state-manager.js';
