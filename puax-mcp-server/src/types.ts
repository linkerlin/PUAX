/**
 * PUAX MCP Server - Shared Type Definitions
 * Centralized type definitions to avoid circular dependencies
 */

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
