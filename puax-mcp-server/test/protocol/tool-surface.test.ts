import { V4_PUBLIC_VERBS, getToolSurface, selectListedTools } from '../../src/core/v4-dashboard.js';
import { Tools } from '../../src/tools/index.js';

describe('tools/list 表面：默认 13 黄金动词', () => {
  const original = process.env.PUAX_TOOL_SURFACE;

  afterEach(() => {
    if (original === undefined) delete process.env.PUAX_TOOL_SURFACE;
    else process.env.PUAX_TOOL_SURFACE = original;
  });

  it('默认 public', () => {
    delete process.env.PUAX_TOOL_SURFACE;
    expect(getToolSurface()).toBe('public');
  });

  it('public 只列出 13 个黄金动词且顺序与 V4_PUBLIC_VERBS 一致', () => {
    const listed = selectListedTools(Tools as Array<{ name: string }>, 'public');
    expect(listed.map((t) => t.name)).toEqual([...V4_PUBLIC_VERBS]);
  });

  it('full 下列出全部注册工具且黄金动词仍前置', () => {
    const listed = selectListedTools(Tools as Array<{ name: string }>, 'full');
    expect(listed.length).toBe((Tools as unknown[]).length);
    expect(listed.slice(0, V4_PUBLIC_VERBS.length).map((t) => t.name)).toEqual([...V4_PUBLIC_VERBS]);
  });
});
