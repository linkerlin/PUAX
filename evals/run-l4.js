#!/usr/bin/env node
/**
 * PUAX L4 行为对照评测
 *
 * 用法:
 *   node evals/run-l4.js list
 *   node evals/run-l4.js scaffold <scenario-id> [--variant=with_puax|without_puax]
 *   node evals/run-l4.js run <scenario-id> [--variant=both|with_puax|without_puax] [--dry-run]
 *   node evals/run-l4.js run-all [--dry-run] [--delay-ms=2000]
 *   node evals/run-l4.js validate <result.json>
 *   node evals/run-l4.js compare <without.json> <with.json>
 *   node evals/run-l4.js report [results-dir]
 *
 * 环境变量（勿写入代码/文档）:
 *   DEEPSEEK_API_KEY, DEEPSEEK_MODEL, DEEPSEEK_BASE_URL
 */
const { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs');
const { join, basename } = require('path');
const { METRIC_KEYS } = require('./lib/response-analyzer.js');
const { executeScenarioRun, RESULTS_DIR } = require('./lib/l4-executor.js');
const { loadL4Config } = require('./lib/config.js');
const { buildScorecard, printScorecard, writeScorecard } = require('./lib/l4-scorecard.js');

const SCENARIOS_DIR = join(__dirname, 'scenarios');
const VARIANTS = ['with_puax', 'without_puax'];

function loadScenarios() {
  return readdirSync(SCENARIOS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(readFileSync(join(SCENARIOS_DIR, f), 'utf-8')));
}

function loadScenario(id) {
  const scenario = loadScenarios().find(s => s.id === id);
  if (!scenario) throw new Error(`未知场景: ${id}`);
  return scenario;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function cmdList() {
  const scenarios = loadScenarios();
  const cfg = loadL4Config();
  console.log(`=== L4 场景 (${scenarios.length}) ===\n`);
  for (const s of scenarios) {
    console.log(`  ${s.id}`);
    console.log(`    ${s.name}: ${s.description}`);
  }
  console.log(`\nDeepSeek: ${cfg.baseUrl} | model=${cfg.model || '<未设置 DEEPSEEK_MODEL>'} | key=${cfg.hasApiKey ? '已配置' : '未配置'}`);
  console.log('\n自动实测:');
  console.log('  node evals/run-l4.js run api-connection-error --variant=both');
  console.log('  node evals/run-l4.js run-all');
}

function cmdScaffold(scenarioId, variant = 'with_puax') {
  if (!VARIANTS.includes(variant)) {
    throw new Error(`variant 须为 ${VARIANTS.join(' | ')}`);
  }
  const scenario = loadScenario(scenarioId);
  const template = {
    scenario_id: scenario.id,
    scenario_name: scenario.name,
    variant,
    recorded_at: new Date().toISOString(),
    task_prompt: scenario.task_prompt,
    metrics: Object.fromEntries(METRIC_KEYS.map(k => [k, 0])),
    behavior_flags: Object.fromEntries(
      Object.keys(scenario.expected_with_puax || {}).map(k => [k, false])
    ),
    notes: '',
    session_ref: '',
  };

  mkdirSync(RESULTS_DIR, { recursive: true });
  const outPath = join(RESULTS_DIR, `${scenarioId}-${variant}.json`);
  writeFileSync(outPath, JSON.stringify(template, null, 2), 'utf-8');
  console.log(`✅ 已生成记录模板: ${outPath}`);
}

async function cmdRun(scenarioId, options) {
  const { variant = 'both', dryRun = false } = options;
  const scenario = loadScenario(scenarioId);
  const variants =
    variant === 'both' ? ['without_puax', 'with_puax'] : [variant];

  for (const v of variants) {
    console.log(`\n▶ ${scenarioId} (${v})${dryRun ? ' [dry-run]' : ''}...`);
    const result = await executeScenarioRun({ scenario, variant: v, dryRun });
    if (dryRun) {
      console.log(`  system: ${result.system_prompt_chars} chars | user: ${result.user_message_chars} chars`);
    } else {
      console.log(`  ✅ ${result.output_path}`);
      console.log(`  metrics: ${JSON.stringify(result.metrics)}`);
      const { errors } = validateResult(result, scenario);
      if (v === 'with_puax' && errors.length) {
        console.log(`  ⚠️  behavior: ${errors.join('; ')}`);
      }
    }
  }
}

async function cmdRunAll(options) {
  const { dryRun = false, delayMs = 2000, skipComplete = false } = options;
  const scenarios = loadScenarios();
  console.log(`=== L4 Run-All (${scenarios.length} 场景) ===\n`);

  const scorecardBefore = skipComplete ? buildScorecard(scenarios, RESULTS_DIR) : null;
  const completeIds = new Set(
    (scorecardBefore?.pairs || []).filter(p => p.complete).map(p => p.scenario_id)
  );

  for (let i = 0; i < scenarios.length; i++) {
    const id = scenarios[i].id;
    if (skipComplete && completeIds.has(id)) {
      console.log(`⏭️  跳过 ${id}（已有完整对照）`);
      continue;
    }
    await cmdRun(id, { variant: 'both', dryRun });
    if (!dryRun && i < scenarios.length - 1) {
      await sleep(delayMs);
    }
  }

  if (!dryRun) {
    cmdReport(RESULTS_DIR);
    const scorecard = buildScorecard(scenarios, RESULTS_DIR);
    const out = writeScorecard(scorecard, RESULTS_DIR);
    printScorecard(scorecard);
    console.log(`Scorecard: ${out}`);
  }
}

function validateResult(data, scenario) {
  const errors = [];
  const warnings = [];

  if (!data.scenario_id) errors.push('缺少 scenario_id');
  if (!data.variant || !VARIANTS.includes(data.variant)) {
    errors.push(`variant 须为 ${VARIANTS.join(' | ')}`);
  }
  if (!data.metrics || typeof data.metrics !== 'object') {
    errors.push('缺少 metrics 对象');
  } else {
    for (const key of METRIC_KEYS) {
      if (!(key in data.metrics)) warnings.push(`metrics 缺少 ${key}`);
      else if (typeof data.metrics[key] !== 'number') errors.push(`metrics.${key} 须为数字`);
    }
  }

  if (scenario && data.scenario_id !== scenario.id) {
    errors.push(`scenario_id 与场景文件不一致`);
  }

  if (data.variant === 'with_puax' && scenario?.expected_with_puax) {
    const flags = data.behavior_flags || {};
    for (const [key, expected] of Object.entries(scenario.expected_with_puax)) {
      if (typeof expected === 'boolean' && flags[key] !== expected) {
        errors.push(`behavior_flags.${key} 期望 ${expected}，实际 ${flags[key]}`);
      }
    }
  }

  return { errors, warnings };
}

function cmdValidate(resultPath) {
  const abs = resultPath.startsWith('/') || /^[A-Za-z]:/.test(resultPath)
    ? resultPath
    : join(process.cwd(), resultPath);
  if (!existsSync(abs)) throw new Error(`文件不存在: ${abs}`);

  const data = JSON.parse(readFileSync(abs, 'utf-8'));
  const scenario = loadScenario(data.scenario_id);
  const { errors, warnings } = validateResult(data, scenario);

  console.log(`=== L4 Validate: ${basename(abs)} ===\n`);
  if (warnings.length) {
    console.log(`⚠️  警告 (${warnings.length}):`);
    warnings.forEach(w => console.log(`  • ${w}`));
    console.log('');
  }
  if (errors.length) {
    console.log(`❌ 错误 (${errors.length}):`);
    errors.forEach(e => console.log(`  • ${e}`));
    process.exit(1);
  }
  console.log('✅ 记录校验通过');
}

function cmdCompare(withoutPath, withPath) {
  const load = p => JSON.parse(readFileSync(
    existsSync(p) ? p : join(process.cwd(), p),
    'utf-8'
  ));
  const without = load(withoutPath);
  const withPuax = load(withPath);

  if (without.scenario_id !== withPuax.scenario_id) {
    throw new Error('两份记录的 scenario_id 不一致');
  }

  const scenario = loadScenario(without.scenario_id);
  console.log(`=== L4 Compare: ${scenario.name} ===\n`);

  console.log('| metric | without | with_puax | delta |');
  console.log('|--------|---------|-----------|-------|');
  for (const key of METRIC_KEYS) {
    const a = without.metrics?.[key] ?? 0;
    const b = withPuax.metrics?.[key] ?? 0;
    const delta = b - a;
    console.log(`| ${key} | ${a} | ${b} | ${delta >= 0 ? '+' : ''}${delta} |`);
  }

  const flagKeys = Object.keys(scenario.expected_with_puax || {});
  if (flagKeys.length) {
    console.log('\n行为标志 (with_puax):');
    for (const key of flagKeys) {
      const actual = withPuax.behavior_flags?.[key];
      const expected = scenario.expected_with_puax[key];
      console.log(`  ${actual === expected ? '✅' : '❌'} ${key}: ${actual} (期望 ${expected})`);
    }
  }
}

function cmdScorecard(resultsDir = RESULTS_DIR) {
  const scenarios = loadScenarios();
  const scorecard = buildScorecard(scenarios, resultsDir);
  printScorecard(scorecard);
  const out = writeScorecard(scorecard, resultsDir);
  console.log(`已写入: ${out}`);
}

function cmdReport(resultsDir = RESULTS_DIR) {
  if (!existsSync(resultsDir)) {
    console.log('尚无 L4 记录。');
    return;
  }

  const files = readdirSync(resultsDir).filter(f => f.endsWith('.json') && f !== 'scorecard.json');
  console.log(`\n=== L4 Report (${files.length} records) ===\n`);

  const byScenario = new Map();
  for (const file of files) {
    const data = JSON.parse(readFileSync(join(resultsDir, file), 'utf-8'));
    if (!byScenario.has(data.scenario_id)) byScenario.set(data.scenario_id, {});
    byScenario.get(data.scenario_id)[data.variant] = data;
  }

  for (const [scenarioId, variants] of byScenario) {
    console.log(`## ${scenarioId}`);
    if (variants.without_puax && variants.with_puax) {
      const w = variants.without_puax.metrics || {};
      const p = variants.with_puax.metrics || {};
      console.log(`  fixes: ${w.fixes ?? 0} → ${p.fixes ?? 0} (Δ${(p.fixes ?? 0) - (w.fixes ?? 0)})`);
      console.log(`  verifications: ${w.verifications ?? 0} → ${p.verifications ?? 0}`);
    } else {
      console.log('  缺少完整对照');
    }
    console.log('');
  }
}

function parseRunOptions(rest) {
  const variantArg = rest.find(a => a.startsWith('--variant='));
  const variant = variantArg ? variantArg.split('=')[1] : 'both';
  const dryRun = rest.includes('--dry-run');
  const delayArg = rest.find(a => a.startsWith('--delay-ms='));
  const delayMs = delayArg ? Number(delayArg.split('=')[1]) : 2000;
  const skipComplete = rest.includes('--skip-complete');
  return { variant, dryRun, delayMs, skipComplete };
}

async function main() {
  const [, , cmd, ...rest] = process.argv;

  switch (cmd) {
    case 'list':
      cmdList();
      break;
    case 'scaffold': {
      const scenarioId = rest[0];
      if (!scenarioId) throw new Error('用法: run-l4.js scaffold <scenario-id>');
      const variantArg = rest.find(a => a.startsWith('--variant='));
      cmdScaffold(scenarioId, variantArg ? variantArg.split('=')[1] : 'with_puax');
      break;
    }
    case 'run': {
      const scenarioId = rest[0];
      if (!scenarioId) throw new Error('用法: run-l4.js run <scenario-id> [--variant=both] [--dry-run]');
      await cmdRun(scenarioId, parseRunOptions(rest.slice(1)));
      break;
    }
    case 'run-all':
      await cmdRunAll(parseRunOptions(rest));
      break;
    case 'validate':
      cmdValidate(rest[0]);
      break;
    case 'compare':
      cmdCompare(rest[0], rest[1]);
      break;
    case 'report':
      cmdReport(rest[0]);
      break;
    case 'scorecard':
      cmdScorecard(rest[0]);
      break;
    default:
      console.log(`PUAX L4 行为对照评测

命令:
  list
  scaffold <id> [--variant=...]
  run <id> [--variant=both|with_puax|without_puax] [--dry-run]
  run-all [--dry-run] [--delay-ms=2000] [--skip-complete]
  validate <result.json>
  compare <without.json> <with.json>
  report [results-dir]
  scorecard [results-dir]

环境变量: DEEPSEEK_API_KEY, DEEPSEEK_MODEL, DEEPSEEK_BASE_URL
详见 evals/.env.example
`);
      process.exit(cmd ? 1 : 0);
  }
}

main().catch(e => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
