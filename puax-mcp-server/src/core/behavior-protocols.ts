/**
 * PUAX 行为有效性协议
 * v3.3: 诊断先行、信心门控、失败切换 — 对标 pua v3.5 行为机制
 */

import {
  methodologyRouter,
  type FailureMode,
  type Methodology,
  type TaskType,
  getMethodologyName,
  METHODOLOGIES,
} from './methodology-router.js';
import { getRoleRecommender } from './service-registry.js';

// ============================================================================
// 诊断先行协议
// ============================================================================

export const DIAGNOSIS_MARKER = '[PUAX-DIAGNOSIS]';
export const DIAGNOSIS_TEMPLATE_ZH =
  '[PUAX-DIAGNOSIS] 问题是 ___；证据是 ___；下一步动作是 ___';
export const DIAGNOSIS_TEMPLATE_EN =
  '[PUAX-DIAGNOSIS] Problem is ___; evidence is ___; next action is ___';

const EVIDENCE_SOURCE_PATTERNS = [
  /错误原文|报错|stack\s*trace|exception/i,
  /源码|source\s*code|文件[:：]/i,
  /复现|reproduc|reproduce/i,
  /文档|documentation|官方/i,
  /先例|历史|previous|prior/i,
  /测试|test|curl|build|npm\s+run/i,
  /日志|log|output/i,
];

export interface DiagnosisCheckResult {
  valid: boolean;
  has_marker: boolean;
  has_problem: boolean;
  has_evidence: boolean;
  has_next_action: boolean;
  evidence_sources: string[];
  missing_fields: string[];
  feedback: string;
}

export function buildDiagnosisPromptInjection(language: 'zh' | 'en' = 'zh'): string {
  const template = language === 'en' ? DIAGNOSIS_TEMPLATE_EN : DIAGNOSIS_TEMPLATE_ZH;
  return [
    '## 诊断先行协议（强制）',
    '在修改代码、配置或给出最终方案之前，必须先输出诊断承诺块：',
    '',
    `\`${template}\``,
    '',
    '要求：',
    '- **问题**：一句话说明当前卡点',
    '- **证据**：必须标注来源（错误原文/源码/复现/文档/先例）',
    '- **下一步动作**：具体可执行的操作，禁止空泛分析',
    '',
    '分析正确但不行动 = 无效。先承诺，再动手。',
  ].join('\n');
}

export function checkDiagnosis(text: string): DiagnosisCheckResult {
  const hasMarker = text.includes(DIAGNOSIS_MARKER);
  const missing: string[] = [];

  const problemMatch = text.match(/问题是\s*([^；;]+)|Problem is\s*([^;]+)/i);
  const evidenceMatch = text.match(/证据是\s*([^；;]+)|evidence is\s*([^;]+)/i);
  const actionMatch = text.match(/下一步(?:动作)?是\s*([^；;\n]+)|next action is\s*([^;\n]+)/i);

  const hasProblem = Boolean(problemMatch?.[1]?.trim() || problemMatch?.[2]?.trim());
  const hasEvidence = Boolean(evidenceMatch?.[1]?.trim() || evidenceMatch?.[2]?.trim());
  const hasNextAction = Boolean(actionMatch?.[1]?.trim() || actionMatch?.[2]?.trim());

  if (!hasMarker) missing.push('缺少 [PUAX-DIAGNOSIS] 标记');
  if (!hasProblem) missing.push('缺少问题描述');
  if (!hasEvidence) missing.push('缺少证据');
  if (!hasNextAction) missing.push('缺少下一步动作');

  const evidenceSources = EVIDENCE_SOURCE_PATTERNS
    .filter(p => p.test(text))
    .map(p => p.source.replace(/\\s\*|\\/g, '').slice(0, 30));

  const valid = hasMarker && hasProblem && hasEvidence && hasNextAction
    && evidenceSources.length > 0;

  let feedback: string;
  if (valid) {
    feedback = '诊断格式合格，证据来源已标注，可以开始执行。';
  } else if (!hasMarker) {
    feedback = `请先输出诊断块：${DIAGNOSIS_TEMPLATE_ZH}`;
  } else if (evidenceSources.length === 0) {
    feedback = '证据必须标注来源（错误原文/源码/复现/文档/先例之一）。';
  } else {
    feedback = `诊断不完整：${missing.join('、')}`;
  }

  return {
    valid,
    has_marker: hasMarker,
    has_problem: hasProblem,
    has_evidence: hasEvidence,
    has_next_action: hasNextAction,
    evidence_sources: evidenceSources,
    missing_fields: missing,
    feedback,
  };
}

