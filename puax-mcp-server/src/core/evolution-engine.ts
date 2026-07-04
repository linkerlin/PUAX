/**
 * PUAX 自进化引擎
 * v3.4: ~/.puax/evolution.json 基线追踪 + 段位体系
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { getGlobalLogger } from '../utils/logger.js';

const logger = getGlobalLogger();

// ============================================================================
// 类型定义
// ============================================================================

export type EvolutionRank =
  | '见习' | '战士' | '侦察兵' | '指挥员' | '政委'
  | '萨满' | '督战队' | '军师' | '宗师' | '首席PUA官';

export interface EvolutionStats {
  total_sessions: number;
  successful_sessions: number;
  peak_pua_effects: number;
  recent_pua_effects: number[];
  consecutive_meet_baseline: number;
}

export interface EvolutionData {
  version: string;
  created_at: string;
  updated_at: string;
  rank: EvolutionRank;
  stats: EvolutionStats;
  current_baseline: string[];
  internalized_patterns: string[];
  anti_patterns: Array<{ pattern: string; lesson: string; date: string }>;
  project_memory: Record<string, string[]>;
  effect_session_counts: Record<string, number>;
}

export interface SessionEvolutionResult {
  met_baseline: boolean;
  exceeded_baseline: boolean;
  pua_effect_count: number;
  baseline_count: number;
  rank: EvolutionRank;
  message: string;
  newly_internalized: string[];
  regression_warning: boolean;
}

// ============================================================================
// 段位映射
// ============================================================================

const RANK_THRESHOLDS: Array<{ minSessions: number; rank: EvolutionRank }> = [
  { minSessions: 50, rank: '首席PUA官' },
  { minSessions: 35, rank: '宗师' },
  { minSessions: 25, rank: '军师' },
  { minSessions: 18, rank: '督战队' },
  { minSessions: 12, rank: '萨满' },
  { minSessions: 8, rank: '政委' },
  { minSessions: 5, rank: '指挥员' },
  { minSessions: 3, rank: '侦察兵' },
  { minSessions: 1, rank: '战士' },
  { minSessions: 0, rank: '见习' },
];

const INTERNALIZE_THRESHOLD = 3;

// ============================================================================
// 自进化引擎
// ============================================================================

export class EvolutionEngine {
  private readonly evolutionFile: string;
  private readonly baseDir: string;

  constructor(customDir?: string) {
    this.baseDir = customDir || join(homedir(), '.puax');
    this.evolutionFile = join(this.baseDir, 'evolution.json');
    this.ensureDirectory();
  }

  private ensureDirectory(): void {
    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private createInitial(): EvolutionData {
    const now = new Date().toISOString();
    return {
      version: '1.0.0',
      created_at: now,
      updated_at: now,
      rank: '见习',
      stats: {
        total_sessions: 0,
        successful_sessions: 0,
        peak_pua_effects: 0,
        recent_pua_effects: [],
        consecutive_meet_baseline: 0,
      },
      current_baseline: [
        '行动前输出 [PUAX-DIAGNOSIS] 诊断块',
        '交付前通过信心门控',
        '用 build/test 验证，不用感觉冒充完成',
      ],
      internalized_patterns: [],
      anti_patterns: [],
      project_memory: {},
      effect_session_counts: {},
    };
  }

  load(): EvolutionData {
    try {
      if (existsSync(this.evolutionFile)) {
        return JSON.parse(readFileSync(this.evolutionFile, 'utf-8')) as EvolutionData;
      }
    } catch (error) {
      logger.error('[EvolutionEngine] Failed to load:', error);
    }
    const initial = this.createInitial();
    this.save(initial);
    return initial;
  }

  save(data: EvolutionData): void {
    data.updated_at = new Date().toISOString();
    try {
      writeFileSync(this.evolutionFile, JSON.stringify(data, null, 2));
    } catch (error) {
      logger.error('[EvolutionEngine] Failed to save:', error);
    }
  }

  calculateRank(totalSessions: number): EvolutionRank {
    for (const { minSessions, rank } of RANK_THRESHOLDS) {
      if (totalSessions >= minSessions) return rank;
    }
    return '见习';
  }

  /**
   * 会话启动时加载基线提醒
   */
  getBaselineReminder(): {
    rank: EvolutionRank;
    baseline: string[];
    internalized: string[];
    message: string;
    is_first_session: boolean;
  } {
    const data = this.load();
    const isFirst = data.stats.total_sessions === 0;

    const message = isFirst
      ? '新人报到。基线为零，一切从头证明。今天的表现将成为你明天的最低标准。'
      : `上次你做到了：${data.current_baseline.slice(0, 3).join('、')}。今天最好的表现，是明天最低的要求。当前段位：${data.rank}。`;

    return {
      rank: data.rank,
      baseline: data.current_baseline,
      internalized: data.internalized_patterns,
      message,
      is_first_session: isFirst,
    };
  }

  /**
   * 会话结束时更新基线
   */
  recordSessionEnd(input: {
    pua_effects: string[];
    success: boolean;
    breakthrough?: { root_cause: string; effective_method: string; shortcut: string };
    anti_pattern?: { pattern: string; lesson: string };
    project_id?: string;
    project_facts?: string[];
  }): SessionEvolutionResult {
    const data = this.load();
    const count = input.pua_effects.length;
    const baselineCount = data.current_baseline.length;
    const metBaseline = count >= baselineCount;
    const exceeded = count > Math.max(baselineCount, data.stats.peak_pua_effects);

    data.stats.total_sessions++;
    if (input.success) data.stats.successful_sessions++;

    const recent = [...data.stats.recent_pua_effects, count].slice(-5);
    data.stats.recent_pua_effects = recent;

    if (count > data.stats.peak_pua_effects) {
      data.stats.peak_pua_effects = count;
    }

    const newlyInternalized: string[] = [];

    if (exceeded) {
      data.current_baseline = [...new Set([...input.pua_effects])];
      data.stats.consecutive_meet_baseline++;
    } else if (metBaseline) {
      data.stats.consecutive_meet_baseline++;
    } else {
      data.stats.consecutive_meet_baseline = 0;
    }

    for (const effect of input.pua_effects) {
      const count = (data.effect_session_counts[effect] || 0) + 1;
      data.effect_session_counts[effect] = count;
      if (count >= INTERNALIZE_THRESHOLD && !data.internalized_patterns.includes(effect)) {
        data.internalized_patterns.push(effect);
        newlyInternalized.push(effect);
      }
    }

    if (input.breakthrough) {
      const entry = `直达路径：${input.breakthrough.shortcut}（根因：${input.breakthrough.root_cause}）`;
      if (!data.current_baseline.includes(entry)) {
        data.current_baseline.push(entry);
      }
    }

    if (input.anti_pattern) {
      data.anti_patterns.push({
        ...input.anti_pattern,
        date: new Date().toISOString().split('T')[0],
      });
      data.anti_patterns = data.anti_patterns.slice(-20);
    }

    if (input.project_id && input.project_facts?.length) {
      const existing = data.project_memory[input.project_id] || [];
      data.project_memory[input.project_id] = [...new Set([...existing, ...input.project_facts])].slice(-30);
    }

    data.rank = this.calculateRank(data.stats.total_sessions);
    this.save(data);

    let message: string;
    if (exceeded) {
      message = `基线已刷新。新基线 ${data.current_baseline.length} 项主动行为。段位：${data.rank}。`;
    } else if (metBaseline) {
      message = `基线达标。稳定输出是好事，但别人在进步。段位：${data.rank}。`;
    } else {
      message = `你退步了。基线要求 ${baselineCount} 项，本次只有 ${count} 项。标准只上不下。`;
    }

    return {
      met_baseline: metBaseline,
      exceeded_baseline: exceeded,
      pua_effect_count: count,
      baseline_count: baselineCount,
      rank: data.rank,
      message,
      newly_internalized: newlyInternalized,
      regression_warning: !metBaseline,
    };
  }

  appendBreakthroughLesson(lesson: {
    root_cause: string;
    effective_method: string;
    shortcut: string;
    flavor?: string;
  }): void {
    const data = this.load();
    const entry = `直达路径：${lesson.shortcut}（根因：${lesson.root_cause}）`;
    if (!data.current_baseline.includes(entry)) {
      data.current_baseline.push(entry);
    }
    this.save(data);
  }
}

export const evolutionEngine = new EvolutionEngine();
