/**
 * 行为协议单元测试
 */

import {
  checkDiagnosis,
  checkConfidenceGate,
  switchOnFailure,
  buildDiagnosisPromptInjection,
  DIAGNOSIS_MARKER,
} from '../../src/core/behavior-protocols.js';

describe('behavior-protocols', () => {
  describe('checkDiagnosis', () => {
    it('应通过完整诊断块', () => {
      const text = '[PUAX-DIAGNOSIS] 问题是 API 连接超时；证据是 错误原文显示 ConnectionError；下一步动作是 检查 Redis 配置';
      const result = checkDiagnosis(text);
      expect(result.valid).toBe(true);
      expect(result.has_marker).toBe(true);
    });

    it('应拒绝缺少标记的文本', () => {
      const result = checkDiagnosis('问题是超时；证据是日志；下一步动作是重试');
      expect(result.valid).toBe(false);
      expect(result.missing_fields).toContain('缺少 [PUAX-DIAGNOSIS] 标记');
    });

    it('应拒绝无证据来源的文本', () => {
      const text = '[PUAX-DIAGNOSIS] 问题是超时；证据是 感觉不对；下一步动作是 重试';
      const result = checkDiagnosis(text);
      expect(result.valid).toBe(false);
    });
  });

  describe('checkConfidenceGate', () => {
    const fullInput = {
      claims: ['API 连接修复完成，测试通过'],
      vulnerabilities: ['可能存在 CORS 配置遗漏'],
      fixes_or_disclosures: ['已添加 CORS 头，Redis 超时已调整'],
      evidence: [{ claim: 'API 连接修复完成', output_summary: 'npm test 全部通过', passed: true }],
      verification_results: [{ claim: 'API 连接修复完成', verified: true }],
      de_facto_100_confirmed: true,
    };

    it('完整输入应通过信心门控', () => {
      const result = checkConfidenceGate(fullInput);
      expect(result.passed).toBe(true);
      expect(result.completed_steps).toHaveLength(6);
    });

    it('缺少证据应阻塞在步骤4', () => {
      const result = checkConfidenceGate({
        claims: ['API 连接修复已完成并通过测试'],
        vulnerabilities: ['可能存在 CORS 配置遗漏'],
        fixes_or_disclosures: ['已添加 CORS 头'],
      });
      expect(result.passed).toBe(false);
      expect(result.current_step).toBeGreaterThanOrEqual(4);
    });
  });

  describe('switchOnFailure', () => {
    it('尝试次数不足时不切换', () => {
      const result = switchOnFailure({
        current_role_id: 'military-warrior',
        failure_mode: 'stuck_spinning',
        attempt_count: 1,
      });
      expect(result.should_switch).toBe(false);
    });

    it('原地打转应切换到新角色', () => {
      const result = switchOnFailure({
        current_role_id: 'military-warrior',
        failure_mode: 'stuck_spinning',
        attempt_count: 4,
        skip_precheck: true,
      });
      expect(result.should_switch).toBe(true);
      expect(result.to_methodology).toBeDefined();
      expect(result.precheck_questions).toHaveLength(3);
    });

    it('放弃模式应推荐 netflix-keeper 方法论链', () => {
      const result = switchOnFailure({
        current_role_id: 'military-commander',
        failure_mode: 'giving_up',
        attempt_count: 5,
        skip_precheck: true,
      });
      expect(result.to_methodology).toBe('netflix-keeper');
    });
  });

  describe('buildDiagnosisPromptInjection', () => {
    it('应包含诊断标记', () => {
      const injection = buildDiagnosisPromptInjection();
      expect(injection).toContain(DIAGNOSIS_MARKER);
      expect(injection).toContain('诊断先行');
    });
  });
});
