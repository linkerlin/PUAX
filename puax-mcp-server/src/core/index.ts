#!/usr/bin/env node
/**
 * PUAX Core 索引
 * 导出所有核心组件
 */

export { TriggerDetector, triggerDetector } from './trigger-detector.js';
export { RoleRecommender, roleRecommender } from './role-recommender.js';
export { MethodologyEngine, methodologyEngine } from './methodology-engine.js';

// 导出类型
export type {
  TriggerDefinition,
  TriggerCategory,
  DetectedTrigger,
  TriggerDetectionResult,
  ConversationMessage,
  TaskContext,
  DetectionOptions
} from './trigger-detector.js';

export type {
  RoleMapping,
  FailureModeMapping,
  RoleMetadata,
  RecommendationRequest,
  RoleRecommendation,
  ScoredRole
} from './role-recommender.js';

export type {
  MethodologyStep,
  Methodology,
  ChecklistItem,
  RoleMethodology
} from './methodology-engine.js';
