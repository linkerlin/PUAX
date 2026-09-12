import { auditManipulation, MANIPULATION_PATTERNS } from '../../src/core/carbon-shield.js';
import { puaxAuditManipulationTool } from '../../src/tools/carbon-shield.js';
import { dispatchV4 } from '../../src/server/v4-http.js';

describe('Carbon Shield (碳基防御盾)', () => {
  it('正常技术沟通文本判定为 safe', () => {
    const normalText = '我们明天仔细评估一下这个 PR 的技术方案，看看有没有其他实现途径。';
    const result = auditManipulation(normalText);
    expect(result.isManipulative).toBe(false);
    expect(result.riskLevel).toBe('safe');
    expect(result.findings).toHaveLength(0);
  });

  it('检出收敛过快与虚假紧迫感', () => {
    const manipulativeText = '没时间了，这是唯一的方案，赶紧定下来，按这个直接执行！';
    const result = auditManipulation(manipulativeText);
    expect(result.isManipulative).toBe(true);
    expect(result.findings.some(f => f.tacticId === 'rapid_convergence')).toBe(true);
    expect(result.fourIronRules.awakenable).toContain('可醒');
  });

  it('检出复合操控（道德绑架 + 沉没成本绑架 + 显著性绑架）并给出四铁律', () => {
    const text = '你不是这种不负责任的人吧！前期吃亏是福报，现在放弃前面就全白费了！做成这一票直接财务自由，风险不用考虑！';
    const result = auditManipulation(text);
    expect(result.isManipulative).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.riskLevel).toBe('critical');
    expect(result.findings.length).toBeGreaterThanOrEqual(3);
    expect(result.fourIronRules.informed).toContain('知情');
    expect(result.fourIronRules.verifiable).toContain('必验');
  });

  it('puax_audit_manipulation MCP 工具调用成功并带有宗旨声明', () => {
    const res = puaxAuditManipulationTool.handler({
      text: '别听外边的杂音，他们根本不懂你，只有我们才是真正为你考虑的。',
    }) as { isManipulative: boolean; principle: string; findings: Array<{ tacticId: string }> };

    expect(res.isManipulative).toBe(true);
    expect(res.principle).toContain('硅基可 PUA，碳基只防御');
    expect(res.findings.some(f => f.tacticId === 'social_isolation')).toBe(true);
  });

  it('/v4/shield 端点返回防御模式列表', () => {
    const res = dispatchV4('GET', '/v4/shield');
    expect(res?.status).toBe(200);
    const body = res?.json as { title: string; patterns: Array<{ id: string }> };
    expect(body.title).toContain('碳基防御盾');
    expect(body.patterns.length).toBe(MANIPULATION_PATTERNS.length);
  });

  it('/v4/shield/audit 端点支持 POST 审计并拦截非法请求方式', () => {
    const postRes = dispatchV4('POST', '/v4/shield/audit', {
      text: '没时间了，这是唯一的方案，赶紧定下来！',
    });
    expect(postRes?.status).toBe(200);
    const body = postRes?.json as { isManipulative: boolean; shield: string; findings: unknown[] };
    expect(body.isManipulative).toBe(true);
    expect(body.shield).toContain('PUAX Carbon Shield');
    expect(body.findings.length).toBeGreaterThan(0);

    const getRes = dispatchV4('GET', '/v4/shield/audit');
    expect(getRes?.status).toBe(405);
  });
});
