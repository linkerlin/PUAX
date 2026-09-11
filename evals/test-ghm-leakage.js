#!/usr/bin/env node
/**
 * GHM 泄漏守门：源码必须拒绝污染 / 伪造印 / 免罪修辞。
 */
const { readFileSync } = require('fs');
const { join } = require('path');

const src = readFileSync(
  join(__dirname, '..', 'puax-mcp-server', 'src', 'tools', 'dreamscape.ts'),
  'utf-8'
);

const needles = [
  '无印拒收',
  '免罪修辞',
  '补票',
  'DREAM_MARK',
  '永不自动升格',
];

for (const n of needles) {
  if (!src.includes(n)) throw new Error(`dreamscape.ts 缺少泄漏防御: ${n}`);
}

console.log('GHM leakage source gates passed');
