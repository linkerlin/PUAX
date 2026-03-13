#!/usr/bin/env node
/**
 * PUAX 用户反馈收集系统
 * 收集用户对角色和自动触发系统的反馈
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';

// ============================================================================
// 类型定义
// ============================================================================

export interface RoleFeedback {
  id: string;
  timestamp: number;
  role_id: string;
  session_id: string;
  
  // 评分 (1-5)
  helpfulness: number;      // 是否有帮助
  relevance: number;        // 触发时机是否合适
  quality: number;          // 输出质量
  
  // 反馈内容
  comment?: string;
  issue_type?: 'wrong_trigger' | 'wrong_role' | 'poor_quality' | 'too_aggressive' | 'not_helpful' | 'other';
  
  // 上下文
  trigger_condition?: string;
  task_type?: string;
  user_agent?: string;
}

export interface TriggerFeedback {
  id: string;
  timestamp: number;
  trigger_condition: string;
  session_id: string;
  
  // 是否正确检测
  was_accurate: boolean;
  should_have_triggered: boolean;  // 如果was_accurate=false，是否应该触发
  
  // 反馈内容
  comment?: string;
  missed_trigger?: string;  // 如果漏检，应该是什么触发条件
}

export interface FeatureRequest {
  id: string;
  timestamp: number;
  type: 'new_role' | 'new_trigger' | 'new_flavor' | 'improvement' | 'bug';
  title: string;
  description: string;
  user_email?: string;
  status: 'open' | 'under_review' | 'planned' | 'completed' | 'rejected';
}

export interface FeedbackStats {
  total_feedback: number;
  average_helpfulness: number;
  average_relevance: number;
  average_quality: number;
  issue_breakdown: Record<string, number>;
  satisfaction_trend: Array<{ date: string; score: number }>;
}

// ============================================================================
// 反馈系统
// ============================================================================

export class FeedbackSystem {
  private dataDir: string;
  private roleFeedback: RoleFeedback[] = [];
  private triggerFeedback: TriggerFeedback[] = [];
  private featureRequests: FeatureRequest[] = [];

  constructor(dataDir: string = './feedback/data') {
    this.dataDir = dataDir;
    this.ensureDataDir();
    this.loadData();
  }

  private ensureDataDir(): void {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private getDataFile(type: string): string {
    return join(this.dataDir, `${type}.json`);
  }

  private loadData(): void {
    // 加载角色反馈
    const roleFile = this.getDataFile('role-feedback');
    if (existsSync(roleFile)) {
      try {
        this.roleFeedback = JSON.parse(readFileSync(roleFile, 'utf-8'));
      } catch (e) {
        this.roleFeedback = [];
      }
    }

    // 加载触发器反馈
    const triggerFile = this.getDataFile('trigger-feedback');
    if (existsSync(triggerFile)) {
      try {
        this.triggerFeedback = JSON.parse(readFileSync(triggerFile, 'utf-8'));
      } catch (e) {
        this.triggerFeedback = [];
      }
    }

    // 加载功能请求
    const featureFile = this.getDataFile('feature-requests');
    if (existsSync(featureFile)) {
      try {
        this.featureRequests = JSON.parse(readFileSync(featureFile, 'utf-8'));
      } catch (e) {
        this.featureRequests = [];
      }
    }
  }

  private saveData(type: 'role' | 'trigger' | 'feature'): void {
    switch (type) {
      case 'role':
        writeFileSync(
          this.getDataFile('role-feedback'),
          JSON.stringify(this.roleFeedback, null, 2)
        );
        break;
      case 'trigger':
        writeFileSync(
          this.getDataFile('trigger-feedback'),
          JSON.stringify(this.triggerFeedback, null, 2)
        );
        break;
      case 'feature':
        writeFileSync(
          this.getDataFile('feature-requests'),
          JSON.stringify(this.featureRequests, null, 2)
        );
        break;
    }
  }

  // ============================================================================
  // 角色反馈
  // ============================================================================

  /**
   * 提交角色反馈
   */
  submitRoleFeedback(feedback: Omit<RoleFeedback, 'id' | 'timestamp'>): RoleFeedback {
    const fullFeedback: RoleFeedback = {
      ...feedback,
      id: this.generateId(),
      timestamp: Date.now()
    };

    this.roleFeedback.push(fullFeedback);
    this.saveData('role');

    // 记录到日志
    this.logFeedback('role', fullFeedback);

    return fullFeedback;
  }

  /**
   * 快速评分 (1-5星)
   */
  quickRate(roleId: string, rating: number, sessionId: string): RoleFeedback {
    return this.submitRoleFeedback({
      role_id: roleId,
      session_id: sessionId,
      helpfulness: rating,
      relevance: rating,
      quality: rating
    });
  }

  /**
   * 获取角色反馈统计
   */
  getRoleFeedbackStats(roleId?: string, days: number = 30): {
    count: number;
    avg_helpfulness: number;
    avg_relevance: number;
    avg_quality: number;
    issues: Record<string, number>;
  } {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    let feedback = this.roleFeedback.filter(f => f.timestamp > cutoff);
    
    if (roleId) {
      feedback = feedback.filter(f => f.role_id === roleId);
    }

    if (feedback.length === 0) {
      return {
        count: 0,
        avg_helpfulness: 0,
        avg_relevance: 0,
        avg_quality: 0,
        issues: {}
      };
    }

    const issues: Record<string, number> = {};
    feedback.forEach(f => {
      if (f.issue_type) {
        issues[f.issue_type] = (issues[f.issue_type] || 0) + 1;
      }
    });

    return {
      count: feedback.length,
      avg_helpfulness: feedback.reduce((s, f) => s + f.helpfulness, 0) / feedback.length,
      avg_relevance: feedback.reduce((s, f) => s + f.relevance, 0) / feedback.length,
      avg_quality: feedback.reduce((s, f) => s + f.quality, 0) / feedback.length,
      issues
    };
  }

  // ============================================================================
  // 触发器反馈
  // ============================================================================

  /**
   * 提交触发器反馈
   */
  submitTriggerFeedback(feedback: Omit<TriggerFeedback, 'id' | 'timestamp'>): TriggerFeedback {
    const fullFeedback: TriggerFeedback = {
      ...feedback,
      id: this.generateId(),
      timestamp: Date.now()
    };

    this.triggerFeedback.push(fullFeedback);
    this.saveData('trigger');

    this.logFeedback('trigger', fullFeedback);

    return fullFeedback;
  }

  /**
   * 报告误检
   */
  reportFalsePositive(triggerCondition: string, sessionId: string, comment?: string): TriggerFeedback {
    return this.submitTriggerFeedback({
      trigger_condition: triggerCondition,
      session_id: sessionId,
      was_accurate: false,
      should_have_triggered: false,
      comment
    });
  }

  /**
   * 报告漏检
   */
  reportFalseNegative(missedTrigger: string, sessionId: string, comment?: string): TriggerFeedback {
    return this.submitTriggerFeedback({
      trigger_condition: 'none',
      session_id: sessionId,
      was_accurate: false,
      should_have_triggered: true,
      missed_trigger: missedTrigger,
      comment
    });
  }

  /**
   * 获取触发器准确率
   */
  getTriggerAccuracy(triggerCondition?: string, days: number = 30): {
    total: number;
    accurate: number;
    false_positives: number;
    false_negatives: number;
    accuracy_rate: number;
  } {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    let feedback = this.triggerFeedback.filter(f => f.timestamp > cutoff);

    if (triggerCondition) {
      feedback = feedback.filter(f => f.trigger_condition === triggerCondition);
    }

    const accurate = feedback.filter(f => f.was_accurate).length;
    const falsePositives = feedback.filter(f => !f.was_accurate && !f.should_have_triggered).length;
    const falseNegatives = feedback.filter(f => !f.was_accurate && f.should_have_triggered).length;

    return {
      total: feedback.length,
      accurate,
      false_positives: falsePositives,
      false_negatives: falseNegatives,
      accuracy_rate: feedback.length > 0 ? (accurate / feedback.length) * 100 : 0
    };
  }

  // ============================================================================
  // 功能请求
  // ============================================================================

  /**
   * 提交功能请求
   */
  submitFeatureRequest(request: Omit<FeatureRequest, 'id' | 'timestamp' | 'status'>): FeatureRequest {
    const fullRequest: FeatureRequest = {
      ...request,
      id: this.generateId(),
      timestamp: Date.now(),
      status: 'open'
    };

    this.featureRequests.push(fullRequest);
    this.saveData('feature');

    return fullRequest;
  }

  /**
   * 更新功能请求状态
   */
  updateFeatureStatus(id: string, status: FeatureRequest['status']): boolean {
    const request = this.featureRequests.find(r => r.id === id);
    if (request) {
      request.status = status;
      this.saveData('feature');
      return true;
    }
    return false;
  }

  /**
   * 获取功能请求列表
   */
  getFeatureRequests(status?: FeatureRequest['status']): FeatureRequest[] {
    let requests = this.featureRequests;
    if (status) {
      requests = requests.filter(r => r.status === status);
    }
    return requests.sort((a, b) => b.timestamp - a.timestamp);
  }

  // ============================================================================
  // 统计和报告
  // ============================================================================

  /**
   * 获取整体反馈统计
   */
  getFeedbackStats(days: number = 30): FeedbackStats {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const roleFeedback = this.roleFeedback.filter(f => f.timestamp > cutoff);

    // 按天统计满意度趋势
    const dailyScores = new Map<string, number[]>();
    roleFeedback.forEach(f => {
      const date = new Date(f.timestamp).toISOString().split('T')[0];
      const scores = dailyScores.get(date) || [];
      scores.push((f.helpfulness + f.relevance + f.quality) / 3);
      dailyScores.set(date, scores);
    });

    const satisfactionTrend = Array.from(dailyScores.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, scores]) => ({
        date,
        score: scores.reduce((a, b) => a + b, 0) / scores.length
      }));

    // 问题类型统计
    const issueBreakdown: Record<string, number> = {};
    roleFeedback.forEach(f => {
      if (f.issue_type) {
        issueBreakdown[f.issue_type] = (issueBreakdown[f.issue_type] || 0) + 1;
      }
    });

    return {
      total_feedback: roleFeedback.length,
      average_helpfulness: roleFeedback.length > 0
        ? roleFeedback.reduce((s, f) => s + f.helpfulness, 0) / roleFeedback.length
        : 0,
      average_relevance: roleFeedback.length > 0
        ? roleFeedback.reduce((s, f) => s + f.relevance, 0) / roleFeedback.length
        : 0,
      average_quality: roleFeedback.length > 0
        ? roleFeedback.reduce((s, f) => s + f.quality, 0) / roleFeedback.length
        : 0,
      issue_breakdown: issueBreakdown,
      satisfaction_trend: satisfactionTrend
    };
  }

  /**
   * 生成反馈报告
   */
  generateReport(days: number = 30): string {
    const stats = this.getFeedbackStats(days);
    const triggerAccuracy = this.getTriggerAccuracy(undefined, days);
    const recentFeatures = this.getFeatureRequests().slice(0, 10);

    return `# PUAX 用户反馈报告

## 概览

- **统计周期**: 最近${days}天
- **总反馈数**: ${stats.total_feedback}
- **平均满意度**: ${((stats.average_helpfulness + stats.average_relevance + stats.average_quality) / 3).toFixed(1)}/5.0
- **触发器准确率**: ${triggerAccuracy.accuracy_rate.toFixed(1)}%

## 评分统计

| 维度 | 平均分 | 状态 |
|------|--------|------|
| 有用性 | ${stats.average_helpfulness.toFixed(1)}/5.0 | ${this.getRatingEmoji(stats.average_helpfulness)} |
| 相关性 | ${stats.average_relevance.toFixed(1)}/5.0 | ${this.getRatingEmoji(stats.average_relevance)} |
| 质量 | ${stats.average_quality.toFixed(1)}/5.0 | ${this.getRatingEmoji(stats.average_quality)} |

## 问题分布

${Object.entries(stats.issue_breakdown).length > 0 
  ? Object.entries(stats.issue_breakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `- ${this.translateIssueType(type)}: ${count}次`)
      .join('\n')
  : '暂无问题反馈'}

## 触发器准确率

- **总检测次数**: ${triggerAccuracy.total}
- **准确**: ${triggerAccuracy.accurate}
- **误检**: ${triggerAccuracy.false_positives}
- **漏检**: ${triggerAccuracy.false_negatives}

## 最近功能请求

${recentFeatures.length > 0
  ? recentFeatures.map((f, i) => `${i + 1}. [${f.status}] ${f.title} (${f.type})`).join('\n')
  : '暂无功能请求'}

## 满意度趋势

${stats.satisfaction_trend.map(t => `- ${t.date}: ${t.score.toFixed(1)}/5.0`).join('\n')}

---

*报告生成时间: ${new Date().toISOString()}*
`;
  }

  // ============================================================================
  // 辅助方法
  // ============================================================================

  private generateId(): string {
    return `fb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private logFeedback(type: string, data: any): void {
    const logFile = join(this.dataDir, 'feedback.log');
    const logEntry = `[${new Date().toISOString()}] ${type}: ${JSON.stringify(data)}\n`;
    appendFileSync(logFile, logEntry);
  }

  private getRatingEmoji(score: number): string {
    if (score >= 4.5) return '🌟🌟🌟🌟🌟';
    if (score >= 3.5) return '🌟🌟🌟🌟';
    if (score >= 2.5) return '🌟🌟🌟';
    if (score >= 1.5) return '🌟🌟';
    return '🌟';
  }

  private translateIssueType(type: string): string {
    const map: Record<string, string> = {
      wrong_trigger: '错误触发',
      wrong_role: '角色不合适',
      poor_quality: '输出质量差',
      too_aggressive: '过于激进',
      not_helpful: '没有帮助',
      other: '其他'
    };
    return map[type] || type;
  }
}

// ============================================================================
// 导出
// ============================================================================

let feedbackInstance: FeedbackSystem | null = null;

export function getFeedbackSystem(dataDir?: string): FeedbackSystem {
  if (!feedbackInstance) {
    feedbackInstance = new FeedbackSystem(dataDir);
  }
  return feedbackInstance;
}

// CLI支持
if (require.main === module) {
  const system = new FeedbackSystem();
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'report':
      console.log(system.generateReport(parseInt(args[1]) || 30));
      break;
    
    case 'stats':
      console.log(JSON.stringify(system.getFeedbackStats(parseInt(args[1]) || 30), null, 2));
      break;
    
    case 'trigger-accuracy':
      console.log(JSON.stringify(system.getTriggerAccuracy(args[1], parseInt(args[2]) || 30), null, 2));
      break;
    
    case 'features':
      console.log(system.getFeatureRequests(args[1] as any).map(f => 
        `[${f.status}] ${f.title}`
      ).join('\n'));
      break;
    
    default:
      console.log('用法: ts-node feedback-system.ts [report|stats|trigger-accuracy|features] [args...]');
  }
}
