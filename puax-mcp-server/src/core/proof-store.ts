/**
 * 战功券（Solution Proof）：verify 过闸者留据（<100 tokens），
 * 供处境原语以真实战绩易假想对手。仿 memory_graph 之本地 JSONL。
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { getPuaxHome } from '../utils/storage-paths.js';
import { atomicWriteFileSync } from '../utils/atomic-write.js';

export interface SolutionProof {
  ts: string;
  role: string;
  task_digest: string;
  passed: number;
  total: number;
  rounds?: number;
  key_command?: string;
}

const MAX_READ = 200;

function proofPath(dir?: string): string {
  const base = dir || getPuaxHome();
  if (!existsSync(base)) mkdirSync(base, { recursive: true });
  return join(base, 'proofs.jsonl');
}

export class ProofStore {
  constructor(private readonly baseDir?: string) {}

  append(proof: Omit<SolutionProof, 'ts'> & { ts?: string }): SolutionProof {
    const full: SolutionProof = {
      ...proof,
      ts: proof.ts || new Date().toISOString(),
    };
    appendFileSync(proofPath(this.baseDir), JSON.stringify(full) + '\n', 'utf-8');
    this.rotateIfHuge();
    return full;
  }

  readRecent(n = 20): SolutionProof[] {
    const file = proofPath(this.baseDir);
    if (!existsSync(file)) return [];
    const lines = readFileSync(file, 'utf-8').split('\n').filter(Boolean);
    const slice = lines.slice(-Math.min(n, MAX_READ));
    const proofs: SolutionProof[] = [];
    for (const line of slice) {
      try {
        proofs.push(JSON.parse(line) as SolutionProof);
      } catch {
        // skip corrupt
      }
    }
    return proofs;
  }

  latestForRole(role: string): SolutionProof | null {
    const recent = this.readRecent(MAX_READ);
    for (let i = recent.length - 1; i >= 0; i--) {
      if (recent[i].role === role) return recent[i];
    }
    return null;
  }

  rotateIfHuge(maxBytes = 2_000_000): void {
    const file = proofPath(this.baseDir);
    if (!existsSync(file)) return;
    const content = readFileSync(file, 'utf-8');
    if (content.length <= maxBytes) return;
    const lines = content.split('\n').filter(Boolean);
    const kept = lines.slice(-Math.floor(lines.length / 2));
    atomicWriteFileSync(file, kept.join('\n') + '\n');
  }
}

export const proofStore = new ProofStore();
