#!/usr/bin/env node
/**
 * 数字一致性守门（run-all 第 32 门）
 *
 * 背景：check-version-consistency.js 只对齐版本号字符串，README/docs 里的
 * 工具数 / 动词数 / 门禁数曾四处漂移（48/49/50、12/13、12/26/28/30 并存）。
 * 本门从源码与编译产物取实际值，强制关键文档与事实一致。
 *
 * 实际值来源：puax-mcp-server/build/metrics.json（由 scripts/lib/count-metrics.js
 * 在本门执行前生成，见 evals/run-all.js）。本脚本自身不执行任何子进程。
 */
const { readFileSync } = require('fs');
const { join } = require('path');

const ROOT = join(__dirname, '..');
const MCP = join(ROOT, 'puax-mcp-server');

const problems = [];

function must(condition, message) {
  if (!condition) problems.push(message);
}

function readDoc(rel) {
  return readFileSync(join(ROOT, rel), 'utf-8');
}

// —— 实际值 ——
const pkg = JSON.parse(readFileSync(join(MCP, 'package.json'), 'utf-8'));
const metrics = JSON.parse(readFileSync(join(MCP, 'build', 'metrics.json'), 'utf-8'));
const tools = metrics.tools;
const verbs = metrics.verbs;
const gates = (readFileSync(join(ROOT, 'evals', 'run-all.js'), 'utf-8').match(/^run\(/gm) || []).length;

// —— README.md（主入口）——
const zh = readDoc('README.md');
must(zh.includes(`## MCP 工具概览（${tools} 个，对外主路径 ${verbs} 个动词）`), `README.md 工具概览标题应为 ${tools} 个 / ${verbs} 动词`);
must(zh.includes(`**${tools} 个 MCP 工具**`), `README.md 文档表应写 ${tools} 个 MCP 工具`);
must(zh.includes(`version-${pkg.version}`) || zh.includes(`v${pkg.version}`), `README.md 应含版本号 ${pkg.version}`);

// —— README_en.md ——
const en = readDoc('README_en.md');
must(en.includes(`(${tools} tools, ${verbs} outward primary verbs)`), `README_en.md 工具概览应为 ${tools} tools / ${verbs} verbs`);
must(en.includes(`**${tools} MCP tools**`), `README_en.md 文档表应写 ${tools} MCP tools`);
must(en.includes(`version-${pkg.version}`) || en.includes(`v${pkg.version}`), `README_en.md 应含版本号 ${pkg.version}`);

// —— puax-mcp-server/README.md（包级首选参考）——
const mcp = readDoc('puax-mcp-server/README.md');
must(mcp.includes(`| **版本** | ${pkg.version} |`), `puax-mcp-server/README.md 版本应为 ${pkg.version}`);
must(mcp.includes(`| **MCP 工具** | ${tools}（对外主路径 ${verbs} 动词`), `puax-mcp-server/README.md 应写 ${tools} 工具 / ${verbs} 动词`);
must(mcp.includes(`${gates} 项守门`), `puax-mcp-server/README.md 应写 ${gates} 项守门`);

// —— docs/API.md ——
const api = readDoc('docs/API.md');
must(api.includes(`**版本**: ${pkg.version} | **MCP 工具**: ${tools} |`), `docs/API.md 头部应为版本 ${pkg.version} / ${tools} 工具`);
must(api.includes('`puax_thin_prompt`'), 'docs/API.md 须收录 v4.2 旗舰工具 puax_thin_prompt');

// —— 陈旧数字全面清零（任意文档出现即红）——
const STALE_PATTERNS = ['48 个', '49 个', '42 个工具', '578+', '48 tools', '42 tools'];
for (const rel of ['README.md', 'README_en.md', 'puax-mcp-server/README.md', 'docs/API.md', 'docs/USER-GUIDE.md']) {
  const content = readDoc(rel);
  for (const pat of STALE_PATTERNS) {
    must(!content.includes(pat), `${rel} 仍含陈旧数字 "${pat}"`);
  }
}

if (problems.length > 0) {
  console.error(`❌ 数字一致性守门失败（实际值：工具 ${tools} / 动词 ${verbs} / 守门 ${gates} / 版本 ${pkg.version}）`);
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}

console.log(`✅ 数字一致：工具 ${tools} / 动词 ${verbs} / 守门 ${gates} 门 / 版本 ${pkg.version}`);
