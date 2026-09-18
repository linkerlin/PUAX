/**
 * Thin Prompt 多级压缩与 Token 经济性测试
 */

import {
  compileThinPrompt,
  clearThinPromptCache,
  selectThinMode,
} from '../../src/core/thin-prompt.js';
import { puaxThinPromptTool } from '../../src/tools/thin-prompt.js';
import { arenaStore } from '../../src/core/arena.js';

describe('Thin Prompt Compiler & Compression Modes', () => {
  beforeAll(() => {
    arenaStore.set({
      rival: '基线对标 Agent',
      audience: '自动化门禁评委',
      scarce_badge: '零幻觉硬交付',
    });
  });

  beforeEach(() => {
    clearThinPromptCache();
  });

  afterAll(() => {
    arenaStore.clear();
  });

  it('compileThinPrompt 支持 full, compact, minimal 三种模式，且文本长度递减', () => {
    const full = compileThinPrompt({ role_id: 'military-commander', mode: 'full' });
    const compact = compileThinPrompt({ role_id: 'military-commander', mode: 'compact' });
    const minimal = compileThinPrompt({ role_id: 'military-commander', mode: 'minimal' });

    expect(full.mode).toBe('full');
    expect(compact.mode).toBe('compact');
    expect(minimal.mode).toBe('minimal');

    expect(minimal.prompt.length).toBeLessThan(compact.prompt.length);
    expect(compact.prompt.length).toBeLessThan(full.prompt.length);

    expect(minimal.estimated_tokens).toBeLessThan(compact.estimated_tokens);
    expect(compact.estimated_tokens).toBeLessThan(full.estimated_tokens);
  });

  it('minimal 模式具有单行紧凑协议头与紧凑诊断块', () => {
    const res = compileThinPrompt({
      role_id: 'military-commander',
      mode: 'minimal',
      language: 'zh',
    });

    expect(res.prompt).toContain('[PUAX-RUNTIME:MINIMAL]');
    expect(res.prompt).toContain('改码必先[PUAX-DIAGNOSIS]');
    expect(res.prompt).toContain('[PUAX-ARENA]');
    expect(res.voice_chars).toBeLessThanOrEqual(400);
    expect(res.estimated_tokens).toBeGreaterThan(0);
  });

  it('minimal 模式支持英文诊断提示', () => {
    const res = compileThinPrompt({
      role_id: 'military-commander',
      mode: 'minimal',
      language: 'en',
    });

    expect(res.prompt).toContain('[PUAX-RUNTIME:MINIMAL]');
    expect(res.prompt).toContain('Problem is ___; evidence is ___; next action is ___');
  });

  it('puaxThinPromptTool MCP 工具调用应正确返回封装数据', async () => {
    const handler = puaxThinPromptTool.handler;
    const response = await handler({
      role_id: 'shaman-jobs',
      mode: 'minimal',
      language: 'zh',
      include_arena: true,
      include_diagnosis: true,
    });

    expect(response.role_id).toBe('shaman-jobs');
    expect(response.mode).toBe('minimal');
    expect(response.prompt).toContain('[PUAX-RUNTIME:MINIMAL]');
    expect(response.estimated_tokens).toBeGreaterThan(0);
    expect(response.classification).toBe('kernel');
  });

  it('selectThinMode：无 mode 按预算选档', () => {
    expect(selectThinMode({ context_budget: 200 })).toBe('minimal');
    expect(selectThinMode({ context_budget: 400 })).toBe('compact');
    expect(selectThinMode({ context_budget: 900 })).toBe('full');
    expect(selectThinMode({ mode: 'full' })).toBe('full');
    expect(selectThinMode({})).toBe('full');
  });

  it('context_budget 过小则从 full 降到更薄一档', () => {
    const res = compileThinPrompt({
      role_id: 'military-commander',
      mode: 'full',
      context_budget: 200,
    });
    expect(res.mode).toBe('minimal');
    expect(res.mode_reason).toBe('budget_stepdown');
    expect(res.prompt).toContain('[PUAX-RUNTIME:MINIMAL]');
  });

  it('仅 context_budget 时自动选档', () => {
    const res = compileThinPrompt({
      role_id: 'military-commander',
      context_budget: 200,
    });
    expect(res.mode).toBe('minimal');
    expect(res.mode_reason).toBe('budget');
  });

  it('同输入二次编译走缓存', () => {
    const a = compileThinPrompt({ role_id: 'military-commander', mode: 'compact' });
    const b = compileThinPrompt({ role_id: 'military-commander', mode: 'compact' });
    expect(a.cached).toBe(false);
    expect(b.cached).toBe(true);
    expect(b.prompt).toBe(a.prompt);
  });

  it('military-commander 三档估算不突破薄注入上界', () => {
    const full = compileThinPrompt({ role_id: 'military-commander', mode: 'full' });
    const compact = compileThinPrompt({ role_id: 'military-commander', mode: 'compact' });
    const minimal = compileThinPrompt({ role_id: 'military-commander', mode: 'minimal' });
    expect(minimal.estimated_tokens).toBeLessThanOrEqual(400);
    expect(compact.estimated_tokens).toBeLessThanOrEqual(750);
    expect(full.estimated_tokens).toBeLessThanOrEqual(1000);
  });
});
