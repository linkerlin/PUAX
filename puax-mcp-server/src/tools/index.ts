#!/usr/bin/env node
/**
 * MCP Tools 统一导出
 * PUAX v2.2.0 - 增强版 Hook 系统
 */

// 原有工具
export { detectTriggerTool, detectTriggerEnhancedTool } from './detect-trigger-enhanced.js';
export { activateWithContextTool } from './activate-with-context.js';
export { exportPlatform, exportAllPlatforms, handleExportCommand } from './export-platform.js';
export { getRoleWithMethodologyTool } from './get-role-with-methodology.js';
export { recommendRoleTool } from './recommend-role.js';

// 新增 Hook 会话管理工具
export {
  startSessionTool,
  endSessionTool,
  getSessionStateTool,
  resetSessionTool,
  hookSessionTools
} from './hook-session.js';

// 新增 Hook 反馈工具
export {
  submitFeedbackTool,
  getFeedbackSummaryTool,
  getImprovementSuggestionsTool,
  exportFeedbackTool,
  generatePUALoopReportTool,
  hookFeedbackTools
} from './hook-feedback.js';

// 快速检测工具
export { quickDetectTool } from './quick-detect.js';

// 工具列表
import { detectTriggerEnhancedTool } from './detect-trigger-enhanced.js';
import { activateWithContextTool } from './activate-with-context.js';
// import { exportPlatformTool } from './export-platform.js';
import { getRoleWithMethodologyTool } from './get-role-with-methodology.js';
import { recommendRoleTool } from './recommend-role.js';
import { hookSessionTools } from './hook-session.js';
import { hookFeedbackTools } from './hook-feedback.js';
import { quickDetectTool } from './quick-detect.js';

export const allTools = [
  // 核心检测工具
  detectTriggerEnhancedTool,
  quickDetectTool,
  
  // 角色管理工具
  activateWithContextTool,
  getRoleWithMethodologyTool,
  recommendRoleTool,
  
  // 会话管理工具
  ...hookSessionTools,
  
  // 反馈工具
  ...hookFeedbackTools,
  
  // 导出工具
  // exportPlatformTool (使用函数 exportPlatform)
];

export default allTools;
