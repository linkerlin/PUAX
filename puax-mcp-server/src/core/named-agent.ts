/**
 * 命名 Agent：伤疤、段位、journal。仿 evolver personality + 跨周期身份。
 */

import { existsSync, mkdirSync, readFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import { getPuaxHome } from '../utils/storage-paths.js';
import { atomicWriteFileSync } from '../utils/atomic-write.js';
import type { EvolutionRank } from './evolution-engine.js';

export interface NamedAgentIdentity {
  name: string;
  created_at: string;
  updated_at: string;
  rank: EvolutionRank;
  trust: 'T1' | 'T2' | 'T3';
  scars: Array<{ at: string; lesson: string }>;
  stats: {
    cycles: number;
    wins: number;
    losses: number;
  };
}

function agentDir(name: string, base?: string): string {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 64) || 'main';
  const dir = join(base || getPuaxHome(), 'agents', safe);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function defaultIdentity(name: string): NamedAgentIdentity {
  const now = new Date().toISOString();
  return {
    name,
    created_at: now,
    updated_at: now,
    rank: '见习',
    trust: 'T1',
    scars: [],
    stats: { cycles: 0, wins: 0, losses: 0 },
  };
}

export class NamedAgentStore {
  constructor(private readonly baseDir?: string) {}

  load(name = 'main'): NamedAgentIdentity {
    const file = join(agentDir(name, this.baseDir), 'identity.json');
    if (existsSync(file)) {
      try {
        return JSON.parse(readFileSync(file, 'utf-8')) as NamedAgentIdentity;
      } catch {
        // fall through
      }
    }
    const identity = defaultIdentity(name);
    this.save(identity);
    return identity;
  }

  save(identity: NamedAgentIdentity): void {
    identity.updated_at = new Date().toISOString();
    const file = join(agentDir(identity.name, this.baseDir), 'identity.json');
    atomicWriteFileSync(file, JSON.stringify(identity, null, 2));
  }

  journal(name: string, entry: Record<string, unknown>): void {
    const file = join(agentDir(name, this.baseDir), 'journal.jsonl');
    appendFileSync(file, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n');
  }

  recordCycle(name: string, success: boolean, scar?: string, rank?: EvolutionRank): NamedAgentIdentity {
    const id = this.load(name);
    id.stats.cycles += 1;
    if (success) id.stats.wins += 1;
    else id.stats.losses += 1;
    if (scar) {
      id.scars.push({ at: new Date().toISOString(), lesson: scar });
      id.scars = id.scars.slice(-30);
    }
    if (rank) id.rank = rank;
    const rate = id.stats.wins / Math.max(1, id.stats.cycles);
    id.trust = rate >= 0.8 && id.stats.cycles >= 8 ? 'T3' : rate >= 0.5 && id.stats.cycles >= 3 ? 'T2' : 'T1';
    this.save(id);
    this.journal(name, { kind: 'cycle', success, scar, rank: id.rank, trust: id.trust });
    return id;
  }
}

export const namedAgentStore = new NamedAgentStore();
