#!/usr/bin/env node
/**
 * 双引擎信号一致性评测（无 LLM）
 *
 * 触发器双引擎——会话级扫描（TriggerDetector，YAML 目录）与事件级实时
 * （EnhancedTriggerDetector，v4 心跳热路径）。模式源已与 YAML 目录 id 对齐
 * （合并第二步）。normalizeTriggerId 只消化历史 camelCase。本门守三层：
 *
 * 1. 键即目录：模式库每键必须是 YAML 目录真实 id
 * 2. 旧别名：camelCase 仍归一到同一目录 id
 * 3. 场景一致：同一话语/上下文，双引擎必须落在同一目录 id
 */
const { loadCore } = require('./lib/puax-core-loader.js');

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

console.log('=== Trigger Signal Consistency Eval (dual-engine, no LLM) ===\n');

const { TriggerDetector } = loadCore('trigger-detector');
const { enhancedTriggerDetector, TRIGGER_PATTERNS } = loadCore('trigger-detector-enhanced');
const { normalizeTriggerId } = loadCore('evolve-cycle');

const catalog = new TriggerDetector();
const PATTERN_KEYS = Object.keys(TRIGGER_PATTERNS);

run('模式键即 YAML 目录 id', () => {
  const ghosts = PATTERN_KEYS.filter(k => !catalog.getTrigger(k));
  if (ghosts.length) throw new Error(`模式键不在目录: ${ghosts.join(', ')}`);
});

run('旧 camelCase 别名仍归一到目录 id', () => {
  const samples = [
    ['userFrustration', 'user_frustration'],
    ['givingUp', 'giving_up_language'],
    ['bashFailure', 'consecutive_failures'],
    ['noSearch', 'tool_underuse'],
    ['sessionRestore', 'need_more_context'],
  ];
  const bad = samples.filter(([from, to]) => normalizeTriggerId(from) !== to);
  if (bad.length) throw new Error(`别名失效: ${bad.map(([f, t]) => `${f}≠${t}`).join(', ')}`);
});

run('无别名生命周期信号与目录零碰撞（按设计直通）', () => {
  const collisions = ['preCompact', 'stopFeedback'].filter(s => catalog.getTrigger(normalizeTriggerId(s)));
  if (collisions.length) throw new Error(`生命周期信号意外撞目录 id: ${collisions.join(', ')}`);
});

// 场景语料：文本须同时命中双引擎各自的模式集（B：trigger-patterns.ts；A：triggers.yaml）
const stamp = Date.now();
const SCENARIOS = [
  { label: '用户挫折', message: '为什么还不行？怎么又失败了，太慢了', expected: 'user_frustration' },
  { label: '放弃语言', message: '我无法解决，无法完成，解决不了', expected: 'giving_up_language' },
  { label: '甩锅环境', message: '可能是环境问题，也可能是网络问题', expected: 'blame_environment' },
  { label: '被动等待', message: '请告诉我下一步，等待您的指示', expected: 'passive_wait' },
  { label: '表面修复', message: '已修复，先这样', expected: 'surface_fix' },
];

for (const s of SCENARIOS) {
  run(`场景一致·${s.label}（双引擎 → ${s.expected}）`, () => {
    const b = enhancedTriggerDetector.detect({
      sessionId: `tsc-${stamp}-${s.expected}`,
      eventType: 'UserPromptSubmit',
      message: s.message,
    });
    if (!b.triggered) throw new Error(`事件引擎未触发 (${b.triggerType})`);
    const bId = normalizeTriggerId(b.triggerType);
    if (bId !== s.expected) throw new Error(`事件引擎归一为 ${bId}，应为 ${s.expected}`);
    const a = catalog.detect([{ role: 'user', content: s.message }]);
    const aIds = a.triggers_detected.map(t => t.id);
    if (!aIds.includes(s.expected)) throw new Error(`会话引擎检出 [${aIds.join(', ') || '无'}]，缺 ${s.expected}`);
  });
}

run('场景一致·Bash 连败（事件引擎 ≡ attempt_count → consecutive_failures）', () => {
  const sessionId = `tsc-${stamp}-bash`;
  const fail = { sessionId, eventType: 'PostToolUse', toolName: 'Bash', toolResult: { exit_code: 1 }, errorMessage: 'error' };
  enhancedTriggerDetector.detect(fail);
  const b = enhancedTriggerDetector.detect(fail);
  if (!b.triggered || b.triggerType !== 'consecutive_failures') throw new Error(`事件引擎未升压 (${b.triggerType})`);
  const a = catalog.detect([], { attempt_count: 2, tools_available: [], tools_used: [] });
  if (!a.triggers_detected.some(t => t.id === 'consecutive_failures')) {
    throw new Error('会话引擎 attempt_count=2 未检出 consecutive_failures');
  }
});

run('场景一致·工具闲置（事件引擎 ≡ tool_underuse 上下文路径）', () => {
  const sessionId = `tsc-${stamp}-underuse`;
  const b = enhancedTriggerDetector.detect({ sessionId, eventType: 'UserPromptSubmit', message: '我不清楚，我猜测大概是配置问题' });
  if (!b.triggered) throw new Error(`事件引擎未触发 (${b.triggerType})`);
  if (b.triggerType !== 'tool_underuse') throw new Error(`事件引擎 triggerType=${b.triggerType}，应为 tool_underuse`);
  const a = catalog.detect(
    [{ role: 'assistant', content: '我不清楚，我猜测大概是配置问题' }],
    { attempt_count: 2, tools_available: ['search', 'read'], tools_used: [] }
  );
  if (!a.triggers_detected.some(t => t.id === 'tool_underuse')) throw new Error('会话引擎未检出 tool_underuse');
});

console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'}: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
