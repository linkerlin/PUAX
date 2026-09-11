#!/usr/bin/env node
/**
 * v4 心跳评测：tick 发生 + AMP 信封（无 LLM）。
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'puax-tick-hb-'));
process.env.PUAX_HOME = temp;

const { loadCore } = require('./lib/puax-core-loader.js');
const { runEvolveCycle } = loadCore('evolve-cycle');
const { toAmpEnvelope } = loadCore('amp');

const session = 'tick-hb';
const tick = runEvolveCycle({
  session_id: session,
  event: 'UserPromptSubmit',
  message: '这都第三次了，怎么还不行？',
  skip_detect: true,
  detected_triggers: ['consecutive_failures', 'user_frustration'],
  force: true,
});

if (!tick.happened) throw new Error('失败+沮丧信号下心跳应当发生');
if (!tick.selected_role) throw new Error('应选出角色');
if (!tick.injection || !tick.injection.includes('[PUAX-RUNTIME]')) {
  throw new Error('薄注入应含 [PUAX-RUNTIME]');
}

const amp = toAmpEnvelope(tick, session, 'UserPromptSubmit');
if (amp.spec !== 'AMP/0.1') throw new Error('缺少 AMP/0.1');
if (!amp.events.includes('failure') && !amp.events.includes('giving_up')) {
  if (amp.events.length === 0 && tick.signals.length === 0) {
    throw new Error('AMP 事件为空');
  }
}
if (amp.state.happened !== true) throw new Error('AMP.state.happened 应为 true');

console.log(`tick heartbeat ok  role=${tick.selected_role} action=${tick.action} amp_events=${amp.events.join(',')}`);
