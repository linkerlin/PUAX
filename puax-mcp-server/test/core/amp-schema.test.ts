/**
 * AMP/0.1 信封 ↔ JSON Schema 契约守门。
 * 背景：schema 是对第三方的机器可校验承诺——本测试用 ajv 对真实运行时产出的
 * 信封逐场景校验，schema 与实现任一方漂移即红。
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import Ajv from 'ajv';
import { toAmpEnvelope } from '../../src/core/amp.js';
import { runEvolveCycle, type TickEvent } from '../../src/core/evolve-cycle.js';

const SCHEMA_PATH = join(__dirname, '../../../', 'docs', 'schemas', 'amp-envelope.schema.json');

function validate(): ReturnType<Ajv['compile']> {
  const ajv = new Ajv({ strict: false });
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));
  return ajv.compile(schema);
}

function envelopeOf(sessionId: string, event: TickEvent, message?: string) {
  const result = runEvolveCycle({ session_id: sessionId, event, message });
  return toAmpEnvelope(result, sessionId, event);
}

describe('AMP/0.1 信封 schema 契约', () => {
  it('schema 文件可编译且要求五必备字段', () => {
    const v = validate();
    expect(v({ spec: 'AMP/0.1' })).toBe(false); // 缺 events/blocks/gate/state
  });

  it('静默拍信封通过校验', () => {
    const v = validate();
    const env = envelopeOf('amp-schema-silent', 'SessionStart');
    expect(v(env)).toBe(true);
  });

  it('失败升压拍信封通过校验（events 含 failure）', () => {
    const v = validate();
    const env = envelopeOf('amp-schema-fail', 'PostToolUse', undefined);
    expect(v(env)).toBe(true);
  });

  it('挫折消息拍信封通过校验', () => {
    const v = validate();
    const env = envelopeOf('amp-schema-msg', 'UserPromptSubmit', '为什么还不行？');
    expect(v(env)).toBe(true);
  });

  it('gate 枚举与实现一致：gate 值必在 schema 枚举内', () => {
    const v = validate();
    for (const sid of ['amp-schema-g1', 'amp-schema-g2', 'amp-schema-g3']) {
      const env = envelopeOf(sid, 'Manual', `连败语境 ${sid}`);
      expect(v(env)).toBe(true);
    }
  });

  it('非法信封被拒（gate 越枚举 / pressure 越界 / spec 错版）', () => {
    const v = validate();
    const base = envelopeOf('amp-schema-bad', 'Manual');
    expect(v({ ...base, gate: 'not-a-gate' })).toBe(false);
    expect(v({ ...base, state: { ...base.state, pressure: 9 } })).toBe(false);
    expect(v({ ...base, spec: 'AMP/0.2-unreleased' })).toBe(false);
  });
});
