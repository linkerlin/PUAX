/**
 * 结局权重：verify/breakthrough 回写推荐。仿 evolver 表观遗传偏置。
 */

import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { getPuaxHome } from '../utils/storage-paths.js';
import { atomicWriteFileSync } from '../utils/atomic-write.js';

export interface RoleOutcome {
  wins: number;
  losses: number;
  last: string;
}

export interface OutcomeWeights {
  version: 1;
  updated_at: string;
  roles: Record<string, RoleOutcome>;
}

function weightsFile(dir?: string): string {
  const base = dir || getPuaxHome();
  if (!existsSync(base)) mkdirSync(base, { recursive: true });
  return join(base, 'outcome-weights.json');
}

function empty(): OutcomeWeights {
  return { version: 1, updated_at: new Date().toISOString(), roles: {} };
}

export class OutcomeStore {
  constructor(private readonly baseDir?: string) {}

  load(): OutcomeWeights {
    const file = weightsFile(this.baseDir);
    if (!existsSync(file)) return empty();
    try {
      return JSON.parse(readFileSync(file, 'utf-8')) as OutcomeWeights;
    } catch {
      return empty();
    }
  }

  save(data: OutcomeWeights): void {
    data.updated_at = new Date().toISOString();
    atomicWriteFileSync(weightsFile(this.baseDir), JSON.stringify(data, null, 2));
  }

  record(roleId: string, success: boolean): RoleOutcome {
    const data = this.load();
    const prev = data.roles[roleId] || { wins: 0, losses: 0, last: '' };
    const next: RoleOutcome = {
      wins: prev.wins + (success ? 1 : 0),
      losses: prev.losses + (success ? 0 : 1),
      last: new Date().toISOString(),
    };
    data.roles[roleId] = next;
    this.save(data);
    return next;
  }

  successRate(roleId: string): number | undefined {
    const row = this.load().roles[roleId];
    if (!row) return undefined;
    const n = row.wins + row.losses;
    if (n === 0) return undefined;
    return row.wins / n;
  }

  asSessionHistory(): {
    role_success_rates: Record<string, number>;
    role_usage_count: Record<string, number>;
    recently_used_roles: string[];
  } {
    const data = this.load();
    const role_success_rates: Record<string, number> = {};
    const role_usage_count: Record<string, number> = {};
    const recent: Array<{ id: string; last: string }> = [];
    for (const [id, row] of Object.entries(data.roles)) {
      const n = row.wins + row.losses;
      role_usage_count[id] = n;
      if (n > 0) role_success_rates[id] = row.wins / n;
      if (row.last) recent.push({ id, last: row.last });
    }
    recent.sort((a, b) => (a.last < b.last ? 1 : -1));
    return {
      role_success_rates,
      role_usage_count,
      recently_used_roles: recent.slice(0, 3).map(r => r.id),
    };
  }
}

export const outcomeStore = new OutcomeStore();
