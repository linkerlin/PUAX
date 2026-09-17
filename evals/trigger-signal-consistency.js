#!/usr/bin/env node
/**
 * 双引擎信号一致性评测（无 LLM）
 *
 * 触发器双引擎——会话级扫描（TriggerDetector，YAML 目录）与事件级实时
 * （EnhancedTriggerDetector，v4 心跳热路径）——经 TRIGGER_ALIASES 缝合层
 * （evolve-cycle.normalizeTriggerId）归一到 YAML 目录 id。引擎合并第二步
 * （模式源归一）以此为前置护栏。本门守三层：
 *
 * 1. 键完备：模式库每键必被别名归一（normalizeTriggerId(K) !== K）
 * 2. 目标有效：别名目标必须是 YAML 目录真实 id（引擎 A getTrigger 可查）；
 *    无别名的生命周期信号（preCompact/stopFeedback）按设计直通，须与目录 id 零碰撞
 * 3. 场景一致：同一话语/上下文，双引擎归一后必须落在同一目录 id
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

run('模式键↔别名完备（每模式键必被归一）', () => {
  const bare = PATTERN_KEYS.filter(k => normalizeTriggerId(k) === k);
  if (bare.length) throw new Error(`无别名的模式键: ${bare.join(', ')}`);
});

run('别名目标全部命中 YAML 目录', () => {
  const targets = [...PATTERN_KEYS, 'sessionRestore'].map(k => normalizeTriggerId(k));
  const ghosts = targets.filter(t => !catalog.getTrigger(t));
  if (ghosts.length) throw new Error(`别名目标不在目录: ${ghosts.join(', ')}`);
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

run('场景一致·Bash 连败（bashFailure ≡ attempt_count → consecutive_failures）', () => {
  const sessionId = `tsc-${stamp}-bash`;
  const fail = { sessionId, eventType: 'PostToolUse', toolName: 'Bash', toolResult: { exit_code: 1 }, errorMessage: 'error' };
  enhancedTriggerDetector.detect(fail);
  const b = enhancedTriggerDetector.detect(fail);
  if (!b.triggered || b.triggerType !== 'bashFailure') throw new Error(`事件引擎未升压 (${b.triggerType})`);
  const bId = normalizeTriggerId(b.triggerType);
  const a = catalog.detect([], { attempt_count: 2, tools_available: [], tools_used: [] });
  if (!a.triggers_detected.some(t => t.id === bId)) throw new Error(`会话引擎 attempt_count=2 未检出 ${bId}`);
});

run('场景一致·工具闲置（noSearch ≡ tool_underuse 上下文路径）', () => {
  const sessionId = `tsc-${stamp}-underuse`;
  const b = enhancedTriggerDetector.detect({ sessionId, eventType: 'UserPromptSubmit', message: '我不清楚，我猜测大概是配置问题' });
  if (!b.triggered) throw new Error(`事件引擎未触发 (${b.triggerType})`);
  if (b.triggerType !== 'noSearch') throw new Error(`事件引擎 triggerType=${b.triggerType}，应为 noSearch`);
  const bId = normalizeTriggerId(b.triggerType);
  const a = catalog.detect(
    [{ role: 'assistant', content: '我不清楚，我猜测大概是配置问题' }],
    { attempt_count: 2, tools_available: ['search', 'read'], tools_used: [] }
  );
  if (!a.triggers_detected.some(t => t.id === bId)) throw new Error(`会话引擎未检出 ${bId}`);
});

console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'}: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
