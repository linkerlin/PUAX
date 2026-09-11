#!/usr/bin/env node
/**
 * GHM 发散度：distinct-n / 语义半径 / 假设存活率（无 LLM）。
 * 同质产物半径应低，议会式异质产物半径应高。
 */
const { distinctN, semanticRadius, hypothesisSurvival } = require('./lib/ghm-metrics');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const clone = [
  '用缓存兜底登录',
  '用缓存兜底登录接口',
  '登录用缓存来兜底',
];
const diverse = [
  '本地只读缓存兜底登录',
  '把认证拆成签发与校验两条路径',
  '失败时返回只读游客态而不是 500',
  '用熔断器切断上游而不是重试死循环',
];

const cloneN = distinctN(clone, 2);
const diverseN = distinctN(diverse, 2);
assert(diverseN > cloneN, `distinct-n 应让异质文本更高: ${diverseN} vs ${cloneN}`);

const cloneR = semanticRadius(clone);
const diverseR = semanticRadius(diverse);
assert(diverseR > cloneR, `语义半径 异质应更大: ${diverseR} vs ${cloneR}`);

const survival = hypothesisSurvival(
  ['A 缓存兜底', 'B 熔断', 'C 游客态'],
  ['A 缓存兜底']
);
assert(Math.abs(survival - 1 / 3) < 1e-9, `存活率应为 1/3，实际 ${survival}`);
assert(hypothesisSurvival([], ['x']) === 0, '空提出应 0');

console.log(`GHM divergence ok  distinct-n clone=${cloneN.toFixed(3)} diverse=${diverseN.toFixed(3)}  radius clone=${cloneR.toFixed(3)} diverse=${diverseR.toFixed(3)}`);
