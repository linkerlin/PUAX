#!/usr/bin/env node
/**
 * 会话心跳 / 断点恢复评测（无 LLM）
 * 对标 pua evals/test-heartbeat
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadHooks } = require('./lib/puax-core-loader.js');

let pass = 0;
let fail = 0;
let tempDir = null;

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

function setupTempDir() {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puax-heartbeat-'));
}

function cleanup() {
  if (tempDir) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
}

console.log('=== PUAX Heartbeat Eval (no LLM) ===\n');

setupTempDir();

try {
  const { StateManager } = loadHooks('state-manager');
  const { PressureSystem } = loadHooks('pressure-system');

  run('新会话初始心跳状态', () => {
    const sm = new StateManager(tempDir);
    const state = sm.getSessionState('hb-new');
    if (state.pressureLevel !== 0) throw new Error('新会话压力应为 L0');
    if (state.failureCount !== 0) throw new Error('新会话失败计数应为 0');
    if (!state.lastActivity) throw new Error('缺少 lastActivity 心跳戳');
  });

  run('失败计数递增（心跳驱动）', () => {
    const sm = new StateManager(tempDir);
    sm.recordFailure('hb-fail', 'test error', 'Bash');
    sm.recordFailure('hb-fail', 'test error 2', 'Bash');
    const state = sm.getSessionState('hb-fail');
    if (state.failureCount < 2) throw new Error(`失败计数应 >= 2，得 ${state.failureCount}`);
  });

  run('压力系统随失败升级', () => {
    const sm = new StateManager(tempDir);
    const ps = new PressureSystem({}, sm);
    const sessionId = 'hb-pressure';
    ps.handleFailure(sessionId, 'e1');
    const result = ps.handleFailure(sessionId, 'e2');
    if (result.currentLevel < 1) {
      throw new Error(`失败 2 次后压力应 >= L1，得 L${result.currentLevel}`);
    }
  });

  run('<2h 断点恢复应注入上下文', () => {
    const sm = new StateManager(tempDir);
    const sessionId = 'hb-compact';
    sm.updateSessionState(sessionId, {
      failureCount: 2,
      pressureLevel: 2,
      triedApproaches: ['检查配置', '重启服务'],
      excludedPossibilities: ['网络断开'],
      nextHypothesis: '端口被占用',
      activeTask: '修复 API 连接',
    });
    const restore = sm.getCompactionRestoreContext(sessionId, 2);
    if (!restore.should_restore) throw new Error('应触发断点恢复');
    if (!restore.context?.includes('[PUAX 断点恢复]')) throw new Error('恢复上下文缺少标记');
    if (!restore.context.includes('已尝试')) throw new Error('恢复上下文缺少 triedApproaches');
  });

  run('无失败上下文时不触发恢复', () => {
    const sm = new StateManager(tempDir);
    const restore = sm.getCompactionRestoreContext('hb-clean', 2);
    if (restore.should_restore) throw new Error('新会话不应触发断点恢复');
  });

  run('推理状态 Compaction 保护字段', () => {
    const sm = new StateManager(tempDir);
    const sessionId = 'hb-reasoning';
    sm.updateSessionState(sessionId, {
      triedApproaches: ['A', 'B'],
      excludedPossibilities: ['C'],
      nextHypothesis: 'D',
    });
    const saved = sm.getSessionState(sessionId);
    if (saved.triedApproaches.length !== 2) throw new Error('triedApproaches 未持久化');
    if (!saved.nextHypothesis) throw new Error('nextHypothesis 未持久化');
  });

  run('cleanupExpiredSessions 清理过期会话', () => {
    const sm = new StateManager(tempDir);
    const sessionId = 'hb-expired';
    const stale = {
      sessionId,
      startTime: Date.now() - 8 * 24 * 60 * 60 * 1000,
      lastActivity: Date.now() - 8 * 24 * 60 * 60 * 1000,
      pressureLevel: 0,
      failureCount: 0,
      triggerCount: 0,
      methodologyHistory: [],
      triedApproaches: [],
      excludedPossibilities: [],
      peakPressureLevel: 0,
    };
    fs.writeFileSync(
      path.join(tempDir, 'session-state.json'),
      JSON.stringify({ [sessionId]: stale })
    );
    const cleaned = sm.cleanupExpiredSessions(7);
    if (cleaned < 1) throw new Error('应清理至少 1 个过期会话');
  });
  run('会话 lastActivity 随保存刷新', () => {
    const sm = new StateManager(tempDir);
    const sessionId = 'hb-activity';
    const before = sm.getSessionState(sessionId).lastActivity;
    const waitUntil = Date.now() + 5;
    while (Date.now() < waitUntil) { /* spin */ }
    sm.updateSessionState(sessionId, { activeTask: 'tick' });
    const after = sm.getSessionState(sessionId).lastActivity;
    if (after <= before) throw new Error('lastActivity 未刷新');
  });
} finally {
  cleanup();
}

console.log(`\nPassed: ${pass}, Failed: ${fail}`);
process.exit(fail > 0 ? 1 : 0);
