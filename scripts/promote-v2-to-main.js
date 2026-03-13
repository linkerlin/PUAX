#!/usr/bin/env node
/**
 * 将SKILL.v2.md提升为主SKILL.md文件
 * 完成v2.0迁移的最终步骤
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '..', 'skills');

function promoteV2ToMain() {
  const categories = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  let promoted = 0;
  let skipped = 0;
  let errors = [];

  console.log('🚀 开始迁移 v2.0 → 主文件\n');

  for (const categoryDir of categories) {
    const skillDir = path.join(SKILLS_DIR, categoryDir);
    const v2File = path.join(skillDir, 'SKILL.v2.md');
    const mainFile = path.join(skillDir, 'SKILL.md');
    const backupFile = path.join(skillDir, 'SKILL.v1.bak');

    if (!fs.existsSync(v2File)) {
      skipped++;
      continue;
    }

    try {
      // 如果存在旧的SKILL.md，备份为v1
      if (fs.existsSync(mainFile)) {
        const content = fs.readFileSync(mainFile, 'utf-8');
        fs.writeFileSync(backupFile, content);
        console.log(`  💾 备份: ${categoryDir}/SKILL.v1.bak`);
      }

      // 将v2提升为主文件
      const v2Content = fs.readFileSync(v2File, 'utf-8');
      fs.writeFileSync(mainFile, v2Content);
      
      // 删除v2文件
      fs.unlinkSync(v2File);
      
      promoted++;
      console.log(`  ✅ 迁移: ${categoryDir}`);
    } catch (e) {
      errors.push({ category: categoryDir, error: e.message });
      console.log(`  ❌ 错误: ${categoryDir} - ${e.message}`);
    }
  }

  console.log('\n📊 迁移统计:');
  console.log(`  成功: ${promoted}`);
  console.log(`  跳过: ${skipped}`);
  console.log(`  错误: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n❌ 错误详情:');
    errors.forEach(e => console.log(`  ${e.category}: ${e.error}`));
  }

  console.log('\n✨ 迁移完成!');
  console.log('\n下一步: npm run generate-bundle');
}

// 安全确认
const args = process.argv.slice(2);
if (args[0] === '--confirm') {
  promoteV2ToMain();
} else {
  console.log('⚠️  警告: 此操作将不可逆地替换SKILL.md文件');
  console.log('请运行: node scripts/promote-v2-to-main.js --confirm');
  console.log('\n建议先提交当前更改到git！');
}
