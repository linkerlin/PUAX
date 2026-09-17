/**
 * 触发器目录一致性契约门。
 *
 * 模式源已与 YAML 目录 id 对齐。本测试锁死：模式键 ⊆ YAML 目录；
 * 旧 camelCase 别名仍归一。生命周期发射（preCompact/stopFeedback）不进目录。
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';
import { TRIGGER_PATTERNS } from '../../src/hooks/trigger-patterns.js';
import { normalizeTriggerId } from '../../src/core/evolve-cycle.js';

const YAML_PATH = join(__dirname, '../../', 'src', 'data', 'triggers.yaml');

/** 生命周期事件：检测器会发射但语义上不是 YAML 触发词（信号层按原样消费） */
const LIFECYCLE_EMISSIONS = ['preCompact', 'stopFeedback', 'none'];

function yamlTriggerIds(): Set<string> {
  const doc = YAML.parse(readFileSync(YAML_PATH, 'utf-8')) as { triggers: Record<string, unknown> };
  return new Set(Object.keys(doc.triggers || {}));
}

describe('触发器目录一致性（别名缝合层契约）', () => {
  const yamlIds = yamlTriggerIds();

  it('YAML 目录可加载且含核心触发词', () => {
    expect(yamlIds.size).toBeGreaterThanOrEqual(15);
    for (const id of ['user_frustration', 'consecutive_failures', 'passive_wait', 'surface_fix', 'tool_underuse']) {
      expect(yamlIds.has(id)).toBe(true);
    }
  });

  it('TRIGGER_PATTERNS 的每个模式键都是 YAML 目录 id', () => {
    const patternKeys = Object.keys(TRIGGER_PATTERNS);
    expect(patternKeys.length).toBeGreaterThan(0);
    for (const key of patternKeys) {
      expect(yamlIds.has(key)).toBe(true);
      expect(normalizeTriggerId(key)).toBe(key);
      expect(key).toMatch(/^[a-z][a-z_]+$/);
    }
  });

  it('旧 camelCase 别名仍归一到目录 id', () => {
    expect(normalizeTriggerId('userFrustration')).toBe('user_frustration');
    expect(normalizeTriggerId('bashFailure')).toBe('consecutive_failures');
    expect(normalizeTriggerId('noSearch')).toBe('tool_underuse');
  });

  it('生命周期发射保留原样（不强制映射进 YAML）', () => {
    for (const id of LIFECYCLE_EMISSIONS) {
      expect(normalizeTriggerId(id)).toBe(id);
    }
  });
});
