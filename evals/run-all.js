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

run('AMB v0 记分卡', () => {
  execSync('node evals/amb-scorecard.js', { cwd: ROOT, stdio: 'pipe' });
});

run('硅基剧场本机演练', () => {
  execSync('node evals/silicon-theater.js', { cwd: ROOT, stdio: 'pipe' });
});

run('AMB 多模型可复现矩阵', () => {
  execSync('node evals/multi-model-amb.js --dry-run', { cwd: ROOT, stdio: 'pipe' });
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

run('CHANGELOG 版本链完整（3.10 → 当前）', () => {
  const changelog = readFileSync(join(MCP, 'CHANGELOG.md'), 'utf-8');
  const required = ['3.10.0', '3.10.1', '4.0.0', '4.1.0', '4.2.0', '4.3.0', '4.3.1'];
  for (const v of required) {
    if (!changelog.includes(`## [${v}]`)) throw new Error(`CHANGELOG 缺少 ${v}`);
  }
});

run('GHM 离线铁律', () => {
  execSync('node evals/test-ghm-offline.js', { cwd: ROOT, stdio: 'pipe' });
});

run('GHM 发散度指标', () => {
  execSync('node evals/test-ghm-divergence.js', { cwd: ROOT, stdio: 'pipe' });
});

run('GHM 泄漏源码门', () => {
  execSync('node evals/test-ghm-leakage.js', { cwd: ROOT, stdio: 'pipe' });
});

run('GHM 梦系离线对照', () => {
  execSync('node evals/test-ghm-contrast.js', { cwd: ROOT, stdio: 'pipe' });
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

run('v4 心跳 + AMP', () => {
  execSync('node evals/test-tick-heartbeat.js', { cwd: ROOT, stdio: 'pipe' });
});

run('TTF 冷启动', () => {
  execSync('node evals/test-ttf.js', { cwd: ROOT, stdio: 'pipe' });
});

run('Hook 路径 TTF', () => {
  execSync('node evals/test-hook-ttf.js', { cwd: ROOT, stdio: 'pipe' });
});

run('Hook PostToolUse 失败', () => {
  execSync('node evals/test-hook-posttool.js', { cwd: ROOT, stdio: 'pipe' });
});

run('使用指南心跳优先', () => {
  execSync('node evals/test-userguide-v4.js', { cwd: ROOT, stdio: 'pipe' });
});

run('性能基准（无 LLM）', () => {
  execSync('node evals/benchmark.js', { cwd: ROOT, stdio: 'pipe' });
});

run('distributions 存在', () => {
  if (!existsSync(join(ROOT, 'distributions/INSTALL.md'))) {
    throw new Error('缺少 distributions/INSTALL.md');
  }
});

run('全组件版本号一致', () => {
  execSync('node scripts/check-version-consistency.js', { cwd: ROOT, stdio: 'pipe' });
});

run('AMB Live 连通与判分引擎', () => {
  execSync('node evals/amb-live.js --mock --scenario=sqlite-lock', { cwd: ROOT, stdio: 'pipe' });
});

run('Python AMP 协议中间件自检', () => {
  const pyDir = join(ROOT, 'distributions/python');
  try {
    execSync('python test_puax_amp.py', { cwd: pyDir, stdio: 'pipe' });
  } catch {
    execSync('python3 test_puax_amp.py', { cwd: pyDir, stdio: 'pipe' });
  }
});

run('Thin Prompt 多级压缩与 Token 经济性', () => {
  execSync('npm test -- test/core/thin-prompt-modes.test.ts --silent', {
    cwd: MCP,
    stdio: 'pipe',
  });
});

run('真实战绩注入（Live Rival Proof）', () => {
  execSync('npm test -- test/core/proof-rival.test.ts --silent', {
    cwd: MCP,
    stdio: 'pipe',
  });
});

run('监军反向干预（MCP Sampling 双通道）', () => {
  execSync('npm test -- test/core/intervention.test.ts --silent', {
    cwd: MCP,
    stdio: 'pipe',
  });
});

run('双引擎信号一致性', () => {
  execSync('node evals/trigger-signal-consistency.js', { cwd: ROOT, stdio: 'pipe' });
});

run('README/docs 数字一致性', () => {
  execSync('node scripts/lib/count-metrics.js > puax-mcp-server/build/metrics.json', { cwd: ROOT, stdio: 'pipe' });
  execSync('node scripts/check-metrics-consistency.js', { cwd: ROOT, stdio: 'pipe' });
});

console.log(`\nPassed: ${pass}, Failed: ${fail}`);
process.exit(fail > 0 ? 1 : 0);
