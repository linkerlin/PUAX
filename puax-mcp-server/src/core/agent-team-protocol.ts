/**
 * Agent Team 编排协议 + [PUAX-REPORT] 格式
 */

import {
  agentTeamManager,
  getAvailableTemplates,
  type AgentTeam,
  type TeamTask,
} from '../role-levels/agent-team.js';
import { stateManager } from '../hooks/state-manager.js';

export const PUAX_REPORT_FORMAT = `[PUAX-REPORT]
role: <role_id>
status: pending|in-progress|blocked|completed
pressure: L0-L4
failure_count: <n>
findings: <what you learned, with evidence>
actions_taken: <concrete steps>
next: <next action>
blockers: <if any>
`;

export interface OrchestrateTeamRequest {
  action: 'create' | 'report' | 'status' | 'disband' | 'recommend';
  team_id?: string;
  template_id?: string;
  project_context?: string;
  session_id?: string;
  report?: {
    role_id: string;
    status: 'pending' | 'in-progress' | 'blocked' | 'completed';
    findings: string;
    actions_taken: string;
    next: string;
    blockers?: string;
  };
  project_type?: 'development' | 'research' | 'crisis' | 'innovation';
}

export interface OrchestrateTeamResult {
  success: boolean;
  action: string;
  team?: AgentTeam;
  team_id?: string;
  collaboration_script?: string;
  report_format?: string;
  leader_pressure_level?: number;
  message: string;
  stats?: ReturnType<typeof agentTeamManager.getTeamStats>;
  available_templates?: string[];
}

export function orchestrateTeam(req: OrchestrateTeamRequest): OrchestrateTeamResult {
  switch (req.action) {
    case 'create': {
      if (!req.template_id || !req.project_context) {
        return { success: false, action: req.action, message: 'create 需要 template_id 和 project_context' };
      }
      const team = agentTeamManager.createTeamFromTemplate(req.template_id, req.project_context);
      const script = agentTeamManager.generateCollaborationScript(team.id);
      const pressure = req.session_id
        ? stateManager.getPressureLevel(req.session_id)
        : 0;

      return {
        success: true,
        action: 'create',
        team,
        team_id: team.id,
        collaboration_script: script.replace(/\[PUA-REPORT\]/g, '[PUAX-REPORT]'),
        report_format: PUAX_REPORT_FORMAT,
        leader_pressure_level: pressure,
        message: `团队「${team.name}」已创建。Leader: ${team.leader.roleName}。统一压力等级: L${pressure}。`,
      };
    }

    case 'report': {
      if (!req.team_id || !req.report) {
        return { success: false, action: req.action, message: 'report 需要 team_id 和 report' };
      }
      const pressure = req.session_id ? stateManager.getPressureLevel(req.session_id) : 0;
      const failures = req.session_id ? stateManager.getFailureCount(req.session_id) : 0;

      const formatted = [
        '[PUAX-REPORT]',
        `role: ${req.report.role_id}`,
        `status: ${req.report.status}`,
        `pressure: L${pressure}`,
        `failure_count: ${failures}`,
        `findings: ${req.report.findings}`,
        `actions_taken: ${req.report.actions_taken}`,
        `next: ${req.report.next}`,
        req.report.blockers ? `blockers: ${req.report.blockers}` : '',
      ].filter(Boolean).join('\n');

      agentTeamManager.sendMessage(
        req.team_id,
        req.report.role_id,
        'leader',
        formatted,
        'report'
      );

      return {
        success: true,
        action: 'report',
        team_id: req.team_id,
        message: formatted,
      };
    }

    case 'status': {
      if (!req.team_id) {
        return { success: false, action: req.action, message: 'status 需要 team_id' };
      }
      const team = agentTeamManager.getTeam(req.team_id);
      if (!team) {
        return { success: false, action: req.action, message: `团队不存在: ${req.team_id}` };
      }
      return {
        success: true,
        action: 'status',
        team,
        team_id: req.team_id,
        stats: agentTeamManager.getTeamStats(req.team_id),
        leader_pressure_level: req.session_id
          ? stateManager.getPressureLevel(req.session_id)
          : undefined,
        message: `团队 ${team.name} 运行中`,
      };
    }

    case 'disband': {
      if (!req.team_id) {
        return { success: false, action: req.action, message: 'disband 需要 team_id' };
      }
      agentTeamManager.disbandTeam(req.team_id);
      return { success: true, action: 'disband', team_id: req.team_id, message: '团队已解散' };
    }

    case 'recommend': {
      const rec = agentTeamManager.recommendTeam(
        req.project_type || 'development',
        4,
        'normal'
      );
      return {
        success: true,
        action: 'recommend',
        team: rec.suggestedTeam,
        team_id: rec.suggestedTeam.id,
        message: `${rec.reason}（预估效率 ${Math.round(rec.estimatedEfficiency * 100)}%）`,
        available_templates: getAvailableTemplates(),
      };
    }

    default:
      return { success: false, action: req.action, message: `未知 action: ${req.action}` };
  }
}
