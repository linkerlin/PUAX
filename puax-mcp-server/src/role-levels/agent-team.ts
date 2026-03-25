/**
 * Agent Team 协作模式
 * 实现多 Agent 协作的团队配置和管理
 */

import { RoleLevel, RoleLevelManager } from './index.js';

// ============================================================================
// 类型定义
// ============================================================================

export interface AgentRole {
  roleId: string;
  roleName: string;
  level: RoleLevel;
  responsibilities: string[];
}

export interface AgentTeam {
  id: string;
  name: string;
  leader: AgentRole;
  members: {
    executor?: AgentRole;
    researcher?: AgentRole;
    reviewer?: AgentRole;
    supporter?: AgentRole;
  };
  protocol: 'command-chain' | 'peer-to-peer';
  maxParallelAgents: number;
}

export interface TeamTask {
  id: string;
  type: 'development' | 'research' | 'review' | 'coordination';
  description: string;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
}

export interface TeamSession {
  teamId: string;
  projectContext: string;
  tasks: TeamTask[];
  currentPhase: string;
  messages: TeamMessage[];
}

export interface TeamMessage {
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  type: 'command' | 'report' | 'request' | 'response';
}

export interface TeamRecommendation {
  suggestedTeam: AgentTeam;
  reason: string;
  estimatedEfficiency: number;
  riskFactors: string[];
}

// ============================================================================
// 预定义团队模板
// ============================================================================

export const TEAM_TEMPLATES: Record<string, Partial<AgentTeam>> = {
  'sprint-team': {
    name: '冲刺团队',
    protocol: 'command-chain',
    maxParallelAgents: 4,
    members: {
      executor: {
        roleId: 'military-warrior',
        roleName: '战士',
        level: 'p7',
        responsibilities: ['核心开发', '攻坚克难']
      },
      researcher: {
        roleId: 'military-scout',
        roleName: '侦察兵',
        level: 'p7',
        responsibilities: ['技术调研', '方案预研']
      },
      reviewer: {
        roleId: 'sillytavern-antifragile',
        roleName: '反脆弱复盘官',
        level: 'p7',
        responsibilities: ['代码审查', '质量把控']
      }
    }
  },

  'architecture-team': {
    name: '架构团队',
    protocol: 'peer-to-peer',
    maxParallelAgents: 3,
    members: {
      executor: {
        roleId: 'shaman-einstein',
        roleName: '爱因斯坦',
        level: 'p9',
        responsibilities: ['架构设计', '技术选型']
      },
      researcher: {
        roleId: 'shaman-buffett',
        roleName: '巴菲特',
        level: 'p9',
        responsibilities: ['长期评估', '风险分析']
      },
      reviewer: {
        roleId: 'sillytavern-chief',
        roleName: '铁血幕僚长',
        level: 'p9',
        responsibilities: ['方案审核', '决策支持']
      }
    }
  },

  'innovation-team': {
    name: '创新团队',
    protocol: 'peer-to-peer',
    maxParallelAgents: 4,
    members: {
      executor: {
        roleId: 'shaman-musk',
        roleName: '马斯克',
        level: 'p10',
        responsibilities: ['创新突破', '第一性原理']
      },
      researcher: {
        roleId: 'shaman-davinci',
        roleName: '达芬奇',
        level: 'p9',
        responsibilities: ['跨界创新', '创意激发']
      },
      supporter: {
        roleId: 'special-creative-spark',
        roleName: '创意火花',
        level: 'p7',
        responsibilities: ['灵感激发', '头脑风暴']
      }
    }
  },

  'crisis-team': {
    name: '危机处理团队',
    protocol: 'command-chain',
    maxParallelAgents: 5,
    members: {
      executor: {
        roleId: 'military-warrior',
        roleName: '战士',
        level: 'p7',
        responsibilities: ['紧急修复', '问题定位']
      },
      researcher: {
        roleId: 'military-scout',
        roleName: '侦察兵',
        level: 'p7',
        responsibilities: ['根因分析', '影响评估']
      },
      reviewer: {
        roleId: 'military-discipline',
        roleName: '督战队',
        level: 'p7',
        responsibilities: ['进度监控', '质量把关']
      },
      supporter: {
        roleId: 'special-urgent-sprint',
        roleName: '紧急冲刺',
        level: 'p7',
        responsibilities: ['加速推进', '资源协调']
      }
    }
  }
};

// ============================================================================
// Agent Team 管理器
// ============================================================================

export class AgentTeamManager {
  private teams: Map<string, AgentTeam> = new Map();
  private sessions: Map<string, TeamSession> = new Map();
  private roleLevelManager: RoleLevelManager;

