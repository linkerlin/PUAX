# PUAX MCP 配置指南

## 概述

PUAX 支持通过 **HTTP SSE** 方式运行的 MCP 服务器，监听 **2333** 端口。

## 配置文件列表

- **`.gemini/settings.json`** - Project Zero/Gemini 的 MCP 配置（当前为空）
- **`puax-mcp-server/README_HTTP.md`** - 完整的服务器使用文档

## 快速设置

### 1. 启动 MCP 服务器

```bash
# 进入服务器目录
cd C:/GitHub/PUAX/puax-mcp-server

# 安装依赖（如果尚未安装）
npm install

# 构建项目
npm run build

# 启动服务器
npm start
```

服务器启动后将在 `http://localhost:2333` 监听

### 2. 验证服务器状态

```bash
curl http://localhost:2333/health
```

预期输出：
```json
{
  "status": "ok",
  "service": "puax-mcp-server",
  "version": "1.1.1",
  "activeSessions": 0
}
```

## MCP 客户端配置

### Claude Desktop

配置文件路径（Windows）：
- `%APPDATA%/Claude/claude_desktop_config.json`

配置内容：
```json
{
  "mcpServers": {
    "puax": {
      "url": "http://localhost:2333"
    }
  }
}
```

### Project Zero/Gemini

配置文件：`.gemini/settings.json`

配置内容：
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

通用配置格式：
```json
{
  "mcpServers": {
    "puax": {
      "url": "http://localhost:2333"
    }
  }
}
```

## 服务器参数

### 连接信息
- **端口**：2333
- **协议**：HTTP SSE (Server-Sent Events)
- **传输方式**：streamable-http

### 可用工具

1. **list_roles** - 列出指定类别的所有角色
   - 参数：`category`（可选，默认为"全部"）

2. **get_role** - 获取指定角色的详细信息
   - 参数：`roleId`（必需），`task`（可选）

3. **search_roles** - 搜索角色
   - 参数：`keyword`（必需）

4. **activate_role** - 激活指定角色并返回系统 Prompt
   - 参数：`roleId`（必需），`task`（可选），`customParams`（可选）

## 端点说明

- **GET /** - SSE 连接端点，建立持久连接
- **POST /message?sessionId=xxx** - 发送消息到指定会话
- **GET /health** - 健康检查端点

## 故障排除

### 端口被占用

如果 2333 端口被占用，找到占用进程并终止：

```powershell
# Windows
netstat -ano | findstr :2333
taskkill /PID <pid> /F
```

### 服务器无法启动

```bash
# 检查 Node.js 版本（需要 >= 18.0.0）
node --version

# 重新安装依赖并构建
rm -rf node_modules
npm install
npm run build
```

### 连接问题

```bash
# 验证服务器运行状态
curl http://localhost:2333/health

# 查看服务器日志
cd puax-mcp-server && node build/index.js
```

## 开发模式

```bash
# 进入服务器目录
cd puax-mcp-server

# 监听模式（自动重编译）
npm run watch

# 开发模式运行
npm run dev
```

## 测试

```bash
# 运行所有测试
npm test

# 运行特定测试套件
npm run test:unit      # 单元测试
npm run test:http      # HTTP 端点测试
npm run test:sse       # SSE 连接测试
npm run test:tools     # 工具功能测试
npm run test:integration # 集成测试
```

## 更多信息

- 详细迁移说明：`puax-mcp-server/HTTP_MIGRATION.md`
- 完整测试文档：`puax-mcp-server/README_HTTP.md`
