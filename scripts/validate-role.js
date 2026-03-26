#!/usr/bin/env node
/**
 * PUAX 角色验证脚本
 * 验证角色文件是否符合v2.0规范
 */

const fs = require('fs');
const path = require('path');

// 必需字段
const REQUIRED_YAML_FIELDS = [
  'name',
  'description',
  'category',
  'tags',
  'version',
  'trigger_conditions',
  'task_types',
  'metadata'
];

const REQUIRED_METADATA_FIELDS = [
  'tone',
  'intensity',
  'language_support',
  'last_updated'
];

// 有效分类
const VALID_CATEGORIES = [
  'military',
  'shaman',
  'p10',
  'theme',
  'silicon',
  'sillytavern',
  'self-motivation',
  'special'
];

// 有效语气
const VALID_TONES = ['aggressive', 'supportive', 'analytical', 'creative'];

// 有效强度
const VALID_INTENSITIES = ['low', 'medium', 'high', 'extreme'];

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function parseYAML(frontmatter) {
  const data = {};
  const lines = frontmatter.split('\n');
  let currentKey = null;
  let currentArray = null;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // 跳过空行
    if (!trimmed) continue;

    // 数组项
    if (trimmed.startsWith('- ') && currentArray) {
      currentArray.push(trimmed.slice(2).trim().replace(/['"]/g, ''));
      continue;
    }

    // 键值对
    const match = trimmed.match(/^(\w+):\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      
      // 数组开始
      if (value === '' || value === '[]') {
        currentArray = [];
        data[key] = currentArray;
        currentKey = key;
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // 内联数组
        data[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/['"]/g, ''));
      } else {
        // 普通值
        data[key] = value.replace(/['"]/g, '');
        currentArray = null;
        currentKey = key;
      }
    }
  }

  return data;
}

function validateRole(roleId) {
  log(`\n🔍 验证角色: ${roleId}`, 'blue');

  const roleDir = path.join(__dirname, '..', 'skills', roleId);
  const v2File = path.join(roleDir, 'SKILL.v2.md');
  const v1File = path.join(roleDir, 'SKILL.md');
  
  const skillFile = fs.existsSync(v2File) ? v2File : v1File;

  if (!fs.existsSync(skillFile)) {
    log(`  ❌ 角色文件不存在: ${roleId}`, 'red');
    return { valid: false, errors: ['文件不存在'] };
  }

  const content = fs.readFileSync(skillFile, 'utf-8');
  const errors = [];
  const warnings = [];

  // 提取frontmatter
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) {
    log('  ❌ 缺少YAML frontmatter', 'red');
    return { valid: false, errors: ['缺少YAML frontmatter'] };
  }

  const yaml = parseYAML(frontmatterMatch[1]);

  // 验证必需字段
  for (const field of REQUIRED_YAML_FIELDS) {
    if (!(field in yaml) || !yaml[field]) {
      errors.push(`缺少必需字段: ${field}`);
    }
  }

  // 验证分类
  if (yaml.category && !VALID_CATEGORIES.includes(yaml.category)) {
    errors.push(`无效分类: ${yaml.category}`);
  }

  // 验证版本
  if (yaml.version && !yaml.version.startsWith('2.0')) {
    warnings.push(`建议升级到v2.0版本，当前: ${yaml.version}`);
  }

  // 验证metadata
  if (yaml.metadata) {
    const metadataLines = frontmatterMatch[1].split('\n');
    const metadataStart = metadataLines.findIndex(l => l.trim().startsWith('metadata:'));
    
    if (metadataStart === -1) {
      errors.push('metadata格式错误');
    }
  }

  // 验证五步法
  const hasFiveSteps = content.includes('Step 1:') && 
                       content.includes('Step 2:') && 
                       content.includes('Step 3:') && 
                       content.includes('Step 4:') && 
                       content.includes('Step 5:');
  
  if (!hasFiveSteps) {
    errors.push('缺少完整的五步法 (Step 1-5)');
  }

  // 验证检查清单
  const hasChecklist = content.includes('七项检查清单') || 
                       content.includes('检查清单');
  
  if (!hasChecklist) {
    errors.push('缺少检查清单');
  }

  // 验证System Prompt
  const hasSystemPrompt = content.includes('System Prompt') || 
                          content.includes('system_prompt');
  
  if (!hasSystemPrompt) {
    errors.push('缺少System Prompt部分');
  }

  // 输出结果
  if (errors.length === 0) {
    log(`  ✅ 验证通过${warnings.length > 0 ? ' (有警告)' : ''}`, 'green');
  } else {
    log(`  ❌ 验证失败 (${errors.length}个错误)`, 'red');
    errors.forEach(e => log(`    - ${e}`, 'red'));
  }

  warnings.forEach(w => log(`  ⚠️  ${w}`, 'yellow'));

  return { valid: errors.length === 0, errors, warnings };
}

function validateAll() {
  log('\n🔍 批量验证所有角色', 'blue');

  const skillsDir = path.join(__dirname, '..', 'skills');
  const categories = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  let total = 0;
  let passed = 0;
  let failed = 0;

  for (const category of categories) {
    const result = validateRole(category);
    total++;
    if (result.valid) {
      passed++;
    } else {
      failed++;
    }
  }

  log(`\n📊 验证结果:`, 'blue');
  log(`  总计: ${total}`, 'reset');
  log(`  通过: ${passed}`, 'green');
  log(`  失败: ${failed}`, failed > 0 ? 'red' : 'reset');

  return failed === 0;
}

// CLI
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log('用法: node validate-role.js [role-id|--all]');
    console.log('');
    console.log('示例:');
    console.log('  node validate-role.js military-commander');
    console.log('  node validate-role.js --all');
    process.exit(0);
  }

  if (command === '--all') {
    const success = validateAll();
    process.exit(success ? 0 : 1);
  } else {
    const result = validateRole(command);
    process.exit(result.valid ? 0 : 1);
  }
}

module.exports = { validateRole, validateAll };

if (require.main === module) {
  main();
}
