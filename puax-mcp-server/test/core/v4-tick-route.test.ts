/**
 * POST /v4/tick 路由守门（AMP 编排器远程通道）。
 * 背景：distributions/python/puax_amp.py 每拍 POST /v4/tick，此路由曾缺失导致
 * 远程通道 404 被静默吞掉、SDK 永久降级本地内核——此测试保证通道与契约不再断裂。
 */

import { dispatchV4 } from '../../src/server/v4-http.js';

describe('POST /v4/tick（AMP 远程心跳）', () => {
  it('合法请求返回 200 且含 AMP 信封契约字段', () => {
    const res = dispatchV4('POST', '/v4/tick', {
      session_id: 'route-test-1',
      event: 'UserPromptSubmit',
      message: '为什么还不行？',
    });
    expect(res).not.toBeNull();
    expect(res!.status).toBe(200);
    const json = res!.json as Record<string, any>;
    expect(json.amp).toBeDefined();
    const amp = json.amp as Record<string, any>;
    expect(amp.spec).toBe('AMP/0.1');
    expect(Array.isArray(amp.events)).toBe(true);
    expect(Array.isArray(amp.blocks)).toBe(true);
    expect(typeof amp.gate).toBe('string');
    expect(amp.state).toBeDefined();
    expect(typeof amp.state.pressure).toBe('number');
    expect(typeof amp.state.role).toBe('string');
    expect(Array.isArray(json.surface_delta)).toBe(true);
  });

  it('未知 event 回退 Manual，不抛异常', () => {
    const res = dispatchV4('POST', '/v4/tick', {
      session_id: 'route-test-2',
      event: 'NotARealEvent',
    });
    expect(res!.status).toBe(200);
    expect((res!.json as Record<string, any>).amp).toBeDefined();
  });

  it('空 body / 非对象 body 优雅降级不炸', () => {
    expect(dispatchV4('POST', '/v4/tick', undefined)!.status).toBe(200);
    expect(dispatchV4('POST', '/v4/tick', 'garbage')!.status).toBe(200);
    expect(dispatchV4('POST', '/v4/tick', {})!.status).toBe(200);
  });

  it('GET /v4/tick 拒绝为 405', () => {
    const res = dispatchV4('GET', '/v4/tick');
    expect(res!.status).toBe(405);
  });
});

describe('POST /v4/thin-prompt', () => {
  it('编译薄注入并返回 prompt / estimated_tokens', () => {
    const res = dispatchV4('POST', '/v4/thin-prompt', {
      role_id: 'military-commander',
      mode: 'minimal',
    });
    expect(res!.status).toBe(200);
    const json = res!.json as Record<string, unknown>;
    expect(typeof json.prompt).toBe('string');
    expect((json.prompt as string).length).toBeGreaterThan(20);
    expect(typeof json.estimated_tokens).toBe('number');
    expect(json.mode).toBe('minimal');
  });

  it('缺 role_id 返回 400', () => {
    expect(dispatchV4('POST', '/v4/thin-prompt', {})!.status).toBe(400);
  });

  it('context_budget 过小则降到 minimal', () => {
    const res = dispatchV4('POST', '/v4/thin-prompt', {
      role_id: 'military-commander',
      mode: 'full',
      context_budget: 200,
    });
    expect(res!.status).toBe(200);
    const json = res!.json as Record<string, unknown>;
    expect(json.mode).toBe('minimal');
    expect(json.mode_reason).toBe('budget_stepdown');
  });
});
