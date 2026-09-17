import { globalAdapterRegistry } from '../../../src/platform-adapters/base-adapter.js';
import '../../../src/platform-adapters/register-all.js';
import { OpenCodeAdapter } from '../../../src/platform-adapters/opencode-adapter.js';

describe('register-all 适配器入口', () => {
  it('CLI / MCP / export 同一入口：原生 hook 宿主 + skill-md 扩展宿主齐', () => {
    const platforms = globalAdapterRegistry.getSupportedPlatforms();
    for (const id of [
      'cursor',
      'vscode',
      'claude-code',
      'opencode',
      'codebuddy',
      'kiro',
      'windsurf',
      'codex',
      'trae',
      'pi',
      'openclaw',
      'antigravity',
    ]) {
      expect(platforms).toContain(id);
    }
    expect(platforms.length).toBeGreaterThanOrEqual(12);
  });

  it('opencode 仍是专属适配器，不被 skill-md 覆盖', () => {
    expect(globalAdapterRegistry.get('opencode')).toBeInstanceOf(OpenCodeAdapter);
  });
});
