#!/usr/bin/env node
/**
 * 同步 Claude Code 插件分发的 hooks 产物（单一数据源）
 *
 * 用法: node scripts/sync-distribution-hooks.js
 * 前置: 已 build（npm run build）
 *
 * 从 claude-code 平台适配器的 generateHooks() 生成产物到
 * distributions/claude-code/hooks/，确保插件分发与 --export=claude-code 一致，
 * 避免手工维护两份配置漂移（Hook机制演进方案.md 5.4 配置回归）。
 */

const fs = require('fs');
const path = require('path');

const { globalAdapterRegistry } = require('../build/platform-adapters/base-adapter.js');
require('../build/platform-adapters/claude-code-adapter.js');

const outDir = path.resolve(__dirname, '../../distributions/claude-code');

const adapter = globalAdapterRegistry.get('claude-code');
if (!adapter) {
  console.error('claude-code adapter not registered. Run: npm run build');
  process.exit(1);
}

const hooks = adapter.generateHooks({ outputPath: outDir });
let count = 0;
for (const file of hooks) {
  const filePath = path.join(outDir, file.path);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, file.content, 'utf-8');
  console.log(`  ✓ ${file.path}`);
  count++;
}
console.log(`Synced ${count} hook files to distributions/claude-code/hooks/`);
