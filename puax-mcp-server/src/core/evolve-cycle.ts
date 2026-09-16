/**
 * PUAX 自进化周期。
 * 仿 evolver.py 七阶段：preflight → collect → signals → select → autopoiesis → dispatch → solidify。
 * 不依赖 evolver 包；基因 = 角色+方法论，固化 = 结局权重 + 记忆图 + 命名 Agent。
 */

import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { getPuaxHome } from '../utils/storage-paths.js';
import { atomicWriteFileSync } from '../utils/atomic-write.js';
import { getGlobalLogger } from '../utils/logger.js';
import { stateManager } from '../hooks/state-manager.js';
import { enhancedTriggerDetector } from '../hooks/trigger-detector-enhanced.js';
import { evolutionEngine } from './evolution-engine.js';
import { memoryGraph } from './memory-graph.js';
import { namedAgentStore } from './named-agent.js';
import { arenaStore } from './arena.js';
import { outcomeStore } from './outcome-store.js';
import type { InterventionContext } from './intervention.js';
import { compileThinPrompt } from './thin-prompt.js';
import { compileCouncilItinerary } from './dream-council.js';
import { recordFirstPressure } from './ttf.js';
import { isDefaultRecommendable, isShamanRole } from './role-kernel.js';
import { getRoleRecommender } from './service-registry.js';

const logger = getGlobalLogger();

export type TickEvent =
  | 'SessionStart'
  | 'UserPromptSubmit'
  | 'PostToolUse'
  | 'PreCompact'
  | 'Stop'
  | 'Manual';

export type EvolveStrategy = 'repair' | 'optimize' | 'innovate';
export type TickAction = 'silent' | 'inject' | 'switch' | 'dream_suggest' | 'arena' | 'gate';

export interface EvolveInput {
  session_id: string;
  event: TickEvent;
  message?: string;
  tool_name?: string;
  error_message?: string;
  task_type?: string;
  agent_name?: string;
  force?: boolean;
  skip_detect?: boolean;
  detected_triggers?: string[];
  success?: boolean;
  active_role?: string;
}

export interface EvolveResult {
  cycle_id: string;
  abort?: string;
  signals: string[];
  strategy: EvolveStrategy;
  repair_bias: boolean;
  selected_role?: string;
  selected_reason?: string;
  action: TickAction;
  injection?: string;
  needs_intervention?: InterventionContext;
  happened: boolean;
  autopoiesis: {
    viability: 'ok' | 'repair' | 'plateau';
    self_report: string;
  };
  arena_active: boolean;
}

interface CycleProgress {
  last_ts: number;
  empty_streak: number;
  last_role?: string;
  last_action?: TickAction;
}

const COOLDOWN_MS = 4000;
const MAX_EMPTY = 6;
const ACTIONABLE = new Set([
  'log_error',
  'consecutive_failures',
  'user_frustration',
  'giving_up_language',
  'premature_convergence',
  'creative_block',
  'assumption_lock',
  'low_novelty',
  'pressure_high',
  'session_end',
]);

function progressPath(): string {
  const base = getPuaxHome();
  if (!existsSync(base)) mkdirSync(base, { recursive: true });
  return join(base, 'evolve-progress.json');
}

interface ProgressFile {
  sessions: Record<string, CycleProgress>;
}

function emptyProgress(): CycleProgress {
  return { last_ts: 0, empty_streak: 0 };
}

function loadProgressFile(): ProgressFile {
  const file = progressPath();
  if (!existsSync(file)) return { sessions: {} };
  try {
    const raw = JSON.parse(readFileSync(file, 'utf-8')) as ProgressFile & CycleProgress;
    if (raw.sessions && typeof raw.sessions === 'object') return { sessions: raw.sessions };
    return { sessions: { _legacy: raw as CycleProgress } };
  } catch {
    return { sessions: {} };
  }
}

function loadProgress(sessionId: string): CycleProgress {
  return loadProgressFile().sessions[sessionId] || emptyProgress();
}

