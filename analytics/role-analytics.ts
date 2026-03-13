#!/usr/bin/env node
/**
 * PUAX 角色使用分析系统
 * 跟踪角色使用情况、效果评估和趋势分析
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// ============================================================================
// 类型定义
// ============================================================================

export interface RoleUsageEvent {
  timestamp: number;
  role_id: string;
  category: string;
  trigger_condition?: string;
  task_type?: string;
  session_id: string;
  success?: boolean;
  duration_ms?: number;
  user_rating?: number; // 1-5
}

export interface RolePerformanceMetrics {
  role_id: string;
  total_activations: number;
  successful_activations: number;
  failed_activations: number;
  average_duration_ms: number;
  user_satisfaction: number; // 0-100
  trend: 'up' | 'down' | 'stable';
  last_used: number;
}

export interface CategoryAnalytics {
  category: string;
  total_usage: number;
  top_roles: string[];
  average_satisfaction: number;
  growth_rate: number;
}

export interface DailyStats {
  date: string;
  total_activations: number;
  unique_roles: number;
  unique_sessions: number;
  top_trigger: string;
  top_role: string;
}

// ============================================================================
// 分析引擎
// ============================================================================

export class RoleAnalyticsEngine {
  private dataDir: string;
  private events: RoleUsageEvent[] = [];
  private maxEventsInMemory: number = 10000;

  constructor(dataDir: string = './analytics/data') {
    this.dataDir = dataDir;
    this.ensureDataDir();
    this.loadEvents();
  }

  private ensureDataDir(): void {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private getEventsFile(): string {
    return join(this.dataDir, 'events.json');
  }

  private loadEvents(): void {
    const file = this.getEventsFile();
    if (existsSync(file)) {
      try {
        const data = readFileSync(file, 'utf-8');
        this.events = JSON.parse(data);
      } catch (e) {
        this.events = [];
      }
    }
  }

  private saveEvents(): void {
    const file = this.getEventsFile();
    writeFileSync(file, JSON.stringify(this.events, null, 2));
  }

  // ============================================================================
  // 事件记录
  // ============================================================================

  /**
   * 记录角色使用事件
   */
  recordEvent(event: Omit<RoleUsageEvent, 'timestamp'>): void {
    const fullEvent: RoleUsageEvent = {
      ...event,
      timestamp: Date.now()
    };

    this.events.push(fullEvent);

    // 限制内存中的事件数量
    if (this.events.length > this.maxEventsInMemory) {
      this.events = this.events.slice(-this.maxEventsInMemory);
    }

    // 每100个事件保存一次
    if (this.events.length % 100 === 0) {
      this.saveEvents();
    }
  }

  /**
   * 批量记录事件
   */
  recordEvents(events: Omit<RoleUsageEvent, 'timestamp'>[]): void {
    events.forEach(e => this.recordEvent(e));
    this.saveEvents();
  }

  // ============================================================================
  // 角色分析
  // ============================================================================

  /**
   * 获取角色性能指标
   */
  getRoleMetrics(roleId: string, days: number = 30): RolePerformanceMetrics {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const roleEvents = this.events.filter(
      e => e.role_id === roleId && e.timestamp > cutoff
    );

    if (roleEvents.length === 0) {
      return {
        role_id: roleId,
        total_activations: 0,
        successful_activations: 0,
        failed_activations: 0,
        average_duration_ms: 0,
        user_satisfaction: 0,
        trend: 'stable',
        last_used: 0
      };
    }

    const successful = roleEvents.filter(e => e.success === true).length;
    const failed = roleEvents.filter(e => e.success === false).length;
    const durations = roleEvents
      .filter(e => e.duration_ms)
      .map(e => e.duration_ms!);
    const ratings = roleEvents
      .filter(e => e.user_rating)
      .map(e => e.user_rating!);

    // 计算趋势
    const halfPoint = Math.floor(roleEvents.length / 2);
    const firstHalf = roleEvents.slice(0, halfPoint).length;
    const secondHalf = roleEvents.slice(halfPoint).length;
    const trend = secondHalf > firstHalf * 1.2 ? 'up' : 
                  secondHalf < firstHalf * 0.8 ? 'down' : 'stable';

    return {
      role_id: roleId,
      total_activations: roleEvents.length,
      successful_activations: successful,
      failed_activations: failed,
      average_duration_ms: durations.length > 0 
        ? durations.reduce((a, b) => a + b, 0) / durations.length 
        : 0,
      user_satisfaction: ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) * 20
        : 0,
      trend,
      last_used: Math.max(...roleEvents.map(e => e.timestamp))
    };
  }

  /**
   * 获取所有角色排名
   */
  getRoleRanking(days: number = 30): RolePerformanceMetrics[] {
    const roleIds = [...new Set(this.events.map(e => e.role_id))];
    return roleIds
      .map(id => this.getRoleMetrics(id, days))
      .sort((a, b) => b.total_activations - a.total_activations);
  }

  // ============================================================================
  // 分类分析
  // ============================================================================

  /**
   * 获取分类分析
   */
  getCategoryAnalytics(days: number = 30): CategoryAnalytics[] {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const recentEvents = this.events.filter(e => e.timestamp > cutoff);

    const categoryMap = new Map<string, RoleUsageEvent[]>();
    recentEvents.forEach(e => {
      const list = categoryMap.get(e.category) || [];
      list.push(e);
      categoryMap.set(e.category, list);
    });

    return Array.from(categoryMap.entries()).map(([category, events]) => {
      const roleCounts = new Map<string, number>();
      events.forEach(e => {
        roleCounts.set(e.role_id, (roleCounts.get(e.role_id) || 0) + 1);
      });

      const topRoles = Array.from(roleCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([role]) => role);

      const ratings = events
        .filter(e => e.user_rating)
        .map(e => e.user_rating!);

      return {
        category,
        total_usage: events.length,
        top_roles: topRoles,
        average_satisfaction: ratings.length > 0
          ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) * 20
          : 0,
        growth_rate: 0 // 需要历史数据计算
      };
    });
  }

  // ============================================================================
  // 每日统计
  // ============================================================================

  /**
   * 获取每日统计
   */
  getDailyStats(days: number = 30): DailyStats[] {
    const stats: DailyStats[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayStart = new Date(dateStr).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const dayEvents = this.events.filter(
        e => e.timestamp >= dayStart && e.timestamp < dayEnd
      );

      if (dayEvents.length === 0) {
        stats.push({
          date: dateStr,
          total_activations: 0,
          unique_roles: 0,
          unique_sessions: 0,
          top_trigger: '-',
          top_role: '-'
        });
        continue;
      }

      // 计算top trigger
      const triggerCounts = new Map<string, number>();
      dayEvents.forEach(e => {
        if (e.trigger_condition) {
          triggerCounts.set(
            e.trigger_condition, 
            (triggerCounts.get(e.trigger_condition) || 0) + 1
          );
        }
      });
      const topTrigger = Array.from(triggerCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

      // 计算top role
      const roleCounts = new Map<string, number>();
      dayEvents.forEach(e => {
        roleCounts.set(e.role_id, (roleCounts.get(e.role_id) || 0) + 1);
      });
      const topRole = Array.from(roleCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

      stats.push({
        date: dateStr,
        total_activations: dayEvents.length,
        unique_roles: new Set(dayEvents.map(e => e.role_id)).size,
        unique_sessions: new Set(dayEvents.map(e => e.session_id)).size,
        top_trigger: topTrigger,
        top_role: topRole
      });
    }

    return stats;
  }

  // ============================================================================
  // 报告生成
  // ============================================================================

  /**
   * 生成分析报告
   */
  generateReport(days: number = 30): string {
    const ranking = this.getRoleRanking(days);
    const categories = this.getCategoryAnalytics(days);
    const daily = this.getDailyStats(Math.min(days, 7));

    const totalActivations = ranking.reduce((sum, r) => sum + r.total_activations, 0);
    const avgSatisfaction = ranking.length > 0
      ? ranking.reduce((sum, r) => sum + r.user_satisfaction, 0) / ranking.length
      : 0;

    return `# PUAX 角色使用分析报告

## 概览

- **分析周期**: 最近${days}天
- **总激活次数**: ${totalActivations}
- **活跃角色数**: ${ranking.length}
- **平均满意度**: ${avgSatisfaction.toFixed(1)}%

## 角色排名 (Top 10)

| 排名 | 角色ID | 激活次数 | 成功率 | 满意度 | 趋势 |
|------|--------|----------|--------|--------|------|
${ranking.slice(0, 10).map((r, i) => 
  `| ${i + 1} | ${r.role_id} | ${r.total_activations} | ` +
  `${r.total_activations > 0 ? ((r.successful_activations / r.total_activations) * 100).toFixed(0) : 0}% | ` +
  `${r.user_satisfaction.toFixed(0)}% | ${r.trend === 'up' ? '↑' : r.trend === 'down' ? '↓' : '→'} |`
).join('\n')}

## 分类统计

| 分类 | 使用次数 | 平均满意度 | 热门角色 |
|------|----------|------------|----------|
${categories.map(c => 
  `| ${c.category} | ${c.total_usage} | ${c.average_satisfaction.toFixed(1)}% | ${c.top_roles.join(', ')} |`
).join('\n')}

## 每日趋势 (最近7天)

| 日期 | 激活次数 | 唯一角色 | 唯一会话 | 主要触发 | 热门角色 |
|------|----------|----------|----------|----------|----------|
${daily.map(d => 
  `| ${d.date} | ${d.total_activations} | ${d.unique_roles} | ${d.unique_sessions} | ${d.top_trigger} | ${d.top_role} |`
).join('\n')}

---

*报告生成时间: ${new Date().toISOString()}*
`;
  }

  /**
   * 保存报告到文件
   */
  saveReport(days: number = 30, filename?: string): string {
    const report = this.generateReport(days);
    const name = filename || `report-${new Date().toISOString().split('T')[0]}.md`;
    const path = join(this.dataDir, name);
    writeFileSync(path, report);
    return path;
  }

  // ============================================================================
  // 数据管理
  // ============================================================================

  /**
   * 清理旧数据
   */
  cleanup(daysToKeep: number = 90): number {
    const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    const beforeCount = this.events.length;
    this.events = this.events.filter(e => e.timestamp > cutoff);
    const afterCount = this.events.length;
    this.saveEvents();
    return beforeCount - afterCount;
  }

  /**
   * 导出数据
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = 'timestamp,role_id,category,trigger_condition,task_type,session_id,success,duration_ms,user_rating';
      const rows = this.events.map(e => 
        `${e.timestamp},${e.role_id},${e.category},${e.trigger_condition || ''},` +
        `${e.task_type || ''},${e.session_id},${e.success !== undefined ? e.success : ''},` +
        `${e.duration_ms || ''},${e.user_rating || ''}`
      );
      return [headers, ...rows].join('\n');
    }
    return JSON.stringify(this.events, null, 2);
  }
}

// ============================================================================
// 单例导出
// ============================================================================

let analyticsInstance: RoleAnalyticsEngine | null = null;

export function getAnalyticsEngine(dataDir?: string): RoleAnalyticsEngine {
  if (!analyticsInstance) {
    analyticsInstance = new RoleAnalyticsEngine(dataDir);
  }
  return analyticsInstance;
}

// CLI支持
if (require.main === module) {
  const engine = new RoleAnalyticsEngine();
  
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'report':
      const days = parseInt(args[1]) || 30;
      const path = engine.saveReport(days);
      console.log(`报告已保存: ${path}`);
      break;
    
    case 'ranking':
      console.log(engine.getRoleRanking().map((r, i) => 
        `${i + 1}. ${r.role_id} (${r.total_activations}次)`
      ).join('\n'));
      break;
    
    case 'cleanup':
      const removed = engine.cleanup(parseInt(args[1]) || 90);
      console.log(`清理完成，移除 ${removed} 条旧数据`);
      break;
    
    default:
      console.log('用法: ts-node role-analytics.ts [report|ranking|cleanup] [days]');
  }
}
