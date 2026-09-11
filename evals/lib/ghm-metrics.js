/**
 * GHM 离线指标（无 LLM），与 src/core/ghm-metrics.ts 同口径。
 */

function tokenize(text) {
  const normalized = String(text || '').toLowerCase().trim();
  if (!normalized) return [];
  const tokens = [];
  const english = normalized.match(/[a-z0-9]+/g);
  if (english) tokens.push(...english);
  const cjk = normalized.replace(/[a-z0-9\s]+/g, '');
  for (let i = 0; i < cjk.length; i++) {
    tokens.push(cjk[i]);
    if (i + 1 < cjk.length) tokens.push(cjk.slice(i, i + 2));
  }
  return tokens.filter(Boolean);
}

function ngrams(tokens, n) {
  if (n <= 1) return tokens;
  const grams = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    grams.push(tokens.slice(i, i + n).join('\u0001'));
  }
  return grams;
}

function distinctN(texts, n = 2) {
  const grams = [];
  for (const t of texts) grams.push(...ngrams(tokenize(t), n));
  if (grams.length === 0) return 0;
  return new Set(grams).size / grams.length;
}

function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 1 : inter / union;
}

function semanticRadius(texts) {
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

function hypothesisSurvival(proposed, verified) {
  if (!proposed.length) return 0;
  const v = new Set(verified.map(s => s.trim()));
  return proposed.filter(p => v.has(p.trim())).length / proposed.length;
}

module.exports = { tokenize, distinctN, semanticRadius, hypothesisSurvival };
