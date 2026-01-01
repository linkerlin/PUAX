const { PuaxMcpServer } = require('./build/server.js');

// 模拟MCP客户端测试
async function testServer() {
  console.log('🧪 测试PUAX MCP服务器...\n');
  
  const server = new PuaxMcpServer();
  
  // 测试1: ListTools
  console.log('📋 测试1: 列出工具');
  try {
    const toolsResult = await server['server']['requestHandlers'].get('tools/list')({});
    console.log('✅ 找到', toolsResult.tools.length, '个工具');
    toolsResult.tools.forEach(tool => console.log('  -', tool.name));
  } catch (e) {
    console.log('❌ 失败:', e.message);
  }
  
  // 测试2: ListRoles
  console.log('\n📋 测试2: 列出所有角色');
  try {
    const result = await server['handleListRoles']({ category: '全部' });
    const text = JSON.parse(result.content[0].text);
    console.log('✅ 找到', text.total, '个角色');
    text.roles.slice(0, 3).forEach(r => console.log('  -', r.name));
  } catch (e) {
    console.log('❌ 失败:', e.message);
  }
  
  // 测试3: ActivateRole
  console.log('\n🎯 测试3: 激活角色');
  try {
    const result = await server['handleActivateRole']({
      roleId: '军事化组织_督战队铁纪执行',
      task: '优化数据库查询性能'
    });
    const text = JSON.parse(result.content[0].text);
    console.log('✅ 激活成功:', text.role.name);
    console.log('📝 Prompt预览:');
    console.log(text.systemPrompt.substring(0, 300) + '...');
  } catch (e) {
    console.log('❌ 失败:', e.message);
  }
  
  console.log('\n🎉 测试完成！');
}

testServer().catch(console.error);
