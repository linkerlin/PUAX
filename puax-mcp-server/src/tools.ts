import { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface SkillInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  author: string;
  version: string;
  filePath: string;
  capabilities: string[];
  howToUse: string;
  inputFormat: string;
  outputFormat: string;
  exampleUsage: string;
  content: string;
}

// Backward compatibility alias
export type RoleInfo = SkillInfo;

/**
 * List all available SKILLs with optional category filter
 */
export const ListSkillsTool: Tool = {
  name: "list_skills",
  description: "List all available SKILLs in the PUAX project. Use this to discover what roles/personas are available.",
  inputSchema: {
    type: "object",
    properties: {
      category: {
        type: "string",
        description: "Filter SKILLs by category",
        enum: ["all", "shaman", "military", "sillytavern", "theme", "self-motivation", "special"],
        default: "all"
      },
      includeCapabilities: {
        type: "boolean",
        description: "Include capabilities array in response (default: false for brevity)",
        default: false
      }
    }
  }
};

/**
 * Get detailed information about a specific SKILL
 */
export const GetSkillTool: Tool = {
  name: "get_skill",
  description: "Get detailed information about a specific SKILL, including its full system prompt content.",
  inputSchema: {
    type: "object",
    properties: {
      skillId: {
        type: "string",
        description: "The unique identifier of the SKILL (e.g., 'shaman-musk', 'military-commander')"
      },
      section: {
        type: "string",
        description: "Optional: Get only a specific section ('full', 'metadata', 'capabilities', 'systemPrompt')",
        enum: ["full", "metadata", "capabilities", "systemPrompt"],
        default: "full"
      }
    },
    required: ["skillId"]
  }
};

/**
 * Search SKILLs by keyword
 */
export const SearchSkillsTool: Tool = {
  name: "search_skills",
  description: "Search SKILLs by keyword. Searches in name, description, tags, and capabilities.",
  inputSchema: {
    type: "object",
    properties: {
      keyword: {
        type: "string",
        description: "Search keyword (searches name, description, tags, capabilities)"
      },
      searchInCapabilities: {
        type: "boolean",
        description: "Include capabilities in search (default: true)",
        default: true
      }
    },
    required: ["keyword"]
  }
};

/**
 * Activate a SKILL with optional task substitution
 */
export const ActivateSkillTool: Tool = {
  name: "activate_skill",
  description: "Activate a SKILL and get the ready-to-use system prompt. Optionally provide a task to replace {{task}} placeholders.",
  inputSchema: {
    type: "object",
    properties: {
      skillId: {
        type: "string",
        description: "The unique identifier of the SKILL to activate"
      },
      task: {
        type: "string",
        description: "Optional task description to replace {{task}}, {{任务描述}}, {{占位符}} placeholders"
      },
      customParams: {
        type: "object",
        description: "Optional custom parameters for placeholder replacement (key-value pairs)",
        additionalProperties: true
      }
    },
    required: ["skillId"]
  }
};

/**
 * Get categories and statistics
 */
export const GetCategoriesTool: Tool = {
  name: "get_categories",
  description: "Get all available SKILL categories with counts and descriptions.",
  inputSchema: {
    type: "object",
    properties: {}
  }
};

// Backward compatibility tools (aliases)
export const ListRolesTool = {
  ...ListSkillsTool,
  name: "list_roles",
  description: "[Legacy] Use list_skills instead. List all available roles."
};

export const GetRoleTool = {
  ...GetSkillTool,
  name: "get_role",
  description: "[Legacy] Use get_skill instead. Get role details by ID."
};

export const SearchRolesTool = {
  ...SearchSkillsTool,
  name: "search_roles",
  description: "[Legacy] Use search_skills instead. Search roles by keyword."
};

export const ActivateRoleTool = {
  ...ActivateSkillTool,
  name: "activate_role",
  description: "[Legacy] Use activate_skill instead. Activate a role."
};

/**
 * Detect trigger conditions in conversation context
 */
export const DetectTriggerTool: Tool = {
  name: "detect_trigger",
  description: "Analyze conversation context to detect trigger conditions that indicate AI needs motivation. Supports 14 trigger types including consecutive failures, giving up language, blame shifting, busywork, passive waiting, and user frustration.",
  inputSchema: {
    type: "object",
    properties: {
      conversation_history: {
        type: "array",
        description: "Array of conversation messages with role and content",
        items: {
          type: "object",
          properties: {
            role: {
              type: "string",
              enum: ["user", "assistant", "system"],
              description: "Role of the message sender"
            },
            content: {
              type: "string",
              description: "Message content"
            }
          },
          required: ["role", "content"]
        }
      },
      task_context: {
        type: "object",
        description: "Current task context information",
        properties: {
          current_task: {
            type: "string",
            description: "Description of current task"
          },
          attempt_count: {
            type: "number",
            description: "Number of attempts made",
            default: 0
          },
          tools_available: {
            type: "array",
            items: { type: "string" },
            description: "List of available tools",
            default: []
          },
          tools_used: {
            type: "array",
            items: { type: "string" },
            description: "List of tools already used",
            default: []
          }
        }
      },
      options: {
        type: "object",
        description: "Detection options",
        properties: {
          sensitivity: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "Detection sensitivity level",
            default: "medium"
          },
          language: {
            type: "string",
            enum: ["zh", "en", "auto"],
            description: "Detection language",
            default: "auto"
          }
        }
      }
    },
    required: ["conversation_history"]
  }
};

