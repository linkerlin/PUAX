#!/usr/bin/env node
/**
 * PUAX Core 索引
 * 导出所有核心组件
 */

export {
  TriggerDetector,
  triggerDetector,
  EnhancedTriggerDetector,
  enhancedTriggerDetectorCore,
  ENHANCED_TRIGGER_DEFINITIONS,
  createEnhancedTriggerDetector,
} from './trigger-detector.js';

export {
  getCoreServices,
  getTriggerDetector,
  getRoleRecommender,
  getMethodologyEngine,
  getMethodologyRouter,
  setCoreServicesForTesting,
  resetTriggerDetectorCache,
} from './service-registry.js';
export type { CoreServices } from './service-registry.js';
export { RoleRecommender, roleRecommender } from './role-recommender.js';
export { MethodologyEngine, methodologyEngine } from './methodology-engine.js';
export { runEvolveCycle, normalizeTriggerId } from './evolve-cycle.js';
export { arenaStore } from './arena.js';
export { compileThinPrompt } from './thin-prompt.js';
export { SHAMAN_ROLE_IDS, KERNEL_ROLE_IDS, isShamanRole } from './role-kernel.js';
export { compileCouncilItinerary, DREAM_COUNCIL_LEGS } from './dream-council.js';
export { distinctN, semanticRadius } from './ghm-metrics.js';
export { getTtfSummary } from './ttf.js';
export { toAmpEnvelope, ampSpecDoc, AMP_SPEC } from './amp.js';
export { runSiliconTheater, planSiliconTheater } from './silicon-theater.js';
export { auditManipulation, MANIPULATION_PATTERNS } from './carbon-shield.js';
export type { ShieldAuditResult, ManipulationFinding, ManipulationPattern } from './carbon-shield.js';

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
