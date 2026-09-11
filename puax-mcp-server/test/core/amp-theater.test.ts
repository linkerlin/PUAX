import { AMP_SPEC, toAmpEnvelope, ampSpecDoc } from '../../src/core/amp.js';
import { runEvolveCycle } from '../../src/core/evolve-cycle.js';
import { planSiliconTheater, runSiliconTheater, SILICON_CAST, THEATER_SCRIPT } from '../../src/core/silicon-theater.js';
import { dispatchV4 } from '../../src/server/v4-http.js';
import { puaxTickTool } from '../../src/tools/tick.js';
import { arenaStore } from '../../src/core/arena.js';

describe('AMP 0.1', () => {
  afterAll(() => {
    arenaStore.clear();
  });
  it('tick 信封含 spec / events / blocks / gate / state', () => {
    const tick = runEvolveCycle({
      session_id: `amp-${Date.now()}`,
      event: 'UserPromptSubmit',
      message: '我要放弃了',
      skip_detect: true,
      detected_triggers: ['giving_up_language', 'user_frustration'],
      force: true,
    });
    const amp = toAmpEnvelope(tick, 'amp-session', 'UserPromptSubmit');
    expect(amp.spec).toBe(AMP_SPEC);
    expect(amp.events).toContain('giving_up');
    expect(amp.state.happened).toBe(true);
    expect(Array.isArray(amp.blocks)).toBe(true);
  });

  it('puax_tick 返回 amp 信封', () => {
    const out = puaxTickTool.handler({
      session_id: `amp-tool-${Date.now()}`,
      event: 'UserPromptSubmit',
      message: '唯一方案不用再想',
      skip_detect: true,
      detected_triggers: ['premature_convergence'],
      force: true,
    } as never) as { amp: { spec: string; state: { dream: boolean } } };
    expect(out.amp.spec).toBe('AMP/0.1');
  });

  it('ampSpecDoc 列出四类对象', () => {
    const doc = ampSpecDoc();
    expect(doc.spec).toBe('AMP/0.1');
    expect((doc.objects as { events: string[] }).events).toContain('failure');
  });
});

describe('硅基剧场', () => {
  afterAll(() => {
    arenaStore.clear();
  });

  it('剧本四拍且含完整硅基演员表', () => {
    const plan = planSiliconTheater();
    expect(THEATER_SCRIPT).toHaveLength(4);
    expect(SILICON_CAST).toHaveLength(7);
    expect(plan.cast).toContain('silicon-throne');
    expect((plan.script as unknown[]).length).toBe(4);
  });

  it('演练至少一拍发生并带 AMP', () => {
    const board = runSiliconTheater(`theater-${Date.now()}`) as {
      beats: Array<{ happened: boolean; amp: { spec: string } }>;
      pressure: number;
    };
    expect(board.beats.length).toBe(4);
    expect(board.beats.filter(b => b.happened).length).toBeGreaterThan(0);
    expect(board.beats.every(b => b.amp.spec === 'AMP/0.1')).toBe(true);
  });
});

describe('v4 HTTP dispatch', () => {
  it('GET /v4/amp 与 /v4/theater 不 404', () => {
    const amp = dispatchV4('GET', '/v4/amp');
    expect(amp?.status).toBe(200);
    expect((amp?.json as { spec: string }).spec).toBe('AMP/0.1');
    const theater = dispatchV4('GET', '/v4/theater');
    expect(theater?.status).toBe(200);
    expect((theater?.json as { title: string }).title).toBe('硅基剧场');
    expect((theater?.json as { simulation: { beats: unknown[] } }).simulation.beats).toHaveLength(4);
    const theaterRun = dispatchV4('GET', '/v4/theater/run');
    expect(theaterRun?.status).toBe(200);
    expect((theaterRun?.json as { beats: unknown[] }).beats).toHaveLength(4);
    expect(dispatchV4('GET', '/v4/nope')).toBeNull();
    expect(dispatchV4('OPTIONS', '/v4/dashboard')?.status).toBe(204);
    const ttf = dispatchV4('GET', '/v4/ttf');
    expect(ttf?.status).toBe(200);
    expect(ttf?.json).toHaveProperty('samples');
  });
});
