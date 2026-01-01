import { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface RoleInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  filePath: string;
}

export const ListRolesTool: Tool = {
  name: "list_roles",
  description: "列出 PUAX 项目中所有可用的 AI 角色",
  inputSchema: {
    type: "object",
    properties: {
      category: {
        type: "string",
        description: "可选，按类别筛选角色（如：萨满系列、军事化组织等）",
        enum: ["全部", "萨满系列", "军事化组织", "SillyTavern系列", "主题场景", "自我激励", "特色角色与工具"],
        default: "全部"
      }
    }
  }
};

export const GetRoleTool: Tool = {
  name: "get_role",
  description: "获取指定角色的详细 Prompt 内容",
  inputSchema: {
    type: "object",
    properties: {
      roleId: {
        type: "string",
        description: "角色ID（使用 list_roles 获取）"
      },
      task: {
        type: "string",
        description: "可选，具体任务描述，会替换模板中的占位符"
      }
    },
    required: ["roleId"]
  }
};

export const SearchRolesTool: Tool = {
  name: "search_roles",
  description: "搜索角色（按名称或描述关键词）",
  inputSchema: {
    type: "object",
    properties: {
      keyword: {
        type: "string",
        description: "搜索关键词"
      }
    },
    required: ["keyword"]
  }
};

export const ActivateRoleTool: Tool = {
  name: "activate_role",
  description: "激活角色并返回完整的 System Prompt（包含可选的任务替换）",
  inputSchema: {
    type: "object",
    properties: {
      roleId: {
        type: "string",
        description: "角色ID"
      },
      task: {
        type: "string",
        description: "具体任务描述，替换模板中的占位符"
      },
      customParams: {
        type: "object",
        description: "可选，自定义参数替换",
        additionalProperties: true
      }
    },
    required: ["roleId"]
  }
};

export const Tools = [ListRolesTool, GetRoleTool, SearchRolesTool, ActivateRoleTool];
