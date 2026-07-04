#!/usr/bin/env node
/**
 * 校验 evals/scenarios/*.json 结构完整性
 */
const { readdirSync, readFileSync } = require('fs');
const { join } = require('path');

const SCENARIOS_DIR = join(__dirname, 'scenarios');
const REQUIRED = ['id', 'name', 'description', 'task_prompt', 'metrics', 'expected_with_puax'];

let pass = 0;
let fail = 0;

const files = readdirSync(SCENARIOS_DIR).filter(f => f.endsWith('.json'));

console.log(`=== PUAX Scenario Validation (${files.length} files) ===\n`);

for (const file of files) {
  try {
    const data = JSON.parse(readFileSync(join(SCENARIOS_DIR, file), 'utf-8'));
    const missing = REQUIRED.filter(k => !(k in data));
    if (missing.length > 0) {
      console.log(`❌ ${file}: missing ${missing.join(', ')}`);
      fail++;
    } else {
      console.log(`✅ ${file}: ${data.id}`);
      pass++;
    }
  } catch (e) {
    console.log(`❌ ${file}: ${e.message}`);
    fail++;
  }
}

console.log(`\nPassed: ${pass}, Failed: ${fail}`);
process.exit(fail > 0 ? 1 : 0);
