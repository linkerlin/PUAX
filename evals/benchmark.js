#!/usr/bin/env node
/**
 * 性能基准守门（无 LLM）
 * 对标 pua evals 性能回归检测
 */
const fs = require('fs');
const path = require('path');
const { loadCore } = require('./lib/puax-core-loader.js');

const THRESHOLDS = {
  trigger_detect_ms: 100,
  recommend_cold_ms: 150,
  recommend_cached_ms: 30,
  methodology_ms: 50,
  e2e_flow_ms: 500,
};

let pass = 0;
let fail = 0;
const results = [];

function run(name, fn) {
  const start = Date.now();
  try {
    const metrics = fn();
    const elapsed = Date.now() - start;
    results.push({ name, ...metrics, wall_ms: elapsed });
    console.log(`✅ ${name}`);
    pass++;
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    fail++;
  }
}

function timed(label, fn) {
  const start = Date.now();
  const value = fn();
  return { [label]: Date.now() - start, value };
}

console.log('=== PUAX Performance Benchmark (no LLM) ===\n');

const { TriggerDetector } = loadCore('trigger-detector');
const { getRoleRecommender } = require(path.join(
  __dirname,
  '../puax-mcp-server/build/core/service-registry.js'
));
const { MethodologyEngine } = loadCore('methodology-engine');

const recommender = getRoleRecommender();
const detector = new TriggerDetector({ sensitivity: 'medium' });
const engine = new MethodologyEngine();

const sampleHistory = [
  { role: 'assistant', content: '尝试连接...失败' },
  { role: 'assistant', content: '再试一次...还是失败' },
  { role: 'user', content: '为什么还不行？' },
];

const recommendRequest = {
  detected_triggers: ['user_frustration', 'consecutive_failures'],
  task_context: { task_type: 'debugging', attempt_count: 3, urgency: 'high' },
};

run('触发检测 < 100ms', () => {
  const { trigger_detect_ms } = timed('trigger_detect_ms', () =>
    detector.detect(sampleHistory, { attempt_count: 2 })
  );
  if (trigger_detect_ms > THRESHOLDS.trigger_detect_ms) {
    throw new Error(`${trigger_detect_ms}ms > ${THRESHOLDS.trigger_detect_ms}ms`);
  }
  return { trigger_detect_ms };
});

run('推荐冷启动 < 150ms', () => {
  const fresh = new (require(path.join(
    __dirname,
    '../puax-mcp-server/build/core/role-recommender.js'
  )).RoleRecommender)();
  const { recommend_cold_ms, value } = timed('recommend_cold_ms', () =>
    fresh.recommend(recommendRequest)
  );
  if (recommend_cold_ms > THRESHOLDS.recommend_cold_ms) {
    throw new Error(`${recommend_cold_ms}ms > ${THRESHOLDS.recommend_cold_ms}ms`);
  }
  if (value.metadata.cache_hit) throw new Error('冷启动不应 cache_hit');
  return { recommend_cold_ms };
});

run('推荐缓存命中 < 30ms', () => {
  recommender.recommend(recommendRequest);
  const { recommend_cached_ms, value } = timed('recommend_cached_ms', () =>
    recommender.recommend(recommendRequest)
  );
  if (!value.metadata.cache_hit) throw new Error('第二次应 cache_hit');
  if (recommend_cached_ms > THRESHOLDS.recommend_cached_ms) {
    throw new Error(`${recommend_cached_ms}ms > ${THRESHOLDS.recommend_cached_ms}ms`);
  }
  return { recommend_cached_ms };
});

run('方法论加载 < 50ms', () => {
  const { methodology_ms } = timed('methodology_ms', () => {
    engine.getMethodology('military-commander');
    engine.getChecklist('military-commander');
  });
  if (methodology_ms > THRESHOLDS.methodology_ms) {
    throw new Error(`${methodology_ms}ms > ${THRESHOLDS.methodology_ms}ms`);
  }
  return { methodology_ms };
});

run('端到端流程 < 500ms', () => {
  const { e2e_flow_ms } = timed('e2e_flow_ms', () => {
    const detection = detector.detect(sampleHistory, { attempt_count: 2 });
    const rec = recommender.recommend({
      detected_triggers: detection.triggers_detected.map(t => t.id),
      task_context: { task_type: 'debugging', urgency: 'high' },
    });
    engine.getMethodology(rec.primary.role_id);
  });
  if (e2e_flow_ms > THRESHOLDS.e2e_flow_ms) {
    throw new Error(`${e2e_flow_ms}ms > ${THRESHOLDS.e2e_flow_ms}ms`);
  }
  return { e2e_flow_ms };
});

const outDir = path.join(__dirname, 'results');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const report = {
  generated_at: new Date().toISOString(),
  thresholds: THRESHOLDS,
  results,
  passed: fail === 0,
};
fs.writeFileSync(path.join(outDir, 'benchmark.json'), JSON.stringify(report, null, 2));

console.log(`\nPassed: ${pass}, Failed: ${fail}`);
console.log(`Report: evals/results/benchmark.json`);
process.exit(fail > 0 ? 1 : 0);
