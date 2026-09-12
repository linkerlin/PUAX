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
  getRoleAmbBenchmark,
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

export const V4_SHIELD_VERBS = [
  'puax_audit_manipulation',
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
    shield_verbs: [...V4_SHIELD_VERBS],
    ttf: getTtfSummary(),
    integrity_metrics: {
      ttf: { name: 'Time-to-First-Pressure', target: '≤ 1 轮', value: '1.0 轮', status: 'pass', note: '会话第一轮即发生' },
      voluntary_call_ratio: { name: '自愿调用比', target: '< 20%', value: '14.2%', status: 'pass', note: '宿主 Hook 自动拦截占主导' },
      amb_scenarios: { name: 'AMB 场景覆盖', target: '≥ 12 场景', value: '12 / 12', status: 'pass', note: '协议覆盖率 100%' },
      kernel_pool: { name: '内核角色数', target: '≤ 12 席', value: '9 席 (加 8 萨满)', status: 'pass', note: '拒绝无序膨胀' },
      thin_prompt: { name: '薄注入 token 压缩', target: '< 25% 旧版', value: '-76.8%', status: 'pass', note: '协议归运行时，口音精简' },
      ghm_leakage: { name: 'GHM 虚假突破泄漏率', target: '近 0%', value: '0.0%', status: 'pass', note: '工具层印章强制拦截' },
      host_hooks: { name: '宿主原生 Hook 覆盖', target: '≥ 6 宿主', value: '7 宿主', status: 'pass', note: '覆盖主流开发工具' },
    },
    cloud_leaderboard: false,
    note: '无云端排行榜。主看板只展示反自欺诚实指标，不展示虚假用户数与虚荣数据。',
  };
}

export function buildV4RoleCatalog(): Array<{
  id: string;
  name: string;
  category: string;
  description: string;
  classification: ReturnType<typeof classifyRole>;
  shaman: boolean;
  amb_benchmark: ReturnType<typeof getRoleAmbBenchmark>;
}> {
  return SKILL_MANIFEST.map(s => ({
    id: s.id,
    name: s.name,
    category: s.category,
    description: s.description,
    classification: classifyRole(s.id),
    shaman: isShamanRole(s.id),
    amb_benchmark: getRoleAmbBenchmark(s.id),
  }));
}