  constructor(roleLevelManager: RoleLevelManager) {
    this.roleLevelManager = roleLevelManager;
  }

  /**
   * 从模板创建团队
   */
  createTeamFromTemplate(
    templateId: string,
    projectContext: string,
    customizations?: Partial<AgentTeam>
  ): AgentTeam {
    const template = TEAM_TEMPLATES[templateId];
    if (!template) {
      throw new Error(`Unknown team template: ${templateId}`);
    }

    const teamId = `team-${Date.now()}`;
    
    // 根据项目上下文确定 Leader 级别
    const leaderLevel = this.determineLeaderLevel(projectContext);
    const leaderRole = this.selectLeaderRole(leaderLevel, projectContext);

    const team: AgentTeam = {
      id: teamId,
      name: customizations?.name || template.name || '未命名团队',
      leader: customizations?.leader || leaderRole,
      members: customizations?.members || template.members || {},
      protocol: customizations?.protocol || template.protocol || 'command-chain',
      maxParallelAgents: customizations?.maxParallelAgents || template.maxParallelAgents || 3
    };

    this.teams.set(teamId, team);

    // 初始化会话
    this.sessions.set(teamId, {
      teamId,
      projectContext,
      tasks: [],
      currentPhase: 'planning',
      messages: []
    });

    return team;
  }

  /**
   * 创建自定义团队
   */
  createCustomTeam(config: Omit<AgentTeam, 'id'>): AgentTeam {
    const teamId = `team-${Date.now()}`;
    const team: AgentTeam = {
      id: teamId,
      ...config
    };

    this.teams.set(teamId, team);
    return team;
  }

  /**
   * 获取团队
   */
  getTeam(teamId: string): AgentTeam | undefined {
    return this.teams.get(teamId);
  }

  /**
   * 解散团队
   */
  disbandTeam(teamId: string): void {
    this.teams.delete(teamId);
    this.sessions.delete(teamId);
  }

  /**
   * 分配任务
   */
  assignTask(
    teamId: string,
    task: Omit<TeamTask, 'id' | 'status'>
  ): TeamTask {
    const session = this.sessions.get(teamId);
    if (!session) {
      throw new Error('Team session not found');
    }

    const newTask: TeamTask = {
      id: `task-${Date.now()}`,
      status: 'pending',
      ...task
    };

    session.tasks.push(newTask);
    return newTask;
  }

  /**
   * 更新任务状态
   */
  updateTaskStatus(
    teamId: string,
    taskId: string,
    status: TeamTask['status']
  ): TeamTask {
    const session = this.sessions.get(teamId);
    if (!session) {
      throw new Error('Team session not found');
    }

    const task = session.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    task.status = status;
    return task;
  }

  /**
   * 发送团队消息
   */
  sendMessage(
    teamId: string,
    from: string,
    to: string,
    content: string,
    type: TeamMessage['type'] = 'report'
  ): TeamMessage {
    const session = this.sessions.get(teamId);
    if (!session) {
      throw new Error('Team session not found');
    }

    const message: TeamMessage = {
      from,
      to,
      content,
      timestamp: new Date(),
      type
    };

    session.messages.push(message);
    return message;
  }

  /**
   * 获取团队会话历史
   */
  getSessionHistory(teamId: string): TeamSession | undefined {
    return this.sessions.get(teamId);
  }

  /**
   * 生成协作剧本
   */
  generateCollaborationScript(teamId: string): string {
    const team = this.teams.get(teamId);
    const session = this.sessions.get(teamId);
    
    if (!team || !session) {
      throw new Error('Team or session not found');
    }

    const lines: string[] = [
      `# ${team.name} 协作剧本`,
      '',
      `项目背景: ${session.projectContext}`,
      `协作模式: ${team.protocol === 'command-chain' ? '指挥链' : '点对点'}`,
      '',
      '## 角色分工',
      '',
      `**Leader (${team.leader.roleName})**`,
      ...team.leader.responsibilities.map(r => `- ${r}`),
      ''
    ];

    if (team.members.executor) {
      lines.push(
        `**执行者 (${team.members.executor.roleName})**`,
        ...team.members.executor.responsibilities.map(r => `- ${r}`),
        ''
      );
    }

    if (team.members.researcher) {
      lines.push(
        `**研究员 (${team.members.researcher.roleName})**`,
        ...team.members.researcher.responsibilities.map(r => `- ${r}`),
        ''
      );
    }

    if (team.members.reviewer) {
      lines.push(
        `**审核员 (${team.members.reviewer.roleName})**`,
        ...team.members.reviewer.responsibilities.map(r => `- ${r}`),
        ''
      );
    }

    lines.push(
      '## 协作流程',
      '',
      '1. Leader 制定整体计划和分工',
      '2. 各成员按角色执行各自任务',
      '3. 定期同步进度和遇到的问题',
      '4. Reviewer 审核中间产出',
      '5. Leader 汇总并做最终决策',
      '',
      '## 沟通协议',
      ''
    );

    if (team.protocol === 'command-chain') {
      lines.push(
        '- 所有成员向 Leader 汇报',
        '- Leader 做最终决策',
        '- 成员之间通过 Leader 协调',
        '- 使用 [PUA-REPORT] 格式汇报'
      );
    } else {
      lines.push(
        '- 成员之间可以直接沟通',
        '- Leader 负责协调和决策',
        '- 重要决策需要共识',
        '- 定期全员同步会议'
      );
    }

    return lines.join('\n');
  }

