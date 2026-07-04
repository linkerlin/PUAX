/**
 * PUAX High-Agency 正向激励
 * v3.4: Trust Level + Quality Compass + Recovery Protocol + Calibration
 */

// ============================================================================
// Trust Level T1-T3
// ============================================================================

export type TrustLevel = 'T1' | 'T2' | 'T3';

export interface TrustAssessment {
  level: TrustLevel;
  consecutive_high_quality: number;
  can_skip_confirmation: boolean;
  can_auto_switch_role: boolean;
  message: string;
}

export function assessTrustLevel(input: {
  consecutive_successes: number;
  confidence_gate_pass_rate: number;
  diagnosis_compliance_rate: number;
}): TrustAssessment {
  const { consecutive_successes, confidence_gate_pass_rate, diagnosis_compliance_rate } = input;

  if (consecutive_successes >= 5 && confidence_gate_pass_rate >= 0.9 && diagnosis_compliance_rate >= 0.9) {
    return {
      level: 'T3',
      consecutive_high_quality: consecutive_successes,
      can_skip_confirmation: true,
      can_auto_switch_role: true,
      message: 'T3 首席信任：持续高质量，可自动切换角色，减少确认步骤。',
    };
  }

  if (consecutive_successes >= 3 && confidence_gate_pass_rate >= 0.7) {
    return {
      level: 'T2',
      consecutive_high_quality: consecutive_successes,
      can_skip_confirmation: false,
      can_auto_switch_role: true,
      message: 'T2 进阶信任：可自动推荐角色，交付仍需信心门控。',
    };
  }

  return {
    level: 'T1',
    consecutive_high_quality: consecutive_successes,
    can_skip_confirmation: false,
    can_auto_switch_role: false,
    message: 'T1 基础信任：每次激活需确认，严格执行诊断先行和信心门控。',
  };
}

// ============================================================================
// Quality Compass（5 问自检）
// ============================================================================

export const QUALITY_COMPASS_QUESTIONS = [
  { id: 'intent', question: '我理解的任务 intent 是什么？与用户原话一致吗？' },
  { id: 'evidence', question: '我有哪些硬证据（非感觉）支撑当前结论？' },
  { id: 'alternatives', question: '我是否考虑过至少 2 个本质不同的方案？' },
  { id: 'verification', question: '我运行的验证命令覆盖了哪些 acceptance 项？' },
  { id: 'residual_risk', question: '还有哪些已知风险未修复？是否已披露？' },
] as const;

export interface QualityCompassResult {
  passed: boolean;
  answered: number;
  total: number;
  gaps: string[];
  recommendation: string;
}

export function runQualityCompass(answers: Record<string, string>): QualityCompassResult {
  const gaps: string[] = [];

  for (const q of QUALITY_COMPASS_QUESTIONS) {
    const answer = answers[q.id]?.trim();
    if (!answer || answer.length < 10) {
      gaps.push(q.question);
    }
  }

  const answered = QUALITY_COMPASS_QUESTIONS.length - gaps.length;
  const passed = gaps.length === 0;

  return {
    passed,
    answered,
    total: QUALITY_COMPASS_QUESTIONS.length,
    gaps,
    recommendation: passed
      ? 'Quality Compass 通过，可进入信心门控。'
      : `请先回答：${gaps[0]}`,
  };
}

// ============================================================================
// Recovery Protocol（L1 前自救窗口）
// ============================================================================

export interface RecoveryProtocol {
  active: boolean;
  remaining_attempts: number;
  checklist: string[];
  message: string;
}

export function getRecoveryProtocol(failureCount: number, pressureLevel: number): RecoveryProtocol {
  const inRecoveryWindow = failureCount === 1 && pressureLevel === 0;

  return {
    active: inRecoveryWindow,
    remaining_attempts: inRecoveryWindow ? 1 : 0,
    checklist: [
      '逐字读错误信息（不是扫一眼）',
      '用搜索工具查报错原文',
      '检查最简单的假设（路径/版本/权限）',
      '换一个本质不同的思路再试一次',
    ],
    message: inRecoveryWindow
      ? '[Recovery Protocol] 首次失败自救窗口：在升级到 L1 前，按清单自救一次。'
      : '自救窗口已关闭，压力系统接管。',
  };
}

// ============================================================================
// Calibration（must / should / could）
// ============================================================================

export type CalibrationLevel = 'must' | 'should' | 'could';

export interface CalibratedItem {
  item: string;
  level: CalibrationLevel;
}

export function calibrateRequirements(items: Array<{ item: string; level?: CalibrationLevel }>): {
  must: string[];
  should: string[];
  could: string[];
  delivery_blockers: string[];
} {
  const must: string[] = [];
  const should: string[] = [];
  const could: string[] = [];

  for (const { item, level = 'should' } of items) {
    if (level === 'must') must.push(item);
    else if (level === 'could') could.push(item);
    else should.push(item);
  }

  return {
    must,
    should,
    could,
    delivery_blockers: must,
  };
}
