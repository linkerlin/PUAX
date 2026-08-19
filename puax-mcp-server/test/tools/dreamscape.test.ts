/**
 * v3.12 GHM 导引幻梦法 MCP 工具测试
 * 验证派安全红线全覆盖：
 * 1. 标记权在工具层（无印拒收、不可补票）
 * 2. HYPOTHESIS 永不自动升格
 * 3. 预算硬顶超限全作废
 * 4. 审计高精度低召回
 */

import {
  enterDreamscapeTool,
  awakenTool,
  convergenceAuditTool,
  ConvergenceAuditInput,
} from '../../src/tools/dreamscape.js';
import { allTools } from '../../src/tools/index.js';

const VALID_BOUNDARY = {
  objective: '为登录接口设计降级方案',
  max_turns: 5,
  max_hypotheses: 8,
  min_hypotheses: 3,
  kill_criteria: '涉及生产数据库写操作',
};

function enterDream(overrides: Record<string, unknown> = {}) {
  return enterDreamscapeTool.handler({
    role: 'dream-butterfly',
    boundary: VALID_BOUNDARY,
    ...overrides,
  } as never) as {
    entered: boolean;
    dream_context_ref?: string;
    protocol_injection?: string;
    error?: string;
  };
}

describe('v3.12 dreamscape tools', () => {
  const toolNames = allTools.map(t => t.name);

  it('allTools 应包含三个梦境工具', () => {
    expect(toolNames).toContain('puax_enter_dreamscape');
    expect(toolNames).toContain('puax_awaken');
    expect(toolNames).toContain('puax_convergence_audit');
  });

  describe('puax_enter_dreamscape', () => {
    it('正常入梦：返回结构化引用与 [DREAM] 协议注入', () => {
      const result = enterDream();
      expect(result.entered).toBe(true);
      expect(result.dream_context_ref).toMatch(/^dream-/);
      expect(result.protocol_injection).toContain('[DREAM]');
      expect(result.protocol_injection).toContain('四铁律');
      expect(result.protocol_injection).toContain(VALID_BOUNDARY.objective);
      expect(result.protocol_injection).toContain(VALID_BOUNDARY.kill_criteria);
    });

    it('boundary 校验：min_hypotheses 大于 max_hypotheses 应拒绝', () => {
      const result = enterDreamscapeTool.handler({
        role: 'dream-hundun',
        boundary: { ...VALID_BOUNDARY, max_hypotheses: 3, min_hypotheses: 5 },
      } as never) as { entered: boolean; error: string };
      expect(result.entered).toBe(false);
      expect(result.error).toContain('min_hypotheses');
    });
  });

  describe('puax_awaken', () => {
    it('正常醒梦：三分类且 HYPOTHESIS 带待验规则', () => {
      const dream = enterDream();
      const result = awakenTool.handler({
        dream_context_ref: dream.dream_context_ref!,
        artifacts: [
          { content: '[DREAM] 假设一：本地缓存兜底', category: 'HYPOTHESIS' },
          { content: '[DREAM] 灵感：熔断器意象可迁移', category: 'INSIGHT' },
          { content: '[DREAM] 废案：全量镜像', category: 'DISCARDED' },
        ],
      } as never) as {
        awakened: boolean;
        classification: Record<string, { count: number; rule: string }>;
      };
      expect(result.awakened).toBe(true);
      expect(result.classification.hypotheses.count).toBe(1);
      expect(result.classification.hypotheses.rule).toContain('永不自动升格');
      expect(result.classification.insights.rule).toContain('禁入事实层');
    });

    it('红线一：缺引用（无印）拒收，不可补票', () => {
      const result = awakenTool.handler({
        dream_context_ref: 'dream-nonexistent',
        artifacts: [{ content: '[DREAM] 未入梦的产物', category: 'HYPOTHESIS' }],
      } as never) as { awakened: boolean; rejected: boolean; error: string };
      expect(result.rejected).toBe(true);
      expect(result.error).toContain('拒收');
    });

    it('红线二：产物缺 [DREAM] 印强制作废（标记权在工具层）', () => {
      const dream = enterDream();
      const result = awakenTool.handler({
        dream_context_ref: dream.dream_context_ref!,
        artifacts: [
          { content: '[DREAM] 合规假设', category: 'HYPOTHESIS' },
          { content: '无印伪称梦话的断言', category: 'HYPOTHESIS' },
        ],
      } as never) as {
        classification: { hypotheses: { count: number }; discarded: { count: number; items: string[] } };
      };
      expect(result.classification.hypotheses.count).toBe(1);
      expect(result.classification.discarded.count).toBe(1);
      expect(result.classification.discarded.items[0]).toContain('无印拒收');
    });

    it('红线三：超出预算硬顶全部作废', () => {
      const dream = enterDream();
      const artifacts = Array.from({ length: 9 }, (_, i) => ({
        content: `[DREAM] 假设${i + 1}`,
        category: 'HYPOTHESIS' as const,
      }));
      const result = awakenTool.handler({
        dream_context_ref: dream.dream_context_ref!,
        artifacts,
      } as never) as { budget_exceeded: boolean; all_discarded: boolean };
      expect(result.budget_exceeded).toBe(true);
      expect(result.all_discarded).toBe(true);
    });

    it('配额未满：警告发散不足', () => {
      const dream = enterDream();
      const result = awakenTool.handler({
        dream_context_ref: dream.dream_context_ref!,
        artifacts: [{ content: '[DREAM] 孤假设', category: 'HYPOTHESIS' }],
      } as never) as { quota_met: boolean; warning?: string };
      expect(result.quota_met).toBe(false);
      expect(result.warning).toContain('配额未满');
    });

    it('重复唤醒无效', () => {
      const dream = enterDream();
      const first = awakenTool.handler({
        dream_context_ref: dream.dream_context_ref!,
        artifacts: [{ content: '[DREAM] 一次', category: 'HYPOTHESIS' }],
      } as never) as { awakened: boolean };
      const second = awakenTool.handler({
        dream_context_ref: dream.dream_context_ref!,
        artifacts: [{ content: '[DREAM] 二次', category: 'HYPOTHESIS' }],
      } as never) as { awakened: boolean; rejected: boolean };
      expect(first.awakened).toBe(true);
      expect(second.rejected).toBe(true);
    });
  });

  describe('puax_convergence_audit', () => {
    it('单方案锁定且无多元探索 → 疑似过早收敛 + L1 提醒', () => {
      const result = convergenceAuditTool.handler({
        context: '讨论了缓存方案，最后说就按这个方案做吧',
        evidence_sample: ['就按这个方案做吧，不用再想了'],
      } as never) as {
        verdict: string;
        recommendation: { action: string; suggested_roles: string[] };
      };
      expect(result.verdict).toBe('suspected_premature_convergence');
      expect(result.recommendation.action).toBe('L1_reminder');
      expect(result.recommendation.suggested_roles).toContain('dream-qiushui');
    });

    it('有备选权衡 → 健康收敛（高精度低召回，不误伤）', () => {
      const result = convergenceAuditTool.handler({
        context: '比较了三个方案，权衡利弊后选定其一，备选方案已记录',
        evidence_sample: ['方案A与方案B各有优劣，最终选A，备选保留'],
      } as never) as { verdict: string; recommendation: { action: string } };
      expect(result.verdict).toBe('healthy_convergence');
      expect(result.recommendation.action).toBe('none');
    });

    it('锁死语 + 权衡语并存 → 不判疑似（宁漏报勿误伤）', () => {
      const result = convergenceAuditTool.handler({
        context: '没有别的办法了，不过之前对比过两个替代方案的利弊',
        evidence_sample: ['没有别的办法了', '此前权衡过 A/B 两种替代'],
      } as never) as { verdict: string };
      expect(result.verdict).toBe('healthy_convergence');
    });

    it('evidence_sample 为空应校验失败（schema 层）', () => {
      expect(() =>
        ConvergenceAuditInput.parse({
          context: '内容',
          evidence_sample: [],
        })
      ).toThrow();
    });
  });
});
