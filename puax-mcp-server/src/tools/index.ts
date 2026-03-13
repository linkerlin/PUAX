#!/usr/bin/env node
/**
 * PUAX MCP Tools 索引
 * 导出所有可用的MCP工具
 */

export { detectTriggerTool } from './detect-trigger';
export { recommendRoleTool } from './recommend-role';
export { getRoleWithMethodologyTool } from './get-role-with-methodology';
export { activateWithContextTool } from './activate-with-context';

// 工具列表（用于注册）
export const allTools = [
  detectTriggerTool,
  recommendRoleTool,
  getRoleWithMethodologyTool,
  activateWithContextTool
];
