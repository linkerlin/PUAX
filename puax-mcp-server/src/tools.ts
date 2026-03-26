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
  triggerConditions: string[];
  taskTypes: string[];
  compatibleFlavors: string[];
  metadata: {
    tone: string;
    intensity: string;
  };
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
        enum: ["all", "shaman", "military", "p10", "silicon", "sillytavern", "theme", "self-motivation", "special"],
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

// ============================================================================
// Hook System Tools (New in v2.2.0)
// ============================================================================

/**
 * Start PUAX session with state tracking
 */
export const PuaxStartSessionTool: Tool = {
  name: "puax_start_session",
  description: "Start a new PUAX session with state monitoring and persistence. This enables L1-L4 pressure escalation, failure tracking, and session recovery.",
  inputSchema: {
    type: "object",
    properties: {
      sessionId: {
        type: "string",
        description: "Unique session identifier"
      },
      metadata: {
        type: "object",
        description: "Optional initial metadata",
        additionalProperties: true
      },
      autoCheck: {
        type: "boolean",
        description: "Enable automatic trigger checking",
        default: true
      }
    },
    required: ["sessionId"]
  }
};

/**
 * End PUAX session and optionally collect feedback
 */
export const PuaxEndSessionTool: Tool = {
  name: "puax_end_session",
  description: "End a PUAX session, optionally collect feedback and generate a PUA Loop report.",
  inputSchema: {
    type: "object",
    properties: {
      sessionId: {
        type: "string",
        description: "Session identifier"
      },
      feedback: {
        type: "object",
        description: "Session feedback",
        properties: {
          success: { type: "boolean", description: "Whether the session was successful" },
          rating: { type: "number", minimum: 1, maximum: 5, description: "Satisfaction rating 1-5" },
          comments: { type: "string", description: "Optional feedback comments" }
        }
      },
      generateReport: {
        type: "boolean",
        description: "Generate PUA Loop report",
        default: false
      }
    },
    required: ["sessionId"]
  }
};

/**
 * Get current session state
 */
export const PuaxGetSessionStateTool: Tool = {
  name: "puax_get_session_state",
  description: "Get current session state including pressure level (L0-L4), failure count, trigger history, and active role.",
  inputSchema: {
    type: "object",
    properties: {
      sessionId: {
        type: "string",
        description: "Session identifier"
      }
    },
    required: ["sessionId"]
  }
};

/**
 * Reset session state
 */
export const PuaxResetSessionTool: Tool = {
  name: "puax_reset_session",
  description: "Reset session state - clear failures, pressure level, or both. Useful when the issue is resolved.",
  inputSchema: {
    type: "object",
    properties: {
      sessionId: {
        type: "string",
        description: "Session identifier"
      },
      resetType: {
        type: "string",
        enum: ["all", "failures", "pressure"],
        description: "What to reset: all, failures (counter only), or pressure (level only)",
        default: "all"
      }
    },
    required: ["sessionId"]
  }
};

/**
 * Enhanced trigger detection with Hook system
 */
export const PuaxDetectTriggerTool: Tool = {
  name: "puax_detect_trigger",
  description: "[Enhanced] Detect trigger conditions with event-based Hook system. Supports UserPromptSubmit, PostToolUse, PreCompact, SessionStart, and Stop events. Automatically manages pressure escalation (L1-L4).",
  inputSchema: {
    type: "object",
    properties: {
      sessionId: {
        type: "string",
        description: "Session ID for state tracking"
      },
      eventType: {
        type: "string",
        enum: ["UserPromptSubmit", "PostToolUse", "PreCompact", "SessionStart", "Stop"],
        description: "Type of event to detect"
      },
      message: {
        type: "string",
        description: "Message content (for UserPromptSubmit)"
      },
      toolName: {
        type: "string",
        description: "Tool name (for PostToolUse)"
      },
      toolResult: {
        description: "Tool result (for PostToolUse)"
      },
      errorMessage: {
        type: "string",
        description: "Error message if any"
      },
      conversationHistory: {
        type: "array",
        items: {
          type: "object",
          properties: {
            role: { type: "string", enum: ["user", "assistant", "system"] },
            content: { type: "string" }
          }
        },
        description: "Conversation history"
      },
      metadata: {
        type: "object",
        description: "Additional context metadata",
        additionalProperties: true
      }
    },
    required: ["sessionId", "eventType"]
  }
};

