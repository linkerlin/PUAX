# PUAX MCP Server

> 🚀 为 AI Agent 提供 PUAX 角色选择、切换和激活功能

**版本**: 1.6.0 | **传输**: HTTP Streamable-HTTP (SSE) | **端口**: 2333

---

## 📋 目录

1. [功能特性](#功能特性)
2. [快速开始](#快速开始)
3. [客户端配置](#客户端配置)
   - [CRUSH](#crush-推荐)
   - [Claude Desktop](#claude-desktop)
   - [Cursor](#cursor)
   - [Windsurf](#windsurf)
   - [其他客户端](#其他客户端)
4. [工具使用](#工具使用)
5. [部署指南](#部署指南)
6. [常见问题](#常见问题)
7. [故障排除](#故障排除)

---

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🔄 角色列表 | 列出所有可用角色，支持按类别筛选 |
| 📄 角色详情 | 获取指定角色的完整 Prompt 内容 |
| 🔍 角色搜索 | 按关键词搜索角色名称和描述 |
| ⚡ 角色激活 | 激活角色并生成完整 System Prompt |
| 🌐 HTTP SSE | 支持 streamable-http，多客户端并发 |

---

## 🚀 快速开始

### 步骤 1：克隆并安装

```bash
git clone https://github.com/linkerlin/PUAX.git
cd PUAX/puax-mcp-server
npm install
```

### 步骤 2：启动服务器

```bash
# 默认启动 (127.0.0.1:2333)
npm start

# 或指定端口
npm run serve -- --port 8080

# 允许外部访问
npm run serve -- --host 0.0.0.0
```

### 步骤 3：验证运行

```bash
# 健康检查
curl http://127.0.0.1:2333/health

# 预期输出: {"status":"ok","service":"puax-mcp-server","version":"1.6.0"}
```

> ✅ 服务器正常运行后，继续下一步：配置你的 AI 客户端

---

## 🛠️ 客户端配置

### CRUSH (推荐)

**配置文件位置**: `C:\Users\{你的用户名}\.crush\config.json`

```json
{
  "mcp": {
    "puax": {
      "type": "sse",
      "url": "http://127.0.0.1:2333/mcp"
    }
  }
}
```

> **提示**: CRUSH 使用 SSE 模式时，必须在配置中指定 `"type": "sse"`

---

### Claude Desktop

**配置文件位置**:
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "puax": {
      "url": "http://127.0.0.1:2333/mcp"
    }
  }
}
```

> ⚠️ 修改配置后需要重启 Claude Desktop

---

### Cursor

**配置文件位置**: `C:\Users\{你的用户名}\.cursor\settings\cursor_model.json` 或通过 **Settings → Models → MCP Servers** 添加

```json
{
  "mcpServers": {
    "puax": {
      "url": "http://127.0.0.1:2333/mcp"
    }
  }
}
```

---

### Windsurf

**配置文件位置**: `C:\Users\{你的用户名}\.windsurf\settings.json`

```json
{
  "mcp": {
    "puax": {
      "type": "sse",
      "url": "http://127.0.0.1:2333/mcp"
    }
  }
}
```

---

### 其他客户端

通用 SSE 配置：

```json
{
  "mcpServers": {
    "puax": {
      "type": "sse",
      "url": "http://127.0.0.1:2333/mcp"
    }
  }
}
```

> **SSE vs HTTP 模式**:
> - **SSE**: 完整 MCP 会话支持（推荐）
> - **HTTP**: 仅基础工具调用

---

## 🔧 工具使用

### 1. list_roles - 列出角色

```json
{
  "category": "萨满系列"
}
```

### 2. get_role - 获取角色详情

```json
{
  "roleId": "萨满系列_萨满Linus",
  "task": "审查这段代码的性能问题"
}
```

### 3. search_roles - 搜索角色

```json
{
  "keyword": "马斯克"
}
```

### 4. activate_role - 激活角色

```json
{
  "roleId": "萨满系列_萨满马斯克",
  "task": "写一段产品描述",
  "customParams": {
    "产品名称": "智能水壶"
  }
}
```

---

## 📦 部署指南

### 使用 PM2 (生产环境推荐)

```bash
# 安装 pm2
npm install -g pm2

# 启动
pm2 start build/index.js --name puax-mcp-server

# 查看状态
pm2 status

# 查看日志
pm2 logs puax-mcp-server
```

### 使用 Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 2333
CMD ["node", "build/index.js"]
```

```bash
docker build -t puax-mcp .
docker run -d -p 2333:2333 puax-mcp
```

---

## ❓ 常见问题

### Q: 如何确认服务器正在运行？

```bash
curl http://localhost:2333/health
```

### Q: 如何更改端口？

```bash
# 命令行
node build/index.js --port 8080

# 环境变量
PORT=8080 npm start
```

### Q: 支持 HTTPS 吗？

当前仅支持 HTTP。生产环境建议使用 Nginx 反向代理 + SSL。

### Q: 客户端连接超时？

1. 确认服务器已启动
2. 检查防火墙设置
3. 验证端口未被占用

---

## 🔍 故障排除

### 端口被占用

```bash
# Windows
netstat -ano | findstr :2333
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :2333
kill -9 <PID>
```

### 无法连接

1. 确认服务器启动：`curl http://localhost:2333/health`
2. 检查防火墙
3. 验证 Node.js >= 18.0.0

### 工具调用失败

1. 检查服务器日志
2. 验证 roleId 是否存在
3. 确认参数格式正确

---

## 📁 项目结构

```
puax-mcp-server/
├── src/
│   ├── index.ts          # 入口
│   ├── server.ts         # MCP 服务器
│   ├── tools.ts          # 工具定义
│   └── prompts/          # Prompt 数据
├── build/                # 编译输出
├── start.ps1             # Windows 启动脚本
├── start.sh              # Linux/macOS 启动脚本
└── README.md
```

---

## 📝 版本历史

| 版本 | 更新内容 |
|------|----------|
| v1.6.0 | 命令行参数、环境变量、跨平台启动脚本 |
| v1.5.0 | 内置 Prompt 模式 |
| v1.1.0 | HTTP streamable-http 支持 |
| v1.0.0 | 初始版本 (Stdio) |

---

## 🔗 相关链接

- [PUAX 项目主页](https://github.com/linkerlin/PUAX)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

---

> 💡 **提示**: 使用 MCP Inspector 测试工具
> ```bash
> npx @modelcontextprotocol/inspector http://localhost:2333
> ```
