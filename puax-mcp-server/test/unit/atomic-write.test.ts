/**
 * 原子写工具守门：内容正确、整替旧档、无临时残留、失败可抛。
 */

import { mkdtempSync, rmSync, readdirSync, readFileSync, existsSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { atomicWriteFileSync } from '../../src/utils/atomic-write.js';

describe('atomicWriteFileSync', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'puax-atomic-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('写入新文件且内容一致', () => {
    const target = join(dir, 'state.json');
    atomicWriteFileSync(target, '{"a":1}');
    expect(readFileSync(target, 'utf-8')).toBe('{"a":1}');
  });

  it('整体替换已存在的旧档', () => {
    const target = join(dir, 'state.json');
    writeFileSync(target, '{"old":true}', 'utf-8');
    atomicWriteFileSync(target, '{"new":true}');
    expect(JSON.parse(readFileSync(target, 'utf-8'))).toEqual({ new: true });
  });

  it('成功写入后目录内无 .tmp 残留', () => {
    const target = join(dir, 'state.json');
    atomicWriteFileSync(target, 'x');
    atomicWriteFileSync(target, 'y');
    const leftovers = readdirSync(dir).filter(f => f.includes('.tmp-'));
    expect(leftovers).toEqual([]);
  });

  it('目标目录不存在时照常抛错，且不残留 tmp 文件', () => {
    const target = join(dir, 'no-such-dir', 'state.json');
    expect(() => atomicWriteFileSync(target, 'x')).toThrow();
    expect(existsSync(dir)).toBe(true);
    // 失败发生在 writeFileSync(tmp) 阶段，tmp 与目标同目录，故 dir 本层无残留
    expect(readdirSync(dir).filter(f => f.includes('.tmp-'))).toEqual([]);
  });
});
