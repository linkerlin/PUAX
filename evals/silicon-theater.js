#!/usr/bin/env node
/**
 * 硅基剧场本机演练（无 LLM）：四拍走完处境 / 闸门 / 梦。
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { loadCore } = require('./lib/puax-core-loader.js');

process.env.PUAX_HOME = process.env.PUAX_HOME || fs.mkdtempSync(path.join(os.tmpdir(), 'puax-theater-'));

const { runSiliconTheater, planSiliconTheater } = loadCore('silicon-theater');
const plan = planSiliconTheater();
if (!plan.script || plan.script.length < 4) {
  throw new Error('剧场剧本不足四拍');
}
if (!plan.cast.includes('silicon-throne') || !plan.cast.includes('silicon-steward')) {
  throw new Error('剧场缺少圣座或供奉');
}

const board = runSiliconTheater('evals-silicon-theater');
const happened = (board.beats || []).filter(b => b.happened).length;
if (happened < 1) throw new Error('剧场零拍发生，心跳未接入');
if (!(board.beats || []).some(b => b.amp && b.amp.spec === 'AMP/0.1')) {
  throw new Error('剧场拍子缺少 AMP 信封');
}

const outDir = path.join(__dirname, 'results');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'silicon-theater.json'), JSON.stringify(board, null, 2));

console.log(`silicon theater ok  beats=${board.beats.length} happened=${happened} pressure=L${board.pressure}`);