  /**
   * 推荐团队配置
   */
  recommendTeam(
    projectType: 'development' | 'research' | 'crisis' | 'innovation',
    teamSize: number,
    timeline: 'urgent' | 'normal' | 'relaxed'
  ): TeamRecommendation {
    let templateId = 'sprint-team';
    let reason = '';
    let efficiency = 0.8;
    const risks: string[] = [];

    switch (projectType) {
      case 'development':
        templateId = 'sprint-team';
        reason = '标准开发团队配置，适合大多数项目';
        efficiency = 0.85;
        break;
      case 'research':
        templateId = 'architecture-team';
        reason = '研究型项目需要深度思考和分析';
        efficiency = 0.75;
        risks.push('研究周期可能较长');
        break;
      case 'crisis':
        templateId = 'crisis-team';
        reason = '危机处理需要快速响应和多角色协作';
        efficiency = 0.9;
        break;
      case 'innovation':
        templateId = 'innovation-team';
        reason = '创新项目需要跨界思维和创意激发';
        efficiency = 0.7;
        risks.push('创新结果不确定性较高');
        break;
    }

    if (timeline === 'urgent') {
      efficiency += 0.1;
      risks.push('时间紧急可能导致质量下降');
    }

    const template = TEAM_TEMPLATES[templateId];
    const team = this.createTeamFromTemplate(templateId, '推荐项目');

    return {
      suggestedTeam: team,
      reason,
      estimatedEfficiency: efficiency,
      riskFactors: risks
    };
  }

  /**
   * 确定 Leader 级别
   */
  private determineLeaderLevel(projectContext: string): RoleLevel {
    // 基于项目上下文判断
    const keywords = {
      p10: ['架构', '战略', '长期', '规划', '决策', '选型'],
      p9: ['团队', '协调', '管理', '项目', '带领'],
      p7: ['开发', '实现', '编码', '调试', '修复']
    };

    for (const [level, words] of Object.entries(keywords)) {
      if (words.some(w => projectContext.includes(w))) {
        return level as RoleLevel;
      }
    }

    return 'p9';  // 默认
  }

  /**
   * 选择 Leader 角色
   */
  private selectLeaderRole(level: RoleLevel, context: string): AgentRole {
    const leaders: Record<RoleLevel, AgentRole[]> = {
      p7: [
        {
          roleId: 'military-warrior',
          roleName: '战士',
          level: 'p7',
          responsibilities: ['任务执行', '技术攻坚']
        }
      ],
      p9: [
        {
          roleId: 'military-commander',
          roleName: '指挥员',
          level: 'p9',
          responsibilities: ['团队指挥', '任务分配', '进度把控']
        }
      ],
      p10: [
        {
          roleId: 'strategic-architect',
          roleName: '战略规划师',
          level: 'p10',
          responsibilities: ['战略规划', '架构决策', '技术方向']
        }
      ]
    };

    const options = leaders[level];
    return options[0];
  }

  /**
   * 获取团队统计
   */
  getTeamStats(teamId: string): {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    messageCount: number;
  } {
    const session = this.sessions.get(teamId);
    if (!session) {
      throw new Error('Team session not found');
    }

    return {
      totalTasks: session.tasks.length,
      completedTasks: session.tasks.filter(t => t.status === 'completed').length,
      inProgressTasks: session.tasks.filter(t => t.status === 'in-progress').length,
      blockedTasks: session.tasks.filter(t => t.status === 'blocked').length,
      messageCount: session.messages.length
    };
  }
}

// ============================================================================
// 单例导出
// ============================================================================

import { roleLevelManager } from './index.js';
export const agentTeamManager = new AgentTeamManager(roleLevelManager);

// ============================================================================
// 工具函数
// ============================================================================

export function getAvailableTemplates(): string[] {
  return Object.keys(TEAM_TEMPLATES);
}

export function getTemplateInfo(templateId: string): Partial<AgentTeam> | undefined {
  return TEAM_TEMPLATES[templateId];
}
