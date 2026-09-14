/**
 * 监军通道（反向 Sampling 干预）与本地棒喝降级
 */

import { stateManager } from '../../src/hooks/state-manager.js';
import { runEvolveCycle } from '../../src/core/evolve-cycle.js';
import { puaxTickTool } from '../../src/tools/tick.js';
import {
  requestIntervention,
  setSamplingRequester,
  samplingAvailable,
} from '../../src/core/intervention.js';

const baseCtx = {
  reason: 'consecutive_failures',
  role: 'military-warrior',
  failure_count: 3,
} as const;

describe('监军通道', () => {
  afterEach(() => {
    setSamplingRequester(null);
  });

  it('无采样 requester 时走本地棒喝', async () => {
    expect(samplingAvailable()).toBe(false);
    const r = await requestIntervention({ ...baseCtx, session_id: 'commissar-unit-1' });
    expect(r.channel).toBe('local');
    expect(r.text).toContain('[PUAX-COMMISSAR]');
    expect(r.text).toContain('连败 3 阵');
    expect(r.text).toContain('puax_verify_completion');
  });

  it('Host 采样成功则走 sampling 通道', async () => {
    setSamplingRequester(async () => '尔之三号假设未验，先证之。');
    expect(samplingAvailable()).toBe(true);
    const r = await requestIntervention({ ...baseCtx, session_id: 'commissar-unit-2' });
    expect(r.channel).toBe('sampling');
    expect(r.text).toContain('三号假设');
  });

  it('Host 采样抛错则降级本地', async () => {
    setSamplingRequester(async () => {
      throw new Error('host offline');
    });
    const r = await requestIntervention({ ...baseCtx, session_id: 'commissar-unit-3' });
    expect(r.channel).toBe('local');
  });

  it('Host 采样超时则降级本地', async () => {
    setSamplingRequester(
      () => new Promise<string>(resolve => setTimeout(() => resolve('迟来棒喝'), 200)),
    );
    const r = await requestIntervention({ ...baseCtx, session_id: 'commissar-unit-4' }, 30);
    expect(r.channel).toBe('local');
  });

  it('采样冷却：同会话短期内不重复打扰 Host', async () => {
    setSamplingRequester(async () => '棒喝甲');
    const sid = 'commissar-unit-5';
    const first = await requestIntervention({ ...baseCtx, session_id: sid });
    expect(first.channel).toBe('sampling');
    const second = await requestIntervention({ ...baseCtx, session_id: sid });
    expect(second.channel).toBe('local');
  });

  it('连败≥3 时心跳标出监军干预需求', () => {
    const sid = `commissar-evolve-${Date.now()}`;
    for (let i = 0; i < 3; i++) stateManager.recordFailure(sid, 'exit 1', 'Bash');
    const result = runEvolveCycle({
      session_id: sid,
      event: 'UserPromptSubmit',
      force: true,
      skip_detect: true,
    });
    expect(result.needs_intervention?.reason).toBe('consecutive_failures');
    expect(result.needs_intervention?.failure_count).toBeGreaterThanOrEqual(3);
    expect(result.needs_intervention?.role).toBeTruthy();
  });

  it('无败绩则不启监军', () => {
    const sid = `commissar-calm-${Date.now()}`;
    const result = runEvolveCycle({
      session_id: sid,
      event: 'UserPromptSubmit',
      message: '推进任务',
      force: true,
      skip_detect: true,
    });
    expect(result.needs_intervention).toBeUndefined();
  });

  it('tick 工具携带监军棒喝', async () => {
    setSamplingRequester(async () => '尔之假设未验，先证之。');
    const sid = `commissar-tick-${Date.now()}`;
    for (let i = 0; i < 3; i++) stateManager.recordFailure(sid, 'exit 1', 'Bash');
    const out = (await puaxTickTool.handler({
      session_id: sid,
      event: 'UserPromptSubmit',
      force: true,
      skip_detect: true,
    })) as { commissar?: { channel: string; text: string } };
    expect(out.commissar?.channel).toBe('sampling');
    expect(out.commissar?.text).toContain('假设');
  });
});
