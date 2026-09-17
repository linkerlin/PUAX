#!/usr/bin/env node
/**
 * Time-to-First-Pressure 冷启动（无 LLM）。
 * 新会话第一拍发生激励即记样；同会话第二拍不得重复记首次。
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'puax-ttf-'));
process.env.PUAX_HOME = temp;

const { loadCore } = require('./lib/puax-core-loader.js');
const { getTtfSummary } = loadCore('ttf');

const session = 'ttf-cold-start';

// 4.5.1：改测子进程冷启动到首压（度量真实 Node 启动 + 模块解析 + 首压墙钟）
const runInSubprocess = (msg, detected) => {
  const code = `
    const { loadCore } = require(${JSON.stringify(path.join(__dirname, 'lib/puax-core-loader.js'))});
    const { runEvolveCycle } = loadCore('evolve-cycle');
    const res = runEvolveCycle({
      session_id: ${JSON.stringify(session)},
      event: 'UserPromptSubmit',
      message: ${JSON.stringify(msg)},
      skip_detect: true,
      detected_triggers: ${JSON.stringify(detected)},
      force: true,
    });
    process.stdout.write(JSON.stringify(res));
  `;
  const t0 = performance.now();
  const stdout = execFileSync(process.execPath, ['-e', code], {
    env: { ...process.env, PUAX_HOME: temp },
    encoding: 'utf-8',
  });
  const wallMs = Math.round(performance.now() - t0);
  return { result: JSON.parse(stdout), wallMs };
};

const firstRun = runInSubprocess('为什么还不行？我要放弃了', ['user_frustration', 'giving_up_language']);
const first = firstRun.result;

if (!first.happened) throw new Error('冷启动第一拍应当发生激励');

const afterFirst = getTtfSummary();
if (afterFirst.samples < 1) throw new Error('应记下至少 1 条 TTF 样本');
if (afterFirst.first_turn_rate === null || afterFirst.first_turn_rate <= 0) {
  throw new Error('第一拍应记为 first_turn');
}
if (afterFirst.median_ms === null || afterFirst.median_ms < 0) {
  throw new Error('median_ms 非法');
}
if (afterFirst.median_wall_clock_ms === null || afterFirst.median_wall_clock_ms < 0) {
  throw new Error('median_wall_clock_ms 非法');
}

const secondRun = runInSubprocess('还是不行', ['user_frustration']);
const second = secondRun.result;
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
  JSON.stringify(
    {
      session,
      first_happened: first.happened,
      subprocess_cold_start_wall_clock_ms: firstRun.wallMs,
      ttf: afterSecond,
    },
    null,
    2
  )
);

console.log(
  `TTF cold-start ok  samples=${afterSecond.samples} in_process_ms=${afterSecond.median_ms} wall_clock_ms=${afterSecond.median_wall_clock_ms} subprocess_wall_ms=${firstRun.wallMs} first_turn_rate=${afterSecond.first_turn_rate}`
);