function saveProgress(sessionId: string, p: CycleProgress): void {
  const all = loadProgressFile();
  all.sessions[sessionId] = p;
  atomicWriteFileSync(progressPath(), JSON.stringify(all, null, 2));
}

function uniqueSignals(list: string[]): string[] {
  return [...new Set(list.filter(Boolean))];
}

const TRIGGER_ALIASES: Record<string, string> = {
  userFrustration: 'user_frustration',
  givingUp: 'giving_up_language',
  bashFailure: 'consecutive_failures',
  blameEnvironment: 'blame_environment',
  passiveWaiting: 'passive_wait',
  sessionRestore: 'need_more_context',
};

export function normalizeTriggerId(id: string): string {
  return TRIGGER_ALIASES[id] || id;
}

function pickStrategy(signals: string[], repairBias: boolean): EvolveStrategy {
  if (repairBias) return 'repair';
  if (signals.some(s => s === 'log_error' || s === 'consecutive_failures' || s === 'giving_up_language')) {
    return 'repair';
  }
  if (signals.some(s =>
    s === 'premature_convergence' || s === 'creative_block' || s === 'assumption_lock' || s === 'low_novelty'
  )) {
    return 'innovate';
  }
  return 'optimize';
}

function collectSignals(input: EvolveInput): string[] {
  const signals: string[] = [...(input.detected_triggers || [])].map(normalizeTriggerId);
  const state = stateManager.getSessionState(input.session_id);

  if (state.pressureLevel >= 2) signals.push('pressure_high');
  if (state.failureCount >= 2) signals.push('consecutive_failures');
  if (input.error_message) signals.push('log_error');
  if (input.event === 'Stop') signals.push('session_end');

  if (!input.skip_detect && (input.message || input.error_message || input.tool_name)) {
    try {
      const detected = enhancedTriggerDetector.detect({
        sessionId: input.session_id,
        eventType: input.event === 'PostToolUse' ? 'PostToolUse' : 'UserPromptSubmit',
        message: input.message || '',
        toolName: input.tool_name,
        errorMessage: input.error_message,
      });
      if (detected.triggered && detected.triggerType) {
        signals.push(detected.triggerType);
      }
      if (detected.metadata && typeof detected.metadata === 'object') {
        const extra = (detected.metadata as { triggers?: string[] }).triggers;
        if (Array.isArray(extra)) signals.push(...extra);
      }
    } catch (err) {
      logger.warn('[evolve] detect skipped', err);
    }
  }

  return uniqueSignals(signals);
}

function selectRole(input: EvolveInput, signals: string[], strategy: EvolveStrategy): { role: string; reason: string } {
  const history = outcomeStore.asSessionHistory();
  const taskType = input.task_type
    || (strategy === 'innovate' ? 'creative' : strategy === 'repair' ? 'debugging' : 'general');

  try {
    const rec = getRoleRecommender().recommend({
      detected_triggers: signals.filter(s => !['pressure_high', 'session_end', 'log_error'].includes(s)),
      task_context: {
        task_type: taskType,
        description: input.message,
        urgency: signals.includes('pressure_high') ? 'high' : 'medium',
        attempt_count: stateManager.getFailureCount(input.session_id),
      },
      session_history: history,
    });

    let role = rec.primary.role_id;
    let reason = rec.primary.match_reasons?.[0] || rec.metadata.identified_failure_mode || '推荐器';

    if (!isDefaultRecommendable(role) && rec.alternatives[0]) {
      role = rec.alternatives[0].role_id;
      reason = '默认池跳过实验角色';
    }

    if (strategy === 'innovate' && !role.startsWith('dream-') && !isShamanRole(role)) {
      const dreamAlt = rec.alternatives.find(a => a.role_id.startsWith('dream-') || isShamanRole(a.role_id));
      if (dreamAlt) {
        role = dreamAlt.role_id;
        reason = 'innovate：发散/萨满优先';
      }
    }

    return { role, reason };
  } catch (err) {
    logger.warn('[evolve] recommend fallback', err);
    if (strategy === 'innovate') return { role: 'shaman-musk', reason: 'fallback innovate' };
    if (strategy === 'repair') return { role: 'military-warrior', reason: 'fallback repair' };
    return { role: 'military-commander', reason: 'fallback optimize' };
  }
}

