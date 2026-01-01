/**
 * PUAX MCP Server 使用示例
 * 
 * 运行此示例:
 * node example-usage.js
 */

const { promptManager } = require('./build/prompts/index.js');

async function demonstrateUsage() {
  console.log('🚀 PUAX MCP Server 功能演示\n');
  
  await promptManager.initialize();
  
  // 1. 列出所有角色
  console.log('📋 1. 列出所有可用角色');
  const allRoles = promptManager.getAllRoles();
  console.log(`共找到 ${allRoles.length} 个角色`);
  console.log('主要类别:');
  const categories = promptManager.getCategories();
  categories.forEach(cat => {
    const count = promptManager.getRolesByCategory(cat).length;
    console.log(`  - ${cat}: ${count} 个角色`);
  });
  
  // 2. 按类别筛选
  console.log('\n⚔️ 2. 按类别筛选: 军事化组织');
  const militaryRoles = promptManager.getRolesByCategory('军事化组织');
  militaryRoles.slice(0, 3).forEach(role => {
    console.log(`  - ${role.name}`);
  });
  
  // 3. 搜索角色
  console.log('\n🔍 3. 搜索包含"马斯克"的角色');
  const searchResults = promptManager.searchRoles('马斯克');
  searchResults.forEach(role => {
    console.log(`  - ${role.name} (${role.category})`);
  });
  
  // 4. 激活角色
  console.log('\n🎯 4. 激活角色并生成System Prompt');
  const systemPrompt = promptManager.activateRole(
    '萨满系列_萨满_马斯克___未来科技狂人附体',
    '为我的智能手表产品设计营销文案'
  );
  
  if (systemPrompt) {
    console.log('\n✅ 激活成功！生成的System Prompt:');
    console.log('='.repeat(60));
    console.log(systemPrompt.substring(0, 800));
    console.log('='.repeat(60));
    console.log('... (省略剩余内容)');
  }
  
  console.log('\n💡 使用提示:');
  console.log('- 先调用 list_roles 获取所有角色ID');
  console.log('- 使用 search_roles 按关键词搜索');
  console.log('- 使用 activate_role 激活角色并替换任务占位符');
  console.log('\n🎉 演示完成！');
}

demonstrateUsage().catch(console.error);
