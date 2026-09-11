#!/usr/bin/env node
/**
 * Time-to-First-Pressure 冷启动（无 LLM）。
 * 新会话第一拍发生激励即记样；同会话第二拍不得重复记首次。
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'puax-ttf-'));
process.env.PUAX_HOME = temp;

const { loadCore } = require('./lib/puax-core-loader.js');
const { runEvolveCycle } = loadCore('evolve-cycle');
const { getTtfSummary } = loadCore('ttf');

const session = 'ttf-cold-start';

const first = runEvolveCycle({
  session_id: session,
  event: 'UserPromptSubmit',
  message: '为什么还不行？我要放弃了',
  skip_detect: true,
  detected_triggers: ['user_frustration', 'giving_up_language'],
  force: true,
});

if (!first.happened) throw new Error('冷启动第一拍应当发生激励');

const afterFirst = getTtfSummary();
if (afterFirst.samples < 1) throw new Error('应记下至少 1 条 TTF 样本');
if (afterFirst.first_turn_rate === null || afterFirst.first_turn_rate <= 0) {
  throw new Error('第一拍应记为 first_turn');
}
if (afterFirst.median_ms === null || afterFirst.median_ms < 0) {
  throw new Error('median_ms 非法');
}

const second = runEvolveCycle({
  session_id: session,
  event: 'UserPromptSubmit',
  message: '还是不行',
  skip_detect: true,
  detected_triggers: ['user_frustration'],
  force: true,
});
if (!second.happened && second.abort && second.abort !== 'cooldown') {
  throw new Error(`第二拍异常 abort=${second.abort}`);
}

const afterSecond = getTtfSummary();
if (afterSecond.samples !== afterFirst.samples) {
  throw new Error(`同会话不得重复记首次压力：${afterFirst.samples} → ${afterSecond.samples}`);
}

const outDir = path.join(__dirname, 'results');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'ttf-cold-start.json'),
  JSON.stringify({ session, first_happened: first.happened, ttf: afterSecond }, null, 2)
);

console.log(
  `TTF cold-start ok  samples=${afterSecond.samples} median_ms=${afterSecond.median_ms} first_turn_rate=${afterSecond.first_turn_rate}`
);
