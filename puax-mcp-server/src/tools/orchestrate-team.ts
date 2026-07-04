#!/usr/bin/env node
/**
 * MCP Tool: puax_orchestrate_team
 */

import { z } from 'zod';
import { orchestrateTeam } from '../core/agent-team-protocol.js';
import { getAvailableTemplates, getTemplateInfo } from '../role-levels/agent-team.js';

const OrchestrateTeamInputSchema = z.object({
  action: z.enum(['create', 'report', 'status', 'disband', 'recommend']),
  team_id: z.string().optional(),
  template_id: z.enum(['sprint-team', 'architecture-team', 'innovation-team', 'crisis-team']).optional(),
  project_context: z.string().optional(),
  session_id: z.string().optional().describe('Leader 统一压力等级来源'),
  project_type: z.enum(['development', 'research', 'crisis', 'innovation']).optional(),
  report: z.object({
    role_id: z.string(),
    status: z.enum(['pending', 'in-progress', 'blocked', 'completed']),
    findings: z.string(),
    actions_taken: z.string(),
    next: z.string(),
    blockers: z.string().optional(),
  }).optional(),
});

export const orchestrateTeamTool = {
  name: 'puax_orchestrate_team',
  description: 'Agent Team 编排：创建团队、接收 [PUAX-REPORT] 上报、查询状态。Leader 通过 session_id 统一压力等级管理。',
  inputSchema: OrchestrateTeamInputSchema,

  handler: (args: z.infer<typeof OrchestrateTeamInputSchema>) => {
    const result = orchestrateTeam(args);
    if (args.action === 'recommend' || args.action === 'create') {
      return {
        ...result,
        templates: getAvailableTemplates().map(id => ({
          id,
          name: getTemplateInfo(id)?.name,
        })),
      };
    }
    return result;
  },
};
