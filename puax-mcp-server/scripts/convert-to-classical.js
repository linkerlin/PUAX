#!/usr/bin/env node
/**
 * PUAX-CC 角色批量转换脚本
 * 将现有角色转换为文言文风格
 * 
 * 使用方法:
 *   node convert-to-classical.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '..', '..', 'skills');

// 文言文风格映射
const CLASSICAL_MAPPINGS = {
  // 通用标题映射
  titles: {
    'System Prompt': 'System Prompt·文言文版',
    '调试方法论': '调试方法论·兵法',
    '核心能力': '核心能力',
    '适用场景': '适用场景',
    '触发条件': '触发条件',
    '检查清单': '检查清单',
    '唤醒语句': '唤醒语句',
    '使用示例': '使用示例',
    'Changelog': '版本志'
  },
  
  // 通用短语映射
  phrases: {
    '你': '汝',
    '我': '吾',
    '的': '之',
    '是': '乃',
    '和': '与',
    '或': '或',
    '了': '矣',
    '吗': '乎',
    '什么': '何',
    '怎么': '如何',
    '为什么': '为何',
    '可以': '可',
    '不能': '不可',
    '需要': '需',
    '必须': '必须',
    '应该': '当',
    '不要': '勿',
    '没有': '无',
    '完成': '完成',
    '解决': '解决',
    '问题': '问题',
    '任务': '任务',
    '用户': '将军',
    'AI': '末将',
    '错误': '错误',
    '成功': '成功',
    '失败': '失败',
    '开始': '开始',
    '结束': '结束',
    '第一步': '第一步',
    '第二步': '第二步',
    '第三步': '第三步',
    '检查': '检查',
    '确认': '确认',
    '执行': '执行',
    '目标': '目标',
    '方法': '方法',
    '结果': '结果',
    '原因': '原因',
    '方案': '方略',
    '计划': '计划',
    '资源': '资源',
    '团队': '团队',
    '时间': '时辰',
    '紧急': '紧急',
    '重要': '重要'
  },
  
  // 通用句式映射
  patterns: [
    { from: /你必须/g, to: '汝必须' },
    { from: /你需要/g, to: '汝需' },
    { from: /你应该/g, to: '汝当' },
    { from: /你不要/g, to: '汝勿' },
    { from: /你不能/g, to: '汝不可' },
    { from: /我没有/g, to: '吾无' },
    { from: /我需要/g, to: '吾需' },
    { from: /我要/g, to: '吾要' },
    { from: /我会/g, to: '吾将' },
    { from: /我可以/g, to: '吾可' },
    { from: /完成了/g, to: '完成矣' },
    { from: /解决了/g, to: '解决矣' },
    { from: /是什么/g, to: '乃何' },
    { from: /为什么/g, to: '为何' },
    { from: /怎么办/g, to: '如何办' },
    { from: /可以吗/g, to: '可乎' },
    { from: /好吗/g, to: '善乎' },
    { from: /行吗/g, to: '行乎' },
    { from: /用户说/g, to: '将军言' },
    { from: /用户问/g, to: '将军问' },
    { from: /用户要求/g, to: '将军令' },
    { from: /AI应该/g, to: '末将当' },
    { from: /AI需要/g, to: '末将需' }
  ]
};

// 角色特定的文言文前缀
const ROLE_PREFIXES = {
  'military': {
    era: '战国乱世',
    style: '兵法',
    greetings: ['末将听令！', '末将在此！', '末将领命！']
  },
  'shaman': {
    era: '道法自然',
    style: '道家',
    greetings: ['道友请了！', '吾在此！', '善哉！']
  },
  'self-motivation': {
    era: '修身齐家',
    style: '儒家',
    greetings: ['君子当自强不息！', '吾日三省吾身！', '士不可以不弘毅！']
  },
  'silicon': {
    era: '格物致知',
    style: '理学',
    greetings: ['格物致知！', '实事求是！', '实践出真知！']
  },
  'special': {
    era: '奇门遁甲',
    style: '杂家',
    greetings: ['奇哉！', '妙哉！', '善哉！']
  },
  'theme': {
    era: '江湖风云',
    style: '武侠',
    greetings: ['在下有礼了！', '江湖儿女！', '来者何人！']
  }
};

function convertToClassical(content, category) {
  let converted = content;
  
  // 更新版本号
  converted = converted.replace(/version: "2\.0\.0"/g, 'version: "3.0.0-cc"');
  converted = converted.replace(/author: PUAX/g, 'author: PUAX-CC');
  converted = converted.replace(/last_updated: "[^"]+"/g, 'last_updated: "2026-03-26"');
  
  // 添加 classical-chinese 标签
  if (!converted.includes('classical-chinese')) {
    converted = converted.replace(
      /tags: \[([^\]]+)\]/,
      (match, tags) => `tags: [${tags}, 'classical-chinese']`
    );
  }
  
  // 添加 language_support
  converted = converted.replace(
    /language_support: \[zh, en\]/g,
    'language_support: [zh-classical, zh]'
  );
  
  // 添加 classical_style
  if (!converted.includes('classical_style:')) {
    const prefix = ROLE_PREFIXES[category] || ROLE_PREFIXES['military'];
    const style = prefix.style.toLowerCase();
    converted = converted.replace(
      /(metadata:[\s\S]*?)(last_updated:)/,
      `$1classical_style: ${style}\n  $2`
    );
  }
  
  // 应用通用短语映射
  for (const [modern, classical] of Object.entries(CLASSICAL_MAPPINGS.phrases)) {
    const regex = new RegExp(modern, 'g');
    converted = converted.replace(regex, classical);
  }
  
  // 应用句式映射
  for (const pattern of CLASSICAL_MAPPINGS.patterns) {
    converted = converted.replace(pattern.from, pattern.to);
  }
  
  return converted;
}

function processSkill(skillDir) {
  const skillName = path.basename(skillDir);
  const skillFile = path.join(skillDir, 'SKILL.md');
  
  if (!fs.existsSync(skillFile)) {
    console.log(`  ⚠️ 跳过 ${skillName}: 无 SKILL.md`);
    return;
  }
  
  // 确定类别
  let category = 'military';
  if (skillName.startsWith('shaman')) category = 'shaman';
  else if (skillName.startsWith('self-motivation')) category = 'self-motivation';
  else if (skillName.startsWith('silicon')) category = 'silicon';
  else if (skillName.startsWith('special')) category = 'special';
  else if (skillName.startsWith('theme')) category = 'theme';
  
  const content = fs.readFileSync(skillFile, 'utf-8');
  
  // 检查是否已转换
  if (content.includes('3.0.0-cc')) {
    console.log(`  ⏭️ 跳过 ${skillName}: 已转换`);
    return;
  }
  
  console.log(`  📝 处理 ${skillName} (${category})`);
  
  const converted = convertToClassical(content, category);
  
  // 备份原文件
  const backupFile = path.join(skillDir, 'archive', `SKILL.v2-${Date.now()}.md`);
  if (!fs.existsSync(path.dirname(backupFile))) {
    fs.mkdirSync(path.dirname(backupFile), { recursive: true });
  }
  fs.copyFileSync(skillFile, backupFile);
  
  // 写入转换后的文件
  fs.writeFileSync(skillFile, converted, 'utf-8');
  
  console.log(`  ✅ 完成: ${skillName}`);
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  console.log('🔧 PUAX-CC 角色批量转换工具\n');
  console.log(`模式: ${dryRun ? '预览' : '执行'}\n`);
  
  const skillDirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => path.join(SKILLS_DIR, e.name));
  
  console.log(`发现 ${skillDirs.length} 个角色\n`);
  
  let processed = 0;
  let skipped = 0;
  
  for (const skillDir of skillDirs) {
    const skillName = path.basename(skillDir);
    const skillFile = path.join(skillDir, 'SKILL.md');
    
    if (!fs.existsSync(skillFile)) {
      skipped++;
      continue;
    }
    
    const content = fs.readFileSync(skillFile, 'utf-8');
    
    // 检查是否已转换
    if (content.includes('3.0.0-cc')) {
      console.log(`⏭️  ${skillName}: 已转换`);
      skipped++;
      continue;
    }
    
    if (dryRun) {
      console.log(`👁️  ${skillName}: 将转换`);
      processed++;
      continue;
    }
    
    try {
      processSkill(skillDir);
      processed++;
    } catch (error) {
      console.error(`❌  ${skillName}: 转换失败 - ${error.message}`);
    }
  }
  
  console.log(`\n========================================`);
  console.log(`处理完成:`);
  console.log(`  已处理: ${processed}`);
  console.log(`  已跳过: ${skipped}`);
  console.log(`========================================`);
}

main();
