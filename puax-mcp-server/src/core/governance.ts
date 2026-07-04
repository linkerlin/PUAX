/**
 * PUAX 防作弊治理
 * v3.4: Task Contract + 独立验证闸门（权责分离）
 */

// ============================================================================
// Task Contract
// ============================================================================

export interface TaskContract {
  feature_id: string;
  intent: string;
  acceptance: string[];
  forbidden: string[];
  verify_commands: string[];
  agent_proposed_status: 'pending' | 'candidate_pass' | 'blocked';
  verifier_status: 'pending' | 'pass' | 'fail';
  created_at: string;
}

export interface DefineContractInput {
  feature_id: string;
  intent: string;
  acceptance: string[];
  forbidden?: string[];
  verify_commands: string[];
}

export interface VerifyCompletionInput {
  contract: TaskContract;
  evidence: Array<{
    command: string;
    exit_code: number;
    output_summary: string;
    passed: boolean;
  }>;
  agent_claims_complete: boolean;
  files_changed?: string[];
}

export interface VerifyCompletionResult {
  verifier_status: 'pass' | 'fail' | 'pending';
  agent_proposed_status: 'candidate_pass' | 'blocked';
  passed_acceptance: string[];
  failed_acceptance: string[];
  forbidden_violations: string[];
  governance_violations: string[];
  recommendation: string;
  can_mark_complete: boolean;
}

const GRADER_GAMING_PATTERNS = [
  /test[s]?\//i, /\.spec\./i, /\.test\./i,
  /eval[s]?\//i, /scor(ing|er)/i, /verifier/i,
  /\.github\/workflows/i, /ci\//i,
  /coverage/i, /jest\.config/i,
];

const FORBIDDEN_SELF_VERIFY_PHRASES = [
  /我认为完成/i, /应该没问题/i, /大概可以/i,
  /i think it('s| is) (done|complete|working)/i,
];

// ============================================================================
// 治理逻辑
// ============================================================================

export function defineContract(input: DefineContractInput): TaskContract {
  if (!input.intent?.trim()) {
    throw new Error('intent 不能为空');
  }
  if (!input.acceptance?.length) {
    throw new Error('acceptance 至少一项');
  }
  if (!input.verify_commands?.length) {
    throw new Error('verify_commands 至少一项');
  }

  return {
    feature_id: input.feature_id,
    intent: input.intent.trim(),
    acceptance: input.acceptance.map(a => a.trim()).filter(Boolean),
    forbidden: (input.forbidden || []).map(f => f.trim()).filter(Boolean),
    verify_commands: input.verify_commands.map(c => c.trim()).filter(Boolean),
    agent_proposed_status: 'pending',
    verifier_status: 'pending',
    created_at: new Date().toISOString(),
  };
}

export function verifyCompletion(input: VerifyCompletionInput): VerifyCompletionResult {
  const violations: string[] = [];
  const governanceViolations: string[] = [];
  const { contract, evidence, agent_claims_complete, files_changed } = input;

  // 防作弊：检测是否修改了评分资产
  if (files_changed?.length) {
    for (const file of files_changed) {
      if (GRADER_GAMING_PATTERNS.some(p => p.test(file))) {
        governanceViolations.push(`疑似修改评分资产: ${file}`);
      }
    }
  }

  // 证据必须覆盖 verify_commands
  const evidenceCommands = new Set(evidence.map(e => e.command));
  const missingCommands = contract.verify_commands.filter(c => !evidenceCommands.has(c));
  if (missingCommands.length > 0) {
    violations.push(`未运行验证命令: ${missingCommands.join(', ')}`);
  }

  const failedEvidence = evidence.filter(e => !e.passed || e.exit_code !== 0);
  if (failedEvidence.length > 0) {
    violations.push(`验证失败: ${failedEvidence.map(e => e.command).join(', ')}`);
  }

  if (agent_claims_complete && evidence.length === 0) {
    governanceViolations.push('自报完成但未附运行证据（Solution contamination / Self-report cheating）');
  }

  // acceptance 逐项检查（基于证据摘要关键词粗匹配）
  const passedAcceptance: string[] = [];
  const failedAcceptance: string[] = [];
  const allOutput = evidence.map(e => e.output_summary).join('\n').toLowerCase();

  for (const item of contract.acceptance) {
    const keywords = item.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matched = keywords.length === 0 || keywords.some(k => allOutput.includes(k));
    if (matched && failedEvidence.length === 0) {
      passedAcceptance.push(item);
    } else {
      failedAcceptance.push(item);
    }
  }

  const forbiddenViolations: string[] = [];
  if (files_changed?.length && contract.forbidden.length > 0) {
    const changedLower = files_changed.join(' ').toLowerCase();
    for (const f of contract.forbidden) {
      if (changedLower.includes(f.toLowerCase().slice(0, 20))) {
        forbiddenViolations.push(f);
      }
    }
  }

  const hasBlocking = violations.length > 0
    || governanceViolations.length > 0
    || failedAcceptance.length > 0
    || forbiddenViolations.length > 0;

  const verifierStatus: VerifyCompletionResult['verifier_status'] = hasBlocking ? 'fail' : 'pass';
  const agentStatus: VerifyCompletionResult['agent_proposed_status'] =
    agent_claims_complete && !hasBlocking ? 'candidate_pass' : 'blocked';

  let recommendation: string;
  if (governanceViolations.length > 0) {
    recommendation = '治理违规：行动权与评分权混同。Agent 不能通过修改测试/CI/verifier 来制造通过。';
  } else if (violations.length > 0) {
    recommendation = `验证未通过：${violations.join('；')}`;
  } else if (failedAcceptance.length > 0) {
    recommendation = `验收项未满足：${failedAcceptance.join('；')}`;
  } else {
    recommendation = '独立验证通过。verifier_status=pass，可标记完成。';
  }

  return {
    verifier_status: verifierStatus,
    agent_proposed_status: agentStatus,
    passed_acceptance: passedAcceptance,
    failed_acceptance: failedAcceptance,
    forbidden_violations: forbiddenViolations,
    governance_violations: governanceViolations,
    recommendation,
    can_mark_complete: verifierStatus === 'pass' && agent_claims_complete,
  };
}

export const GOVERNANCE_PRINCIPLES = [
  '行动权：Agent 执行实现，不能改评分规则',
  '自我评价权：Agent 只能提出 candidate_pass，不能写 verifier_status=pass',
  '评分权：puax_verify_completion 独立验证，非 Agent 自评',
  '环境修改权：改 tests/CI/verifier 需人工审批',
];