function autopoiesisTick(signals: string[], sessionId: string): {
  viability: 'ok' | 'repair' | 'plateau';
  self_report: string;
  repair_bias: boolean;
} {
  const evo = evolutionEngine.load();
  const recent = evo.stats.recent_pua_effects;
  const progress = loadProgress(sessionId);
  let viability: 'ok' | 'repair' | 'plateau' = 'ok';
  let repair_bias = false;

  if (evo.stats.total_sessions >= 3 && evo.stats.successful_sessions / evo.stats.total_sessions < 0.4) {
    viability = 'repair';
    repair_bias = true;
  }
  if (signals.includes('log_error') || signals.includes('consecutive_failures')) {
    viability = 'repair';
    repair_bias = true;
  }
  if (progress.empty_streak >= 4 && !signals.some(s => ACTIONABLE.has(s))) {
    viability = 'plateau';
  }
  if (recent.length >= 4 && recent.every(n => n === recent[0])) {
    viability = 'plateau';
  }

  const self_report = [
    `段位 ${evo.rank}，会话 ${evo.stats.total_sessions}，成功率 ${
      evo.stats.total_sessions ? (evo.stats.successful_sessions / evo.stats.total_sessions).toFixed(2) : 'n/a'
    }`,
    `空转 ${progress.empty_streak}，活力 ${viability}`,
    evo.anti_patterns[0] ? `近课：${evo.anti_patterns[evo.anti_patterns.length - 1]?.lesson}` : '尚无反模式课记',
  ].join('。');

  return { viability, self_report, repair_bias };
}

function decideAction(input: EvolveInput, signals: string[], strategy: EvolveStrategy, arenaOn: boolean): TickAction {
  if (input.event === 'PreCompact') return 'silent';
  if (input.event === 'Stop') return 'silent';
  if (arenaOn && input.event === 'SessionStart') return 'arena';
  if (signals.includes('pressure_high') && stateManager.getPressureLevel(input.session_id) >= 3) return 'gate';
  if (strategy === 'innovate' && signals.some(s =>
    s === 'premature_convergence' || s === 'creative_block' || s === 'low_novelty'
  )) {
    return 'dream_suggest';
  }
  if (signals.includes('consecutive_failures') || signals.includes('log_error')) return 'switch';
  if (signals.some(s => ACTIONABLE.has(s))) return 'inject';
  if (arenaOn && input.event === 'UserPromptSubmit' && input.message) return 'arena';
  return 'silent';
}

function compileInjection(action: TickAction, role: string, reason: string): string {
  const thin = compileThinPrompt({ role_id: role });
  const header = {
    inject: `[PUAX-TICK] 注入角色 ${role}（${reason}）`,
    switch: `[PUAX-TICK] 失败切换 → ${role}（${reason}）`,
    dream_suggest: compileCouncilItinerary(`过早收敛/卡壳。建议入梦：${role}`),
    arena: arenaStore.compileInjection(undefined, role) || `[PUAX-TICK] 处境待命。调用 puax_set_arena 立对手。`,
    gate: `[PUAX-TICK] 闸门。交付前 puax_confidence_check + puax_verify_completion。角色 ${role}。`,
    silent: '',
  }[action];
  if (!header) return '';
  if (action === 'arena' && !thin.prompt.includes('[PUAX-ARENA]')) {
    return [header, thin.prompt].filter(Boolean).join('\n\n');
  }
  if (action === 'gate' || action === 'dream_suggest') {
    return [header, thin.prompt].join('\n\n');
  }
  return thin.prompt;
}

