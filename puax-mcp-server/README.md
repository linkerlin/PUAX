# PUAX MCP Server (HTTP Streamable-HTTP 版本)

PUAX MCP Server 是一个基于 Model Context Protocol (MCP) 的服务器，为 AI Agent 提供 PUAX 项目中角色的选择、切换和激活功能。

> **重要更新**: 现已支持 HTTP streamable-http (SSE) 传输方式！监听 **23333** 端口，提供更好的并发性和远程访问能力。

## 功能特性

- **角色列表**: 列出所有可用的 PUAX 角色，支持按类别筛选
- **角色详情**: 获取指定角色的完整 Prompt 内容
- **角色搜索**: 按关键词搜索角色名称和描述
- **角色激活**: 激活角色并生成完整的 System Prompt，支持任务占位符替换
- **HTTP 协议**: 支持 streamable-http (SSE) 传输，多客户端并发

## 快速开始

### 一键启动（推荐）

```bash
# 克隆并启动
git clone https://github.com/linkerlin/PUAX.git
cd PUAX/puax-mcp-server
npm install && npm run serve
```

### 命令行选项

```bash
# 查看帮助
node build/index.js --help

# 使用默认配置启动 (127.0.0.1:23333)
npm start

# 指定端口启动
node build/index.js --port 8080

# 允许外部访问
node build/index.js --host 0.0.0.0

# 使用环境变量
PORT=8080 npm start
```

### 启动脚本

```bash
# Windows (PowerShell)
.\start.ps1 -Port 8080

# Windows (CMD)
start-server.bat

# Linux/macOS
./start.sh --port 8080
```

### 验证服务器

```bash
# 健康检查
curl http://127.0.0.1:23333/health

# 预期输出: {"status":"ok","service":"puax-mcp-server","version":"1.6.0",...}

# MCP 端点测试
curl http://127.0.0.1:23333/mcp
```

## 传输方式

### HTTP Streamable-HTTP (SSE) - 推荐

服务器现在支持 **streamable-http** 传输方式，使用 Server-Sent Events (SSE) 实现双向通信。

在 MCP 客户端配置中：

```json
{
  "mcpServers": {
    "puax": {
      "url": "http://127.0.0.1:23333/mcp"
    }
  }
}
```

或使用根路径（向后兼容）：

```json
{
  "mcpServers": {
    "puax": {
      "url": "http://127.0.0.1:23333"
    }
  }
}
```

#### HTTP 端点

- `GET /mcp` - MCP SSE 连接端点（推荐）
- `POST /mcp` - MCP JSON-RPC 请求端点（推荐）
- `GET /` - SSE 连接端点（向后兼容）
- `POST /` - JSON-RPC 请求端点（向后兼容）
- `POST /message?sessionId=xxx` - 消息发送端点
- `GET /health` - 健康检查端点

#### 健康检查示例

```bash
$ curl http://localhost:23333/health

{"status":"ok","service":"puax-mcp-server","version":"1.0.0","activeSessions":0}
```

### Stdio 传输方式（旧版）

如果需要使用旧的 stdio 传输方式，请将 `src/server.ts` 改回使用 `StdioServerTransport`。

## 配置 MCP 客户端

### CRUSH (推荐 SSE 模式)

CRUSH 支持 SSE (Server-Sent Events) 模式，这是本服务器推荐的使用方式。

编辑配置文件：

- **配置文件路径**: `C:\Users\{你的用户名}\.crush\`

**SSE 模式配置（推荐）**:
```json
{
  "mcp": {
    "puax": {
      "type": "sse",
      "url": "http://127.0.0.1:23333/mcp"
    }
  }
}
```

> **注意**: CRUSH 使用 SSE 模式时，需要在配置中明确指定 `"type": "sse"`

### Claude Desktop

编辑配置文件：

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

配置示例：

```json
{
  "mcpServers": {
    "puax": {
      "url": "http://127.0.0.1:23333/mcp",
      "env": {
        "PUAX_PROJECT_PATH": "/path/to/your/PUAX/project"
      }
    }
  }
}
```

> **注意**: Claude Desktop 使用 HTTP 模式，确保服务器已经启动。

### Cursor

在 Cursor 设置中添加：

```json
{
  "mcpServers": {
    "puax": {
      "url": "http://127.0.0.1:23333/mcp",
      "env": {
        "PUAX_PROJECT_PATH": "/path/to/your/PUAX/project"
      }
    }
  }
}
```

### 其他支持 SSE 的 MCP 客户端

对于其他支持 SSE 传输的 MCP 客户端，请使用以下配置：

```json
{
  "mcpServers": {
    "puax": {
      "type": "sse",
      "url": "http://127.0.0.1:23333/mcp"
    }
  }
}
```

> **SSE vs HTTP**: 
> - **SSE 模式**: 支持完整的 MCP 会话，包括 prompts、resources、notifications
> - **HTTP 模式**: 仅支持基础的工具调用，适合简单的请求-响应场景

## 可用工具

### 1. list_roles

列出所有可用的角色。

**参数：**
- `category` (可选): 按类别筛选，可选值：
  - "全部" (默认)
  - "萨满系列"
  - "军事化组织"
  - "SillyTavern系列"
  - "主题场景"
  - "自我激励"
  - "特色角色与工具"

**示例：**
```json
{
  "category": "军事化组织"
}
```

### 2. get_role

获取指定角色的详细 Prompt 内容。

**参数：**
- `roleId` (必需): 角色ID
- `task` (可选): 具体任务描述，会替换模板中的占位符

**示例：**
```json
{
  "roleId": "军事化组织_督战队铁纪执行",
  "task": "审查这段代码的性能问题"
}
```

### 3. search_roles

按关键词搜索角色。

**参数：**
- `keyword` (必需): 搜索关键词

**示例：**
```json
{
  "keyword": "马斯克"
}
```

### 4. activate_role

激活角色并返回完整的 System Prompt。

**参数：**
- `roleId` (必需): 角色ID
- `task` (可选): 具体任务描述
- `customParams` (可选): 自定义参数替换

**示例：**
```json
{
  "roleId": "萨满系列_萨满马斯克",
  "task": "为我的新产品写一段产品描述",
  "customParams": {
    "产品名称": "智能水壶"
  }
}
```

## 开发与测试

### 使用 MCP Inspector 测试

```bash
npx @modelcontextprotocol/inspector http://localhost:23333
```

浏览器将自动打开 Inspector 界面，你可以：
1. 测试工具列表
2. 调用具体工具
3. 查看请求和响应

### 开发命令

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 开发模式（热重载）
npm run watch

# 运行
npm start

# 开发运行
npm run dev
```

