/**
 * PUAX MCP Server - Handlers Index
 *
 * 已合并至 tools/ 单一工具层。
 * 此文件保留作为向后兼容重导出。
 *
 * 所有工具定义 + 嵌入 handler 统一在 tools/index.ts 中。
 * server/core.ts 直接遍历 allTools 分发调用，无需此文件。
 */

export {
    ListSkillsTool,
    GetSkillTool,
    SearchSkillsTool,
    ActivateSkillTool,
    GetCategoriesTool,
    ListRolesTool,
    GetRoleTool,
    SearchRolesTool,
    ActivateRoleTool,
    detectTriggerTool,
    detectTriggerEnhancedTool,
    activateWithContextTool,
    getRoleWithMethodologyTool,
    recommendRoleTool,
    startSessionTool,
    endSessionTool,
    getSessionStateTool,
    resetSessionTool,
    submitFeedbackTool,
    getFeedbackSummaryTool,
    getImprovementSuggestionsTool,
    exportFeedbackTool,
    generatePUALoopReportTool,
    quickDetectTool,
    allTools,
    Tools
} from '../tools/index.js';

// Hook tool handlers registry (still used for backward compatibility fallback in server)
export { hookToolHandlers } from './hook-handlers.js';

// Legacy role handlers (deprecated, delegated to tools/ implementations)
export { handleListRoles, handleGetRole, handleSearchRoles, handleActivateRole } from './role-handlers.js';

// SKILL handlers (deprecated, delegated to tools/ implementations)
export { handleListSkills, handleGetSkill, handleSearchSkills, handleActivateSkill, handleGetCategories } from './skill-handlers.js';

// Trigger & methodology handlers (deprecated, delegated to tools/ implementations)
export { handleDetectTrigger, handleRecommendRole, handleGetRoleWithMethodology, handleActivateWithContext } from './trigger-handlers.js';
