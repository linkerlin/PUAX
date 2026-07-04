#!/usr/bin/env node
/**
 * 从 methodologies.yaml 生成 templates/{category}-methodology-guide.md
 */
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(ROOT, '..');
const YAML_PATH = path.join(ROOT, 'src', 'data', 'methodologies.yaml');
const TEMPLATES_DIR = path.join(REPO_ROOT, 'templates');
const BUILD_MODULE = path.join(ROOT, 'build', 'core', 'methodology-guide-generator.js');

function loadGenerator() {
  if (fs.existsSync(BUILD_MODULE)) {
    return require(BUILD_MODULE);
  }
  require('ts-node/register/transpile-only');
  return require(path.join(ROOT, 'src', 'core', 'methodology-guide-generator.ts'));
}

function main() {
  const { generateAllCategoryGuides, listGuideCategories } = loadGenerator();
  const data = YAML.parse(fs.readFileSync(YAML_PATH, 'utf-8'));
  const generatedAt = new Date().toISOString();
  const guides = generateAllCategoryGuides(data, generatedAt);

  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });

  let written = 0;
  for (const [category, content] of Object.entries(guides)) {
    const outPath = path.join(TEMPLATES_DIR, `${category}-methodology-guide.md`);
    fs.writeFileSync(outPath, content, 'utf-8');
    console.log(`  ✓ ${path.relative(REPO_ROOT, outPath)}`);
    written++;
  }

  const readmePath = path.join(TEMPLATES_DIR, 'README.md');
  const categories = listGuideCategories(data);
  fs.writeFileSync(readmePath, `# PUAX 模板目录

## 方法论指南（自动生成）

由 \`puax-mcp-server/src/data/methodologies.yaml\` 单一数据源生成，**请勿手工编辑** \`*-methodology-guide.md\`。

\`\`\`bash
cd puax-mcp-server && npm run generate-guides
\`\`\`

| 类别 | 文件 |
|------|------|
${categories.map(c => `| ${c} | \`${c}-methodology-guide.md\` |`).join('\n')}

## SKILL 模板（手工维护）

- \`SKILL-v2.0-template.md\` — 新建角色 SKILL 结构模板

`, 'utf-8');
  console.log(`  ✓ ${path.relative(REPO_ROOT, readmePath)}`);
  console.log(`\nGenerated ${written} methodology guides.`);
}

main();