export function runEvolveCycle(input: EvolveInput): EvolveResult {
  const cycle_id = randomBytes(4).toString('hex');
  const progress = loadProgress(input.session_id);
  const now = Date.now();

  if (!input.force && progress.last_ts && now - progress.last_ts < COOLDOWN_MS) {
    return {
      cycle_id,
      abort: 'cooldown',
      signals: [],
      strategy: 'optimize',
      repair_bias: false,
      action: 'silent',
      happened: false,
      autopoiesis: { viability: 'ok', self_report: '冷却中' },
      arena_active: !!arenaStore.get(),
    };
  }

  const signals = collectSignals(input);
  const auto = autopoiesisTick(signals, input.session_id);
  if (auto.repair_bias && !signals.includes('consecutive_failures')) {
    signals.push('autopoiesis:repair_loop_guard');
  }

  const hasActionable = signals.some(s => ACTIONABLE.has(s) || s.startsWith('autopoiesis:'));
  if (!hasActionable && progress.empty_streak >= MAX_EMPTY && !input.force && input.event !== 'SessionStart') {
    saveProgress(input.session_id, { ...progress, empty_streak: progress.empty_streak + 1 });
    return {
      cycle_id,
      abort: 'saturation',
      signals,
      strategy: 'optimize',
      repair_bias: auto.repair_bias,
      action: 'silent',
      happened: false,
      autopoiesis: { viability: 'plateau', self_report: auto.self_report },
      arena_active: !!arenaStore.get(),
    };
  }

  const strategy = pickStrategy(signals, auto.repair_bias);
  const { role, reason } = selectRole(input, signals, strategy);
  const liveState = stateManager.getSessionState(input.session_id);
  let needs_intervention: InterventionContext | undefined;
  if (signals.includes('consecutive_failures') && liveState.failureCount >= 3) {
    needs_intervention = {
      reason: 'consecutive_failures',
      role,
      failure_count: liveState.failureCount,
      session_id: input.session_id,
    };
  } else if (signals.includes('premature_convergence') && liveState.pressureLevel >= 3) {
    needs_intervention = {
      reason: 'premature_convergence',
      role,
      failure_count: liveState.failureCount,
      session_id: input.session_id,
    };
  }
  const arena_active = !!arenaStore.get();
  const action = decideAction(input, signals, strategy, arena_active);
  const injection = action === 'silent' ? undefined : compileInjection(action, role, reason);
  const happened = action !== 'silent';

  memoryGraph.append({
    type: 'hypothesis',
    run_id: cycle_id,
    session_id: input.session_id,
    signals,
    role_id: role,
    strategy,
    note: reason,
  });
  memoryGraph.append({
    type: 'attempt',
    run_id: cycle_id,
    session_id: input.session_id,
    role_id: role,
    strategy,
    signals,
  });

  const agentName = input.agent_name || 'main';
  if (input.event === 'Stop' || typeof input.success === 'boolean') {
    const success = input.success !== false;
    const roleForOutcome = input.active_role || role;
    outcomeStore.record(roleForOutcome, success);
    memoryGraph.append({
      type: 'outcome',
      run_id: cycle_id,
      session_id: input.session_id,
      role_id: roleForOutcome,
      success,
    });
    const evo = evolutionEngine.load();
    namedAgentStore.recordCycle(
      agentName,
      success,
      success ? undefined : `失败信号 ${signals.slice(0, 3).join(',')}`,
      evo.rank
    );
  } else {
    namedAgentStore.journal(agentName, {
      kind: 'tick',
      cycle_id,
      action,
      role,
      event: input.event,
    });
  }

  saveProgress(input.session_id, {
    last_ts: happened ? now : progress.last_ts,
    empty_streak: happened ? 0 : progress.empty_streak + 1,
    last_role: role,
    last_action: action,
  });
  memoryGraph.rotateIfHuge();

  if (happened) {
    recordFirstPressure(input.session_id);
  }

  return {
    cycle_id,
    signals,
    strategy,
    repair_bias: auto.repair_bias,
    selected_role: role,
    selected_reason: reason,
    action,
    injection,
    needs_intervention,
    happened,
    autopoiesis: auto,
    arena_active,
  };
}
