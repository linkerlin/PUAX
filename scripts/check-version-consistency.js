#!/usr/bin/env node
/**
 * PUAX Version Consistency Guard
 *
 * Ensures all subpackages and server metadata share the exact same version string.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const FILES = {
  mcp: path.join(ROOT, 'puax-mcp-server/package.json'),
  landing: path.join(ROOT, 'landing/package.json'),
  webAdmin: path.join(ROOT, 'web-admin/package.json'),
  serverTs: path.join(ROOT, 'puax-mcp-server/src/server.ts'),
};

console.log('🔍 Checking PUAX Monorepo Version Consistency...\n');

const versions = {};

for (const [key, filePath] of Object.entries(FILES)) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing target file: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  if (filePath.endsWith('.json')) {
    const pkg = JSON.parse(content);
    versions[key] = pkg.version;
  } else if (filePath.endsWith('.ts')) {
    const match = content.match(/@version\s+([0-9]+\.[0-9]+\.[0-9]+[a-zA-Z0-9.-]*)/);
    if (!match) {
      console.error(`❌ Could not parse @version from ${filePath}`);
      process.exit(1);
    }
    versions[key] = match[1];
  }
}

console.log('Detected Versions:');
for (const [k, v] of Object.entries(versions)) {
  console.log(`  • ${k.padEnd(12)}: ${v}`);
}

const uniqueVersions = new Set(Object.values(versions));
if (uniqueVersions.size !== 1) {
  console.error('\n❌ Version Mismatch detected across components!');
  process.exit(1);
}

const targetVersion = [...uniqueVersions][0];
console.log(`\n✅ All components unified at version: v${targetVersion}`);
process.exit(0);