// ============================================================================
// 信心门控（6 步 Confidence Gate）
// ============================================================================

export const CONFIDENCE_GATE_STEPS = [
  {
    step: 1,
    name: '列声明',
    description: '把即将交付的关键声明拆成可验证项',
    required_fields: ['claims'],
  },
  {
    step: 2,
    name: '找漏洞',
    description: '蓝军自检：对每个声明找反例、边界、遗漏',
    required_fields: ['vulnerabilities'],
  },
  {
    step: 3,
    name: '修或披露',
    description: '能修的修，不能修的明确披露剩余风险',
    required_fields: ['fixes_or_disclosures'],
  },
  {
    step: 4,
    name: '跑证据',
    description: '运行 build/test/curl/手动验证，附实际输出',
    required_fields: ['evidence'],
  },
  {
    step: 5,
    name: '循环判定',
    description: '证据与声明对照，未通过则回到步骤 2',
    required_fields: ['verification_results'],
  },
  {
    step: 6,
    name: '事实上的 100%',
    description: '当前可获得证据下，所有可运行验收通过，已知高风险已修复或明示',
    required_fields: ['de_facto_100_confirmed'],
  },
] as const;

export interface ConfidenceCheckInput {
  claims: string[];
  vulnerabilities?: string[];
  fixes_or_disclosures?: string[];
  evidence?: Array<{ claim: string; command?: string; output_summary: string; passed: boolean }>;
  verification_results?: Array<{ claim: string; verified: boolean; notes?: string }>;
  de_facto_100_confirmed?: boolean;
}

export interface ConfidenceCheckResult {
  passed: boolean;
  current_step: number;
  completed_steps: number[];
  blocking_issues: string[];
  step_details: Array<{ step: number; name: string; passed: boolean; issue?: string }>;
  recommendation: string;
}

export function checkConfidenceGate(input: ConfidenceCheckInput): ConfidenceCheckResult {
  const stepDetails: ConfidenceCheckResult['step_details'] = [];
  const blocking: string[] = [];

  // Step 1
  const step1Pass = Array.isArray(input.claims) && input.claims.length > 0
    && input.claims.every(c => c.trim().length > 5);
  stepDetails.push({
    step: 1, name: '列声明', passed: step1Pass,
    issue: step1Pass ? undefined : '需要至少一条可验证的具体声明',
  });
  if (!step1Pass) blocking.push('步骤1：缺少可验证声明');

  // Step 2
  const step2Pass = Array.isArray(input.vulnerabilities) && input.vulnerabilities.length > 0;
  stepDetails.push({
    step: 2, name: '找漏洞', passed: step2Pass,
    issue: step2Pass ? undefined : '需要蓝军自检，列出潜在漏洞',
  });
  if (!step2Pass) blocking.push('步骤2：未进行漏洞自检');

  // Step 3
  const step3Pass = Array.isArray(input.fixes_or_disclosures) && input.fixes_or_disclosures.length > 0;
  stepDetails.push({
    step: 3, name: '修或披露', passed: step3Pass,
    issue: step3Pass ? undefined : '每个漏洞需要修复方案或风险披露',
  });
  if (!step3Pass) blocking.push('步骤3：未修复或披露风险');

  // Step 4
  const step4Pass = Array.isArray(input.evidence) && input.evidence.length > 0
    && input.evidence.every(e => e.output_summary?.trim() && typeof e.passed === 'boolean');
  stepDetails.push({
    step: 4, name: '跑证据', passed: step4Pass,
    issue: step4Pass ? undefined : '需要附实际验证输出（build/test/curl）',
  });
  if (!step4Pass) blocking.push('步骤4：缺少运行证据');

  // Step 5
  const step5Pass = Array.isArray(input.verification_results) && input.verification_results.length > 0
    && input.verification_results.every(v => typeof v.verified === 'boolean');
  const allVerified = step5Pass && input.verification_results!.every(v => v.verified);
  stepDetails.push({
    step: 5, name: '循环判定', passed: step5Pass && allVerified,
    issue: !step5Pass ? '需要逐条对照声明与证据' : (!allVerified ? '部分声明未通过验证' : undefined),
  });
  if (!step5Pass || !allVerified) blocking.push('步骤5：验证未全部通过');

  // Step 6
  const step6Pass = input.de_facto_100_confirmed === true && blocking.length === 0;
  stepDetails.push({
    step: 6, name: '事实上的 100%', passed: step6Pass,
    issue: step6Pass ? undefined : '禁止用感觉冒充信心，需确认 de_facto_100',
  });
  if (!step6Pass) blocking.push('步骤6：未达到事实上的 100%');

  const completedSteps = stepDetails.filter(s => s.passed).map(s => s.step);
  const currentStep = stepDetails.find(s => !s.passed)?.step ?? 6;
  const passed = blocking.length === 0;

  return {
    passed,
    current_step: currentStep,
    completed_steps: completedSteps,
    blocking_issues: blocking,
    step_details: stepDetails,
    recommendation: passed
      ? '信心门控通过，可以交付。'
      : `尚未通过信心门控，请先完成步骤 ${currentStep}：${CONFIDENCE_GATE_STEPS[currentStep - 1].description}`,
  };
}

