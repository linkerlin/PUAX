#!/usr/bin/env node
/**
 * TTF 冷启动子进程探针（静态脚本，无动态代码构造）。
 * 从 cwd 读 payload.json（{session_id, message, detected_triggers}），
 * 跑一拍 evolve-cycle，stdout 回 JSON 结果。
 * 调用方：execFileSync('node', ['lib/ttf-subprocess.js'], { cwd: <临时目录> })
 */
const { readFileSync } = require('fs');
const { loadCore } = require('./puax-core-loader.js');
const { runEvolveCycle } = loadCore('evolve-cycle');

const payload = JSON.parse(readFileSync('payload.json', 'utf-8'));
const res = runEvolveCycle({
  session_id: payload.session_id,
  event: 'UserPromptSubmit',
  message: payload.message,
  skip_detect: true,
  detected_triggers: payload.detected_triggers,
  force: true,
});
process.stdout.write(JSON.stringify(res));
