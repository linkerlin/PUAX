#!/usr/bin/env node
/**
 * PUAX 元数据一致性验证脚本
 * 检查 SKILL.md / prompts-bundle 与 role-mappings.yaml 之间的一致性
 * 
 * 用法:
 *   node scripts/validate-metadata.js          # 完整验证
 *   node scripts/validate-metadata.js --fix     # 输出修复建议
 */

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

// ============================================================================
// 数据加载
// ============================================================================

function loadRoleMappings() {
  const yamlPath = path.join(SRC, 'data', 'role-mappings.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  return YAML.parse(content);
}

function loadTriggers() {
  const yamlPath = path.join(SRC, 'data', 'triggers.yaml');
  const content = fs.readFileSync(yamlPath, 'utf-8');
  return YAML.parse(content);
}

function loadBundleRoleIds() {
  const bundlePath = path.join(SRC, 'prompts', 'prompts-bundle.ts');
  const content = fs.readFileSync(bundlePath, 'utf-8');
  
  // Extract role IDs from the bundle
  const roleIds = new Set();
  const regex = /id:\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    roleIds.add(match[1]);
  }
  
  // Also try the categories pattern
  const categoriesRegex = /CATEGORIES\s*=\s*\{([^}]+)\}/s;
  const catMatch = content.match(categoriesRegex);
  
  return roleIds;
}

function loadSkillFiles() {
  const skillsDir = path.join(ROOT, '..', 'skills');
  const skills = new Map();
  
  if (!fs.existsSync(skillsDir)) {
    return skills;
  }
  
  const categories = fs.readdirSync(skillsDir);
  for (const category of categories) {
    const catPath = path.join(skillsDir, category);
    if (!fs.statSync(catPath).isDirectory()) continue;
    
    const roleDirs = fs.readdirSync(catPath);
    for (const roleDir of roleDirs) {
      const rolePath = path.join(catPath, roleDir);
      if (!fs.statSync(rolePath).isDirectory()) continue;
      
      const skillFile = path.join(rolePath, 'SKILL.md');
      if (fs.existsSync(skillFile)) {
        const content = fs.readFileSync(skillFile, 'utf-8');
        skills.set(roleDir, {
          category,
          path: skillFile,
          content,
          hasTriggerConditions: content.includes('trigger_conditions'),
          hasTaskTypes: content.includes('task_types'),
          hasMethodology: content.includes('五步法') || content.includes('调试方法论'),
          hasChecklist: content.includes('检查清单') || content.includes('checklist')
        });
      }
    }
  }
  
  return skills;
}

// ============================================================================
// 验证逻辑
// ============================================================================

function collectMappedRoles(roleMappings) {
  const roles = new Set();
  
  // 从 trigger_role_mappings 收集
  if (roleMappings.trigger_role_mappings) {
    for (const mapping of Object.values(roleMappings.trigger_role_mappings)) {
      if (mapping.primary) {
        if (Array.isArray(mapping.primary)) {
          mapping.primary.forEach(r => roles.add(r));
        } else {
          roles.add(mapping.primary);
        }
      }
      if (mapping.alternatives) {
        mapping.alternatives.forEach(r => roles.add(r));
      }
    }
  }
  
  // 从 task_type_role_mappings 收集
  if (roleMappings.task_type_role_mappings) {
    for (const mapping of Object.values(roleMappings.task_type_role_mappings)) {
      if (mapping.primary) {
        (Array.isArray(mapping.primary) ? mapping.primary : [mapping.primary]).forEach(r => roles.add(r));
      }
      if (mapping.secondary) {
        (Array.isArray(mapping.secondary) ? mapping.secondary : [mapping.secondary]).forEach(r => roles.add(r));
      }
    }
  }
  
  // 从 failure_mode_role_mappings 收集
  if (roleMappings.failure_mode_role_mappings) {
    for (const mapping of Object.values(roleMappings.failure_mode_role_mappings)) {
      if (mapping.rounds) {
        for (const round of Object.values(mapping.rounds)) {
          if (round.roles) {
            round.roles.forEach(r => roles.add(r));
          }
        }
      }
    }
  }
  
  return roles;
}

