/**
 * PUAX MCP Server - Tool Handlers Index
 * Central export for all tool handler modules
 */

// SKILL handlers
export {
    handleListSkills,
    handleGetSkill,
    handleSearchSkills,
    handleActivateSkill,
    handleGetCategories
} from './skill-handlers.js';

// Legacy Role handlers
export {
    handleListRoles,
    handleGetRole,
    handleSearchRoles,
    handleActivateRole
} from './role-handlers.js';

// Trigger & Methodology handlers
export {
    handleDetectTrigger,
    handleRecommendRole,
    handleGetRoleWithMethodology,
    handleActivateWithContext
} from './trigger-handlers.js';

// Hook System handlers
export { hookToolHandlers } from './hook-handlers.js';
