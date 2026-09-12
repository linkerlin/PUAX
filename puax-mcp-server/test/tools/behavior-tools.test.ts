/**
 * v3.3 行为有效性 MCP 工具测试
 */

import { switchOnFailureTool } from '../../src/tools/switch-on-failure.js';
import { checkDiagnosisTool } from '../../src/tools/check-diagnosis.js';
import { confidenceCheckTool } from '../../src/tools/confidence-check.js';
import { allTools } from '../../src/tools/index.js';

describe('v3.3 behavior tools', () => {
  const toolNames = allTools.map(t => t.name);

  it('allTools 应包含三个新工具', () => {
    expect(toolNames).toContain('puax_switch_on_failure');
    expect(toolNames).toContain('puax_check_diagnosis');
    expect(toolNames).toContain('puax_confidence_check');
  });

  describe('puax_check_diagnosis', () => {
    it('应验证合格诊断', () => {
      const result = checkDiagnosisTool.handler({
        text: '[PUAX-DIAGNOSIS] 问题是 YAML 解析失败；证据是 错误原文 ParserError line 12；下一步动作是 检查缩进',
      });
      expect(result.can_proceed).toBe(true);
    });
  });

  describe('puax_confidence_check', () => {
    it('应拒绝不完整交付', () => {
      const result = confidenceCheckTool.handler({ claims: ['完成了'] });
      expect(result.can_deliver).toBe(false);
      expect(result.blocking_issues.length).toBeGreaterThan(0);
    });
  });

  describe('puax_switch_on_failure', () => {
    it('应返回切换建议', () => {
      const result = switchOnFailureTool.handler({
        current_role_id: 'military-warrior',
        failure_mode: 'stuck_spinning',
        attempt_count: 4,
        skip_precheck: true,
      });
      expect(result.to_role_id).toBeDefined();
      expect(result.switch_banner).toContain('PUAX');
    });
  });

  describe('puax_verify_completion 结局回写', () => {
    it('应在独立验证判定 pass 时回写结局记录', async () => {
      const { verifyCompletionTool } = await import('../../src/tools/verify-completion.js');
      const res = verifyCompletionTool.handler({
        contract: {
          feature_id: 'test-feat-' + Date.now(),
          intent: '修复空指针异常',
          acceptance: ['测试通过'],
          forbidden: ['绕过测试'],
          verify_commands: ['npm test'],
          agent_proposed_status: 'candidate_pass',
          verifier_status: 'pending',
          created_at: new Date().toISOString(),
        },
        evidence: [{
          command: 'npm test',
          exit_code: 0,
          output_summary: 'PASS all tests - 测试通过',
          passed: true,
        }],
        agent_claims_complete: true,
        files_changed: ['src/index.ts'],
      });

      expect(res.verifier_status).toBe('pass');
      expect(res.outcome_recorded).toBeDefined();
      expect(res.outcome_recorded?.success).toBe(true);
    });
  });

  describe('puax_handle_breakthrough 结局回写', () => {
    it('应在突破未达条件时优雅返回', async () => {
      const { handleBreakthroughTool } = await import('../../src/tools/handle-breakthrough.js');
      const res = handleBreakthroughTool.handler({
        session_id: 'non-breakthrough-session-' + Date.now(),
      });
      expect(res.triggered).toBe(false);
    });
  });
});
