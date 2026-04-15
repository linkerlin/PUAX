/**
 * PUAX 反馈收集系统
 * 会话结束时收集反馈，用于持续改进
 * 
 * 功能:
 * - 会话成功率评估
 * - 压力等级效果评估
 * - 角色推荐准确度评估
 * - 反馈历史分析
 */

import type { StateManager, FeedbackRecord, SessionState } from './state-manager.js';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import { stateManager as defaultStateManager } from './state-manager.js';

// ============================================================================
// 类型定义
// ============================================================================

export interface SessionFeedback {
  sessionId: string;
  success: boolean;
  rating: number;  // 1-5
  pressureLevel: number;
  triggerCount: number;
  comments?: string;
  
  // 详细评估
  assessments?: {
    roleHelpfulness?: number;      // 角色是否有帮助
    pressureAppropriate?: number;  // 压力等级是否合适
    methodologySwitchHelpful?: boolean;  // 方法论切换是否有帮助
    wouldRecommend?: boolean;      // 是否愿意再次使用
  };
}

export interface FeedbackSummary {
  totalSessions: number;
  successfulSessions: number;
  successRate: number;
  averageRating: number;
  averagePressureLevel: number;
  totalTriggers: number;
  
  // 按压力等级统计
  byPressureLevel: Record<number, {
    count: number;
    successRate: number;
    averageRating: number;
  }>;
  
  // 趋势
  trend: {
    improving: boolean;
    recentSuccessRate: number;
    previousSuccessRate: number;
  };
}

export interface ImprovementSuggestion {
  type: 'pressure_timing' | 'role_recommendation' | 'methodology_switch' | 'general';
  description: string;
  confidence: number;
  basedOn: string;
}

// ============================================================================
// 反馈系统类
// ============================================================================

export class FeedbackSystem {
  private stateManager: StateManager;

  constructor(stateManager?: StateManager) {
    this.stateManager = stateManager ?? defaultStateManager;
  }

  /**
   * 收集会话反馈
   */
  collectFeedback(feedback: SessionFeedback): void {
    // 保存到状态管理器
    this.stateManager.recordFeedback(feedback.sessionId, {
      pressureLevel: feedback.pressureLevel,
      rating: feedback.rating,
      success: feedback.success,
      comments: feedback.comments
    });

    console.log(`[FeedbackSystem] Feedback collected for ${feedback.sessionId}: ${feedback.rating}/5, success=${feedback.success}`);
  }

  /**
   * 快速收集反馈（简化版）
   */
  quickFeedback(
    sessionId: string,
    success: boolean,
    rating: number,
    comments?: string
  ): void {
    const state = this.stateManager.getSessionState(sessionId);
    
    this.collectFeedback({
      sessionId,
      success,
      rating,
      pressureLevel: state.pressureLevel,
      triggerCount: state.triggerCount,
      comments
    });
  }

  /**
   * 获取反馈汇总
   */
  getFeedbackSummary(days: number = 30): FeedbackSummary {
    const allFeedback = this.stateManager.getFeedbackHistory();
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    // 过滤最近的数据
    const recentFeedback = allFeedback.filter(f => f.timestamp >= cutoffTime);
    
    if (recentFeedback.length === 0) {
      return this.createEmptySummary();
    }

    // 基础统计
    const totalSessions = recentFeedback.length;
    const successfulSessions = recentFeedback.filter(f => f.success).length;
    const successRate = successfulSessions / totalSessions;
    const averageRating = recentFeedback.reduce((sum, f) => sum + f.rating, 0) / totalSessions;
    const averagePressureLevel = recentFeedback.reduce((sum, f) => sum + f.pressureLevel, 0) / totalSessions;

    // 按压力等级统计
    const byPressureLevel: FeedbackSummary['byPressureLevel'] = {};
    for (let level = 0; level <= 4; level++) {
      const levelFeedback = recentFeedback.filter(f => f.pressureLevel === level);
      if (levelFeedback.length > 0) {
        const levelSuccess = levelFeedback.filter(f => f.success).length;
        byPressureLevel[level] = {
          count: levelFeedback.length,
          successRate: levelSuccess / levelFeedback.length,
          averageRating: levelFeedback.reduce((sum, f) => sum + f.rating, 0) / levelFeedback.length
        };
      }
    }

    // 趋势分析（比较最近7天和前7天）
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    
    const recentWeek = recentFeedback.filter(f => f.timestamp >= now - sevenDays);
    const previousWeek = recentFeedback.filter(f => 
      f.timestamp >= now - 2 * sevenDays && f.timestamp < now - sevenDays
    );

    const recentSuccessRate = recentWeek.length > 0
      ? recentWeek.filter(f => f.success).length / recentWeek.length
      : 0;
    
    const previousSuccessRate = previousWeek.length > 0
      ? previousWeek.filter(f => f.success).length / previousWeek.length
      : 0;

    return {
      totalSessions,
      successfulSessions,
      successRate,
      averageRating,
      averagePressureLevel,
      totalTriggers: recentFeedback.length, // 这里需要关联触发数据
      byPressureLevel,
      trend: {
        improving: recentSuccessRate > previousSuccessRate,
        recentSuccessRate,
        previousSuccessRate
      }
    };
  }

