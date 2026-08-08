/**
 * Hook 产物一致性集成测试（Hook机制演进方案.md 5.4 配置回归）
 *
 * 断言：
 * 1. distributions/claude-code/hooks/ 与 claude-code adapter 生成产物逐字节一致
 *    （单一数据源，防两处漂移）；
 * 2. 示例配置 config/hooks.example.json 是合法 JSON 且可被 hook-config 加载。
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { globalAdapterRegistry } from '../../../src/platform-adapters/base-adapter.js';
import '../../../src/platform-adapters/claude-code-adapter.js';

const REPO_ROOT = resolve(__dirname, '../../../../');
const DIST_HOOKS_DIR = join(REPO_ROOT, 'distributions', 'claude-code', 'hooks');

describe('Hook artifact consistency', () => {
  it('distribution hooks match claude-code adapter output (single source of truth)', () => {
    const adapter = globalAdapterRegistry.get('claude-code');
    const generated = adapter!.generateHooks({ outputPath: '/tmp/x' } as never);

    expect(generated.length).toBeGreaterThan(0);
    for (const file of generated) {
      const distPath = join(DIST_HOOKS_DIR, file.path.replace('hooks/', ''));
      expect(existsSync(distPath)).toBe(true);
      expect(readFileSync(distPath, 'utf-8')).toBe(file.content);
    }
  });

  it('distribution hooks.json registers all three events', () => {
    const distHooks = JSON.parse(readFileSync(join(DIST_HOOKS_DIR, 'hooks.json'), 'utf-8'));
    expect(distHooks.hooks.SessionStart).toBeDefined();
    expect(distHooks.hooks.PreToolUse).toBeDefined();
    expect(distHooks.hooks.PostToolUse).toBeDefined();
  });
});

describe('config/hooks.example.json', () => {
  it('is valid JSON loadable by hook-config', () => {
    const examplePath = join(REPO_ROOT, 'config', 'hooks.example.json');
    expect(existsSync(examplePath)).toBe(true);
    const { getTriggerPatterns, resetHookConfigCache } = require('../../../src/hooks/hook-config.js');
    const patterns = getTriggerPatterns(examplePath);
    // 示例配置生效：自定义词可用，清空的组为空
    expect(patterns.userFrustration.zh.patterns).toContain('我的专属暗号');
    expect(patterns.givingUp.zh.patterns).toEqual([]);
    // 未覆盖子表沿用内置
    expect(patterns.userFrustration.en.patterns.length).toBeGreaterThan(0);
    resetHookConfigCache();
  });
});
