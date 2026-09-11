/**
 * GHM 发散度代理指标（无 LLM）：
 * distinct-n、语义半径（1 - 平均 pairwise Jaccard）、假设存活率。
 */

import { tokenize } from './text-similarity.js';

export function ngrams(tokens: string[], n: number): string[] {
  if (n <= 1) return tokens;
  const grams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    grams.push(tokens.slice(i, i + n).join('\u0001'));
  }
  return grams;
}

/** distinct-n：unique n-grams / total n-grams，越高越散。 */
export function distinctN(texts: string[], n = 2): number {
  const grams: string[] = [];
  for (const t of texts) {
    grams.push(...ngrams(tokenize(t), n));
  }
  if (grams.length === 0) return 0;
  return new Set(grams).size / grams.length;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 1 : inter / union;
}

/** 语义半径：1 - 平均 pairwise token Jaccard。0=全同，1=互不重叠。 */
export function semanticRadius(texts: string[]): number {
  const sets = texts.map(t => new Set(tokenize(t)));
  if (sets.length < 2) return 0;
  let sum = 0;
  let pairs = 0;
  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      sum += jaccard(sets[i], sets[j]);
      pairs++;
    }
  }
  return 1 - sum / pairs;
}

/** 假设存活率：通过独立验证的假设 / 提出的假设。 */
export function hypothesisSurvival(proposed: string[], verified: string[]): number {
  if (proposed.length === 0) return 0;
  const v = new Set(verified.map(s => s.trim()));
  const survived = proposed.filter(p => v.has(p.trim())).length;
  return survived / proposed.length;
}
