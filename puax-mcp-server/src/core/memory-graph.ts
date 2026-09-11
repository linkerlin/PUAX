/**
 * 仿 evolver.py memory_graph.jsonl：假设 / 尝试 / 结局 / 课记。
 * 不依赖 evolver 包，本地 JSONL。
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getPuaxHome } from '../utils/storage-paths.js';

export type MemoryNodeType = 'hypothesis' | 'attempt' | 'outcome' | 'lesson';

export interface MemoryNode {
  type: MemoryNodeType;
  ts: string;
  run_id?: string;
  session_id?: string;
  signals?: string[];
  role_id?: string;
  strategy?: string;
  success?: boolean;
  note?: string;
}

const MAX_READ = 200;

function graphPath(dir?: string): string {
  const base = dir || getPuaxHome();
  if (!existsSync(base)) mkdirSync(base, { recursive: true });
  return join(base, 'memory_graph.jsonl');
}

export class MemoryGraph {
  constructor(private readonly baseDir?: string) {}

  append(node: Omit<MemoryNode, 'ts'> & { ts?: string }): MemoryNode {
    const full: MemoryNode = {
      ...node,
      ts: node.ts || new Date().toISOString(),
    };
    appendFileSync(graphPath(this.baseDir), JSON.stringify(full) + '\n', 'utf-8');
    return full;
  }

  readRecent(n = 20): MemoryNode[] {
    const file = graphPath(this.baseDir);
    if (!existsSync(file)) return [];
    const lines = readFileSync(file, 'utf-8').split('\n').filter(Boolean);
    const slice = lines.slice(-Math.min(n, MAX_READ));
    const nodes: MemoryNode[] = [];
    for (const line of slice) {
      try {
        nodes.push(JSON.parse(line) as MemoryNode);
      } catch {
        // skip corrupt
      }
    }
    return nodes;
  }

  rotateIfHuge(maxBytes = 2_000_000): void {
    const file = graphPath(this.baseDir);
    if (!existsSync(file)) return;
    const content = readFileSync(file, 'utf-8');
    if (content.length <= maxBytes) return;
    const lines = content.split('\n').filter(Boolean);
    const kept = lines.slice(-Math.floor(lines.length / 2));
    writeFileSync(file, kept.join('\n') + '\n');
  }
}

export const memoryGraph = new MemoryGraph();
