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

export const Tools = [
  // New SKILL-based tools
  ListSkillsTool,
  GetSkillTool,
  SearchSkillsTool,
  ActivateSkillTool,
  GetCategoriesTool,
  // Legacy aliases for backward compatibility
  ListRolesTool,
  GetRoleTool,
  SearchRolesTool,
  ActivateRoleTool
];
