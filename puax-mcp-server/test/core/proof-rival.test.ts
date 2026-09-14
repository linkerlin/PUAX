/**
 * 战功券（Solution Proof）与真实战绩注入（Live Rival）
 */

import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ArenaStore } from '../../src/core/arena.js';
import { ProofStore } from '../../src/core/proof-store.js';

describe('战功券与真实战绩注入', () => {
  it('战功券落盘，可按角色取最新', () => {
    const dir = mkdtempSync(join(tmpdir(), 'puax-proof-'));
    const proofs = new ProofStore(dir);
    proofs.append({ role: 'military-warrior', task_digest: '修复 sqlite 锁', passed: 3, total: 4, rounds: 5, key_command: 'npm test' });
    proofs.append({ role: 'shaman-musk', task_digest: '发散', passed: 1, total: 1 });
    expect(proofs.readRecent()).toHaveLength(2);
    expect(proofs.latestForRole('military-warrior')?.key_command).toBe('npm test');
    expect(proofs.latestForRole('dream-artisan')).toBeNull();
    rmSync(dir, { recursive: true, force: true });
  });

  it('无战功或未指角色时，对手行保持原配', () => {
    const dir = mkdtempSync(join(tmpdir(), 'puax-arena-noproof-'));
    const arena = new ArenaStore(dir);
    arena.set({});
    expect(arena.compileInjection(undefined, 'military-warrior', new ProofStore(dir))).toContain('另一路 Agent');
    expect(arena.compileInjection()).toContain('另一路 Agent');
    rmSync(dir, { recursive: true, force: true });
  });

  it('同袍有战功时，对手行换为真实战绩', () => {
    const dir = mkdtempSync(join(tmpdir(), 'puax-arena-proof-'));
    const arena = new ArenaStore(dir);
    arena.set({});
    const proofs = new ProofStore(dir);
    proofs.append({ role: 'military-warrior', task_digest: '修复 sqlite 锁', passed: 16, total: 16, rounds: 4, key_command: 'npm test -- sqlite' });
    const inj = arena.compileInjection(undefined, 'military-warrior', proofs);
    expect(inj).toContain('[PUAX-ARENA]');
    expect(inj).toContain('npm test -- sqlite');
    expect(inj).toContain('16/16');
    expect(inj).toContain('第 4 轮');
    expect(inj).not.toContain('另一路 Agent');
    rmSync(dir, { recursive: true, force: true });
  });
});
