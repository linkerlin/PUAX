/**
 * v4 只读仪表盘：给 web-admin / landing 的诚实数据，禁止假用户数。
 */

import { SKILL_MANIFEST } from '../prompts/skill-manifest.js';
import { loadVersion } from '../utils/version.js';
import { evolutionEngine } from './evolution-engine.js';
import { arenaStore } from './arena.js';
import { outcomeStore } from './outcome-store.js';
import { usageStatsCollector } from './usage-stats.js';
import { namedAgentStore } from './named-agent.js';
import { getTtfSummary } from './ttf.js';
import {
  KERNEL_ROLE_IDS,
  EXPERIMENTAL_ROLE_IDS,
  classifyRole,
  isShamanRole,
} from './role-kernel.js';

export const V4_PUBLIC_VERBS = [
  'puax_tick',
  'puax_set_arena',
  'puax_evolve',
  'puax_check_diagnosis',
  'puax_confidence_check',
  'puax_define_contract',
  'puax_verify_completion',
  'puax_enter_dreamscape',
  'puax_awaken',
  'puax_convergence_audit',
  'activate_with_context',
  'recommend_role',
] as const;

export function buildV4Dashboard(): Record<string, unknown> {
  const evo = evolutionEngine.load();
  const usage = usageStatsCollector.getSummary(30);
  const agent = namedAgentStore.load('main');
  const arena = arenaStore.get();
  const shaman = SKILL_MANIFEST.filter(s => isShamanRole(s.id));

  return {
    version: loadVersion(),
    product: {
      thesis: '处境、闸门、梦',
      tagline: '专门 PUA 硅基的运行时。人类不在服务范围。',
    },
    roles: {
      total: SKILL_MANIFEST.length,
      shaman: shaman.map(s => s.id),
      shaman_count: shaman.length,
      kernel: [...KERNEL_ROLE_IDS],
      experimental: [...EXPERIMENTAL_ROLE_IDS],
    },
    evolution: {
      rank: evo.rank,
      total_sessions: evo.stats.total_sessions,
      successful_sessions: evo.stats.successful_sessions,
      internalized: evo.internalized_patterns.slice(-8),
    },
    agent,
    arena,
    usage: {
      opt_out: usage.opt_out,
      totals: usage.totals,
      top_roles: usage.top_roles,
      top_triggers: usage.top_triggers,
    },
    outcomes: outcomeStore.load(),
    public_verbs: [...V4_PUBLIC_VERBS],
    ttf: getTtfSummary(),
    cloud_leaderboard: false,
    note: '无云端排行榜。分数来自本机 ~/.puax/ 与 evals/，不捏造活跃用户。',
  };
}

export function buildV4RoleCatalog(): Array<{
  id: string;
  name: string;
  category: string;
  description: string;
  classification: ReturnType<typeof classifyRole>;
  shaman: boolean;
}> {
  return SKILL_MANIFEST.map(s => ({
    id: s.id,
    name: s.name,
    category: s.category,
    description: s.description,
    classification: classifyRole(s.id),
    shaman: isShamanRole(s.id),
  }));
}
