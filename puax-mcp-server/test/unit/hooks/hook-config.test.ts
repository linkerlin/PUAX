/**
 * Hook 配置外置测试（Hook机制演进方案.md P3-19）
 *
 * 断言：
 * 1. 无覆盖时默认模式 = 内置 TRIGGER_PATTERNS；
 * 2. 用户覆盖文件按"子表级替换"合并（覆盖子表整体替换，未覆盖子表沿用内置——
 *    加词不丢旧词）；
 * 3. 空 patterns 数组等效清空该子表；
 * 4. 配置缺失/非法 JSON 一律回退默认，不抛错（优雅降级契约）；
 * 5. 检测器实际使用合并后的模式（自定义词可触发）。
 */

import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { getTriggerPatterns, resetHookConfigCache } from '../../../src/hooks/hook-config.js';
import { TRIGGER_PATTERNS } from '../../../src/hooks/trigger-patterns.js';
import { enhancedTriggerDetector } from '../../../src/hooks/trigger-detector-enhanced.js';
import { stateManager } from '../../../src/hooks/state-manager.js';

let tmpDir: string;
let configPath: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'puax-hook-config-'));
  configPath = join(tmpDir, 'hooks.json');
  resetHookConfigCache();
});

afterEach(() => {
  delete process.env.PUAX_HOOKS_CONFIG;
  resetHookConfigCache();
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('getTriggerPatterns (config externalization)', () => {
  it('returns built-in patterns when no override file exists', () => {
    const patterns = getTriggerPatterns(configPath);
    expect(patterns).toEqual(TRIGGER_PATTERNS);
  });

  it('replaces whole subtable from user override (subtable-level semantics)', () => {
    writeFileSync(configPath, JSON.stringify({
      triggerPatterns: {
        userFrustration: {
          zh: { patterns: ['用户自定义咒语'], weight: 2.0 }
        }
      }
    }), 'utf-8');

    const patterns = getTriggerPatterns(configPath);
    // 覆盖子表：整体替换
    expect(patterns.userFrustration.zh.patterns).toEqual(['用户自定义咒语']);
    expect(patterns.userFrustration.zh.weight).toBe(2.0);
    expect(patterns.userFrustration.zh.patterns).not.toContain('还不行');
    // 未覆盖子表（en）：沿用内置——加词不丢旧词
    expect(patterns.userFrustration.en).toEqual(TRIGGER_PATTERNS.userFrustration.en);
    // 未覆盖组：沿用内置
    expect(patterns.givingUp).toEqual(TRIGGER_PATTERNS.givingUp);
    expect(patterns.bashFailure).toEqual(TRIGGER_PATTERNS.bashFailure);
  });

  it('empty patterns array clears a subtable', () => {
    writeFileSync(configPath, JSON.stringify({
      triggerPatterns: {
        userFrustration: {
          zh: { patterns: [], weight: 1.0 }
        }
      }
    }), 'utf-8');

    const patterns = getTriggerPatterns(configPath);
    expect(patterns.userFrustration.zh.patterns).toEqual([]);
    expect(patterns.userFrustration.en).toEqual(TRIGGER_PATTERNS.userFrustration.en);
  });

  it('falls back to defaults on invalid JSON (graceful degradation)', () => {
    writeFileSync(configPath, '{ not valid json', 'utf-8');
    expect(() => getTriggerPatterns(configPath)).not.toThrow();
    expect(getTriggerPatterns(configPath)).toEqual(TRIGGER_PATTERNS);
  });

  it('falls back to defaults when triggerPatterns section missing', () => {
    writeFileSync(configPath, JSON.stringify({ hooks: {} }), 'utf-8');
    expect(getTriggerPatterns(configPath)).toEqual(TRIGGER_PATTERNS);
  });

  it('rejects invalid subtables instead of corrupting patterns (regression)', () => {
    writeFileSync(configPath, JSON.stringify({
      triggerPatterns: {
        userFrustration: {
          // patterns 是字符串：必须拒绝，否则 for...of 迭代成单字符正则导致假触发
          zh: { patterns: 'xy', weight: 1.0 },
          // weight 非法
          en: { patterns: ['ok'], weight: '1' }
        },
        givingUp: {
          zh: { patterns: ['合法的'], weight: 1.2 }
        }
      }
    }), 'utf-8');

    const patterns = getTriggerPatterns(configPath);
    // 非法子表整体跳过 → 沿用内置
    expect(patterns.userFrustration.zh).toEqual(TRIGGER_PATTERNS.userFrustration.zh);
    expect(patterns.userFrustration.en).toEqual(TRIGGER_PATTERNS.userFrustration.en);
    // 合法子表正常覆盖
    expect(patterns.givingUp.zh.patterns).toEqual(['合法的']);
  });
});

describe('detector uses merged patterns', () => {
  it('custom pattern from override triggers detection', () => {
    writeFileSync(configPath, JSON.stringify({
      triggerPatterns: {
        userFrustration: {
          zh: { patterns: ['我的专属暗号'], weight: 1.0 }
        }
      }
    }), 'utf-8');
    // 让检测器（无参调用 getTriggerPatterns）读到测试配置
    process.env.PUAX_HOOKS_CONFIG = configPath;
    resetHookConfigCache();

    const sessionId = `config-test_${Date.now()}`;
    stateManager.clearSessionState(sessionId);
    const result = enhancedTriggerDetector.detect({
      sessionId,
      eventType: 'UserPromptSubmit',
      message: '我的专属暗号 出现了！'
    });

    expect(result.triggered).toBe(true);
    expect(result.triggerType).toBe('userFrustration');
    expect(result.metadata.matchedPatterns).toContain('我的专属暗号');
  });

  it('built-in pattern still triggers when override only adds a new group', () => {
    writeFileSync(configPath, JSON.stringify({
      triggerPatterns: {
        customGroup: {
          zh: { patterns: ['自成一派'], weight: 1.0 }
        }
      }
    }), 'utf-8');
    process.env.PUAX_HOOKS_CONFIG = configPath;
    resetHookConfigCache();

    const sessionId = `config-test2_${Date.now()}`;
    stateManager.clearSessionState(sessionId);
    const result = enhancedTriggerDetector.detect({
      sessionId,
      eventType: 'UserPromptSubmit',
      message: '为什么还不行！'
    });

    expect(result.triggered).toBe(true);
  });
});