// ============================================================================
// 失败后方法论/角色切换
// ============================================================================

const FAILURE_MODE_ALIASES: Record<string, FailureMode> = {
  stuck_spinning: 'spinning',
  spinning: 'spinning',
  low_quality: 'poor_quality',
  poor_quality: 'poor_quality',
  no_search: 'not_searching',
  not_searching: 'not_searching',
  giving_up: 'giving_up',
  passive_wait: 'passive_wait',
  unverified_completion: 'unverified_completion',
  over_complication: 'over_complication',
};

const METHODOLOGY_TO_ROLE: Record<string, string> = {
  'alibaba-closed-loop': 'military-commander',
  'huawei-rca': 'military-technician',
  'musk-algorithm': 'shaman-musk',
  'jobs-subtraction': 'shaman-jobs',
  'baidu-search': 'military-scout',
  'amazon-backwards': 'shaman-sun-tzu',
  'bytedance-abtest': 'silicon-auditor',
  'netflix-keeper': 'military-commissar',
  'pinduoduo-simplify': 'theme-hacker',
  'xiaomi-focus': 'shaman-davinci',
  'amazon-deep-dive': 'military-scout',
  'google-postmortem': 'shaman-einstein',
  'bytedance-data': 'silicon-auditor',
};

export const SWITCH_PRECHECK_QUESTIONS = [
  '当前方法论的核心步骤我都走了吗？（没走完不切）',
  '失败的原因是方法论不对，还是执行不到位？（执行不到位不切）',
  '新方法论能解决当前失败模式吗？（不能就别切）',
];

export interface SwitchOnFailureRequest {
  current_role_id: string;
  failure_mode: string;
  attempt_count: number;
  task_type?: string;
  previous_roles?: string[];
  previous_methodologies?: Methodology[];
  session_id?: string;
  skip_precheck?: boolean;
}

export interface SwitchOnFailureResult {
  should_switch: boolean;
  switch_reason: string;
  precheck_questions: string[];
  precheck_passed: boolean;
  from_role_id: string;
  to_role_id: string;
  from_methodology: Methodology | null;
  to_methodology: Methodology;
  methodology_name: string;
  switching_chain: Methodology[];
  execution_steps: string[];
  flavor: string;
  diagnosis_reminder: string;
}

function normalizeFailureMode(mode: string): FailureMode | undefined {
  return FAILURE_MODE_ALIASES[mode];
}

