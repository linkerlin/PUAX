# PUAX MCP Server (HTTP 版本)

## 简介

PUAX MCP Server 现已支持 HTTP streamable-http (SSE) 传输方式！监听 **2333** 端口，提供 AI 角色选择、切换和激活功能。

## 快速开始

### 安装依赖

```bash
npm install
```

### 构建项目

```bash
npm run build
```

### 启动服务器

```bash
npm start
```

或

```bash
node build/index.js
```

服务器启动后，将监听 `http://localhost:2333`

## 测试服务器

### 健康检查

```bash
curl http://localhost:2333/health
```

预期输出：
```json
{
  "status": "ok",
  "service": "puax-mcp-server",
  "version": "1.0.0",
  "activeSessions": 0
}
```

### SSE 连接测试

```bash
curl http://localhost:2333/
```

## MCP 客户端配置

### Claude Desktop

编辑 `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) 或 `%APPDATA%/Claude/claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "puax": {
      "url": "http://localhost:2333"
    }
  }
}
```

### 其他 MCP 客户端

在配置中使用 URL 形式：

```json
{
  "mcpServers": {
    "puax": {
      "url": "http://localhost:2333"
    }
  }
}
```

### MCP Inspector 测试

使用 MCP Inspector 工具进行测试：

```bash
npx @modelcontextprotocol/inspector http://localhost:2333
```

## API 端点

### 主要端点

- `GET /` - SSE 连接端点
- `POST /message?sessionId=xxx` - 消息发送端点
- `GET /health` - 健康检查端点

### 健康检查

健康检查端点返回服务器状态信息：

```
GET /health
```

响应：
```json
{
  "status": "ok",
  "service": "puax-mcp-server",
  "version": "1.0.0",
  "activeSessions": 0
}
```

## 可用工具

### 1. list_roles

列出指定类别的所有角色。

**参数:**
- `category` (可选): 角色类别，默认为 "全部"

**示例:**
```javascript
{
  "category": "全部"
}
```

### 2. get_role

获取指定角色的详细信息。

**参数:**
- `roleId` (必需): 角色 ID
- `task` (可选): 任务描述，用于替换 Prompt 中的占位符

**示例:**
```javascript
{
  "roleId": "puax-shaman",
  "task": "编写一个用户登录功能"
}
```

### 3. search_roles

搜索角色。

**参数:**
- `keyword` (必需): 搜索关键词

**示例:**
```javascript
{
  "keyword": "萨满"
}
```

### 4. activate_role

激活指定角色并返回系统 Prompt。

**参数:**
- `roleId` (必需): 角色 ID
- `task` (可选): 任务描述
- `customParams` (可选): 自定义参数

**示例:**
```javascript
{
  "roleId": "puax-shaman",
  "task": "设计一个数据库架构"
}
```

## 开发

### 项目结构

```
puax-mcp-server/
├── src/
│   ├── index.ts          # 入口文件
│   ├── server.ts         # 服务器实现
│   ├── tools.ts          # 工具定义
│   └── prompts/          # 提示词管理
│       └── index.ts
├── build/                # 编译输出
├── package.json
└── tsconfig.json
```

### 开发模式

```bash
npm run watch
```

### 重新构建

```bash
npm run build
```

## 传输方式说明

### Streamable HTTP (SSE)

服务器使用 **Server-Sent Events (SSE)** 实现 streamable HTTP 传输：

1. 客户端通过 `GET /` 建立 SSE 连接
2. 服务器创建会话并返回唯一的 `sessionId`
3. 服务器通过 SSE 发送事件到客户端
4. 客户端通过 POST 请求发送消息到 `/message?sessionId=xxx`

这种传输方式的优势：
- 支持多客户端并发连接
- 易于调试（可使用 curl、浏览器工具）
- 支持远程访问
- 符合 MCP 最新规范

## 要求

- Node.js >= 18.0.0
- npm >= 8.0.0

## 故障排除

### 端口被占用

如果端口 2333 被占用，您需要：

**Windows:**
```powershell
netstat -ano | findstr :2333
taskkill /PID <pid> /F
```

**Linux/Mac:**
```bash
lsof -i :2333
kill -9 <pid>
```

### 无法启动

检查 Node.js 版本：
```bash
node --version  # 需要 >= 18.0.0
```

重新安装依赖：
```bash
rm -rf node_modules
npm install
npm run build
```

### 连接问题

验证服务器是否运行：
```bash
curl http://localhost:2333/health
```

查看服务器日志：
```bash
node build/index.js
```

## 许可证

MIT

## 更多信息

详细迁移说明请查看 [HTTP_MIGRATION.md](./HTTP_MIGRATION.md)