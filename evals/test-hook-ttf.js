#!/usr/bin/env node
/**
 * Hook 路径 TTF：SessionStart 静默不得挡住紧随其后的 UserPromptSubmit。
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'puax-hook-ttf-'));
process.env.PUAX_HOME = temp;

const { loadCli, loadCore } = require('./lib/puax-core-loader.js');
const { runHook } = loadCli('hook-cli');
const { getTtfSummary } = loadCore('ttf');

const session = 'hook-ttf-1';

const start = runHook({
  event: 'SessionStart',
  sessionId: session,
  harness: 'claude',
});
const startJson = JSON.parse(start.json || '{}');
if (startJson.hookSpecificOutput && startJson.hookSpecificOutput.additionalContext) {
  // 新会话不应注入恢复块；有内容也可以，但不能是死冷却
}

const prompt = runHook({
  event: 'UserPromptSubmit',
  sessionId: session,
  message: '为什么还不行？我要放弃了',
  harness: 'claude',
});
const payload = JSON.parse(prompt.json || '{}');
const ctx =
  (payload.hookSpecificOutput && payload.hookSpecificOutput.additionalContext) ||
  payload.additional_context ||
  payload.additionalContext ||
  '';
if (!ctx) throw new Error('第一轮用户沮丧后 Hook 应注入上下文');

const ttf = getTtfSummary();
if (ttf.samples < 1) throw new Error('Hook 路径应记下 TTF 样本');
if (!ttf.first_turn_rate) throw new Error('Hook 第一拍应记 first_turn');

console.log(
  `hook TTF ok  samples=${ttf.samples} median_ms=${ttf.median_ms} produced=${prompt.produced}`
);
