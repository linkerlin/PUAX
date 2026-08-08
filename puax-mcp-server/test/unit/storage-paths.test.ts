/**
 * 存储路径隔离测试（修复：测试写真实 ~/.puax/ 全局状态）
 *
 * 断言：
 * 1. jest setup 已设置 PUAX_HOME（临时目录），生产默认仍为 ~/.puax；
 * 2. getPuaxHome() / getPuaxPath() 遵循 PUAX_HOME；
 * 3. StateManager 在测试环境把状态写入临时目录而非真实用户目录。
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { getPuaxHome, getPuaxPath } from '../../src/utils/storage-paths.js';
import { stateManager } from '../../src/hooks/state-manager.js';

describe('storage paths (PUAX_HOME isolation)', () => {
  it('PUAX_HOME is set to a temp dir in test env (setup.js)', () => {
    expect(process.env.PUAX_HOME).toBeTruthy();
    expect(process.env.PUAX_HOME).toContain('puax-test-');
  });

  it('getPuaxHome follows PUAX_HOME', () => {
    expect(getPuaxHome()).toBe(process.env.PUAX_HOME);
    expect(getPuaxPath('sessions')).toBe(join(process.env.PUAX_HOME!, 'sessions'));
  });

  it('StateManager persists into PUAX_HOME, not the real user home (regression)', () => {
    const sessionId = `isolation-${Date.now()}`;
    stateManager.clearSessionState(sessionId);
    stateManager.recordFailure(sessionId, 'test failure');
    stateManager.getSessionState(sessionId);

    // 状态文件必须存在于临时目录
    const stateFile = join(process.env.PUAX_HOME!, 'session-state.json');
    expect(existsSync(stateFile)).toBe(true);
    const content = readFileSync(stateFile, 'utf-8');
    expect(content).toContain(sessionId);

    stateManager.clearSessionState(sessionId);
  });
});
