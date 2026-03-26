#!/usr/bin/env node
/**
 * 完成文档归档脚本
 * 将各种"完成"、"测试完成"等文档归档到 docs/archive/ 目录
 * 
 * 使用方式:
 *   node archive-completion-docs.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const ARCHIVE_DIR = path.join(ROOT_DIR, 'docs', 'archive', 'completion-reports');

// 需要归档的文件模式
const PATTERNS = [
  /完成.*\.md$/i,
  /COMPLETE.*\.md$/i,
  /DONE.*\.md$/i,
  /TESTING.*COMPLETE.*\.md$/i,
  /^✅.*\.md$/,
  /^🎉.*\.md$/,
  /修复完成.*\.md$/i,
  /改造完成.*\.md$/i,
  /测试修复.*\.md$/i
];

// 保留的文件（白名单）
const KEEP_FILES = [
  'README.md',
  'CONTRIBUTING.md',
  'CHANGELOG.md',
  'LICENSE.md'
];

function shouldArchive(filename) {
  if (KEEP_FILES.includes(filename)) return false;
  return PATTERNS.some(pattern => pattern.test(filename));
}

function findDocsToArchive() {
  const files = fs.readdirSync(ROOT_DIR);
  const mdFiles = files.filter(f => f.endsWith('.md'));
  
  return mdFiles.filter(shouldArchive);
}

function archiveDoc(filename, options = {}) {
  const sourcePath = path.join(ROOT_DIR, filename);
  const targetPath = path.join(ARCHIVE_DIR, filename);
  
  console.log(`📄 ${filename}`);
  
  if (options.dryRun) {
    console.log(`   ⏭️  [DRY RUN] Would move to ${path.relative(ROOT_DIR, targetPath)}`);
    return { file: filename, action: 'dry-run' };
  }
  
  // 确保归档目录存在
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }
  
  // 移动文件
  fs.renameSync(sourcePath, targetPath);
  console.log(`   ✅ Moved to ${path.relative(ROOT_DIR, targetPath)}`);
  
  return { file: filename, action: 'archived' };
}

function createIndexFile(archivedFiles) {
  const indexPath = path.join(ARCHIVE_DIR, 'README.md');
  
  const content = `# 归档的完成报告

本目录包含项目开发过程中产生的各种"完成"类文档。

## 归档文件列表

| 文件名 | 归档日期 |
|--------|----------|
${archivedFiles.map(f => `| ${f} | ${new Date().toISOString().split('T')[0]} |`).join('\n')}

## 说明

这些文档记录了项目不同阶段的完成状态，包括但不限于：
- 测试完成报告
- 修复完成总结
- 改造完成报告
- 测试用例覆盖报告

为了保持根目录整洁，这些文档已被归档至此。
`;
  
  fs.writeFileSync(indexPath, content, 'utf-8');
  console.log(`\n📝 Created index: ${path.relative(ROOT_DIR, indexPath)}`);
}

function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run')
  };
  
  console.log('📦 Completion Documents Archival Tool\n');
  console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}\n`);
  
  const toArchive = findDocsToArchive();
  
  console.log(`Found ${toArchive.length} documents to archive:\n`);
  
  if (toArchive.length === 0) {
    console.log('✅ No documents need archiving!');
    return;
  }
  
  const results = [];
  for (const filename of toArchive) {
    try {
      const result = archiveDoc(filename, options);
      results.push(result);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      results.push({ file: filename, action: 'error', error: error.message });
    }
  }
  
  // 创建索引文件
  if (!options.dryRun && results.some(r => r.action === 'archived')) {
    createIndexFile(toArchive);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 Archival Summary:\n');
  
  const archived = results.filter(r => r.action === 'archived');
  const dryRuns = results.filter(r => r.action === 'dry-run');
  const errors = results.filter(r => r.action === 'error');
  
  console.log(`✅ Archived: ${archived.length}`);
  console.log(`⏭️  Dry run: ${dryRuns.length}`);
  console.log(`❌ Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(r => console.log(`   - ${r.file}: ${r.error}`));
  }
  
  console.log('\n✨ Done!');
}

main();
