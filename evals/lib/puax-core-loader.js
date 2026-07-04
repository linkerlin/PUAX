/**
 * 加载 puax-mcp-server 编译产物（eval 脚本用，无 LLM）
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MCP_ROOT = path.join(__dirname, '../../puax-mcp-server');

function ensureBuilt() {
  const marker = path.join(MCP_ROOT, 'build/core/governance.js');
  if (!fs.existsSync(marker)) {
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

module.exports = { ensureBuilt, loadCore, loadHooks, MCP_ROOT };
