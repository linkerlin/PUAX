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

export interface SkillInfo {
    id: string;
    name: string;
    category: string;
    description: string;
    tags?: string[];
    capabilities?: string[];
    author?: string;
    version?: string;
    filePath?: string;
    content?: string;
}

export interface RoleInfo extends SkillInfo {}

export interface ActivationResult {
    success: boolean;
    role: {
        id: string;
        name: string;
        category: string;
        capabilities?: string[];
    };
    systemPrompt: string;
    note?: string;
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