/**
 * Recommend the best role based on context
 */
export const RecommendRoleTool: Tool = {
  name: "recommend_role",
  description: "Recommend the most suitable PUAX role based on detected triggers, task context, and user preferences. Uses multi-dimensional scoring algorithm.",
  inputSchema: {
    type: "object",
    properties: {
      detected_triggers: {
        type: "array",
        items: { type: "string" },
        description: "List of detected trigger condition IDs"
      },
      task_context: {
        type: "object",
        description: "Task context information",
        properties: {
          task_type: {
            type: "string",
            enum: ["coding", "debugging", "writing", "review", "creative", "analysis", "emergency", "planning"],
            description: "Type of task"
          },
          description: {
            type: "string",
            description: "Task description"
          },
          urgency: {
            type: "string",
            enum: ["low", "medium", "high", "critical"],
            description: "Task urgency level",
            default: "medium"
          },
          attempt_count: {
            type: "number",
            description: "Number of attempts made",
            default: 0
          }
        },
        required: ["task_type"]
      },
      user_preferences: {
        type: "object",
        description: "User preference settings",
        properties: {
          favorite_roles: {
            type: "array",
            items: { type: "string" },
            description: "User's favorite role IDs",
            default: []
          },
          blacklisted_roles: {
            type: "array",
            items: { type: "string" },
            description: "User's blacklisted role IDs",
            default: []
          },
          preferred_tone: {
            type: "string",
            enum: ["aggressive", "supportive", "analytical", "creative"],
            description: "Preferred tone style"
          },
          preferred_categories: {
            type: "array",
            items: { type: "string" },
            description: "Preferred role categories",
            default: []
          }
        }
      },
      session_history: {
        type: "object",
        description: "Session history data",
        properties: {
          recently_used_roles: {
            type: "array",
            items: { type: "string" },
            description: "Recently used role IDs",
            default: []
          },
          role_success_rates: {
            type: "object",
            description: "Role success rates (role_id -> rate)",
            additionalProperties: { type: "number" },
            default: {}
          }
        }
      }
    },
    required: ["detected_triggers", "task_context"]
  }
};

/**
 * Get role with methodology
 */
export const GetRoleWithMethodologyTool: Tool = {
  name: "get_role_with_methodology",
  description: "Get complete role information including system prompt, debugging methodology, and mandatory checklist. Supports flavor overlay.",
  inputSchema: {
    type: "object",
    properties: {
      role_id: {
        type: "string",
        description: "Role ID (e.g., 'military-commander', 'shaman-musk')"
      },
      options: {
        type: "object",
        description: "Options",
        properties: {
          include_methodology: {
            type: "boolean",
            description: "Include debugging methodology",
            default: true
          },
          include_checklist: {
            type: "boolean",
            description: "Include mandatory checklist",
            default: true
          },
          include_flavor: {
            type: "string",
            description: "Overlay flavor (e.g., 'huawei', 'alibaba', 'musk')",
            enum: ["alibaba", "bytedance", "huawei", "tencent", "meituan", "netflix", "musk", "jobs"]
          },
          format: {
            type: "string",
            enum: ["full", "compact", "prompt_only"],
            description: "Output format",
            default: "full"
          }
        }
      }
    },
    required: ["role_id"]
  }
};

/**
 * Activate with context - one-click activation
 */
export const ActivateWithContextTool: Tool = {
  name: "activate_with_context",
  description: "One-click activation: Automatically detect triggers, recommend and activate the most suitable role based on current context. Complete workflow: detect -> recommend -> get -> return.",
  inputSchema: {
    type: "object",
    properties: {
      context: {
        type: "object",
        description: "Current conversation context",
        properties: {
          conversation_history: {
            type: "array",
            items: {
              type: "object",
              properties: {
                role: { type: "string", enum: ["user", "assistant", "system"] },
                content: { type: "string" }
              },
              required: ["role", "content"]
            },
            description: "Conversation history"
          },
          task_context: {
            type: "object",
            properties: {
              current_task: { type: "string" },
              attempt_count: { type: "number", default: 0 },
              tools_available: { type: "array", items: { type: "string" }, default: [] },
              tools_used: { type: "array", items: { type: "string" }, default: [] }
            }
          }
        },
        required: ["conversation_history"]
      },
      options: {
        type: "object",
        description: "Activation options",
        properties: {
          auto_detect: {
            type: "boolean",
            description: "Auto detect triggers",
            default: true
          },
          user_confirmation: {
            type: "boolean",
            description: "Require user confirmation",
            default: false
          },
          fallback_role: {
            type: "string",
            description: "Fallback role if no trigger detected",
            default: "military-commander"
          },
          include_methodology: {
            type: "boolean",
            default: true
          },
          include_checklist: {
            type: "boolean",
            default: true
          }
        }
      }
    },
    required: ["context"]
  }
};

export const Tools = [
  // New SKILL-based tools
  ListSkillsTool,
  GetSkillTool,
  SearchSkillsTool,
  ActivateSkillTool,
  GetCategoriesTool,
  // New auto-trigger tools
  DetectTriggerTool,
  RecommendRoleTool,
  GetRoleWithMethodologyTool,
  ActivateWithContextTool,
  // Legacy aliases for backward compatibility
  ListRolesTool,
  GetRoleTool,
  SearchRolesTool,
  ActivateRoleTool
];
