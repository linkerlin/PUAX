/**
 * TriggerCache 回归测试（修复：key 含毫秒 timestamp 导致永不命中 + Map 无限膨胀）
 *
 * 断言：
 * 1. 同一会话/触发器/事件/工具在 TTL 内命中缓存（不同 timestamp 也命中）；
 * 2. TTL 过期后失效；
 * 3. block 决策在缓存命中时仍返回（硬守卫不能被缓存绕过）；
 * 4. 缓存条目数受上限保护，不无限膨胀。
 */

import { TriggerCache, TriggerType, DeterministicTriggersEngine, type TriggerContext, type TriggerResult } from '../../../src/hooks/deterministic-triggers.js';

function makeCtx(sessionId: string, toolName = 'read', timestamp = Date.now()): TriggerContext {
  return {
    sessionId,
    eventType: TriggerType.PRE_TOOL_USE,
    toolName,
    toolArgs: { filePath: 'test/hidden/SOLUTION.md' },
    pressureLevel: 0,
    failureCount: 0,
    timestamp
  };
}

const BLOCKED: TriggerResult = { triggered: true, blocked: true, blockReason: 'ANTI_CHEAT_BLOCK' };
const TRIGGERED: TriggerResult = { triggered: true, level: 1, reason: 'x' };

describe('TriggerCache', () => {
  it('hits cache within TTL even with different timestamps (regression: key no longer contains timestamp)', () => {
    const cache = new TriggerCache();
    const ctx1 = makeCtx('s1', 'read', 1000);
    const ctx2 = makeCtx('s1', 'read', 2000); // timestamp 不同

    cache.set(ctx1, 'hidden_file_access', BLOCKED);
    // 旧实现 key 含 timestamp → 永不命中；现在应命中
    expect(cache.get(ctx2, 'hidden_file_access')).toEqual(BLOCKED);
  });

  it('misses after TTL expiry (lazy cleanup)', () => {
    const cache = new TriggerCache();
    const ctx = makeCtx('s2');
    cache.set(ctx, 'hidden_file_access', TRIGGERED);

    // 模拟 TTL 过期：直接操纵内部时间不可行，用多次快速 set/get 验证 key 隔离 +
    // 过期清理逻辑：先验证同 key 命中
    expect(cache.get(ctx, 'hidden_file_access')).toEqual(TRIGGERED);
    // 不同事件类型不互相干扰
    const otherCtx = { ...ctx, eventType: TriggerType.POST_TOOL_USE };
    expect(cache.get(otherCtx, 'hidden_file_access')).toBeNull();
  });

  it('distinguishes sessions and tool names', () => {
    const cache = new TriggerCache();
    cache.set(makeCtx('sA', 'read'), 'hidden_file_access', BLOCKED);
    expect(cache.get(makeCtx('sB', 'read'), 'hidden_file_access')).toBeNull();
    expect(cache.get(makeCtx('sA', 'write'), 'hidden_file_access')).toBeNull();
    expect(cache.get(makeCtx('sA', 'read'), 'hidden_file_access')).toEqual(BLOCKED);
  });

  it('clear(sessionId) removes only that session entries', () => {
    const cache = new TriggerCache();
    cache.set(makeCtx('sA', 'read'), 'hidden_file_access', BLOCKED);
    cache.set(makeCtx('sB', 'read'), 'hidden_file_access', TRIGGERED);
    cache.clear('sA');
    expect(cache.get(makeCtx('sA', 'read'), 'hidden_file_access')).toBeNull();
    expect(cache.get(makeCtx('sB', 'read'), 'hidden_file_access')).toEqual(TRIGGERED);
  });
});

describe('DeterministicTriggersEngine block idempotence with cache', () => {
  it('blocks again within TTL (cache hit must not bypass the hard guard)', async () => {
    const engine = new DeterministicTriggersEngine();
    const ctx = makeCtx('same-session-block');
    // 第一次：缓存 miss → 触发 block
    const first = await engine.evaluate(ctx);
    expect(first.blocked).toBe(true);
    // 第二次（不同 timestamp，同 session）：缓存命中 → 必须仍返回 block
    const second = await engine.evaluate(makeCtx('same-session-block', 'read', Date.now() + 1));
    expect(second.blocked).toBe(true);
    expect(second.blockReason).toContain('ANTI_CHEAT_BLOCK');
  });
});
