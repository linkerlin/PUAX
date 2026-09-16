/**
 * 触发器目录一致性契约门。
 *
 * 背景：仓库曾有并行的触发器命名空间——hooks 检测器发射 camelCase（userFrustration/
 * bashFailure/...），YAML 目录与策略/角色映射说 snake_case（user_frustration/
 * consecutive_failures/...），靠 evolve-cycle 的 TRIGGER_ALIASES 缝合。曾发生真实漂移：
 * 死键 passiveWaiting（真实发射 passiveWait）、surfaceFix/noSearch 无别名裸奔。
 * 本测试锁死三方对齐：别名表 ↔ 模式目录 ↔ YAML 目录。
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

  it('TRIGGER_PATTERNS 的每个模式键都有归一去处（防新增触发词裸奔）', () => {
    const patternKeys = new Set(Object.keys(TRIGGER_PATTERNS));
    expect(patternKeys.size).toBeGreaterThan(0);
    for (const key of patternKeys) {
      const normalized = normalizeTriggerId(key);
      const ok = yamlIds.has(normalized);
      expect(
        `模式键 "${key}" 归一为 "${normalized}"，YAML 目录${ok ? '命中' : '无此 id'}`
      ).toContain('命中');
    }
  });

  it('归一后的 id 不会自我循环或退化为未知形态', () => {
    for (const key of Object.keys(TRIGGER_PATTERNS)) {
      const n = normalizeTriggerId(key);
      expect(n).not.toBe(key); // camel 键必须被映射
      expect(n).toMatch(/^[a-z][a-z_]+$/); // snake_case 形态
    }
  });

  it('生命周期发射保留原样（不强制映射进 YAML）', () => {
    for (const id of LIFECYCLE_EMISSIONS) {
      expect(normalizeTriggerId(id)).toBe(id);
    }
  });
});
