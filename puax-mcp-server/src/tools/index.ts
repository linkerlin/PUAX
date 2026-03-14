#!/usr/bin/env node
/**
 * PUAX MCP Tools 索引
 * 导出所有可用的MCP工具
 */

import { detectTriggerTool } from './detect-trigger.js';
import { recommendRoleTool } from './recommend-role.js';
import { getRoleWithMethodologyTool } from './get-role-with-methodology.js';
import { activateWithContextTool } from './activate-with-context.js';

export { detectTriggerTool };
export { recommendRoleTool };
export { getRoleWithMethodologyTool };
export { activateWithContextTool };

// 工具列表（用于注册）
export const allTools = [
  detectTriggerTool,
  recommendRoleTool,
  getRoleWithMethodologyTool,
  activateWithContextTool
];