  /**
   * 生成改进建议
   */
  generateImprovementSuggestions(): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];
    const summary = this.getFeedbackSummary(30);

    // 检查成功率
    if (summary.successRate < 0.5) {
      suggestions.push({
        type: 'general',
        description: '整体成功率较低，建议检查触发条件是否过于敏感或角色推荐是否合适',
        confidence: 0.8,
        basedOn: `成功率: ${(summary.successRate * 100).toFixed(1)}%`
      });
    }

    // 检查各压力等级的效果
    for (const [level, stats] of Object.entries(summary.byPressureLevel)) {
      if (stats.successRate < 0.4 && stats.count >= 5) {
        suggestions.push({
          type: 'pressure_timing',
          description: `L${level} 压力等级的成功率偏低 (${(stats.successRate * 100).toFixed(1)}%)，建议调整触发时机或升级策略`,
          confidence: 0.7,
          basedOn: `L${level} 统计: ${stats.count} 次会话`
        });
      }
    }

    // 检查评分分布
    if (summary.averageRating < 3) {
      suggestions.push({
        type: 'role_recommendation',
        description: '平均评分较低，建议优化角色推荐算法，更精准匹配问题类型',
        confidence: 0.75,
        basedOn: `平均评分: ${summary.averageRating.toFixed(2)}/5`
      });
    }

    // 检查高压力等级的必要性
    const l4Stats = summary.byPressureLevel[4];
    if (l4Stats && l4Stats.count > summary.totalSessions * 0.3) {
      suggestions.push({
        type: 'methodology_switch',
        description: '过高比例的会话达到 L4 压力等级，建议在 L2/L3 时加强方法论切换指导',
        confidence: 0.65,
        basedOn: `L4 占比: ${(l4Stats.count / summary.totalSessions * 100).toFixed(1)}%`
      });
    }

    return suggestions;
  }

  /**
   * 生成会话结束报告
   */
  generateSessionReport(sessionId: string): {
    session: SessionState;
    feedback: FeedbackRecord[];
    summary: string;
    recommendations: string[];
  } | null {
    const state = this.stateManager.getSessionState(sessionId);
    const feedback = this.stateManager.getFeedbackHistory(sessionId);

    if (!state) return null;

    const summary = this.buildSessionSummary(state, feedback);
    const recommendations = this.generateSessionRecommendations(state, feedback);

    return {
      session: state,
      feedback,
      summary,
      recommendations
    };
  }

  /**
   * 导出反馈数据
   */
  exportFeedbackData(format: 'json' | 'csv' = 'json'): string {
    const allFeedback = this.stateManager.getFeedbackHistory();
    const allStates = this.getAllSessionStates();

    if (format === 'csv') {
      const headers = 'timestamp,sessionId,success,rating,pressureLevel,triggerCount\n';
      const rows = allFeedback.map(f => 
        `${new Date(f.timestamp).toISOString()},${f.sessionId},${f.success},${f.rating},${f.pressureLevel},${allStates[f.sessionId]?.triggerCount || 0}`
      ).join('\n');
      return headers + rows;
    }

    return JSON.stringify({
      exportTime: new Date().toISOString(),
      totalRecords: allFeedback.length,
      data: allFeedback.map(f => ({
        ...f,
        sessionDetails: allStates[f.sessionId]
      }))
    }, null, 2);
  }

  /**
   * 获取 PUA Loop 报告（对标原版 PUA）
   */
  generatePUALoopReport(sessionId: string): string {
    const state = this.stateManager.getSessionState(sessionId);
    const feedback = this.stateManager.getFeedbackHistory(sessionId);
    const journal = this.stateManager.readBuilderJournal();

    if (!state) return '';

    const report = [
      '# PUAX Loop Report',
      '',
      `**Session ID:** ${sessionId}`,
      `**Generated:** ${new Date().toISOString()}`,
      '',
      '## Session Statistics',
      '',
      `- **Duration:** ${this.formatDuration(Date.now() - state.startTime)}`,
      `- **Pressure Level Reached:** L${state.pressureLevel}`,
      `- **Failure Count:** ${state.failureCount}`,
      `- **Trigger Count:** ${state.triggerCount}`,
      `- **Final Flavor:** ${state.currentFlavor || 'N/A'}`,
      '',
      '## Feedback',
      ''
    ];

    if (feedback.length > 0) {
      const latest = feedback[feedback.length - 1];
      report.push(
        `- **Success:** ${latest.success ? '✅ Yes' : '❌ No'}`,
        `- **Rating:** ${latest.rating}/5`,
        `- **Comments:** ${latest.comments || 'N/A'}`,
        ''
      );
    } else {
      report.push('*No feedback collected*\n');
    }

    report.push(
      '## Methodology History',
      '',
      state.methodologyHistory.length > 0
        ? state.methodologyHistory.map(m => `- ${m}`).join('\n')
        : '*No methodology switches*',
      '',
      '## Builder Journal',
      '',
      journal.includes(sessionId) 
        ? '*See builder-journal.md for checkpoints*'
        : '*No journal entries*',
      ''
    );

    return report.join('\n');
  }

  // ============================================================================
  // 私有辅助方法
  // ============================================================================

  private createEmptySummary(): FeedbackSummary {
    return {
      totalSessions: 0,
      successfulSessions: 0,
      successRate: 0,
      averageRating: 0,
      averagePressureLevel: 0,
      totalTriggers: 0,
      byPressureLevel: {},
      trend: {
        improving: false,
        recentSuccessRate: 0,
        previousSuccessRate: 0
      }
    };
  }

  private buildSessionSummary(state: SessionState, feedback: FeedbackRecord[]): string {
    const parts: string[] = [
      `Session ${state.sessionId} summary:`,
      `- Duration: ${this.formatDuration(Date.now() - state.startTime)}`,
      `- Max Pressure: L${state.pressureLevel}`,
      `- Failures: ${state.failureCount}`,
      `- Triggers: ${state.triggerCount}`
    ];

    if (feedback.length > 0) {
      const latest = feedback[feedback.length - 1];
      parts.push(`- Final Rating: ${latest.rating}/5`);
      parts.push(`- Success: ${latest.success ? 'Yes' : 'No'}`);
    }

    return parts.join('\n');
  }

  private generateSessionRecommendations(state: SessionState, feedback: FeedbackRecord[]): string[] {
    const recommendations: string[] = [];

    // 基于压力等级的建议
    if (state.pressureLevel >= 4) {
      recommendations.push('Session reached L4 pressure. Consider breaking down tasks into smaller steps.');
    }

    // 基于失败次数的建议
    if (state.failureCount >= 5) {
      recommendations.push('High failure count detected. Review methodology choices and tool usage.');
    }

    // 基于反馈的建议
    if (feedback.length > 0) {
      const avgRating = feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;
      if (avgRating < 3) {
        recommendations.push('Low satisfaction rating. Review role recommendations for this session type.');
      }
    }

    return recommendations;
  }

  private formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }

  private getAllSessionStates(): Record<string, SessionState> {
    // 访问 stateManager 的私有方法需要通过其他方式
    // 这里简化处理，实际使用时可以暴露相关接口
    return {};
  }
}

// 导出单例
export const feedbackSystem = new FeedbackSystem();
export default feedbackSystem;
