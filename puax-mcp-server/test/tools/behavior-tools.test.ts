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
});
