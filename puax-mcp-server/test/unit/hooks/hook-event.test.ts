/**
 * 统一事件枚举测试（Hook机制演进方案.md Phase 0.1）
 * 断言：PuaxHookEvent 为唯一权威枚举；HookEventType / TriggerType 为兼容别名，
 * 值语义对齐；PreToolUse 补齐为一等公民。
 */

import { PUAX_HOOK_EVENTS, isPuaxHookEvent } from '../../../src/hooks/hook-event.js';
import { HookEventType } from '../../../src/hooks/trigger-detector-enhanced.js';
import { TriggerType } from '../../../src/hooks/deterministic-triggers.js';

describe('PuaxHookEvent (unified event enum)', () => {
  it('should contain exactly 6 events with PreToolUse as first-class citizen', () => {
    expect(PUAX_HOOK_EVENTS).toEqual([
      'UserPromptSubmit',
      'PostToolUse',
      'PreToolUse',
      'PreCompact',
      'SessionStart',
      'Stop'
    ]);
  });

  it('isPuaxHookEvent should accept all enum values and reject others', () => {
    for (const event of PUAX_HOOK_EVENTS) {
      expect(isPuaxHookEvent(event)).toBe(true);
    }
    expect(isPuaxHookEvent('pre_tool_use')).toBe(false);
    expect(isPuaxHookEvent('bogus')).toBe(false);
    expect(isPuaxHookEvent(undefined)).toBe(false);
  });

  it('HookEventType (deprecated alias) should equal PuaxHookEvent values', () => {
    const type: HookEventType = 'PreToolUse';
    expect(type).toBe('PreToolUse');
    expect((PUAX_HOOK_EVENTS as readonly string[]).includes('PreToolUse')).toBe(true);
  });

  it('TriggerType (deprecated enum) should map to unified PascalCase values', () => {
    expect(TriggerType.PRE_TOOL_USE).toBe('PreToolUse');
    expect(TriggerType.POST_TOOL_USE).toBe('PostToolUse');
    expect(TriggerType.USER_PROMPT).toBe('UserPromptSubmit');
    expect(TriggerType.SESSION_START).toBe('SessionStart');
    expect(TriggerType.PRE_COMPACT).toBe('PreCompact');
    expect(TriggerType.STOP).toBe('Stop');
  });

  it('MCP-facing detect tool accepts PreToolUse in its schema', async () => {
    const { detectTriggerEnhancedTool } = await import('../../../src/tools/detect-trigger-enhanced.js');
    const schema = detectTriggerEnhancedTool.inputSchema.shape.eventType;
    const parsed = schema.parse('PreToolUse');
    expect(parsed).toBe('PreToolUse');
    // 旧的 5 个值仍然兼容（MCP API 不破坏）
    expect(schema.parse('UserPromptSubmit')).toBe('UserPromptSubmit');
  });
});