### 项目结构

```
puax-mcp-server/
├── src/
│   ├── index.ts          # 主入口
│   ├── server.ts         # MCP 服务器实现（HTTP 版本）
│   ├── tools.ts          # 工具定义
│   └── prompts/          # Prompt 数据管理
│       └── index.ts
├── build/                # 编译输出
├── package.json
├── tsconfig.json
└── README.md
```

## 环境变量

- `PUAX_PROJECT_PATH`: 指定 PUAX 项目的路径。如果未设置，服务器会自动尝试找到 PUAX 项目目录。

## 部署建议

### 使用进程管理器

```bash
# 安装 pm2
npm install -g pm2

# 启动服务器
pm2 start build/index.js --name puax-mcp-server

# 查看状态
pm2 status

# 查看日志
pm2 logs puax-mcp-server
```

### 使用 Docker（未来支持）

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 23333
CMD ["node", "build/index.js"]
```

### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:23333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## HTTP 传输优势

相比传统的 stdio 传输方式，HTTP 版本提供：

✅ **多客户端支持** - 同时处理多个连接  
✅ **远程访问** - 可通过网络访问  
✅ **易于调试** - 支持 curl、浏览器工具  
✅ **健康监控** - 内置健康检查端点  
✅ **标准兼容** - 符合 MCP streamable-http 规范  
✅ **生产就绪** - 易于部署和监控  

## 常见问题

### Q: 如何确认服务器正在运行？

**A**: 使用健康检查端点：
```bash
curl http://localhost:23333/health
```

### Q: 如何更改监听端口？

**A**: 修改 `src/server.ts` 中的端口配置（默认为 23333）。

### Q: 是否支持 HTTPS？

**A**: 当前版本仅支持 HTTP，建议在生产环境使用 Nginx 反向代理并配置 SSL。

### Q: 连接超时怎么办？

**A**: 检查：
1. 服务器是否正常运行
2. 端口是否被防火墙阻止
3. 网络连接是否正常

### Q: 如何查看服务器日志？

**A**: 服务器日志输出到 stderr，使用 pm2 时：
```bash
pm2 logs puax-mcp-server
```

## 故障排除

### 端口被占用

如果遇到 `EADDRINUSE` 错误：

```bash
# 查找占用端口的进程
# Windows (PowerShell)
Get-NetTCPConnection -LocalPort 23333 | Select-Object OwningProcess
Get-Process -Id <PID>

# Windows (CMD)
netstat -ano | findstr :23333
tasklist /FI "PID eq <PID>"

# Linux/macOS
lsof -i :23333
ps aux | grep <PID>

# 关闭进程
# Windows
Stop-Process -Id <PID> -Force
# 或
taskkill /PID <PID> /F

# Linux/macOS
kill -9 <PID>

# 或者使用不同端口
node build/index.js --port 8080
```

### 无法连接

1. 确认服务器已启动：
   ```bash
   curl http://localhost:23333/health
   ```

2. 检查防火墙设置
3. 验证 Node.js 版本（>= 18.0.0）

### 工具调用失败

1. 检查服务器日志中的错误信息
2. 验证参数格式是否正确
3. 确认 roleId 是否存在

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关链接

- [PUAX 项目主页](https://github.com/linkerlin/PUAX)
- [PUAX 文档](https://github.com/linkerlin/PUAX/blob/main/README.md)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

## 版本历史

### v1.6.0 (Latest)
- ✅ 添加命令行参数支持 (`--port`, `--host`, `--quiet`, `--help`, `--version`)
- ✅ 添加环境变量支持 (`PORT`, `HOST`, `PUAX_PORT`, `PUAX_HOST`)
- ✅ 优化启动日志，美化输出
- ✅ 修复版本号读取问题，支持 npx 运行
- ✅ 添加跨平台启动脚本 (`start.ps1`, `start.sh`, `start-server.bat`)
- ✅ 优雅关闭处理

### v1.5.0
- ✅ 内置 Prompt 模式，无需外部文件
- ✅ 添加 `puax` 短命令别名

### v1.1.0 (2026-01-02)
- ✅ 新增 HTTP streamable-http (SSE) 传输方式
- ✅ 支持多客户端并发连接
- ✅ 添加健康检查端点
- ✅ 监听 23333 端口
- ✅ 改进错误处理和日志记录

### v1.0.0 (Initial)
- ✅ Stdio 传输方式
- ✅ 角色管理工具
- ✅ Prompt 加载和激活

---

**注意**: 这是 HTTP streamable-http 版本。如需使用传统的 stdio 版本，请查看 Git 历史记录或切换到相关分支。