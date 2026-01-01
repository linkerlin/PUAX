# PUAX MCP Server

PUAX MCP Server 是一个基于 Model Context Protocol (MCP) 的服务器，为 AI Agent 提供 PUAX 项目中角色的选择、切换和激活功能。

## 功能特性

- **角色列表**：列出所有可用的 PUAX 角色，支持按类别筛选
- **角色详情**：获取指定角色的完整 Prompt 内容
- **角色搜索**：按关键词搜索角色名称和描述
- **角色激活**：激活角色并生成完整的 System Prompt，支持任务占位符替换

## 安装

### 全局安装（推荐）

```bash
npm install -g @puax/mcp-server
```

### 本地安装

```bash
npm install @puax/mcp-server
npx puax-mcp-server
```

### 从源码构建

```bash
git clone https://github.com/linkerlin/PUAX.git
cd PUAX/puax-mcp-server
npm install
npm run build
npm start
```

## 使用方法

### 作为 MCP 服务器使用

在你的 MCP 客户端配置中添加：

```json
{
  "mcpServers": {
    "puax": {
      "command": "npx",
      "args": ["@puax/mcp-server"]
    }
  }
}
```

### 直接运行

```bash
# 全局安装后
puax-mcp-server

# 或使用 npx
npx @puax/mcp-server
```

## 工具说明

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

## 使用示例

### 在 Claude Desktop 中使用

1. 打开 Claude Desktop 配置：
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%/Claude/claude_desktop_config.json`

2. 添加 MCP 服务器配置：

```json
{
  "mcpServers": {
    "puax": {
      "command": "npx",
      "args": ["@puax/mcp-server"],
      "env": {
        "PUAX_PROJECT_PATH": "/path/to/your/PUAX/project"
      }
    }
  }
}
```

3. 重启 Claude Desktop

### 在 Cursor 中使用

在 Cursor 设置中添加 MCP 服务器：

```json
{
  "mcpServers": {
    "puax": {
      "command": "npx",
      "args": ["@puax/mcp-server"],
      "env": {
        "PUAX_PROJECT_PATH": "/path/to/your/PUAX/project"
      }
    }
  }
}
```

## 环境变量

- `PUAX_PROJECT_PATH`: 指定 PUAX 项目的路径。如果未设置，服务器会自动尝试找到 PUAX 项目目录。

## 开发

### 项目结构

```
puax-mcp-server/
├── src/
│   ├── index.ts          # 主入口
│   ├── server.ts         # MCP 服务器实现
│   ├── tools.ts          # 工具定义
│   └── prompts/
│       └── index.ts      # Prompt 数据管理
├── package.json
├── tsconfig.json
└── README.md
```

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

### 发布

```bash
# 构建
npm run build

# 发布到 npm
npm publish
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关链接

- [PUAX 项目主页](https://github.com/linkerlin/PUAX)
- [PUAX 文档](https://github.com/linkerlin/PUAX/blob/main/README.md)
