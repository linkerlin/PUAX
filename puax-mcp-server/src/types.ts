// ============================================================================
// Trigger Types - Single Source of Truth
// ============================================================================

/** Trigger pattern matching for different languages */
export interface TriggerPattern {
  zh?: string[];
  en?: string[];
}

/** Trigger detection configuration */
export interface TriggerDetection {
  type?: 'regex' | 'counter' | 'pattern' | 'capability_check' | 'semantic' | 'composite';
  threshold?: number;
  case_sensitive?: boolean;
  requires_verification?: boolean;
  same_approach_count?: number;
  no_new_info?: boolean;
  available_but_unused?: boolean;
  min_confidence?: number;
  requires_context?: boolean;
  context_window_size?: number;
  window?: string;
  no_verification?: boolean;
  no_followup?: boolean;
  same_command_threshold?: number;
  min_length?: number;
  max_length?: number;
  available_tools_check?: boolean;
  guess_patterns?: TriggerPattern;
  complexity_indicators?: string[];
  pattern_similarity?: number;
  same_approach_threshold?: number;
}

/** Complete trigger definition loaded from YAML or hardcoded */
export interface TriggerDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  patterns?: TriggerPattern;
  detection: TriggerDetection;
  recommended_roles: {
    primary: string;
    alternatives: string[];
    reason: string;
  };
}

/** Trigger category metadata */
export interface TriggerCategory {
  id: string;
  name: string;
  description: string;
  color: string;
}

/** Trigger catalog containing all definitions and categories */
export interface TriggerCatalog {
  triggers: Record<string, TriggerDefinition>;
  categories: Record<string, TriggerCategory>;
}

/** A detected trigger with confidence score */
export interface DetectedTrigger {
  id: string;
  name: string;
  confidence: number;
  matched_patterns: string[];
  severity: string;
  category: string;
}

/** Result of trigger detection analysis */
export interface TriggerDetectionResult {
  triggers_detected: DetectedTrigger[];
  summary: {
    should_trigger: boolean;
    overall_severity: string;
    recommended_action: 'immediate_activation' | 'suggest_activation' | 'monitor' | 'none';
  };
}

/** A conversation message used for trigger detection */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/** Task context information for trigger detection */
export interface TaskContext {
  current_task?: string;
  attempt_count?: number;
  tools_available?: string[];
  tools_used?: string[];
}

/** Options for trigger detection sensitivity */
export interface DetectionOptions {
  sensitivity?: 'low' | 'medium' | 'high';
  language?: 'zh' | 'en' | 'auto';
}

// ============================================================================
// Server Types
// ============================================================================

export type TransportMode = 'http' | 'stdio';

export interface ServerConfig {
    port?: number;
    host?: string;
    quiet?: boolean;
    transport?: TransportMode;
}

export interface ToolResponse {
    content: Array<{
        type: string;
        text: string;
    }>;
}

// ============================================================================
// Activation Types
// ============================================================================

export interface TriggerDetectionContext {
    conversation_history?: Array<{
        role: string;
        content: string;
    }>;
    task_context?: {
        current_task?: string;
        attempt_count?: number;
        last_error?: string;
    };
}

export interface MethodologyOptions {
    include_methodology?: boolean;
    include_checklist?: boolean;
    include_flavor?: string;
    format?: 'full' | 'compact' | 'prompt_only';
}

export interface ActivationContext {
    conversation_history?: Array<{
        role: string;
        content: string;
    }>;
    task_context?: {
        current_task?: string;
        attempt_count?: number;
        last_error?: string;
    };
}

export interface ActivationOptions {
    auto_detect?: boolean;
    user_confirmation?: boolean;
    fallback_role?: string;
    include_methodology?: boolean;
    include_checklist?: boolean;
}

/** Pressure level type constraint */
export type PressureLevel = 0 | 1 | 2 | 3 | 4;

/** Re-export SkillInfo from tools.ts as single source of truth */
export type { SkillInfo, RoleInfo } from './tools.js';