function collectTriggerRecommendedRoles(triggers) {
  const roles = new Set();
  if (!triggers.triggers) return roles;
  
  for (const trigger of Object.values(triggers.triggers)) {
    if (trigger.recommended_roles) {
      if (trigger.recommended_roles.primary) roles.add(trigger.recommended_roles.primary);
      if (trigger.recommended_roles.alternatives) {
        trigger.recommended_roles.alternatives.forEach(r => roles.add(r));
      }
    }
  }
  return roles;
}

function validate() {
  const errors = [];
  const warnings = [];
  
  console.log('🔍 PUAX 元数据一致性验证\n');
  console.log('═'.repeat(60));
  
  // 加载数据
  const roleMappings = loadRoleMappings();
  const triggers = loadTriggers();
  const bundleRoleIds = loadBundleRoleIds();
  const skillFiles = loadSkillFiles();
  
  const mappedRoles = collectMappedRoles(roleMappings);
  const triggerRoles = collectTriggerRecommendedRoles(triggers);
  const allReferencedRoles = new Set([...mappedRoles, ...triggerRoles]);
  
  // 1. Bundle 中存在但未在 role-mappings 中引用的角色
  for (const roleId of bundleRoleIds) {
    if (!allReferencedRoles.has(roleId)) {
      warnings.push(`Bundle 角色 "${roleId}" 未在 role-mappings.yaml 中被引用`);
    }
  }
  
  // 2. role-mappings 中引用但 Bundle 中不存在的角色
  for (const roleId of allReferencedRoles) {
    if (!bundleRoleIds.has(roleId)) {
      errors.push(`role-mappings.yaml 引用了不存在的角色 "${roleId}"`);
    }
  }
  
  // 3. triggers.yaml 推荐角色与 role-mappings.yaml primary 不一致
  if (triggers.triggers && roleMappings.trigger_role_mappings) {
    for (const [triggerId, trigger] of Object.entries(triggers.triggers)) {
      const mappingPrimary = roleMappings.trigger_role_mappings[triggerId]?.primary;
      const triggerPrimary = trigger.recommended_roles?.primary;
      
      if (mappingPrimary && triggerPrimary && mappingPrimary !== triggerPrimary) {
        warnings.push(`触发器 "${triggerId}" 的 primary 角色不一致: triggers.yaml="${triggerPrimary}", role-mappings.yaml="${mappingPrimary}"`);
      }
    }
  }
  
  // 4. SKILL.md 完整性检查
  for (const [roleId, info] of skillFiles) {
    if (!info.hasTriggerConditions) {
      warnings.push(`SKILL "${roleId}" 缺少 trigger_conditions`);
    }
    if (!info.hasTaskTypes) {
      warnings.push(`SKILL "${roleId}" 缺少 task_types`);
    }
    if (!info.hasMethodology) {
      warnings.push(`SKILL "${roleId}" 缺少方法论描述`);
    }
    if (!info.hasChecklist) {
      warnings.push(`SKILL "${roleId}" 缺少检查清单`);
    }
  }
  
  // 输出结果
  console.log('\n📊 验证统计:');
  console.log(`  Bundle 角色: ${bundleRoleIds.size} 个`);
  console.log(`  role-mappings 引用: ${mappedRoles.size} 个角色`);
  console.log(`  triggers.yaml 推荐角色: ${triggerRoles.size} 个`);
  console.log(`  SKILL.md 文件: ${skillFiles.size} 个`);
  
  if (errors.length > 0) {
    console.log(`\n❌ 错误 (${errors.length}):`);
    errors.forEach(e => console.log(`  • ${e}`));
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  警告 (${warnings.length}):`);
    warnings.forEach(w => console.log(`  • ${w}`));
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ 所有元数据一致性检查通过！');
  }
  
  console.log('\n═'.repeat(60));
  
  // 返回退出码
  return errors.length > 0 ? 1 : 0;
}

// 运行
const exitCode = validate();
process.exit(exitCode);
