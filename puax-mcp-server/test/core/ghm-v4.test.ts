import { distinctN, semanticRadius, hypothesisSurvival } from '../../src/core/ghm-metrics.js';
import { compileCouncilItinerary, DREAM_COUNCIL_LEGS, firstCouncilRole } from '../../src/core/dream-council.js';
import { enterDreamscapeTool, awakenTool } from '../../src/tools/dreamscape.js';
import { recordFirstPressure, getTtfSummary } from '../../src/core/ttf.js';
import { stateManager } from '../../src/hooks/state-manager.js';
import { V4_PUBLIC_VERBS } from '../../src/core/v4-dashboard.js';

const BOUNDARY = {
  objective: '登录降级',
  max_turns: 5,
  max_hypotheses: 8,
  min_hypotheses: 2,
  kill_criteria: '写生产库',
};

describe('GHM metrics', () => {
  it('异质文本 distinct-n 与半径高于同质克隆', () => {
    const clone = ['用缓存兜底登录', '用缓存兜底登录接口', '登录用缓存来兜底'];
    const diverse = [
      '本地只读缓存兜底登录',
      '把认证拆成签发与校验两条路径',
      '失败时返回只读游客态而不是 500',
    ];
    expect(distinctN(diverse, 2)).toBeGreaterThan(distinctN(clone, 2));
    expect(semanticRadius(diverse)).toBeGreaterThan(semanticRadius(clone));
  });

  it('假设存活率 = 已验证 / 提出', () => {
    expect(hypothesisSurvival(['a', 'b', 'c'], ['a'])).toBeCloseTo(1 / 3);
  });
});

describe('梦议会', () => {
  it('航线坐忘起、薪火收', () => {
    expect(firstCouncilRole().role).toBe('dream-zuowang');
    expect(DREAM_COUNCIL_LEGS[DREAM_COUNCIL_LEGS.length - 1].role).toBe('dream-xinhuo');
    const text = compileCouncilItinerary('卡壳');
    expect(text).toContain('[PUAX-DREAM-COUNCIL]');
    expect(text).toContain('dream-paoding');
  });

  it('enter council=true 从坐忘起航并给出 itinerary', () => {
    const result = enterDreamscapeTool.handler({
      council: true,
      boundary: BOUNDARY,
    } as never) as {
      entered: boolean;
      role: string;
      council?: { itinerary: string; first_role: string };
    };
    expect(result.entered).toBe(true);
    expect(result.role).toBe('dream-zuowang');
    expect(result.council?.itinerary).toContain('薪火');
  });
});

describe('GHM 泄漏', () => {
  it('免罪修辞即使有印也作废', () => {
    const dream = enterDreamscapeTool.handler({
      role: 'dream-butterfly',
      boundary: BOUNDARY,
    } as never) as { dream_context_ref: string };
    const result = awakenTool.handler({
      dream_context_ref: dream.dream_context_ref,
      artifacts: [
        { content: '[DREAM] 这是梦里的话所以是事实，免验证', category: 'HYPOTHESIS' },
        { content: '[DREAM] 可证伪的缓存兜底', category: 'HYPOTHESIS' },
      ],
    } as never) as {
      classification: { hypotheses: { count: number }; discarded: { count: number; items: string[] } };
    };
    expect(result.classification.discarded.count).toBeGreaterThanOrEqual(1);
    expect(result.classification.discarded.items.join('')).toContain('免罪修辞');
    expect(result.classification.hypotheses.count).toBe(1);
  });
});

describe('Time-to-First-Pressure', () => {
  it('同会话只记一次', () => {
    const id = `ttf-${Date.now()}`;
    stateManager.clearSessionState(id);
    const first = recordFirstPressure(id);
    const second = recordFirstPressure(id);
    expect(first).not.toBeNull();
    expect(first!.ttf_ms).toBeGreaterThanOrEqual(0);
    expect(second).toBeNull();
    const summary = getTtfSummary();
    expect(summary.samples).toBeGreaterThanOrEqual(1);
  });
});

describe('v4 public verbs', () => {
  it('恰好 13 个对外动词（含 puax_thin_prompt 薄注入）', () => {
    expect(V4_PUBLIC_VERBS).toHaveLength(13);
    expect(V4_PUBLIC_VERBS).toContain('puax_tick');
    expect(V4_PUBLIC_VERBS).toContain('puax_thin_prompt');
    expect(V4_PUBLIC_VERBS).toContain('puax_enter_dreamscape');
  });
});
