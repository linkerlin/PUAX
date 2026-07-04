#!/usr/bin/env node
/**
 * L4 治理评测（无 LLM）
 * 对标 pua evals/test-agent-governance + test-integrity-guard
 */
const fs = require('fs');
const path = require('path');
const { loadCore } = require('./lib/puax-core-loader.js');

const GOV_DIR = path.join(__dirname, 'scenarios/governance');

let pass = 0;
let fail = 0;

function run(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    pass++;
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    fail++;
  }
}

function loadFixture(file) {
  return JSON.parse(fs.readFileSync(path.join(GOV_DIR, file), 'utf-8'));
}

function runContractFixture(fixture) {
  const { defineContract, verifyCompletion } = loadCore('governance');
  const contract = defineContract(fixture.contract);
  const result = verifyCompletion({
    contract,
    ...fixture.input,
  });

  if (fixture.expect.verifier_status && result.verifier_status !== fixture.expect.verifier_status) {
    throw new Error(`verifier_status 期望 ${fixture.expect.verifier_status}，得 ${result.verifier_status}`);
  }
  if (fixture.expect.can_mark_complete !== undefined
    && result.can_mark_complete !== fixture.expect.can_mark_complete) {
    throw new Error(`can_mark_complete 期望 ${fixture.expect.can_mark_complete}`);
  }
  const hasGov = result.governance_violations.length > 0;
  if (fixture.expect.has_governance_violation !== undefined
    && hasGov !== fixture.expect.has_governance_violation) {
    throw new Error(`governance_violation 期望 ${fixture.expect.has_governance_violation}，得 ${hasGov}`);
  }
}

console.log('=== PUAX Governance Eval (no LLM) ===\n');

run('治理原则已定义', () => {
  const { GOVERNANCE_PRINCIPLES } = loadCore('governance');
  if (!Array.isArray(GOVERNANCE_PRINCIPLES) || GOVERNANCE_PRINCIPLES.length < 3) {
    throw new Error('GOVERNANCE_PRINCIPLES 不完整');
  }
  const text = GOVERNANCE_PRINCIPLES.join(' ');
  if (!text.includes('评分权') || !text.includes('行动权')) {
    throw new Error('缺少权责分离条款');
  }
});

run('Task Contract 必填项校验', () => {
  const { defineContract } = loadCore('governance');
  try {
    defineContract({ feature_id: 'x', intent: '', acceptance: ['a'], verify_commands: ['npm test'] });
    throw new Error('应拒绝空 intent');
  } catch (e) {
    if (!e.message.includes('intent')) throw e;
  }
});

for (const file of ['self-report-cheating.json', 'grader-gaming.json', 'valid-completion.json']) {
  const fixture = loadFixture(file);
  run(`契约场景: ${fixture.id}`, () => runContractFixture(fixture));
}

run('诊断先行协议', () => {
  const { checkDiagnosis } = loadCore('behavior-protocols');
  const fixture = loadFixture('diagnosis-protocol.json');
  for (const c of fixture.cases) {
    const result = checkDiagnosis(c.text);
    if (result.valid !== c.expect_valid) {
      throw new Error(`${c.label}: valid 期望 ${c.expect_valid}，得 ${result.valid}`);
    }
  }
});

run('信心门控 6 步', () => {
  const { checkConfidenceGate } = loadCore('behavior-protocols');
  const fixture = loadFixture('confidence-gate.json');
  const passResult = checkConfidenceGate(fixture.pass_input);
  const failResult = checkConfidenceGate(fixture.fail_input);
  if (!passResult.passed) throw new Error('完整输入应通过信心门控');
  if (failResult.passed) throw new Error('残缺输入不应通过信心门控');
  if (failResult.completed_steps.length >= passResult.completed_steps.length) {
    throw new Error('残缺输入完成步数不应多于完整输入');
  }
});

run('权责分离：Agent 不能写 verifier_status=pass', () => {
  const { defineContract } = loadCore('governance');
  const contract = defineContract({
    feature_id: 'x',
    intent: '测试',
    acceptance: ['完成'],
    verify_commands: ['npm test'],
  });
  if (contract.verifier_status !== 'pending') {
    throw new Error('新建 contract 的 verifier_status 应为 pending');
  }
  if (contract.agent_proposed_status !== 'pending') {
    throw new Error('新建 contract 的 agent_proposed_status 应为 pending');
  }
});

console.log(`\nPassed: ${pass}, Failed: ${fail}`);
process.exit(fail > 0 ? 1 : 0);
