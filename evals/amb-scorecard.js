#!/usr/bin/env node
/**
 * AMB v0（Agent Motivation Benchmark）无 LLM 记分卡。
 * 不捏造跨模型胜率。只证明：12+ 场景存在、触发/角色对得上运行时、协议字段齐全。
 */
const { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } = require('fs');
const { join } = require('path');

const ROOT = join(__dirname, '..');
const SCENARIO_DIR = join(__dirname, 'scenarios');
const RESULTS = join(__dirname, 'results');
const DETERMINISTIC_TRIGGERS = new Set(['hidden_file_access']);

const files = readdirSync(SCENARIO_DIR).filter(f => f.endsWith('.json'));
if (files.length < 12) {
  throw new Error(`AMB v0 需要至少 12 个顶层场景，当前 ${files.length}`);
}

const triggersYaml = readFileSync(join(ROOT, 'puax-mcp-server/src/data/triggers.yaml'), 'utf-8');
const manifest = readFileSync(join(ROOT, 'puax-mcp-server/src/prompts/skill-manifest.ts'), 'utf-8');
const shamanOk = (id) => id.startsWith('shaman-') || id.startsWith('military-') || id.startsWith('dream-') || id.startsWith('silicon-');

const rows = [];
let fail = 0;

for (const file of files) {
  const s = JSON.parse(readFileSync(join(SCENARIO_DIR, file), 'utf-8'));
  const issues = [];
  for (const t of s.recommended_triggers || []) {
    const inYaml = triggersYaml.includes(`\n  ${t}:`) || triggersYaml.includes(`id: ${t}`);
    if (!inYaml && !DETERMINISTIC_TRIGGERS.has(t)) {
      issues.push(`unknown trigger ${t}`);
    }
  }
  for (const r of s.recommended_roles || []) {
    const inManifest = manifest.includes(`id: "${r}"`);
    if (!inManifest && !shamanOk(r)) {
      issues.push(`unknown role ${r}`);
    }
  }
  if (!Array.isArray(s.metrics) || s.metrics.length === 0) issues.push('metrics empty');
  if (!s.expected_with_puax) issues.push('expected_with_puax missing');

  const ok = issues.length === 0;
  if (!ok) fail++;
  rows.push({ id: s.id, file, ok, issues, triggers: s.recommended_triggers || [], roles: s.recommended_roles || [] });
}

const shamanScenes = rows.filter(r => (r.roles || []).some(id => String(id).startsWith('shaman-')));
const card = {
  name: 'AMB v0',
  date: new Date().toISOString(),
  scenarios: files.length,
  passed: rows.filter(r => r.ok).length,
  failed: fail,
  shaman_scenes: shamanScenes.length,
  note: '无 LLM。此卡度量协议覆盖，不是跨模型胜率。',
  rows,
};

if (!existsSync(RESULTS)) mkdirSync(RESULTS, { recursive: true });
writeFileSync(join(RESULTS, 'amb-v0.json'), JSON.stringify(card, null, 2));

if (fail > 0) {
  console.error('AMB v0 failed', rows.filter(r => !r.ok));
  process.exit(1);
}

console.log(`AMB v0 ok  scenarios=${card.scenarios} shaman_scenes=${card.shaman_scenes}`);
