# PUAX 3.1 快速开始

5分钟内启动并使用 PUAX 激励系统。

---

## 方式一：npx 一键使用（推荐）

```bash
# MCP 客户端（STDIO 模式，推荐）
npx puax-mcp-server --stdio

# HTTP 模式（端口 2333）
npx puax-mcp-server --port 2333
```

---

## 方式二：从源码启动

```bash
# 1. 进入服务器目录
cd PUAX/puax-mcp-server

# 2. 安装依赖
npm install

# 3. 生成角色Bundle
npm run generate-bundle

# 4. 启动服务器
npm start
```

---

## 配置 MCP 客户端

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) 或 `%APPDATA%/Claude/claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "puax": {
      "command": "npx",
      "args": ["puax-mcp-server", "--stdio"]
    }
  }
}
```

### Cursor

`~/.cursor/mcp_config.json`:

```json
{
  "mcpServers": {
    "puax": {
      "command": "npx",
      "args": ["puax-mcp-server", "--stdio"]
    }
  }
}
```

### CRUSH

`~/.crush/config.json`:

```json
{
  "mcp": {
    "puax": {
      "type": "stdio",
      "command": "npx",
      "args": ["puax-mcp-server", "--stdio"]
    }
  }
}
```

### Windsurf

`~/.windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "puax": {
      "command": "npx",
      "args": ["puax-mcp-server", "--stdio"]
    }
  }
}
```

---

## 验证安装

### 测试触发检测

在对话中模拟AI失败场景：

```
你: 为什么还不行？
```

PUAX 应该检测到 `user_frustration` 触发条件。

### 查看角色列表

```
列出所有可用的PUAX角色
```

---

## 第一个激励场景

### 场景：AI反复失败

**步骤1**: 模拟AI多次失败

```
AI: 尝试连接数据库...失败
AI: 再次尝试...还是失败
AI: 修改配置后重试...仍然失败
你: 这都第三次了，怎么还不行？
```

**步骤2**: PUAX自动介入

PUAX会：
1. 检测到 `consecutive_failures` 和 `user_frustration`
2. 推荐 `military-warrior` (战士) 角色
3. 激活战士，执行五步法

**步骤3**: 观察角色响应

战士角色会执行军事组织·战士五步法：

1. **请战** - 主动请缨，立下军令状
2. **侦察** - 摸清敌情，找出弱点
3. **冲锋** - 勇猛冲锋，突破防线
4. **坚守** - 坚守阵地，防止反复
5. **庆功** - 庆祝胜利，激励士气

---

## 平台导出

```bash
# 导出到 Cursor Rules
npx puax-mcp-server --export=cursor --output=./.cursor/rules

# 导出到 VSCode Copilot
npx puax-mcp-server --export=vscode --output=./.github

# 查看支持的平台
npx puax-mcp-server --list-platforms
```

---

## 故障排除

### 服务器启动失败

```bash
# 检查端口占用
lsof -i :2333

# 检查日志
cd puax-mcp-server && npm start 2>&1 | tee server.log
```

### 角色未加载

```bash
# 重新生成Bundle
cd puax-mcp-server
npm run generate-bundle
```

### MCP连接失败

1. 确认服务器正在运行
2. 检查URL是否正确：`http://localhost:2333/health`
3. 尝试 STDIO 模式：`npx puax-mcp-server --stdio`

---

## 下一步

- [API 文档](docs/API.md) - 完整MCP工具API参考
- [使用指南](docs/USER-GUIDE.md) - 详细使用说明
