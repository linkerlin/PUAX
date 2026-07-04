/**
 * v3.4 核心模块单元测试
 */

import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { EvolutionEngine } from '../../src/core/evolution-engine.js';
import { defineContract, verifyCompletion } from '../../src/core/governance.js';
import {
  runQualityCompass,
  assessTrustLevel,
  getRecoveryProtocol,
} from '../../src/core/high-agency.js';
import { getFlavorMethodology, getFlavorExportList } from '../../src/core/flavor-methodology.js';
import { StateManager } from '../../src/hooks/state-manager.js';
import { PressureSystem } from '../../src/hooks/pressure-system.js';

describe('v3.4 core modules', () => {
  describe('EvolutionEngine', () => {
    let engine: EvolutionEngine;
    let tempDir: string;

    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), 'puax-evo-'));
      engine = new EvolutionEngine(tempDir);
    });

    afterEach(() => {
      try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
    });

    it('首次会话应返回见习段位', () => {
      const baseline = engine.getBaselineReminder();
      expect(baseline.rank).toBe('见习');
      expect(baseline.is_first_session).toBe(true);
    });

    it('超越基线应刷新标准', () => {
      const result = engine.recordSessionEnd({
        pua_effects: ['诊断先行', '跑测试', '主动搜索', '信心门控', '换思路'],
        success: true,
      });
      expect(result.exceeded_baseline).toBe(true);
    });
  });

  describe('governance', () => {
    it('应定义 Task Contract', () => {
      const contract = defineContract({
        feature_id: 'auth_001',
        intent: '用户可登录',
        acceptance: ['正确密码可登录'],
        verify_commands: ['npm test'],
      });
      expect(contract.verifier_status).toBe('pending');
    });

    it('应拒绝无证据的自报完成', () => {
      const contract = defineContract({
        feature_id: 'x',
        intent: '修 bug',
        acceptance: ['bug 已修'],
        verify_commands: ['npm test'],
      });
      const result = verifyCompletion({
        contract,
        evidence: [],
        agent_claims_complete: true,
      });
      expect(result.can_mark_complete).toBe(false);
      expect(result.governance_violations.length).toBeGreaterThan(0);
    });

    it('应通过有效证据', () => {
      const contract = defineContract({
        feature_id: 'x',
        intent: '修 bug',
        acceptance: ['bug 已修'],
        verify_commands: ['npm test'],
      });
      const result = verifyCompletion({
        contract,
        evidence: [{ command: 'npm test', exit_code: 0, output_summary: 'all tests passed bug fixed', passed: true }],
        agent_claims_complete: true,
      });
      expect(result.verifier_status).toBe('pass');
    });
  });

  describe('high-agency', () => {
    it('Quality Compass 应检测缺口', () => {
      const result = runQualityCompass({ intent: '短' });
      expect(result.passed).toBe(false);
    });

    it('T3 信任需高连续成功', () => {
      const t3 = assessTrustLevel({ consecutive_successes: 5, confidence_gate_pass_rate: 0.95, diagnosis_compliance_rate: 0.95 });
      expect(t3.level).toBe('T3');
    });

    it('Recovery Protocol 在首次失败时激活', () => {
      const r = getRecoveryProtocol(1, 0);
      expect(r.active).toBe(true);
    });
  });

  describe('flavor-methodology', () => {
    it('应加载华为味行为约束', () => {
      const flavor = getFlavorMethodology('huawei');
      expect(flavor?.name).toContain('华为');
      expect(flavor?.behavior_constraints.length).toBeGreaterThan(0);
    });

    it('应加载 Amazon / Google / Xiaomi 风味', () => {
      for (const id of ['amazon', 'google', 'xiaomi']) {
        const flavor = getFlavorMethodology(id);
        expect(flavor).toBeDefined();
        expect(flavor!.behavior_constraints.length).toBeGreaterThan(0);
        expect(flavor!.forbidden_behaviors.length).toBeGreaterThan(0);
      }
    });

    it('getFlavorExportList 应包含 google 与 xiaomi', () => {
      const ids = getFlavorExportList().map(f => f.id);
      expect(ids).toContain('amazon');
      expect(ids).toContain('google');
      expect(ids).toContain('xiaomi');
      const google = getFlavorExportList().find(f => f.id === 'google');
      expect(google?.rhetoric.opening.length).toBeGreaterThan(0);
    });
  });

  describe('pressure breakthrough', () => {
    let sm: StateManager;
    let ps: PressureSystem;
    let tempDir: string;

    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), 'puax-ps-'));
      sm = new StateManager(tempDir);
      ps = new PressureSystem({}, sm);
    });

    afterEach(() => {
      try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
    });

    it('连续失败3次后成功应触发突破', () => {
      const sid = 'breakthrough-test';
      ps.handleFailure(sid, 'err1');
      ps.handleFailure(sid, 'err2');
      ps.handleFailure(sid, 'err3');
      const result = ps.handleSuccess(sid);
      expect(result?.triggered).toBe(true);
      expect(result?.injection).toContain('突破');
    });
  });

  describe('compaction state', () => {
    let sm: StateManager;
    let tempDir: string;

    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), 'puax-compact-'));
      sm = new StateManager(tempDir);
    });

    afterEach(() => {
      try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
    });

    it('应保存推理状态', () => {
      sm.updateReasoningState('s1', {
        triedApproaches: ['改 timeout'],
        nextHypothesis: '检查 Redis 配置',
      });
      const state = sm.getSessionState('s1');
      expect(state.triedApproaches).toContain('改 timeout');
      expect(state.nextHypothesis).toBe('检查 Redis 配置');
    });

    it('应检测断点恢复', () => {
      sm.updateReasoningState('s2', { triedApproaches: ['方案A'] });
      const restore = sm.getCompactionRestoreContext('s2');
      expect(restore.should_restore).toBe(true);
      expect(restore.context).toContain('断点恢复');
    });
  });
});
