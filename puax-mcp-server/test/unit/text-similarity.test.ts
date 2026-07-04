import {
  tokenize,
  patternToSemanticPhrase,
  cosineSimilarity,
  tfIdfVector,
  buildIdf,
  hybridSimilarity,
  maxSemanticSimilarity,
  partialPhraseScore,
} from '../../src/core/text-similarity.js';

describe('text-similarity', () => {
  it('tokenize 应处理中英文', () => {
    const tokens = tokenize('为什么还不行 why not working');
    expect(tokens).toContain('why');
    expect(tokens.some(t => t.includes('为') || t === '为')).toBe(true);
  });

  it('patternToSemanticPhrase 应剥离正则元字符', () => {
    expect(patternToSemanticPhrase('尝试.*次仍未成功')).toBe('尝试 次仍未成功');
  });

  it('partialPhraseScore 应对 paraphrase 给高分', () => {
    const score = partialPhraseScore(
      '这问题超出了我的能力范围，没法继续了',
      '这超出了我的能力范围'
    );
    expect(score).toBeGreaterThanOrEqual(0.65);
  });
  it('hybridSimilarity 相似句得分高于无关句', () => {
    const a = hybridSimilarity('我无法解决这个问题', '我无法解决');
    const b = hybridSimilarity('今天天气不错', '我无法解决');
    expect(a).toBeGreaterThan(b);
  });

  it('maxSemanticSimilarity 返回最佳匹配', () => {
    const match = maxSemanticSimilarity('用户很沮丧，为什么还不行', [
      '为什么还不行',
      '任务完成',
    ]);
    expect(match).not.toBeNull();
    expect(match!.phrase).toContain('为什么');
    expect(match!.score).toBeGreaterThan(0);
  });

  it('cosineSimilarity 相同向量得 1', () => {
    const tokens = tokenize('hello world');
    const idf = buildIdf([tokens]);
    const vec = tfIdfVector(tokens, idf);
    expect(cosineSimilarity(vec, vec)).toBeCloseTo(1, 5);
  });
});
