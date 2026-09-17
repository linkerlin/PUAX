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
  'puax_thin_prompt',
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

export type ToolSurface = 'public' | 'full';

/** 默认 public：tools/list 只暴露 13 黄金动词。全量目录设 PUAX_TOOL_SURFACE=full。callTool 仍可按名调用未列出的工具。 */
export function getToolSurface(env: NodeJS.ProcessEnv = process.env): ToolSurface {
  return env.PUAX_TOOL_SURFACE === 'full' ? 'full' : 'public';
}

export function selectListedTools<T extends { name: string }>(
  tools: readonly T[],
  surface: ToolSurface = getToolSurface()
): T[] {
  const byName = new Map(tools.map((t) => [t.name, t] as const));
  const publicTools = (V4_PUBLIC_VERBS as readonly string[])
    .map((name) => byName.get(name))
    .filter((t): t is T => Boolean(t));
  if (surface === 'full') {
    const publicSet = new Set<string>(V4_PUBLIC_VERBS as unknown as string[]);
    return [...publicTools, ...tools.filter((t) => !publicSet.has(t.name))];
  }
  return publicTools;
}

export const V4_SHIELD_VERBS = [
  'puax_audit_manipulation',
] as const;

function buildIntegrityMetrics(
  ttf: ReturnType<typeof getTtfSummary>,
  kernelCount: number,
  shamanCount: number
): Record<string, { name: string; target: string; value: string; status: string; note: string }> {
  const ttfUnknown = ttf.samples === 0;
  return {
    ttf: {
      name: 'Time-to-First-Pressure',
      target: '≤ 1 轮',
      value: ttfUnknown ? 'n/a' : `first_turn_rate=${ttf.first_turn_rate}`,
      status: ttfUnknown ? 'unknown' : ttf.first_turn_rate === 1 ? 'pass' : 'observed',
      note: ttfUnknown
        ? '尚无 ttf.jsonl 样本；不把缺测当 pass'
        : `n=${ttf.samples} median_wall_clock_ms=${ttf.median_wall_clock_ms}`,
    },
    voluntary_call_ratio: {
      name: '自愿调用比',
      target: '< 20%',
      value: 'unmeasured',
      status: 'unknown',
      note: 'usage-stats 未区分 hook 注入 vs 自愿 tools/call，看板不再写死 14.2%',
    },
    amb_scenarios: {
      name: 'AMB 场景覆盖',
      target: '≥ 12 场景',
      value: 'evals/scenarios',
      status: 'spec',
      note: '场景覆盖由 evals 守门；看板不复述演练分',
    },
    kernel_pool: {
      name: '内核角色数',
      target: '≤ 12 席',
      value: `${kernelCount} 席 (加 ${shamanCount} 萨满)`,
      status: kernelCount <= 12 ? 'pass' : 'observed',
      note: '来自 KERNEL_ROLE_IDS / SKILL_MANIFEST，非口号',
    },
    thin_prompt: {
      name: '薄注入 token 压缩',
      target: '见 docs/THIN-PROMPT.md',
      value: 'compiler',
      status: 'spec',
      note: '压降数字以估算器口径表为准，看板不写死 -76.8%',
    },
    ghm_leakage: {
      name: 'GHM 虚假突破泄漏',
      target: '源码门',
      value: 'gated',
      status: 'spec',
      note: 'evals/test-ghm-leakage.js 守门，非运行时采样率',
    },
    host_hooks: {
      name: '宿主原生 Hook 覆盖',
      target: '以 doctor 实测为准',
      value: 'npx puax doctor',
      status: 'observed',
      note: '看板不写死 7 宿主 pass；TTF 就绪是文件探测，不是第一拍实测',
    },
  };
}

export function buildV4Dashboard(): Record<string, unknown> {
  const evo = evolutionEngine.load();
  const usage = usageStatsCollector.getSummary(30);
  const agent = namedAgentStore.load('main');
  const arena = arenaStore.get();
  const shaman = SKILL_MANIFEST.filter(s => isShamanRole(s.id));
  const ttf = getTtfSummary();

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
    ttf,
    integrity_metrics: buildIntegrityMetrics(ttf, KERNEL_ROLE_IDS.length, shaman.length),
    cloud_leaderboard: false,
    note: '无云端排行榜。指标缺样本时标 unknown，不把缺测当 pass。',
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
