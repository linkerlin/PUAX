/**
 * v3.5 生态广度单元测试
 */

import { applyToneVariant, isValidToneVariant, TONE_VARIANTS } from '../../src/core/tone-variants.js';
import { applyPipEdition, buildLocalizedDiagnosisInjection } from '../../src/core/i18n-en.js';
import { orchestrateTeam, PUAX_REPORT_FORMAT } from '../../src/core/agent-team-protocol.js';
import { globalAdapterRegistry } from '../../src/platform-adapters/base-adapter.js';
import '../../src/platform-adapters/skill-md-platform-adapter.js';
import '../../src/platform-adapters/cursor-adapter.js';
import '../../src/platform-adapters/vscode-adapter.js';
import '../../src/platform-adapters/kiro-adapter.js';
import '../../src/platform-adapters/codebuddy-adapter.js';
import '../../src/platform-adapters/windsurf-adapter.js';

describe('v3.5 ecosystem', () => {
  describe('tone variants', () => {
    it('strict 不叠加', () => {
      expect(applyToneVariant('base', 'strict')).toBe('base');
    });

    it('yes 应叠加鼓励段', () => {
      const out = applyToneVariant('base', 'yes');
      expect(out).toContain('鼓励模式');
    });

    it('mama 应叠加唠叨段', () => {
      const out = applyToneVariant('base', 'mama');
      expect(out).toContain('妈妈唠叨');
    });

    it('三种变体均有效', () => {
      expect(Object.keys(TONE_VARIANTS)).toHaveLength(3);
      expect(isValidToneVariant('yes')).toBe(true);
    });
  });

  describe('PIP Edition', () => {
    it('应注入 PIP 头', () => {
      const out = applyPipEdition('prompt', 'Warrior', 'fight');
      expect(out).toContain('Amazon');
      expect(out).toContain('Netflix');
    });

    it('英文诊断模板', () => {
      expect(buildLocalizedDiagnosisInjection('en')).toContain('Diagnosis-First');
    });
  });

  describe('agent team', () => {
    it('应创建团队', () => {
      const result = orchestrateTeam({
        action: 'create',
        template_id: 'sprint-team',
        project_context: '紧急修复生产 bug',
        session_id: 'team-test-1',
      });
      expect(result.success).toBe(true);
      expect(result.team_id).toBeDefined();
      expect(result.collaboration_script).toContain('协作剧本');
    });

    it('应定义 PUAX-REPORT 格式', () => {
      expect(PUAX_REPORT_FORMAT).toContain('[PUAX-REPORT]');
    });
  });

  describe('platform adapters', () => {
    it('应注册 11+ 平台', () => {
      const platforms = globalAdapterRegistry.getSupportedPlatforms();
      expect(platforms).toContain('cursor');
      expect(platforms).toContain('codex');
      expect(platforms).toContain('trae');
      expect(platforms).toContain('pi');
      expect(platforms.length).toBeGreaterThanOrEqual(11);
    });
  });
});