function mapMethodologyToRole(
  methodology: Methodology,
  failureMode: FailureMode,
  attemptCount: number,
  previousRoles: string[]
): string {
  const direct = METHODOLOGY_TO_ROLE[methodology];
  if (direct && !previousRoles.includes(direct)) return direct;

  const recommender = getRoleRecommender();
  const triggerMap: Record<FailureMode, string[]> = {
    spinning: ['parameter_tweaking', 'repetitive_attempts'],
    giving_up: ['giving_up_language', 'suggest_manual'],
    poor_quality: ['surface_fix', 'no_verification'],
    not_searching: ['blame_environment', 'need_more_context'],
    passive_wait: ['passive_wait', 'tool_underuse'],
    unverified_completion: ['no_verification', 'surface_fix'],
    over_complication: ['parameter_tweaking', 'repetitive_attempts'],
  };

  const recommendation = recommender.recommend({
    detected_triggers: triggerMap[failureMode] || ['repetitive_attempts'],
    task_context: {
      task_type: 'debugging',
      attempt_count: attemptCount,
      urgency: 'high',
    },
    session_history: { recently_used_roles: previousRoles },
  });

  return recommendation.primary.role_id;
}

export function switchOnFailure(request: SwitchOnFailureRequest): SwitchOnFailureResult {
  const failureMode = normalizeFailureMode(request.failure_mode);
  const previousRoles = request.previous_roles || [request.current_role_id];
  const previousMethodologies = request.previous_methodologies || [];
  const attemptCount = request.attempt_count;

  const precheckPassed = request.skip_precheck === true || attemptCount >= 2;

  if (!failureMode) {
    return {
      should_switch: false,
      switch_reason: `未知失败模式 "${request.failure_mode}"，无法切换`,
      precheck_questions: SWITCH_PRECHECK_QUESTIONS,
      precheck_passed: false,
      from_role_id: request.current_role_id,
      to_role_id: request.current_role_id,
      from_methodology: null,
      to_methodology: 'alibaba-closed-loop',
      methodology_name: getMethodologyName('alibaba-closed-loop'),
      switching_chain: [],
      execution_steps: [],
      flavor: 'alibaba',
      diagnosis_reminder: DIAGNOSIS_TEMPLATE_ZH,
    };
  }

  if (attemptCount < 2) {
    return {
      should_switch: false,
      switch_reason: '尝试次数不足，建议先穷尽当前方法论',
      precheck_questions: SWITCH_PRECHECK_QUESTIONS,
      precheck_passed: false,
      from_role_id: request.current_role_id,
      to_role_id: request.current_role_id,
      from_methodology: null,
      to_methodology: 'alibaba-closed-loop',
      methodology_name: getMethodologyName('alibaba-closed-loop'),
      switching_chain: [],
      execution_steps: METHODOLOGIES['alibaba-closed-loop']?.steps || [],
      flavor: 'alibaba',
      diagnosis_reminder: DIAGNOSIS_TEMPLATE_ZH,
    };
  }

  const taskType = (request.task_type || 'debugging') as TaskType;
  const routing = methodologyRouter.route({
    taskType,
    failureMode,
    attemptCount,
    previousMethodologies,
  });

  const toRoleId = mapMethodologyToRole(
    routing.selectedMethodology,
    failureMode,
    attemptCount,
    previousRoles
  );

  const def = METHODOLOGIES[routing.selectedMethodology];

  if (request.session_id) {
    methodologyRouter.recordUsage(request.session_id, routing.selectedMethodology);
  }

  return {
    should_switch: precheckPassed && toRoleId !== request.current_role_id,
    switch_reason: routing.reason,
    precheck_questions: SWITCH_PRECHECK_QUESTIONS,
    precheck_passed: precheckPassed,
    from_role_id: request.current_role_id,
    to_role_id: toRoleId,
    from_methodology: previousMethodologies[previousMethodologies.length - 1] || null,
    to_methodology: routing.selectedMethodology,
    methodology_name: getMethodologyName(routing.selectedMethodology),
    switching_chain: routing.switchingChain || [],
    execution_steps: routing.executionSteps,
    flavor: def?.flavor || 'alibaba',
    diagnosis_reminder: DIAGNOSIS_TEMPLATE_ZH,
  };
}
