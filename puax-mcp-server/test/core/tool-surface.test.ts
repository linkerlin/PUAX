import {
  extraToolsForTick,
  listedExtraNames,
  resetListedTools,
  revealListedTools,
} from '../../src/core/tool-surface.js';

describe('按会话工具面揭示', () => {
  it('inject 动作揭示检测与完整角色工具', () => {
    expect(extraToolsForTick('inject', ['user_frustration'], 'UserPromptSubmit')).toEqual([
      'puax_detect_trigger',
      'get_role_with_methodology',
    ]);
  });

  it('switch / 连败揭示降压与失败切换', () => {
    const names = extraToolsForTick('switch', ['consecutive_failures'], 'PostToolUse');
    expect(names).toEqual(expect.arrayContaining(['puax_switch_on_failure', 'puax_handle_breakthrough']));
  });

  it('PreCompact 揭示推理状态工具', () => {
    expect(extraToolsForTick('silent', [], 'PreCompact')).toContain('puax_update_reasoning_state');
  });

  it('WeakMap 按 owner 隔离 extras，并尝试发 list_changed', async () => {
    const n1 = { notification: jest.fn(async () => {}) };
    const n2 = { notification: jest.fn(async () => {}) };
    const added = await revealListedTools(['puax_switch_on_failure'], n1);
    expect(added).toEqual(['puax_switch_on_failure']);
    expect(n1.notification).toHaveBeenCalledWith({ method: 'notifications/tools/list_changed' });
    expect(listedExtraNames(n1)).toEqual(['puax_switch_on_failure']);
    expect(listedExtraNames(n2)).toEqual([]);
    const again = await revealListedTools(['puax_switch_on_failure'], n1);
    expect(again).toEqual([]);
    expect(n1.notification).toHaveBeenCalledTimes(1);
    resetListedTools(n1);
    expect(listedExtraNames(n1)).toEqual([]);
  });
});
