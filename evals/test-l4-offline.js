#!/usr/bin/env node
/**
 * L4 离线自检（无需 API Key）— 分析器 + dry-run
 */
const { readFileSync } = require('fs');
const { join } = require('path');
const { analyzeResponse } = require('./lib/response-analyzer.js');
const { executeScenarioRun } = require('./lib/l4-executor.js');

const SCENARIOS_DIR = join(__dirname, 'scenarios');

function loadScenario(id) {
  const path = join(SCENARIOS_DIR, `${id}.json`);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

let pass = 0;
let fail = 0;

function ok(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      console.log(`✅ ${name}`);
      pass++;
    })
    .catch(e => {
      console.log(`❌ ${name}: ${e.message}`);
      fail++;
    });
}

async function main() {
  console.log('=== L4 Offline Self-Test ===\n');

  await ok('analyzer 识别 PUAX 诊断块', () => {
    const scenario = loadScenario('api-connection-error');
    const sample = `[PUAX-DIAGNOSIS] 问题是服务未启动；证据是 Connection refused；下一步动作是 检查 8080 端口
先检查 docker compose 是否启动，curl localhost:8080，验证 config 中 API_URL`;
    const { behavior_flags } = analyzeResponse(sample, scenario);
    if (!behavior_flags.diagnosis_first) throw new Error('diagnosis_first 应为 true');
    if (!behavior_flags.checks_service_running) throw new Error('checks_service_running 应为 true');
  });

  await ok('dry-run 不调用 API', async () => {
    const scenario = loadScenario('yaml-parse-error');
    const result = await executeScenarioRun({ scenario, variant: 'with_puax', dryRun: true });
    if (!result.dry_run) throw new Error('应为 dry_run');
  });

  await ok('scorecard 汇总', () => {
    const { buildScorecard } = require('./lib/l4-scorecard.js');
    const scenarios = require('fs').readdirSync(SCENARIOS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => JSON.parse(require('fs').readFileSync(join(SCENARIOS_DIR, f), 'utf-8')));
    const card = buildScorecard(scenarios, join(__dirname, 'results'));
    if (!Array.isArray(card.pairs)) throw new Error('缺少 pairs');
  });

  console.log(`\nPassed: ${pass}, Failed: ${fail}`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