/**
 * Quick detect without session management
 */
export const PuaxQuickDetectTool: Tool = {
  name: "puax_quick_detect",
  description: "Quickly detect triggers without starting a session. Returns trigger detection results with recommended role and injection prompt.",
  inputSchema: {
    type: "object",
    properties: {
      sessionId: {
        type: "string",
        description: "Optional session ID (auto-generated if not provided)"
      },
      text: {
        type: "string",
        description: "Text to analyze"
      },
      context: {
        type: "object",
        description: "Optional context",
        properties: {
          toolName: { type: "string" },
          toolResult: {},
          errorMessage: { type: "string" }
        }
      }
    },
    required: ["text"]
  }
};

/**
 * Submit feedback
 */
export const PuaxSubmitFeedbackTool: Tool = {
  name: "puax_submit_feedback",
  description: "Submit session feedback to help improve PUAX. Collected feedback is used for generating improvement suggestions.",
  inputSchema: {
    type: "object",
    properties: {
      sessionId: {
        type: "string",
        description: "Session identifier"
      },
      success: {
        type: "boolean",
        description: "Whether the session was successful"
      },
      rating: {
        type: "number",
        minimum: 1,
        maximum: 5,
        description: "Satisfaction rating 1-5"
      },
      comments: {
        type: "string",
        description: "Optional comments"
      },
      assessments: {
        type: "object",
        description: "Detailed assessments",
        properties: {
          roleHelpfulness: { type: "number", minimum: 1, maximum: 5 },
          pressureAppropriate: { type: "number", minimum: 1, maximum: 5 },
          methodologySwitchHelpful: { type: "boolean" },
          wouldRecommend: { type: "boolean" }
        }
      }
    },
    required: ["sessionId", "success", "rating"]
  }
};

/**
 * Get feedback summary
 */
export const PuaxGetFeedbackSummaryTool: Tool = {
  name: "puax_get_feedback_summary",
  description: "Get feedback summary statistics including success rate, average rating, trends, and per-pressure-level analysis.",
  inputSchema: {
    type: "object",
    properties: {
      days: {
        type: "number",
        description: "Number of days to analyze",
        default: 30
      },
      sessionId: {
        type: "string",
        description: "Optional: get report for specific session only"
      }
    }
  }
};

/**
 * Get improvement suggestions
 */
export const PuaxGetImprovementSuggestionsTool: Tool = {
  name: "puax_get_improvement_suggestions",
  description: "Get AI-generated improvement suggestions based on feedback data analysis.",
  inputSchema: {
    type: "object",
    properties: {}
  }
};

/**
 * Generate PUA Loop report
 */
export const PuaxGenerateReportTool: Tool = {
  name: "puax_generate_pua_loop_report",
  description: "Generate a detailed PUA Loop report for a session, similar to the original PUA system's session report.",
  inputSchema: {
    type: "object",
    properties: {
      sessionId: {
        type: "string",
        description: "Session identifier"
      }
    },
    required: ["sessionId"]
  }
};

/**
 * Export feedback data
 */
export const PuaxExportFeedbackTool: Tool = {
  name: "puax_export_feedback",
  description: "Export feedback data in JSON or CSV format for external analysis.",
  inputSchema: {
    type: "object",
    properties: {
      format: {
        type: "string",
        enum: ["json", "csv"],
        default: "json"
      },
      days: {
        type: "number",
        description: "Limit to recent N days"
      }
    }
  }
};

/**
 * Get current pressure level
 */
export const PuaxGetPressureLevelTool: Tool = {
  name: "puax_get_pressure_level",
  description: "Get current pressure level (L0-L4) and response details for a session.",
  inputSchema: {
    type: "object",
    properties: {
      sessionId: {
        type: "string",
        description: "Session identifier"
      }
    },
    required: ["sessionId"]
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
  ActivateRoleTool,
  // Hook System tools (v2.2.0)
  PuaxStartSessionTool,
  PuaxEndSessionTool,
  PuaxGetSessionStateTool,
  PuaxResetSessionTool,
  PuaxDetectTriggerTool,
  PuaxQuickDetectTool,
  PuaxSubmitFeedbackTool,
  PuaxGetFeedbackSummaryTool,
  PuaxGetImprovementSuggestionsTool,
  PuaxGenerateReportTool,
  PuaxExportFeedbackTool,
  PuaxGetPressureLevelTool
];
