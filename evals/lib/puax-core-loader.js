/**
 * 加载 puax-mcp-server 编译产物（eval 脚本用，无 LLM）。
 * 模块表为字面量白名单：require 路径不含任何运行时拼接（静态可审计）。
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const MCP_ROOT = path.join(__dirname, '../../puax-mcp-server');

function ensureBuilt() {
  const src = path.join(MCP_ROOT, 'src/core/evolve-cycle.ts');
  const built = path.join(MCP_ROOT, 'build/core/evolve-cycle.js');
  const theater = path.join(MCP_ROOT, 'build/core/silicon-theater.js');
  const stale =
    !fs.existsSync(built) ||
    !fs.existsSync(theater) ||
    (fs.existsSync(src) && fs.statSync(src).mtimeMs > fs.statSync(built).mtimeMs);
  if (stale) {
    // 参数列表调用（无 shell），与根目录 package.json 的 build 脚本等价
    execFileSync('npm', ['run', 'build'], { cwd: MCP_ROOT, stdio: 'pipe' });
  }
  const dataDst = path.join(MCP_ROOT, 'build/data');
  const dataSrc = path.join(MCP_ROOT, 'src/data');
  if (!fs.existsSync(dataDst) && fs.existsSync(dataSrc)) {
    fs.cpSync(dataSrc, dataDst, { recursive: true });
  }
}

// 字面量白名单：evals 消费的编译产物模块（新增消费时在此登记）
const CORE_MODULES = {
  'evolve-cycle': () => require('../../puax-mcp-server/build/core/evolve-cycle.js'),
  'amp': () => require('../../puax-mcp-server/build/core/amp.js'),
  'trigger-detector': () => require('../../puax-mcp-server/build/core/trigger-detector.js'),
  'methodology-engine': () => require('../../puax-mcp-server/build/core/methodology-engine.js'),
  'silicon-theater': () => require('../../puax-mcp-server/build/core/silicon-theater.js'),
  'governance': () => require('../../puax-mcp-server/build/core/governance.js'),
  'behavior-protocols': () => require('../../puax-mcp-server/build/core/behavior-protocols.js'),
  'ttf': () => require('../../puax-mcp-server/build/core/ttf.js'),
};
const HOOKS_MODULES = {
  'state-manager': () => require('../../puax-mcp-server/build/hooks/state-manager.js'),
  'pressure-system': () => require('../../puax-mcp-server/build/hooks/pressure-system.js'),
};
const CLI_MODULES = {
  'hook-cli': () => require('../../puax-mcp-server/build/cli/hook-cli.js'),
};

function fromWhitelist(table, kind, name) {
  const factory = table[name];
  if (!factory) {
    throw new Error(`未知 ${kind} 模块 "${name}"：请在 evals/lib/puax-core-loader.js 白名单登记`);
  }
  return factory();
}

function loadCore(name) {
  ensureBuilt();
  return fromWhitelist(CORE_MODULES, 'core', name);
}

function loadHooks(name) {
  ensureBuilt();
  return fromWhitelist(HOOKS_MODULES, 'hooks', name);
}

function loadCli(name) {
  ensureBuilt();
  return fromWhitelist(CLI_MODULES, 'cli', name);
}

module.exports = { ensureBuilt, loadCore, loadHooks, loadCli, MCP_ROOT };
