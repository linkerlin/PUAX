# 测试指南

## 启动服务器

在新的终端窗口中：

```bash
cd "C:\GitHub\PUAX\puax-mcp-server"
node build/index.js
```

你应该看到：
```
PUAX MCP Server started successfully
Listening on http://localhost:2333
```

## 测试步骤

### 1. 健康检查测试

打开 **另一个** 终端窗口（保持服务器运行）：

```bash
curl http://localhost:2333/health
```

预期输出：
```json
{"status":"ok","service":"puax-mcp-server","version":"1.0.0","activeSessions":0}
```

### 2. SSE 连接测试

```bash
curl http://localhost:2333/
```

预期输出类似：
```
event: endpoint
data: /message?sessionId=550e8400-e29b-41d4-a716-446655440000

```

按 `Ctrl+C` 停止 curl。

### 3. 使用 MCP Inspector 测试

安装并运行 MCP Inspector：

```bash
npx @modelcontextprotocol/inspector http://localhost:2333
```

浏览器将自动打开 Inspector 界面。

#### 测试工具列表

在 Inspector 中：
1. 点击 "List Tools" 按钮
2. 应该看到以下工具：
   - `list_roles`
   - `get_role`
   - `search_roles`
   - `activate_role`

#### 测试具体工具

##### 列出所有角色

参数：
```json
{
  "category": "全部"
}
```

##### 获取特定角色

参数：
```json
{
  "roleId": "puax-shaman",
  "task": "编写一个用户登录功能"
}
```

##### 搜索角色

参数：
```json
{
  "keyword": "萨满"
}
```

##### 激活角色

参数：
```json
{
  "roleId": "puax-shaman",
  "task": "设计一个数据库架构"
}
```

### 4. 多会话测试

打开多个终端窗口，同时运行：

```bash
# 终端 1
curl http://localhost:2333/

# 终端 2
curl http://localhost:2333/

# 终端 3
curl http://localhost:2333/health
```

健康检查应显示 `activeSessions` 数量增加。

## 常见问题

### Q: 端口 2333 被占用

**A**: 停止占用该端口的进程或修改代码中的端口号。

### Q: 无法连接到服务器

**A**: 
1. 确认服务器正在运行
2. 检查是否监听了 localhost:2333
3. 验证防火墙设置

### Q: MCP Inspector 无法连接

**A**:
1. 确认服务器运行正常
2. 在浏览器中尝试访问 http://localhost:2333/health
3. 检查 MCP Inspector 的版本

### Q: 工具调用失败

**A**:
1. 检查服务器日志
2. 确认参数格式正确
3. 验证角色 ID 是否存在

## 验证成功标准

✅ 服务器启动无错误  
✅ 健康检查端点正常工作  
✅ SSE 连接可以建立  
✅ MCP Inspector 可以连接  
✅ 工具列表可以获取  
✅ 工具调用可以执行  
✅ 多会话支持正常  

如果以上所有测试都通过，说明 HTTP streamable-http 改造成功！