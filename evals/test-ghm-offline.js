#!/usr/bin/env node
/**
 * GHM 离线守门：铁律仍在源码，泄漏路径仍拒绝无印。
 */
const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

const ROOT = join(__dirname, '..');
const MCP = join(ROOT, 'puax-mcp-server');

function mustContain(file, needles, label) {
  if (!existsSync(file)) throw new Error(`missing ${label}: ${file}`);
  const text = readFileSync(file, 'utf-8');
  for (const n of needles) {
    if (!text.includes(n)) throw new Error(`${label} 缺少: ${n}`);
  }
}

mustContain(
  join(ROOT, 'docs/GHM.md'),
  ['知情入梦', '标记隔离', '随时可醒', '醒后必验', '永不自动升格'],
  'GHM.md'
);

mustContain(
  join(MCP, 'src/tools/dreamscape.ts'),
  ['puax_enter_dreamscape', 'puax_awaken', 'puax_convergence_audit', 'dream_context_ref'],
  'dreamscape.ts'
);

mustContain(
  join(MCP, 'test/tools/dreamscape.test.ts'),
  ['无印', '永不自动升格'],
  'dreamscape.test.ts'
);

console.log('GHM offline gates passed');
