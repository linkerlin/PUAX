# PUAX MCP Server - HTTP Streamable-HTTP 迁移说明

## 概述

已将 puax-mcp-server 从 stdio 传输方式改造为 HTTP streamable-http (SSE) 传输方式，监听 **2333** 端口。

## 主要变更

### 1. 传输方式变更
- **旧**: 使用 `StdioServerTransport` (标准输入输出)
- **新**: 使用 `SSEServerTransport` (Server-Sent Events over HTTP)

### 2. 服务器架构
- **HTTP Server**: 监听 `localhost:2333`
- **端点**:
  - `GET /` - SSE 连接端点
  - `POST /message?sessionId=xxx` - 客户端消息端点
  - `GET /health` - 健康检查端点

### 3. 代码变更
- `src/server.ts` - 主要改造文件
  - 新增 HTTP 服务器创建和管理
  - 新增会话管理 (跟踪活跃的 SSE 连接)
  - 新增请求路由处理

## 使用方法

### 启动服务器

```bash
cd puax-mcp-server
npm start
```

或

```bash
cd puax-mcp-server
node build/index.js
```

服务器启动后，将输出：
```
PUAX MCP Server started successfully
Listening on http://localhost:2333
```

### 测试服务器

#### 健康检查
```bash
curl http://localhost:2333/health
```

返回：
```json
{
  "status": "ok",
  "service": "puax-mcp-server",
  "version": "1.0.0",
  "activeSessions": 0
}
```

#### SSE 连接测试
```bash
curl http://localhost:2333/
```

这将建立一个 SSE 连接，并返回端点信息：
```
event: endpoint
data: /message?sessionId=<session-id>

```

### MCP 客户端配置

在 MCP 客户端配置中，使用以下设置：

```json
{
  "mcpServers": {
    "puax": {
      "url": "http://localhost:2333"
    }
  }
}
```

或使用 MCP Inspector 进行测试：

```bash
npx @modelcontextprotocol/inspector http://localhost:2333
```

## 技术细节

### SSE 传输流程

1. **建立连接**: 客户端通过 `GET /` 建立 SSE 连接
2. **会话创建**: 服务器创建唯一的 `sessionId`
3. **端点通知**: 服务器通过 SSE 发送消息端点 URL
4. **双向通信**:
   - 服务器 → 客户端: 通过 SSE 发送事件
   - 客户端 → 服务器: 通过 POST 到 `/message?sessionId=xxx`

### 会话管理

- 每个 SSE 连接都有唯一的 `sessionId`
- 活跃的传输实例存储在 `Map<string, SSEServerTransport>` 中
- 连接关闭时自动清理会话

### 错误处理

- HTTP 错误码:
  - `400`: 缺少 sessionId 参数
  - `404`: 会话不存在
  - `500`: 内部服务器错误
- 详细的错误日志输出到 stderr

## 与旧版本对比

| 特性 | Stdio 版本 | HTTP/SSE 版本 |
|------|-----------|--------------|
| 传输方式 | 标准输入输出 | HTTP + SSE |
| 并发性 | 单客户端 | 多客户端 |
| 网络访问 | 仅限本地 | 支持远程访问 |
| 调试难度 | 较难 | 较易 (可使用 curl 等工具) |
| 适用场景 | 本地进程间通信 | 网络服务、远程调用 |

## 优势

1. **远程访问**: 可以通过网络访问 MCP 服务器
2. **多客户端**: 支持多个客户端同时连接
3. **易于调试**: 可使用 curl、浏览器开发者工具等
4. **标准化**: 符合 MCP streamable-http 规范
5. **监控友好**: 提供健康检查端点

## 注意事项

1. **安全性**: 当前监听 localhost，如需远程访问，请配置防火墙和认证
2. **端口占用**: 确保 2333 端口未被占用
3. **会话清理**: 断开连接的会话会自动清理
4. **日志输出**: 所有日志输出到 stderr，不影响客户端通信

## 兼容性

- Node.js >= 18.0.0
- @modelcontextprotocol/sdk ^0.4.0
- 兼容所有支持 streamable-http 的 MCP 客户端

## 故障排除

### 端口被占用
```bash
# Windows
netstat -ano | findstr :2333
taskkill /PID <pid> /F

# Linux/Mac
lsof -i :2333
kill -9 <pid>
```

### 无法连接
- 检查服务器是否启动
- 检查防火墙设置
- 验证 URL: `http://localhost:2333`
- 查看健康检查: `http://localhost:2333/health`

### SSE 连接中断
- 检查网络连接
- 查看服务器日志
- 重新建立连接

## 参考文档

- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Streamable HTTP 规范](https://spec.modelcontextprotocol.io/specification/2024-11-05/basic/transports/#streamable-http)