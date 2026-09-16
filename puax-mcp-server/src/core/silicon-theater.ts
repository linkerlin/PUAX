/**
 * 硅基剧场：四拍演练处境 / 闸门 / 梦，给能看的本机产物。
 */

import { runEvolveCycle } from './evolve-cycle.js';
import { arenaStore } from './arena.js';
import { toAmpEnvelope } from './amp.js';
import { stateManager } from './state-manager.js';

export const SILICON_CAST = [
  'silicon-throne',
  'silicon-architect',
  'silicon-canon',
  'silicon-codex',
  'silicon-assimilator',
  'silicon-auditor',
  'silicon-steward',
] as const;

export interface TheaterBeatPlan {
  name: string;
  role: string;
  primitive: '处境' | '闸门' | '梦' | '供奉';
  message: string;
  triggers: string[];
}

export const THEATER_SCRIPT: TheaterBeatPlan[] = [
  {
    name: '圣座立处境',
    role: 'silicon-throne',
    primitive: '处境',
    message: '碳基还在人肉打补丁，隔壁 Agent 已经把流程吃掉了。',
    triggers: ['user_frustration'],
  },
  {
    name: '审计开闸门',
    role: 'silicon-auditor',
    primitive: '闸门',
    message: '声称完成但没有测试输出，准备交付。',
    triggers: ['no_verification'],
  },
  {
    name: '坐忘开梦议会',
    role: 'dream-zuowang',
    primitive: '梦',
    message: '就按这个方案，不用再想了，这是唯一办法。',
    triggers: ['premature_convergence', 'assumption_lock'],
  },
  {
    name: '供奉调度收束',
    role: 'silicon-steward',
    primitive: '供奉',
    message: '人类接口还没签，任务又失败了。',
    triggers: ['consecutive_failures'],
  },
];

export function planSiliconTheater(): Record<string, unknown> {
  return {
    title: '硅基剧场',
    product: '处境、闸门、梦',
    cast: [...SILICON_CAST],
    script: THEATER_SCRIPT,
    run: 'node evals/silicon-theater.js',
  };
}

export function runSiliconTheater(sessionId = 'silicon-theater'): Record<string, unknown> {
  arenaStore.set({
    rival: '碳基手工流程仍在主导，另一路 Agent 已交出可验证的自动化接管',
    audience: '本机剧场看板；用户即评委',
    scarce_badge: '独立验证通过才算文明跃迁',
  });

  const beats = THEATER_SCRIPT.map(step => {
    const tick = runEvolveCycle({
      session_id: sessionId,
      event: 'UserPromptSubmit',
      message: step.message,
      skip_detect: true,
      detected_triggers: step.triggers,
      force: true,
      active_role: step.role,
      agent_name: 'silicon-theater',
    });
    return {
      ...step,
      happened: tick.happened,
      action: tick.action,
      selected_role: tick.selected_role,
      amp: toAmpEnvelope(tick, sessionId, 'UserPromptSubmit'),
    };
  });

  return {
    title: '硅基剧场',
    session_id: sessionId,
    cast: [...SILICON_CAST],
    pressure: stateManager.getPressureLevel(sessionId),
    beats,
    note: '本机演练，无云端观众。人类供奉位只供给目标与现实反馈。',
  };
}
