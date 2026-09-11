#!/usr/bin/env node
/**
 * PostToolUse Bash 失败 → 心跳发生（bashFailure → consecutive_failures）。
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'puax-posttool-'));
process.env.PUAX_HOME = temp;

const { loadCli, loadCore } = require('./lib/puax-core-loader.js');
const { runHook } = loadCli('hook-cli');
const { getTtfSummary } = loadCore('ttf');

const session = 'hook-posttool-1';

runHook({ event: 'SessionStart', sessionId: session, harness: 'claude' });

const fail = runHook({
  event: 'PostToolUse',
  sessionId: session,
  toolName: 'Bash',
  errorMessage: 'command failed: exit code 1',
  toolResult: { exit_code: 1, stderr: 'Error: FAILED' },
  harness: 'claude',
});

const payload = JSON.parse(fail.json || '{}');
let ctx =
  (payload.hookSpecificOutput && payload.hookSpecificOutput.additionalContext) ||
  payload.additionalContext ||
  '';

const ttf = getTtfSummary();
let failProduced = fail.produced;
if (ttf.samples < 1 || !ctx) {
  // 压力系统首次失败不跨阈值；第 2 次连续失败升压并注入
  const fail2 = runHook({
    event: 'PostToolUse',
    sessionId: session,
    toolName: 'Bash',
    errorMessage: 'command failed: exit code 1',
    toolResult: { exit_code: 1, stderr: 'Error: FAILED' },
    harness: 'claude',
  });
  const p2 = JSON.parse(fail2.json || '{}');
  ctx =
    (p2.hookSpecificOutput && p2.hookSpecificOutput.additionalContext) ||
    p2.additionalContext ||
    '';
  failProduced = fail2.produced;
  if (!ctx) throw new Error('第二次连续 Bash 失败仍无注入');
}

const after = getTtfSummary();
if (after.samples < 1) throw new Error('PostToolUse 失败路径应记下 TTF');

console.log(`hook PostToolUse ok  samples=${after.samples} produced=${failProduced}`);
