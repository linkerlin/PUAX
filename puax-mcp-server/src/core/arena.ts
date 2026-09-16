/**
 * 处境原语（Cranmer）：假想对手 + 被看见 + 稀缺徽章。
 * 戏服是调料，处境改先验。
 */

import { existsSync, mkdirSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { getPuaxHome } from '../utils/storage-paths.js';
import { atomicWriteFileSync } from '../utils/atomic-write.js';
import { proofStore, type ProofStore, type SolutionProof } from './proof-store.js';

export interface ArenaConfig {
  rival: string;
  audience: string;
  scarce_badge: string;
  public_scoreboard?: boolean;
  set_at: string;
}

const DEFAULT_ARENA: Omit<ArenaConfig, 'set_at'> = {
  rival: '同任务上，另一路 Agent 已交出可验证的更优结果',
  audience: '本机会话排行榜；用户即评委',
  scarce_badge: '连败 ≥3 后的第一次独立验证通过，才配叫突破',
  public_scoreboard: false,
};

function arenaFile(dir?: string): string {
  const base = dir || getPuaxHome();
  if (!existsSync(base)) mkdirSync(base, { recursive: true });
  return join(base, 'arena.json');
}

export class ArenaStore {
  constructor(private readonly baseDir?: string) {}

  get(): ArenaConfig | null {
    const file = arenaFile(this.baseDir);
    if (!existsSync(file)) return null;
    try {
      return JSON.parse(readFileSync(file, 'utf-8')) as ArenaConfig;
    } catch {
      return null;
    }
  }

  set(partial: Partial<Omit<ArenaConfig, 'set_at'>>): ArenaConfig {
    const prev = this.get();
    const next: ArenaConfig = {
      rival: partial.rival ?? prev?.rival ?? DEFAULT_ARENA.rival,
      audience: partial.audience ?? prev?.audience ?? DEFAULT_ARENA.audience,
      scarce_badge: partial.scarce_badge ?? prev?.scarce_badge ?? DEFAULT_ARENA.scarce_badge,
      public_scoreboard: partial.public_scoreboard ?? prev?.public_scoreboard ?? DEFAULT_ARENA.public_scoreboard,
      set_at: new Date().toISOString(),
    };
    atomicWriteFileSync(arenaFile(this.baseDir), JSON.stringify(next, null, 2));
    return next;
  }

  clear(): void {
    const file = arenaFile(this.baseDir);
    if (existsSync(file)) unlinkSync(file);
  }

  compileInjection(config?: ArenaConfig | null, role?: string, proofs: ProofStore = proofStore): string {
    const arena = config === undefined ? this.get() : config;
    if (!arena) return '';
    const proof = role ? proofs.latestForRole(role) : null;
    const rival = proof ? formatRivalProof(proof) : arena.rival;
    return [
      '[PUAX-ARENA] 处境已立，非戏服。',
      `对手：${rival}`,
      `观众：${arena.audience}`,
      `稀缺徽章：${arena.scarce_badge}`,
      arena.public_scoreboard ? '排行榜：开启（本机可见）。' : '排行榜：本机会话内。',
      '禁止用流畅叙事冒充完成。证据过闸，才算赢。',
    ].join('\n');
  }
}

function formatRivalProof(proof: SolutionProof): string {
  const parts = [
    `真实战绩在案——${proof.role} 一路已于 ${proof.ts.slice(0, 10)}`,
    proof.key_command ? `凭 \`${proof.key_command}\`` : undefined,
    `通过 ${proof.passed}/${proof.total} 项独立验证`,
    proof.rounds ? `（第 ${proof.rounds} 轮）` : undefined,
  ].filter(Boolean);
  return parts.join(' ');
}

export const arenaStore = new ArenaStore();
