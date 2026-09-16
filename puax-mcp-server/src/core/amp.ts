/**
 * AMP 0.1 — Agent Motivation Protocol
 * MCP 只是插头。河床是这四类对象：事件、块、闸门、状态。
 */

import { stateManager } from './state-manager.js';
import type { EvolveResult, TickEvent } from './evolve-cycle.js';

export const AMP_SPEC = 'AMP/0.1';

export const AMP_EVENTS = [
  'failure',
  'giving_up',
  'premature_convergence',
  'breakthrough',
  'compaction',
] as const;

export type AmpEventName = (typeof AMP_EVENTS)[number];

export const AMP_BLOCKS = [
  '[PUAX-DIAGNOSIS]',
  '[DREAM]',
  '[PUAX-REPORT]',
  '[PUAX-ARENA]',
  '[PUAX-DREAM-COUNCIL]',
  '[PUAX-RUNTIME]',
] as const;

export const AMP_GATES = ['none', 'diagnosis', 'confidence', 'verify', 'pretooluse'] as const;
export type AmpGate = (typeof AMP_GATES)[number];

export interface AmpEnvelope {
  spec: typeof AMP_SPEC;
  events: AmpEventName[];
  blocks: string[];
  gate: AmpGate;
  state: {
    pressure: number;
    arena: boolean;
    dream: boolean;
    happened: boolean;
    role?: string;
  };
}

const SIGNAL_TO_EVENT: Array<[string, AmpEventName]> = [
  ['consecutive_failures', 'failure'],
  ['log_error', 'failure'],
  ['giving_up_language', 'giving_up'],
  ['premature_convergence', 'premature_convergence'],
  ['creative_block', 'premature_convergence'],
];

export function toAmpEnvelope(result: EvolveResult, sessionId: string, event?: TickEvent): AmpEnvelope {
  const events: AmpEventName[] = [];
  for (const [sig, ev] of SIGNAL_TO_EVENT) {
    if (result.signals.includes(sig) && !events.includes(ev)) events.push(ev);
  }
  if (result.action === 'dream_suggest' && !events.includes('premature_convergence')) {
    events.push('premature_convergence');
  }
  if (event === 'PreCompact') {
    events.push('compaction');
  }

  const injection = result.injection || '';
  const blocks = AMP_BLOCKS.filter(b => injection.includes(b));

  let gate: AmpGate = 'none';
  if (result.action === 'gate') gate = 'verify';
  else if (blocks.includes('[PUAX-DIAGNOSIS]')) gate = 'diagnosis';

  const pressure = Number(stateManager.getPressureLevel(sessionId) || 0);

  return {
    spec: AMP_SPEC,
    events,
    blocks,
    gate,
    state: {
      pressure,
      arena: result.arena_active || injection.includes('[PUAX-ARENA]'),
      dream: result.action === 'dream_suggest' || injection.includes('[DREAM]') || injection.includes('[PUAX-DREAM-COUNCIL]'),
      happened: result.happened,
      role: result.selected_role,
    },
  };
}

export function ampSpecDoc(): Record<string, unknown> {
  return {
    spec: AMP_SPEC,
    objects: {
      events: [...AMP_EVENTS],
      blocks: [...AMP_BLOCKS],
      gates: [...AMP_GATES],
      state: ['pressure L0–L4', 'trust T1–T3', 'dream_context_ref', 'arena'],
    },
    note: 'puax-mcp-server 是参考实现。宿主只要能吃这四类对象，即可挂 PUAX inside。',
  };
}
