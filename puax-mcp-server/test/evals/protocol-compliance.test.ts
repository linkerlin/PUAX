/**
 * 行为协议合规 + 工程化守门测试
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { allTools } from '../../src/tools/index.js';
import { RoleRecommender } from '../../src/core/role-recommender.js';
import { assertSafeOutputPath, PathTraversalError } from '../../src/utils/path-security.js';
import { checkDiagnosis, checkConfidenceGate } from '../../src/core/behavior-protocols.js';

const REQUIRED_V3_TOOLS = [
  'puax_switch_on_failure',
  'puax_check_diagnosis',
  'puax_confidence_check',
  'puax_define_contract',
  'puax_verify_completion',
  'puax_get_evolution_baseline',
  'puax_record_evolution',
  'puax_handle_breakthrough',
  'puax_quality_compass',
  'puax_update_reasoning_state',
  'puax_orchestrate_team',
  'puax_list_platforms',
  'puax_register_custom_role',
  'puax_list_custom_roles',
  'puax_remove_custom_role',
];

describe('protocol compliance (evals)', () => {
  it('应注册全部 v3.3-v3.5 行为工具', () => {
    const names = allTools.map(t => t.name);
    for (const tool of REQUIRED_V3_TOOLS) {
      expect(names).toContain(tool);
    }
  });

  it('recommend_role 应返回 score_explanation', () => {
    const recommender = new RoleRecommender();
    const result = recommender.recommend({
      detected_triggers: ['user_frustration', 'repetitive_attempts'],
      task_context: { task_type: 'debugging', attempt_count: 3, urgency: 'high' },
    });
    expect(result.metadata.score_explanation).toBeDefined();
    expect(result.metadata.score_explanation!.dimensions.length).toBe(5);
    expect(result.metadata.score_explanation!.total_score).toBe(result.primary.confidence_score);
  });

  it('路径遍历应被拒绝', () => {
    expect(() => assertSafeOutputPath('../../etc/passwd')).toThrow(PathTraversalError);
    expect(() => assertSafeOutputPath('valid-export-dir')).not.toThrow();
  });

  it('行为协议静态条款应存在于源码', () => {
    const behaviorSrc = readFileSync(
      join(__dirname, '../../src/core/behavior-protocols.ts'),
      'utf-8'
    );
    expect(behaviorSrc).toContain('[PUAX-DIAGNOSIS]');
    expect(behaviorSrc).toContain('事实上的 100%');
  });

  it('诊断+信心门控端到端', () => {
    const diag = checkDiagnosis(
      '[PUAX-DIAGNOSIS] 问题是连接失败；证据是 错误原文 ECONNREFUSED；下一步动作是 检查端口'
    );
    expect(diag.valid).toBe(true);

    const gate = checkConfidenceGate({
      claims: ['API 修复完成并通过集成测试'],
      vulnerabilities: ['CORS 可能遗漏'],
      fixes_or_disclosures: ['已补 CORS 头'],
      evidence: [{ claim: 'API 修复', output_summary: 'npm test passed', passed: true }],
      verification_results: [{ claim: 'API 修复', verified: true }],
      de_facto_100_confirmed: true,
    });
    expect(gate.passed).toBe(true);
  });

  it('分发清单文件应存在', () => {
    const installMd = join(__dirname, '../../../distributions/INSTALL.md');
    const pluginJson = join(__dirname, '../../../distributions/claude-code/plugin.json');
    expect(() => readFileSync(installMd, 'utf-8')).not.toThrow();
    expect(() => readFileSync(pluginJson, 'utf-8')).not.toThrow();
  });

  it('prompts bundle 应按需加载类别', () => {
    const { getBundledSkillById, getSkillManifest } = require('../../src/prompts/prompts-bundle.js');
    expect(getSkillManifest().length).toBeGreaterThanOrEqual(50);
    const skill = getBundledSkillById('military-commander');
    expect(skill?.content).toMatch(/上将军|运筹帷幄/);
  });

  it('handlers 已并入 tools 单一注册表', () => {
    const { allTools, hookToolHandlers, buildToolHandlerMap } = require('../../src/tools/index.js');
    const map = buildToolHandlerMap(allTools);
    expect(map.size).toBe(allTools.length);
    expect(hookToolHandlers.puax_get_pressure_level).toBeDefined();
    expect(hookToolHandlers.puax_start_session).toBeDefined();
  });
});
