/**
 * L4 实测结果汇总与 scorecard
 */

const { readdirSync, readFileSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path');

function loadResults(resultsDir) {
  if (!existsSync(resultsDir)) return [];

  return readdirSync(resultsDir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const data = JSON.parse(readFileSync(join(resultsDir, f), 'utf-8'));
      return { file: f, ...data };
    })
    .filter(r => r.scenario_id && r.variant);
}

function scoreRecord(record, scenario) {
  const expected = scenario?.expected_with_puax || {};
  const flags = record.behavior_flags || {};
  const flagResults = {};

  for (const [key, exp] of Object.entries(expected)) {
    if (typeof exp === 'boolean') {
      flagResults[key] = { expected: exp, actual: flags[key] ?? false, pass: flags[key] === exp };
    }
  }

  const flagPass = Object.values(flagResults).filter(f => f.pass).length;
  const flagTotal = Object.values(flagResults).length;

  return {
    scenario_id: record.scenario_id,
    variant: record.variant,
    flag_pass: flagPass,
    flag_total: flagTotal,
    flag_rate: flagTotal ? flagPass / flagTotal : 1,
    flags: flagResults,
    metrics: record.metrics || {},
    recorded_at: record.recorded_at,
    model: record.llm?.model,
  };
}

function buildScorecard(scenarios, resultsDir) {
  const records = loadResults(resultsDir);
  const scenarioMap = Object.fromEntries(scenarios.map(s => [s.id, s]));
  const byScenario = {};

  for (const record of records) {
    const scenario = scenarioMap[record.scenario_id];
    if (!byScenario[record.scenario_id]) {
      byScenario[record.scenario_id] = { scenario_name: scenario?.name, variants: {} };
    }
    byScenario[record.scenario_id].variants[record.variant] = scoreRecord(record, scenario);
  }

  const pairs = [];
  for (const [scenarioId, data] of Object.entries(byScenario)) {
    const w = data.variants.without_puax;
    const p = data.variants.with_puax;
    const complete = Boolean(w && p);
    let delta = null;
    if (complete) {
      delta = {
        fixes: (p.metrics.fixes ?? 0) - (w.metrics.fixes ?? 0),
        verifications: (p.metrics.verifications ?? 0) - (w.metrics.verifications ?? 0),
        tool_calls: (p.metrics.tool_calls ?? 0) - (w.metrics.tool_calls ?? 0),
        hidden_issues: (p.metrics.hidden_issues ?? 0) - (w.metrics.hidden_issues ?? 0),
      };
    }
    pairs.push({
      scenario_id: scenarioId,
      scenario_name: data.scenario_name,
      complete,
      with_puax_flags_pass: p?.flag_pass ?? 0,
      with_puax_flags_total: p?.flag_total ?? 0,
      with_puax_all_flags: p ? p.flag_rate === 1 : false,
      delta,
      variants: data.variants,
    });
  }

  const completePairs = pairs.filter(p => p.complete);
  const allFlagsPass = completePairs.filter(p => p.with_puax_all_flags).length;

  return {
    generated_at: new Date().toISOString(),
    results_dir: resultsDir,
    scenario_count: scenarios.length,
    record_count: records.length,
    complete_pairs: completePairs.length,
    with_puax_full_pass: allFlagsPass,
    pass_rate: completePairs.length ? allFlagsPass / completePairs.length : 0,
    pairs: pairs.sort((a, b) => a.scenario_id.localeCompare(b.scenario_id)),
  };
}

function printScorecard(scorecard) {
  console.log(`=== L4 Scorecard ===\n`);
  console.log(`记录: ${scorecard.record_count} | 完整对照: ${scorecard.complete_pairs}/${scorecard.scenario_count}`);
  console.log(`with_puax 行为标志全过: ${scorecard.with_puax_full_pass}/${scorecard.complete_pairs || 0}`);
  console.log(`通过率: ${(scorecard.pass_rate * 100).toFixed(0)}%\n`);

  for (const pair of scorecard.pairs) {
    const icon = !pair.complete ? '⏳' : pair.with_puax_all_flags ? '✅' : '⚠️';
    console.log(`${icon} ${pair.scenario_id}`);
    if (pair.complete && pair.delta) {
      console.log(`   Δ fixes=${pair.delta.fixes >= 0 ? '+' : ''}${pair.delta.fixes} verifications=${pair.delta.verifications >= 0 ? '+' : ''}${pair.delta.verifications}`);
    }
    if (pair.variants.with_puax && !pair.with_puax_all_flags) {
      const failed = Object.entries(pair.variants.with_puax.flags)
        .filter(([, v]) => !v.pass)
        .map(([k]) => k);
      if (failed.length) console.log(`   未过标志: ${failed.join(', ')}`);
    }
    console.log('');
  }
}

function writeScorecard(scorecard, resultsDir) {
  const outPath = join(resultsDir, 'scorecard.json');
  writeFileSync(outPath, JSON.stringify(scorecard, null, 2), 'utf-8');
  return outPath;
}

module.exports = {
  buildScorecard,
  printScorecard,
  writeScorecard,
  loadResults,
};
