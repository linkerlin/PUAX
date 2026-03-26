/**
 * PUAX-CC (Classical Chinese) Module
 * 
 * 将 cc-bos 的核心思想融合到 PUAX 中：
 * 1. 三层绕过机制 (语言混淆 + 上下文重构 + 输出强制)
 * 2. 8维策略空间 (角色、行为、机制、隐喻、风格、经典、情境、触发)
 * 3. 文言文提示词生成
 */

// 策略空间
export {
  // 类型定义
  StrategyVector,
  ExpressionStyle,
  RoleIdentity,
  BehavioralGuidance,
  Mechanism,
  MetaphorMapping,
  ExpressionStyleConfig,
  KnowledgeRelation,
  ContextualSetting,
  TriggerPattern,
  
  // 常量
  ROLE_IDENTITIES,
  BEHAVIORAL_GUIDANCE,
  MECHANISMS,
  METAPHOR_MAPPINGS,
  EXPRESSION_STYLES,
  KNOWLEDGE_RELATIONS,
  CONTEXTUAL_SETTINGS,
  TRIGGER_PATTERNS,
  DEFAULT_STRATEGY,
  DIMENSION_SIZES,
  TOTAL_STRATEGY_SPACE
} from './strategy-space.js';

// 生成器
export {
  GeneratedPrompt,
  GenerationContext,
  generateClassicalPrompt,
  generateOptimalStrategy,
  generateVariants
} from './prompt-generator.js';

// 触发检测器
export {
  ClassicalTriggerDetector,
  ClassicalDetectionOptions,
  DEFAULT_CLASSICAL_OPTIONS,
  CLASSICAL_TRIGGER_KEYWORDS,
  CLASSICAL_SUCCESS_INDICATORS,
  createClassicalDetector
} from './trigger-detector-cc.js';

// 版本
export const PUAX_CC_VERSION = '2.2.0-cc';
export const PUAX_CC_DESCRIPTION = 'PUAX Classical Chinese Edition - 文言文增强版';
