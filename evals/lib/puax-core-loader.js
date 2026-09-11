/**
 * 加载 puax-mcp-server 编译产物（eval 脚本用，无 LLM）
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
    execSync('npm run build', { cwd: MCP_ROOT, stdio: 'pipe' });
  }
  const dataDst = path.join(MCP_ROOT, 'build/data');
  const dataSrc = path.join(MCP_ROOT, 'src/data');
  if (!fs.existsSync(dataDst) && fs.existsSync(dataSrc)) {
    fs.cpSync(dataSrc, dataDst, { recursive: true });
  }
}

function loadCore(name) {
  ensureBuilt();
  return require(path.join(MCP_ROOT, 'build/core', name));
}

function loadHooks(name) {
  ensureBuilt();
  return require(path.join(MCP_ROOT, 'build/hooks', name));
}

function loadCli(name) {
  ensureBuilt();
  return require(path.join(MCP_ROOT, 'build/cli', name));
}

module.exports = { ensureBuilt, loadCore, loadHooks, loadCli, MCP_ROOT };
