#!/usr/bin/env node
/**
 * PUAX 行为协议 + 场景评测入口（无需 LLM）
 * 对标 pua evals/test-behavior.sh 的静态守门层
 */
const { execSync } = require('child_process');
const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

const ROOT = join(__dirname, '..');
const MCP = join(ROOT, 'puax-mcp-server');

let pass = 0;
let fail = 0;

function run(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    pass++;
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    fail++;
  }
}

console.log('=== PUAX Eval Runner (protocol layer) ===\n');

run('场景 JSON 结构', () => {
  execSync('node evals/validate-scenarios.js', { cwd: ROOT, stdio: 'pipe' });
});

run('元数据一致性', () => {
  execSync('node scripts/validate-metadata.js', { cwd: MCP, stdio: 'pipe' });
});

run('协议合规 Jest', () => {
  execSync('npm test -- test/evals/protocol-compliance.test.ts --silent', {
    cwd: MCP,
    stdio: 'pipe',
  });
});

run('CHANGELOG 含 v3.8', () => {
  const changelog = readFileSync(join(MCP, 'CHANGELOG.md'), 'utf-8');
  if (!changelog.includes('3.10.0')) throw new Error('CHANGELOG 缺少 3.10.0');
  if (!changelog.includes('3.10.1')) throw new Error('CHANGELOG 缺少 3.10.1');
});

run('方法论指南已生成', () => {
  const guide = join(ROOT, 'templates/military-methodology-guide.md');
  if (!existsSync(guide)) throw new Error('缺少 templates/military-methodology-guide.md');
  const content = readFileSync(guide, 'utf-8');
  if (!content.includes('AUTO-GENERATED')) throw new Error('指南未标记 AUTO-GENERATED');
});

run('prompts bundle 按类别拆分', () => {
  const manifest = join(MCP, 'src/prompts/skill-manifest.ts');
  const military = join(MCP, 'src/prompts/bundles/bundle-military.ts');
  if (!existsSync(manifest) || !existsSync(military)) {
    throw new Error('缺少 skill-manifest 或 bundles/bundle-military.ts');
  }
  const content = readFileSync(manifest, 'utf-8');
  const count = (content.match(/id:/g) || []).length;
  if (count < 50) throw new Error(`manifest 角色数不足: ${count}`);
});

run('L4 runner 可执行', () => {
  execSync('node evals/run-l4.js list', { cwd: ROOT, stdio: 'pipe' });
});

run('L4 离线自检', () => {
  execSync('node evals/test-l4-offline.js', { cwd: ROOT, stdio: 'pipe' });
});

run('L4 治理评测（无 LLM）', () => {
  execSync('node evals/test-governance.js', { cwd: ROOT, stdio: 'pipe' });
});

run('会话心跳评测（无 LLM）', () => {
  execSync('node evals/test-heartbeat.js', { cwd: ROOT, stdio: 'pipe' });
});

run('性能基准（无 LLM）', () => {
  execSync('node evals/benchmark.js', { cwd: ROOT, stdio: 'pipe' });
});

run('distributions 存在', () => {
  if (!existsSync(join(ROOT, 'distributions/INSTALL.md'))) {
    throw new Error('缺少 distributions/INSTALL.md');
  }
});

console.log(`\nPassed: ${pass}, Failed: ${fail}`);
process.exit(fail > 0 ? 1 : 0);
