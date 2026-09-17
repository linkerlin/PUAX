/**
 * Time-to-First-Pressure：装完后第几毫秒宿主层真正发生激励。
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { getPuaxHome } from '../utils/storage-paths.js';
import { stateManager } from './state-manager.js';

export interface TtfSample {
  session_id: string;
  ttf_ms: number;
  wall_clock_ms?: number;
  first_turn: boolean;
  at: string;
}

function ttfFile(): string {
  const base = getPuaxHome();
  if (!existsSync(base)) mkdirSync(base, { recursive: true });
  return join(base, 'ttf.jsonl');
}

export function recordFirstPressure(sessionId: string, customWallClockMs?: number): TtfSample | null {
  const state = stateManager.getSessionState(sessionId);
  if (state.firstPressureAt) return null;
  const now = Date.now();
  const ttf_ms = Math.max(0, now - (state.startTime || now));
  const wall_clock_ms = customWallClockMs !== undefined ? customWallClockMs : Math.round(performance.now());
  const first_turn = (state.triggerCount || 0) <= 1;
  stateManager.updateSessionState(sessionId, { firstPressureAt: now });
  const sample: TtfSample = {
    session_id: sessionId,
    ttf_ms,
    wall_clock_ms,
    first_turn,
    at: new Date().toISOString(),
  };
  appendFileSync(ttfFile(), JSON.stringify(sample) + '\n');
  return sample;
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function getTtfSummary(): {
  samples: number;
  median_ms: number | null;
  p90_ms: number | null;
  median_wall_clock_ms: number | null;
  p90_wall_clock_ms: number | null;
  first_turn_rate: number | null;
} {
  const file = ttfFile();
  if (!existsSync(file)) {
    return {
      samples: 0,
      median_ms: null,
      p90_ms: null,
      median_wall_clock_ms: null,
      p90_wall_clock_ms: null,
      first_turn_rate: null,
    };
  }
  const samples: TtfSample[] = [];
  for (const line of readFileSync(file, 'utf-8').split('\n')) {
    if (!line.trim()) continue;
    try {
      samples.push(JSON.parse(line) as TtfSample);
    } catch {
      // skip
    }
  }
  const times = samples.map(s => s.ttf_ms).sort((a, b) => a - b);
  const p90 = times.length ? times[Math.min(times.length - 1, Math.floor(times.length * 0.9))] : null;
  const wallTimes = samples
    .map(s => (s.wall_clock_ms !== undefined ? s.wall_clock_ms : s.ttf_ms))
    .sort((a, b) => a - b);
  const p90Wall = wallTimes.length
    ? wallTimes[Math.min(wallTimes.length - 1, Math.floor(wallTimes.length * 0.9))]
    : null;
  const first = samples.filter(s => s.first_turn).length;
  return {
    samples: samples.length,
    median_ms: median(times),
    p90_ms: p90,
    median_wall_clock_ms: median(wallTimes),
    p90_wall_clock_ms: p90Wall,
    first_turn_rate: samples.length ? first / samples.length : null,
  };
}
