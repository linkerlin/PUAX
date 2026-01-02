const { glob } = require('glob');
const path = require('path');

async function count() {
  const projectRoot = 'C:\\GitHub\\PUAX';
  
  const categories = ['萨满系列', '军事化组织', 'SillyTavern系列', '主题场景', '自我激励', '特色角色与工具', '通用文档'];
  
  let total = 0;
  for (const category of categories) {
    const files = await glob(category + '/*.md', { cwd: projectRoot });
    console.log(`${category}: ${files.length}`);
    total += files.length;
  }
  
  const rootFiles = await glob('*.md', { cwd: projectRoot });
  console.log(`根目录: ${rootFiles.length}`);
  console.log(`总计: ${total + rootFiles.length}`);
}

count().catch(console.error);
