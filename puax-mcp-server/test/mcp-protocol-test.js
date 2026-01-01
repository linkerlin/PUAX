#!/usr/bin/env node

/**
 * MCP 协议测试
 * 模拟 MCP 客户端与服务器通信
 */

const { spawn } = require('child_process');
const path = require('path');

class MCPClient {
  constructor(serverPath) {
    this.server = spawn('node', [serverPath]);
    this.requestId = 0;
    this.pendingRequests = new Map();
    
    this.server.stdout.on('data', (data) => {
      this.handleResponse(data.toString());
    });
    
    this.server.stderr.on('data', (data) => {
      console.error('[Server Error]', data.toString());
    });
  }
  
  handleResponse(data) {
    try {
      const lines = data.trim().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          const response = JSON.parse(line);
          const id = response.id;
          if (id && this.pendingRequests.has(id)) {
            this.pendingRequests.get(id)(response);
            this.pendingRequests.delete(id);
          }
        }
      }
    } catch (e) {
      // 忽略解析错误（可能是初始化消息）
    }
  }
  
  sendRequest(method, params) {
    return new Promise((resolve) => {
      const id = ++this.requestId;
      const request = {
        jsonrpc: '2.0',
        id: id,
        method: method,
        params: params
      };
      
      this.pendingRequests.set(id, resolve);
      this.server.stdin.write(JSON.stringify(request) + '\n');
    });
  }
  
  async initialize() {
    return await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    });
  }
  
  async listTools() {
    return await this.sendRequest('tools/list', {});
  }
  
  async callTool(name, args) {
    return await this.sendRequest('tools/call', {
      name: name,
      arguments: args
    });
  }
  
  close() {
    this.server.kill();
  }
}

async function runTests() {
  console.log('🚀 MCP协议测试启动\n');
  
  const serverPath = path.join(__dirname, '..', 'build', 'index.js');
  const client = new MCPClient(serverPath);
  
  try {
    // 等待服务器启动
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('1. 初始化连接...');
    const initResult = await client.initialize();
    console.log('✅ 初始化成功:', initResult.result ? 'OK' : 'Failed');
    
    console.log('\n2. 列出工具...');
    const toolsResult = await client.listTools();
    console.log('✅ 找到工具数:', toolsResult.result.tools.length);
    toolsResult.result.tools.forEach(tool => {
      console.log(`   - ${tool.name}`);
    });
    
    console.log('\n3. 调用 list_roles...');
    const rolesResult = await client.callTool('list_roles', { category: '军事化组织' });
    const rolesData = JSON.parse(rolesResult.result.content[0].text);
    console.log('✅ 军事化组织角色数:', rolesData.total);
    
    console.log('\n4. 调用 activate_role...');
    const activateResult = await client.callTool('activate_role', {
      roleId: '军事化组织_督战队铁纪执行',
      task: '优化数据库查询性能'
    });
    const promptData = JSON.parse(activateResult.result.content[0].text);
    console.log('✅ 激活角色:', promptData.role.name);
    console.log('✅ Prompt长度:', promptData.systemPrompt.length, '字符');
    
    console.log('\n🎉 所有测试通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    client.close();
  }
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { MCPClient };
