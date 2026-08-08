/**
 * 平台适配器 hook 生成测试（Hook机制演进方案.md Phase 1 + 5.4）
 * 断言：--export 不再只发 skill 文件，还发宿主原生 hook 配置/脚本；
 * 生成的 hooks.json 结构与 per-harness 契约一致。
 */

import { globalAdapterRegistry } from '../../../src/platform-adapters/base-adapter.js';
import '../../../src/platform-adapters/claude-code-adapter.js';
import { OpenCodeAdapter } from '../../../src/platform-adapters/opencode-adapter.js';
import '../../../src/platform-adapters/cursor-adapter.js';
import '../../../src/platform-adapters/skill-md-platform-adapter.js';

describe('Platform adapter hook generation', () => {
  it('should register claude-code and opencode adapters', () => {
    const platforms = globalAdapterRegistry.getSupportedPlatforms();
    expect(platforms).toContain('claude-code');
    expect(platforms).toContain('opencode');
  });

  it('opencode has exactly one adapter (no duplicate registration with skill-md)', () => {
    // skill-md 的 EXTENDED_PLATFORMS 曾注册同名 'opencode'，注册表 Map 会静默覆盖；
    // 该测试断言注册的是专属适配器（含 Shape B 插件生成），而非 skill-md 通用版。
    const adapter = globalAdapterRegistry.get('opencode');
    expect(adapter).toBeInstanceOf(OpenCodeAdapter);
    const hooks = adapter!.generateHooks({ outputPath: '/tmp/x' } as never);
    // 专属适配器一定生成进程内插件；skill-md 通用版 generateHooks 返回空
    expect(hooks.some(h => h.path === '.opencode/plugins/puax.js')).toBe(true);
  });

  it('claude-code: generates hooks.json with SessionStart/PreToolUse/PostToolUse', () => {
    const adapter = globalAdapterRegistry.get('claude-code');
    expect(adapter).toBeDefined();
    const hooks = adapter!.generateHooks({ outputPath: '/tmp/x' } as never);
    const paths = hooks.map(h => h.path);
    expect(paths).toContain('hooks/hooks.json');
    expect(paths).toContain('hooks/hook.js');
    expect(paths).toContain('hooks/run-hook.cmd');
    expect(paths).toContain('hooks/session-start');
    expect(paths).toContain('hooks/pre-tool-use');
    expect(paths).toContain('hooks/post-tool-use');

    const hooksJson = JSON.parse(hooks.find(h => h.path === 'hooks/hooks.json')!.content);
    expect(hooksJson.hooks.SessionStart[0].matcher).toBe('startup|clear|compact');
    expect(hooksJson.hooks.SessionStart[0].hooks[0].async).toBe(false);
    expect(hooksJson.hooks.PreToolUse[0].matcher).toBe('Bash|Read|Write|Edit');
    expect(hooksJson.hooks.PostToolUse[0].matcher).toBe('Bash');
    // 所有事件都走引擎共享层单通路
    expect(hooksJson.hooks.SessionStart[0].hooks[0].command).toContain('hook.js');
  });

  it('snapshot: generated hook artifacts do not drift (regression guard)', () => {
    const claude = globalAdapterRegistry.get('claude-code')!.generateHooks({ outputPath: '/tmp/x' } as never);
    const cursor = globalAdapterRegistry.get('cursor')!.generateHooks({ outputPath: '/tmp/x' } as never);
    const opencode = globalAdapterRegistry.get('opencode')!.generateHooks({ outputPath: '/tmp/x' } as never);

    const claudeHooksJson = claude.find(h => h.path === 'hooks/hooks.json')!.content;
    const cursorHooksJson = cursor.find(h => h.path === 'hooks/hooks-cursor.json')!.content;
    const opencodePlugin = opencode.find(h => h.path === '.opencode/plugins/puax.js')!.content;

    expect(JSON.parse(claudeHooksJson)).toMatchSnapshot('claude-code hooks.json');
    expect(JSON.parse(cursorHooksJson)).toMatchSnapshot('cursor hooks-cursor.json');
    expect(opencodePlugin).toMatchSnapshot('opencode plugin puax.js');
  });

  it('cursor: generates hooks-cursor.json with lowercase sessionStart key', () => {
    const adapter = globalAdapterRegistry.get('cursor');
    const hooks = adapter!.generateHooks({ outputPath: '/tmp/x' } as never);
    const cursorJson = hooks.find(h => h.path === 'hooks/hooks-cursor.json');
    expect(cursorJson).toBeDefined();
    const parsed = JSON.parse(cursorJson!.content);
    expect(parsed.version).toBe(1);
    expect(parsed.hooks.sessionStart).toBeDefined();
    expect(parsed.hooks.sessionStart[0].command).toContain('hook.js');
  });

  it('opencode: generates .opencode/plugins/puax.js (Shape B)', () => {
    const adapter = globalAdapterRegistry.get('opencode');
    const hooks = adapter!.generateHooks({ outputPath: '/tmp/x' } as never);
    const plugin = hooks.find(h => h.path === '.opencode/plugins/puax.js');
    expect(plugin).toBeDefined();
    expect(plugin!.content).toContain('experimental.chat.messages.transform');
    expect(plugin!.content).toContain('EXTREMELY_IMPORTANT');
    expect(plugin!.content).toContain('puax-mcp-server');
    // Windows: npx 是 npx.cmd，execFileSync 不经 shell 不解析 .cmd（回归守卫）
    expect(plugin!.content).toContain("process.platform === 'win32' ? 'npx.cmd' : 'npx'");
  });

  it('opencode: role files land under .opencode/skills/ via export flow', () => {
    const adapter = globalAdapterRegistry.get('opencode');
    const role = {
      id: 'military-warrior', name: '狂战士', description: 'd', category: 'military',
      systemPrompt: 'p', triggerConditions: [], taskTypes: [], compatibleFlavors: [],
      metadata: { tone: 'strict', intensity: 'high', version: '1.0' }
    };
    // 经 export() 全流程验证文件落位（protected 方法不可直接访问，用公共入口断言）
    const result = adapter!.export([role as never], [], { outputPath: 'C:/Temp/opencode/hook-export-test' });
    expect(result.success).toBe(true);
    const normalize = (p: string) => p.replace(/\\/g, '/');
    expect(result.exportedFiles.some(f => normalize(f).includes('.opencode/skills/military-warrior.md'))).toBe(true);
    expect(result.exportedFiles.some(f => normalize(f).includes('.opencode/plugins/puax.js'))).toBe(true);
  });
});
