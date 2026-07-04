/**
 * 轻量 TF-IDF + 余弦相似度（无外部 ML 依赖）
 * 用于触发检测的语义补充路径
 */

/** 分词：中文按字/双字切分，英文按单词 */
export function tokenize(text: string): string[] {
  const normalized = text.toLowerCase().trim();
  if (!normalized) return [];

  const tokens: string[] = [];
  const english = normalized.match(/[a-z0-9]+/g);
  if (english) tokens.push(...english);

  const cjk = normalized.replace(/[a-z0-9\s]+/g, '');
  for (let i = 0; i < cjk.length; i++) {
    tokens.push(cjk[i]);
    if (i + 1 < cjk.length) tokens.push(cjk.slice(i, i + 2));
  }

  return tokens.filter(t => t.length > 0);
}

/** 将正则模式转为语义短语（去掉 .* 等） */
export function patternToSemanticPhrase(pattern: string): string {
  return pattern
    .replace(/\\./g, ' ')
    .replace(/[.*+?^${}()|[\]\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function termFreq(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) ?? 0) + 1);
  }
  const len = tokens.length || 1;
  for (const [k, v] of tf) {
    tf.set(k, v / len);
  }
  return tf;
}

/** 从语料库构建 IDF */
export function buildIdf(corpus: string[][]): Map<string, number> {
  const df = new Map<string, number>();
  const n = corpus.length || 1;

  for (const doc of corpus) {
    const seen = new Set(doc);
    for (const term of seen) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [term, count] of df) {
    idf.set(term, Math.log((n + 1) / (count + 1)) + 1);
  }
  return idf;
}

export function tfIdfVector(tokens: string[], idf: Map<string, number>): Map<string, number> {
  const tf = termFreq(tokens);
  const vec = new Map<string, number>();
  for (const [term, freq] of tf) {
    vec.set(term, freq * (idf.get(term) ?? 1));
  }
  return vec;
}

export function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  if (a.size === 0 || b.size === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const [k, v] of a) {
    normA += v * v;
    if (b.has(k)) dot += v * (b.get(k) ?? 0);
  }
  for (const v of b.values()) normB += v * v;

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export interface SemanticMatch {
  phrase: string;
  score: number;
}

/** 文本与多条短语的语义相似度（取最高） */
export function maxSemanticSimilarity(
  text: string,
  phrases: string[],
  idf?: Map<string, number>
): SemanticMatch | null {
  const textTokens = tokenize(text);
  if (textTokens.length === 0 || phrases.length === 0) return null;

  const corpus = [textTokens, ...phrases.map(p => tokenize(p))];
  const sharedIdf = idf ?? buildIdf(corpus);
  const textVec = tfIdfVector(textTokens, sharedIdf);

  let best: SemanticMatch | null = null;
  for (const phrase of phrases) {
    const clean = patternToSemanticPhrase(phrase);
    if (!clean || clean.length < 2) continue;
    const phraseVec = tfIdfVector(tokenize(clean), sharedIdf);
    const score = cosineSimilarity(textVec, phraseVec);
    if (!best || score > best.score) {
      best = { phrase: clean, score };
    }
  }

  return best;
}

/** Jaccard 字符集相似度（短文本补充） */
export function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.replace(/\s/g, ''));
  const setB = new Set(b.replace(/\s/g, ''));
  if (setA.size === 0 || setB.size === 0) return 0;
  let inter = 0;
  for (const c of setA) {
    if (setB.has(c)) inter++;
  }
  return inter / (setA.size + setB.size - inter);
}

/** 子串/片段重叠得分（中文 paraphrase 友好） */
export function partialPhraseScore(text: string, phrase: string): number {
  const normText = text.replace(/\s/g, '').toLowerCase();
  const normPhrase = phrase.replace(/\s/g, '').toLowerCase();
  if (!normPhrase || !normText) return 0;
  if (normText.includes(normPhrase)) return 1;

  let best = 0;
  const minLen = Math.min(4, normPhrase.length);
  for (let len = normPhrase.length; len >= minLen; len--) {
    for (let i = 0; i <= normPhrase.length - len; i++) {
      const sub = normPhrase.slice(i, i + len);
      if (normText.includes(sub)) {
        best = Math.max(best, len / normPhrase.length);
      }
    }
    if (best >= 0.85) break;
  }
  return best;
}

/** 混合得分：子串 + TF-IDF + Jaccard */
export function hybridSimilarity(text: string, phrase: string): number {
  const partial = partialPhraseScore(text, phrase);
  if (partial >= 0.65) {
    return Math.min(1, partial * 0.85 + 0.15);
  }
  const semantic = maxSemanticSimilarity(text, [phrase]);
  const jaccard = jaccardSimilarity(text, phrase);
  const tfidfScore = semantic?.score ?? 0;
  return Math.min(1, Math.max(partial * 0.9, tfidfScore * 0.6 + jaccard * 0.25 + partial * 0.15));
}
