/**
 * 反馈收集系统
 * 收集用户对角色和触发效果的使用反馈
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// ============================================================================
// 类型定义
// ============================================================================

export interface RoleFeedback {
  id: string;
  roleId: string;
  sessionId: string;
  timestamp: Date;
  
  // 评分 (1-5)
  ratings: {
    helpfulness: number;      // 帮助程度
    relevance: number;        // 相关性
    quality: number;          // 输出质量
    overall: number;          // 综合评分
  };
  
  // 详细反馈
  comment?: string;
  wouldUseAgain: boolean;
  
  // 上下文
  context: {
    taskType: string;
    triggerType: string;
    triggerLevel: number;
    attemptCount: number;
  };
}

export interface TriggerFeedback {
  id: string;
  triggerId: string;
  sessionId: string;
  timestamp: Date;
  
  // 检测准确性
  accuracy: 'correct' | 'false_positive' | 'missed';
  confidence: number;
  
  // 干预效果
  interventionHelpful: boolean;
  
  // 评论
  comment?: string;
}

export interface SessionFeedback {
  sessionId: string;
  timestamp: Date;
  
  // 整体体验
  overallSatisfaction: number;  // 1-5
  wouldRecommend: boolean;
  
  // 使用统计
  stats: {
    totalTriggers: number;
    l3PlusTriggers: number;
    rolesUsed: string[];
    duration: number;  // 会话时长(分钟)
  };
  
  // 改进建议
  suggestions?: string;
}

export interface FeedbackStats {
  totalFeedbacks: number;
  averageRatings: {
    helpfulness: number;
    relevance: number;
    quality: number;
    overall: number;
  };
  roleRankings: Array<{
    roleId: string;
    usageCount: number;
    averageRating: number;
  }>;
  triggerAccuracy: {
    correct: number;
    falsePositive: number;
    missed: number;
  };
}

// ============================================================================
// 反馈收集器
// ============================================================================

export class FeedbackCollector {
  private dataDir: string;
  private roleFeedbacks: RoleFeedback[] = [];
  private triggerFeedbacks: TriggerFeedback[] = [];
  private sessionFeedbacks: SessionFeedback[] = [];
  private initialized: boolean = false;

  constructor() {
    this.dataDir = join(homedir(), '.puax', 'feedback');
    this.init();
  }

  /**
   * 初始化数据目录
   */
  private init(): void {
    if (this.initialized) return;

    try {
      if (!existsSync(this.dataDir)) {
        mkdirSync(this.dataDir, { recursive: true });
      }

      // 加载历史数据
      this.loadFeedbacks();
      this.initialized = true;
    } catch (error) {
      console.warn('[Feedback] Initialization failed:', error);
    }
  }

  /**
   * 加载历史反馈
   */
  private loadFeedbacks(): void {
    try {
      // 加载角色反馈
      const rolePath = join(this.dataDir, 'role-feedbacks.json');
      if (existsSync(rolePath)) {
        const data = JSON.parse(readFileSync(rolePath, 'utf-8')) as Array<RoleFeedback & { timestamp: string | number | Date }>;
        this.roleFeedbacks = data.map(f => ({
          ...f,
          timestamp: new Date(f.timestamp)
        }));
      }

      // 加载触发器反馈
      const triggerPath = join(this.dataDir, 'trigger-feedbacks.json');
      if (existsSync(triggerPath)) {
        const data = JSON.parse(readFileSync(triggerPath, 'utf-8')) as Array<TriggerFeedback & { timestamp: string | number | Date }>;
        this.triggerFeedbacks = data.map(f => ({
          ...f,
          timestamp: new Date(f.timestamp)
        }));
      }

      // 加载会话反馈
      const sessionPath = join(this.dataDir, 'session-feedbacks.json');
      if (existsSync(sessionPath)) {
        const data = JSON.parse(readFileSync(sessionPath, 'utf-8')) as Array<SessionFeedback & { timestamp: string | number | Date }>;
        this.sessionFeedbacks = data.map(f => ({
          ...f,
          timestamp: new Date(f.timestamp)
        }));
      }
    } catch (error) {
      console.warn('[Feedback] Load failed:', error);
    }
  }

  /**
   * 保存反馈数据
   */
  private saveFeedbacks(): void {
    try {
      // 保存角色反馈
      writeFileSync(
        join(this.dataDir, 'role-feedbacks.json'),
        JSON.stringify(this.roleFeedbacks, null, 2)
      );

      // 保存触发器反馈
      writeFileSync(
        join(this.dataDir, 'trigger-feedbacks.json'),
        JSON.stringify(this.triggerFeedbacks, null, 2)
      );

      // 保存会话反馈
      writeFileSync(
        join(this.dataDir, 'session-feedbacks.json'),
        JSON.stringify(this.sessionFeedbacks, null, 2)
      );
    } catch (error) {
      console.warn('[Feedback] Save failed:', error);
    }
  }

  /**
   * 提交角色反馈
   */
  submitRoleFeedback(feedback: Omit<RoleFeedback, 'id' | 'timestamp'>): RoleFeedback {
    const fullFeedback: RoleFeedback = {
      ...feedback,
      id: `rf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.roleFeedbacks.push(fullFeedback);
    
    // 限制存储数量，保留最近1000条
    if (this.roleFeedbacks.length > 1000) {
      this.roleFeedbacks = this.roleFeedbacks.slice(-1000);
    }

    this.saveFeedbacks();
    return fullFeedback;
  }

  /**
   * 快速评分
   */
  quickRate(roleId: string, rating: number, sessionId: string): void {
    this.submitRoleFeedback({
      roleId,
      sessionId,
      ratings: {
        helpfulness: rating,
        relevance: rating,
        quality: rating,
        overall: rating
      },
      wouldUseAgain: rating >= 4,
      context: {
        taskType: 'unknown',
        triggerType: 'unknown',
        triggerLevel: 0,
        attemptCount: 0
      }
    });
  }

  /**
   * 提交触发器反馈
   */
  submitTriggerFeedback(
    feedback: Omit<TriggerFeedback, 'id' | 'timestamp'>
  ): TriggerFeedback {
    const fullFeedback: TriggerFeedback = {
      ...feedback,
      id: `tf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.triggerFeedbacks.push(fullFeedback);
    
    if (this.triggerFeedbacks.length > 1000) {
      this.triggerFeedbacks = this.triggerFeedbacks.slice(-1000);
    }

    this.saveFeedbacks();
    return fullFeedback;
  }

  /**
   * 提交会话反馈
   */
  submitSessionFeedback(
    feedback: Omit<SessionFeedback, 'timestamp'>
  ): SessionFeedback {
    const fullFeedback: SessionFeedback = {
      ...feedback,
      timestamp: new Date()
    };

    this.sessionFeedbacks.push(fullFeedback);
    
    if (this.sessionFeedbacks.length > 100) {
      this.sessionFeedbacks = this.sessionFeedbacks.slice(-100);
    }

    this.saveFeedbacks();
    return fullFeedback;
  }

  /**
   * 获取角色统计
   */
  getRoleStats(roleId: string): {
    usageCount: number;
    averageRating: number;
    wouldUseAgainRate: number;
  } {
    const roleFeedbacks = this.roleFeedbacks.filter(f => f.roleId === roleId);
    
    if (roleFeedbacks.length === 0) {
      return { usageCount: 0, averageRating: 0, wouldUseAgainRate: 0 };
    }

    const averageRating = roleFeedbacks.reduce(
      (sum, f) => sum + f.ratings.overall, 0
    ) / roleFeedbacks.length;

    const wouldUseAgainCount = roleFeedbacks.filter(f => f.wouldUseAgain).length;

    return {
      usageCount: roleFeedbacks.length,
      averageRating: Math.round(averageRating * 10) / 10,
      wouldUseAgainRate: Math.round((wouldUseAgainCount / roleFeedbacks.length) * 100)
    };
  }

  /**
   * 获取全局统计
   */
  getGlobalStats(days: number = 30): FeedbackStats {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const recentRoleFeedbacks = this.roleFeedbacks.filter(
      f => f.timestamp > cutoffDate
    );

    const recentTriggerFeedbacks = this.triggerFeedbacks.filter(
      f => f.timestamp > cutoffDate
    );

    // 计算平均评分
    const averageRatings = recentRoleFeedbacks.length > 0 ? {
      helpfulness: Math.round(
        recentRoleFeedbacks.reduce((s, f) => s + f.ratings.helpfulness, 0) / recentRoleFeedbacks.length * 10
      ) / 10,
      relevance: Math.round(
        recentRoleFeedbacks.reduce((s, f) => s + f.ratings.relevance, 0) / recentRoleFeedbacks.length * 10
      ) / 10,
      quality: Math.round(
        recentRoleFeedbacks.reduce((s, f) => s + f.ratings.quality, 0) / recentRoleFeedbacks.length * 10
      ) / 10,
      overall: Math.round(
        recentRoleFeedbacks.reduce((s, f) => s + f.ratings.overall, 0) / recentRoleFeedbacks.length * 10
      ) / 10
    } : { helpfulness: 0, relevance: 0, quality: 0, overall: 0 };

    // 角色排名
    const roleUsage: Record<string, { count: number; totalRating: number }> = {};
    for (const f of recentRoleFeedbacks) {
      if (!roleUsage[f.roleId]) {
        roleUsage[f.roleId] = { count: 0, totalRating: 0 };
      }
      roleUsage[f.roleId].count++;
      roleUsage[f.roleId].totalRating += f.ratings.overall;
    }

    const roleRankings = Object.entries(roleUsage)
      .map(([roleId, data]) => ({
        roleId,
        usageCount: data.count,
        averageRating: Math.round((data.totalRating / data.count) * 10) / 10
      }))
      .sort((a, b) => b.usageCount - a.usageCount);

    // 触发器准确性
    const triggerAccuracy = {
      correct: recentTriggerFeedbacks.filter(f => f.accuracy === 'correct').length,
      falsePositive: recentTriggerFeedbacks.filter(f => f.accuracy === 'false_positive').length,
      missed: recentTriggerFeedbacks.filter(f => f.accuracy === 'missed').length
    };

    return {
      totalFeedbacks: recentRoleFeedbacks.length,
      averageRatings,
      roleRankings: roleRankings.slice(0, 10),
      triggerAccuracy
    };
  }

  /**
   * 获取用户反馈历史
   */
  getUserHistory(sessionId: string): {
    roles: RoleFeedback[];
    triggers: TriggerFeedback[];
    session?: SessionFeedback;
  } {
    return {
      roles: this.roleFeedbacks.filter(f => f.sessionId === sessionId),
      triggers: this.triggerFeedbacks.filter(f => f.sessionId === sessionId),
      session: this.sessionFeedbacks.find(f => f.sessionId === sessionId)
    };
  }

  /**
   * 生成反馈报告
   */
  generateReport(days: number = 30): string {
    const stats = this.getGlobalStats(days);
    
    const lines: string[] = [
      '# PUAX 反馈报告',
      `生成时间: ${new Date().toLocaleString('zh-CN')}`,
      `统计周期: 最近 ${days} 天`,
      '',
      '## 总体反馈',
      `- 总反馈数: ${stats.totalFeedbacks}`,
      `- 平均帮助度: ${stats.averageRatings.helpfulness}/5`,
      `- 平均相关性: ${stats.averageRatings.relevance}/5`,
      `- 平均质量: ${stats.averageRatings.quality}/5`,
      `- 综合评分: ${stats.averageRatings.overall}/5`,
      '',
      '## 角色排名 (Top 10)',
      ''
    ];

    for (let i = 0; i < stats.roleRankings.length; i++) {
      const role = stats.roleRankings[i];
      lines.push(`${i + 1}. **${role.roleId}**: ${role.usageCount} 次使用, 平均评分 ${role.averageRating}`);
    }

    lines.push(
      '',
      '## 触发器准确性',
      `- 正确检测: ${stats.triggerAccuracy.correct}`,
      `- 误报: ${stats.triggerAccuracy.falsePositive}`,
      `- 漏检: ${stats.triggerAccuracy.missed}`
    );

    const totalTriggers = stats.triggerAccuracy.correct + 
                         stats.triggerAccuracy.falsePositive + 
                         stats.triggerAccuracy.missed;
    
    if (totalTriggers > 0) {
      const accuracy = Math.round(
        (stats.triggerAccuracy.correct / totalTriggers) * 100
      );
      lines.push(`- 准确率: ${accuracy}%`);
    }

    return lines.join('\n');
  }

  /**
   * 导出反馈数据
   */
  exportData(): {
    roleFeedbacks: RoleFeedback[];
    triggerFeedbacks: TriggerFeedback[];
    sessionFeedbacks: SessionFeedback[];
  } {
    return {
      roleFeedbacks: [...this.roleFeedbacks],
      triggerFeedbacks: [...this.triggerFeedbacks],
      sessionFeedbacks: [...this.sessionFeedbacks]
    };
  }

  /**
   * 清空所有反馈
   */
  clearAll(): void {
    this.roleFeedbacks = [];
    this.triggerFeedbacks = [];
    this.sessionFeedbacks = [];
    this.saveFeedbacks();
  }
}

// ============================================================================
// 单例导出
// ============================================================================

export const feedbackCollector = new FeedbackCollector();

// ============================================================================
// 便捷函数
// ============================================================================

export function rateRole(
  roleId: string, 
  rating: number, 
  sessionId: string
): void {
  feedbackCollector.quickRate(roleId, rating, sessionId);
}

export function getRoleRanking(): Array<{
  roleId: string;
  usageCount: number;
  averageRating: number;
}> {
  return feedbackCollector.getGlobalStats().roleRankings;
}
