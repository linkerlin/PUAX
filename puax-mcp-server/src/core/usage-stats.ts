/**
 * 匿名使用统计收集器
 * 本地持久化 ~/.puax/usage-stats.json，不含对话内容或 PII
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';

export interface UsageStatsData {
  version: 1;
  anonymous_id: string;
  first_seen: string;
  last_updated: string;
  opt_out: boolean;
  counters: {
    tool_calls: Record<string, number>;
    triggers_detected: Record<string, number>;
    roles_recommended: Record<string, number>;
    roles_activated: Record<string, number>;
  };
  totals: {
    sessions: number;
    tool_calls: number;
    trigger_detections: number;
  };
}

export interface UsageStatsSummary {
  anonymous_id: string;
  period_days: number;
  totals: UsageStatsData['totals'];
  top_tools: Array<{ name: string; count: number }>;
  top_triggers: Array<{ id: string; count: number }>;
  top_roles: Array<{ id: string; count: number }>;
  opt_out: boolean;
}

function defaultData(): UsageStatsData {
  const now = new Date().toISOString();
  return {
    version: 1,
    anonymous_id: randomUUID(),
    first_seen: now,
    last_updated: now,
    opt_out: process.env.PUAX_USAGE_STATS === '0',
    counters: {
      tool_calls: {},
      triggers_detected: {},
      roles_recommended: {},
      roles_activated: {},
    },
    totals: {
      sessions: 0,
      tool_calls: 0,
      trigger_detections: 0,
    },
  };
}

function topEntries(map: Record<string, number>, limit = 10): Array<{ name: string; count: number }> {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

export class UsageStatsCollector {
  private filePath: string;
  private data: UsageStatsData | null = null;
  private dirty = false;

  private testModeEnabled = false;

  constructor(dataDir?: string) {
    const dir = dataDir ?? join(homedir(), '.puax');
    this.filePath = join(dir, 'usage-stats.json');
  }

  isEnabled(): boolean {
    if (this.testModeEnabled) return !this.load().opt_out;
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) return false;
    if (process.env.PUAX_USAGE_STATS === '0') return false;
    return !this.load().opt_out;
  }

  load(): UsageStatsData {
    if (this.data) return this.data;

    try {
      const dir = join(this.filePath, '..');
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      if (existsSync(this.filePath)) {
        this.data = JSON.parse(readFileSync(this.filePath, 'utf-8')) as UsageStatsData;
        return this.data;
      }
    } catch {
      /* fresh start */
    }

    this.data = defaultData();
    this.persist();
    return this.data;
  }

  private persist(): void {
    if (!this.data) return;
    this.data.last_updated = new Date().toISOString();
    try {
      const dir = join(this.filePath, '..');
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
      this.dirty = false;
    } catch {
      /* non-fatal */
    }
  }

  private bump(map: Record<string, number>, key: string): void {
    if (!this.isEnabled()) return;
    const data = this.load();
    map[key] = (map[key] ?? 0) + 1;
    this.dirty = true;
    data.last_updated = new Date().toISOString();
  }

  recordSessionStart(): void {
    if (!this.isEnabled()) return;
    const data = this.load();
    data.totals.sessions++;
    this.dirty = true;
    this.persist();
  }

  recordToolCall(toolName: string): void {
    if (!this.isEnabled()) return;
    const data = this.load();
    this.bump(data.counters.tool_calls, toolName);
    data.totals.tool_calls++;
    this.persist();
  }

  recordTriggerDetection(triggerId: string): void {
    if (!this.isEnabled()) return;
    const data = this.load();
    this.bump(data.counters.triggers_detected, triggerId);
    data.totals.trigger_detections++;
    this.persist();
  }

  recordRoleRecommended(roleId: string): void {
    if (!this.isEnabled()) return;
    this.bump(this.load().counters.roles_recommended, roleId);
    this.persist();
  }

  recordRoleActivated(roleId: string): void {
    if (!this.isEnabled()) return;
    this.bump(this.load().counters.roles_activated, roleId);
    this.persist();
  }

  getSummary(_days = 30): UsageStatsSummary {
    const data = this.load();
    const roles = { ...data.counters.roles_recommended, ...data.counters.roles_activated };
    const roleEntries = Object.entries(roles).map(([id, count]) => ({ id, count }));

    return {
      anonymous_id: data.anonymous_id,
      period_days: _days,
      totals: { ...data.totals },
      top_tools: topEntries(data.counters.tool_calls),
      top_triggers: topEntries(data.counters.triggers_detected).map(({ name, count }) => ({
        id: name,
        count,
      })),
      top_roles: roleEntries
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(({ id, count }) => ({ id, count })),
      opt_out: data.opt_out,
    };
  }

  setOptOut(optOut: boolean): void {
    const data = this.load();
    data.opt_out = optOut;
    this.persist();
  }

  /** 测试专用 */
  resetForTesting(dataDir: string): void {
    this.filePath = join(dataDir, 'usage-stats.json');
    this.data = null;
    this.testModeEnabled = true;
  }
}

export const usageStatsCollector = new UsageStatsCollector();
