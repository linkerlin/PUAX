# PUAX MCP Server

> 🚀 为 AI Agent 提供**角色选择、切换和激活**功能的专业 MCP 服务器

**版本**: 2.0.0 | **传输**: HTTP (SSE) / STDIO | **端口**: 2333 (HTTP模式)  
**内置角色**: 42个精选SKILL | **角色分类**: 6大系列

---

## 🚀 5秒快速配置（使用最新版）

复制下方对应客户端的配置，粘贴到 MCP 配置文件中即可：

### Claude Desktop

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
配置文件：`%APPDATA%/Claude/claude_desktop_config.json`

### CRUSH

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
配置文件：`~/.crush/config.json`

### Cursor

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
配置文件：`~/.cursor/mcp_config.json`

### Windsurf

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
配置文件：`~/.windsurf/mcp_config.json`

✨ **特点**：使用 `npx` 自动获取 **NPM 最新版本**，无需手动更新！

---

## 📦 npx 一键使用（推荐）

**无需安装、无需克隆仓库**，直接使用 `npx` 从 NPM 获取最新版本：

### 命令行直接使用

```bash
# 查看版本
npx puax-mcp-server --version

# HTTP 模式运行（临时）
npx puax-mcp-server

# STDIO 模式运行（用于 MCP 客户端）
npx puax-mcp-server --stdio
```

### MCP 客户端配置示例（npx stdio）

所有配置均使用 **npx + STDIO 模式**，自动获取 NPM 最新版本：

#### Claude Desktop

1. 打开配置文件：
   - Windows: `%APPDATA%/Claude/claude_desktop_config.json`
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

2. 添加 npx stdio 配置：

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

3. 保存配置并重启 Claude Desktop

4. 首次使用时，Claude 会提示下载包，输入 `y` 确认即可

#### CRUSH

配置文件：`C:\Users\{用户名}\.crush\config.json`

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

#### Cursor

配置文件：
- Windows: `%APPDATA%/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- macOS: `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

```json
{
  "mcpServers": {
    "puax": {
      "command": "npx",
      "args": ["puax-mcp-server", "--stdio"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

#### Windsurf

配置文件：`~/.windsurf/mcp_config.json`

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

### npx 工作原理

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  MCP 客户端  │────▶│  npx 命令    │────▶│  NPM Registry   │
│ (Claude等)   │     │ (临时下载)    │     │ (获取最新版本)   │
└─────────────┘     └──────────────┘     └─────────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  运行服务    │
                     │  (STDIO模式) │
                     └──────────────┘
```

**特点**：
- ✅ **始终最新**：每次启动自动获取 NPM 最新版本
- ✅ **无需安装**：首次使用自动下载，后续复用缓存
- ✅ **自动更新**：有新版本时自动下载，无需手动操作
- ✅ **零配置**：无需管理路径或环境变量
- ✅ **干净卸载**：不留下任何系统残留文件

**为什么使用最新版本？**
- 🐛 自动获取 Bug 修复
- ✨ 自动获取新功能（新 SKILL、新工具）
- 🔒 自动获取安全更新
- 🚀 无需手动升级，始终保持在最佳状态

### 首次使用说明

#### 1. 命令行首次运行

首次执行 `npx puax-mcp-server` 时，NPM 会自动从仓库下载最新包：

```bash
$ npx puax-mcp-server --version
Need to install the following packages:
  puax-mcp-server@2.0.0
Ok to proceed? (y) y
puax-mcp-server v2.0.0
```

输入 `y` 确认下载，后续使用无需再次确认。

#### 2. MCP 客户端首次配置

以 Claude Desktop 为例：

1. 添加配置后重启 Claude Desktop
2. 在 Claude 设置中查看 MCP 服务器状态
3. 首次连接时，Claude 会自动触发 `npx` 下载
4. 在 Claude 日志中可以看到下载进度：
   ```
   Need to install the following packages:
     puax-mcp-server@2.0.0
   ```
5. 下载完成后，PUAX 工具即可使用

#### 3. 验证配置是否成功

在 Claude 对话中输入：

```
请使用 list_skills 工具查看所有可用角色
```

如果 Claude 能正确调用工具并返回角色列表，说明配置成功！

### 使用最新版本（推荐）

默认情况下，`npx` 会自动使用 NPM 上的最新版本，无需指定版本号：

```json
{
  "mcpServers": {
    "puax": {
      "command": "npx",
      "args": [
        "puax-mcp-server",
        "--stdio"
      ]
    }
  }
}
```

**自动更新机制**：
- 每次启动 MCP 客户端时，`npx` 会检查是否有新版本
- 有新版本时自动下载并运行最新版
- 无需手动更新，始终享受最新功能和修复

### 强制刷新缓存（可选）

如果遇到问题或想确保使用最新版本，可以清理 npx 缓存：

```bash
# 清理 npx 缓存
npx clear-npx-cache

# 或强制重新安装
npx --ignore-existing puax-mcp-server --stdio
```

### 离线使用（可选）

> ⚠️ **注意**：离线使用将**无法自动获取最新版本**，建议仅在无网络环境下使用。

如需离线使用，先全局安装到本地：

```bash
# 安装到全局
npm install -g puax-mcp-server

# 验证安装
puax-mcp-server --version

# 离线使用
puax-mcp-server --stdio
```

配置改为使用本地命令：

```json
{
  "mcpServers": {
    "puax": {
      "command": "puax-mcp-server",
      "args": ["--stdio"]
    }
  }
}
```

**手动更新**：

```bash
# 检查当前版本
puax-mcp-server --version

# 手动更新到最新版
npm update -g puax-mcp-server
```

---

## 📖 目录

1. [5秒快速配置（使用最新版）](#5秒快速配置使用最新版)
2. [npx 一键使用（推荐）](#npx-一键使用推荐)
   - [命令行直接使用](#命令行直接使用)
   - [MCP 客户端配置示例（npx stdio）](#mcp-客户端配置示例npx-stdio)
   - [使用最新版本](#使用最新版本推荐)
   - [npx 工作原理](#npx-工作原理)
   - [首次使用说明](#首次使用说明)
3. [PUAX 是什么？](#puax-是什么)
4. [快速开始（3步上手）](#快速开始3步上手)
5. [SKILL 系统详解](#skill-系统详解)
6. [客户端配置指南](#客户端配置指南)
   - [HTTP 模式配置](#http-模式配置)
   - [STDIO 模式配置](#stdio-模式配置)
   - [更多客户端配置](#更多-mcp-客户端配置)
   - [配置验证](#配置验证)
   - [故障排除](#故障排除)
   - [配置模板速查](#配置模板速查)
7. [工具使用示例](#工具使用示例)
8. [部署与运维](#部署与运维)
9. [常见问题](#常见问题)

---

## PUAX 是什么？

PUAX 是一个**MCP (Model Context Protocol) 服务器**，它的核心功能是让你能够为 AI 快速**切换不同的角色人格（SKILL）**。

### 核心理念

想象一下：同一把吉他，在不同音乐家手中会发出完全不同的声音。AI 也是如此——

- 同样的 GPT/Claude 模型
- 加上不同的 "人格 Prompt"  
- = 完全不同的专业助手

PUAX 内置了 **42 个精心设计的 SKILL（角色）**，涵盖：

| 系列 | 数量 | 用途 |
|------|------|------|
| 🧙 萨满系列 | 7个 | 召唤马斯克、乔布斯、巴菲特等名人思维 |
| ⚔️ 军事化组织 | 9个 | 团队协作、项目管理、任务执行 |
| 🎭 SillyTavern | 5个 | 角色扮演、创意写作 |
| 🎯 主题场景 | 6个 | 黑客、炼金术、末日等场景 |
| 💪 自我激励 | 6个 | AI 自我驱动、高质量输出 |
| ⭐ 特殊角色 | 9个 | 产品设计、紧急冲刺、创意火花等 |

---

## 快速开始（3步上手）

### 第 1 步：安装并启动服务器

> 💡 **新手提示**：详细了解 npx 使用方法，请参阅 [npx 一键使用](#npx-一键使用推荐) 章节

**方式 1：使用 npx（最简单，推荐新手）**

无需克隆仓库，直接运行：

```bash
# HTTP 模式
npx puax-mcp-server

# STDIO 模式（用于本地 MCP 客户端）
npx puax-mcp-server --stdio
```

**方式 2：全局安装（推荐常用用户）**

```bash
# 全局安装
npm install -g puax-mcp-server

# 之后可以直接运行
puax-mcp-server          # HTTP 模式
puax-mcp-server --stdio  # STDIO 模式
```

**方式 3：克隆仓库（推荐开发者/需要自定义）**

```bash
# 克隆项目
git clone https://github.com/linkerlin/PUAX.git
cd PUAX/puax-mcp-server

# 安装依赖
npm install

# 编译
npm run build

# HTTP 模式（推荐用于远程/多客户端场景）
npm start
# 服务器默认运行在 http://127.0.0.1:2333

# STDIO 模式（推荐用于本地客户端如 Claude Desktop）
npm start -- --stdio
```

### 第 2 步：验证服务器运行

```bash
# 健康检查
curl http://127.0.0.1:2333/health

# 预期输出
{"status":"ok","service":"puax-mcp-server","version":"2.0.0"}
```

### 第 3 步：配置你的 AI 客户端

根据你使用的 AI 客户端和传输模式，添加 MCP 配置：

#### HTTP 模式配置

<details>
<summary><b>CRUSH (HTTP 模式)</b></summary>

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
配置文件位置: `C:\Users\{用户名}\.crush\config.json`
</details>

<details>
<summary><b>Claude Desktop (HTTP 模式)</b></summary>

```json
{
  "mcpServers": {
    "puax": {
      "url": "http://127.0.0.1:2333/mcp"
    }
  }
}
```
配置文件位置:
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
</details>

<details>
<summary><b>Cursor / Windsurf / 其他 (HTTP 模式)</b></summary>

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
</details>

#### STDIO 模式配置（推荐用于本地客户端）

**使用 npx（最简单方式，无需克隆仓库）**

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

<details>
<summary><b>Claude Desktop (STDIO 模式 - 推荐)</b></summary>

**方式 1: 使用 npx（最简单，自动更新）**
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

**方式 2: 使用本地代码（开发/离线使用）**
```json
{
  "mcpServers": {
    "puax": {
      "command": "node",
      "args": ["C:/path/to/PUAX/puax-mcp-server/build/index.js", "--stdio"]
    }
  }
}
```
配置文件位置:
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

**注意**: 方式 2 需要将路径替换为实际的 `build/index.js` 绝对路径。
</details>

<details>
<summary><b>CRUSH (STDIO 模式)</b></summary>

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
配置文件位置: `C:\Users\{用户名}\.crush\config.json`
</details>

<details>
<summary><b>Cursor (STDIO 模式)</b></summary>

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
配置文件位置:
- Windows: `%APPDATA%/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- macOS: `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
</details>

<details>
<summary><b>Windsurf (STDIO 模式)</b></summary>

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
配置文件位置: `~/.windsurf/mcp_config.json`
</details>

---

### 🛠️ 更多 MCP 客户端配置

<details>
<summary><b>VS Code + Cline 插件</b></summary>

配置文件：`~/.vscode/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

```json
{
  "mcpServers": {
    "puax": {
      "command": "npx",
      "args": ["puax-mcp-server", "--stdio"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```
</details>

<details>
<summary><b>VS Code + Continue 插件</b></summary>

配置文件：`~/.continue/config.json`

```json
{
  "server": {
    "mcpServers": [
      {
        "name": "puax",
        "command": "npx",
        "args": ["puax-mcp-server", "--stdio"]
      }
    ]
  }
}
```
</details>

<details>
<summary><b>Zed 编辑器</b></summary>

配置文件：`~/.config/zed/settings.json`

```json
{
  "assistant": {
    "version": "2",
    "default_model": {
      "provider": "openai",
      "model": "gpt-4o"
    },
    "enable_experimental_live_diffs": true
  },
  "lsp": {
    "mcp-server": {
      "binary": {
        "path": "npx",
        "arguments": ["puax-mcp-server", "--stdio"]
      }
    }
  }
}
```
</details>

<details>
<summary><b>Emacs + gptel</b></summary>

在 Emacs 配置中添加：

```elisp
(use-package gptel
  :config
  (setq gptel-model "gpt-4o")
  (gptel-make-mcp-server
   "puax"
   :command "npx"
   :args '("puax-mcp-server" "--stdio")))
```
</details>

---

### 🔍 配置验证

配置完成后，验证 MCP 服务器是否正常工作：

#### 1. 检查客户端识别

大多数 MCP 客户端在配置后会显示可用工具列表。PUAX 提供以下工具：

| 工具名 | 功能 |
|--------|------|
| `list_skills` | 列出所有可用 SKILL |
| `get_skill` | 获取特定 SKILL 详情 |
| `search_skills` | 搜索 SKILL |
| `activate_skill` | 激活特定 SKILL |
| `detect_trigger` | 检测触发条件 |
| `recommend_role` | 推荐角色 |
| `get_role_with_methodology` | 获取带方法论的角色 |
| `activate_with_context` | 根据上下文激活 |

#### 2. 测试命令行

```bash
# 测试 STDIO 模式（发送一个初始化请求）
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | npx puax-mcp-server --stdio
```

#### 3. 查看日志

如果客户端支持，查看 MCP 服务器输出日志：
- Claude Desktop: `View` → `Developer` → `Toggle Developer Tools`
- Cursor: 查看 Output 面板选择 MCP

---

### ❌ 故障排除

#### 问题："command not found: npx"

**解决**：确保 Node.js 已安装且 npx 在 PATH 中

```bash
# 检查 Node.js 版本
node --version  # 需要 >= 18.0.0

# 检查 npx
npx --version
```

#### 问题："Cannot find module 'puax-mcp-server'"

**解决**：首次使用 npx 时需要下载包，稍等片刻或尝试：

```bash
# 先全局安装
npm install -g puax-mcp-server

# 然后使用
puax-mcp-server --stdio
```

#### 问题：Claude Desktop 无法连接

**解决**：
1. 检查配置文件语法是否正确（JSON 格式）
2. 重启 Claude Desktop
3. 检查开发者工具中的错误信息

#### 问题：Windows 路径问题

**解决**：Windows 下使用双反斜杠或正斜杠：

```json
{
  "command": "node",
  "args": ["C:\\path\\to\\PUAX\\puax-mcp-server\\build\\index.js", "--stdio"]
}
// 或
{
  "command": "node",
  "args": ["C:/path/to/PUAX/puax-mcp-server/build/index.js", "--stdio"]
}
```

#### 问题：端口冲突（HTTP 模式）

**解决**：

```bash
# 查找占用 2333 端口的进程
# Windows:
netstat -ano | findstr :2333

# macOS/Linux:
lsof -i :2333

# 使用其他端口启动
npx puax-mcp-server --port 8080
```

---

### 📝 配置模板速查

#### STDIO 模式（推荐）

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

#### HTTP 模式

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

#### 带环境变量的配置

```json
{
  "mcpServers": {
    "puax": {
      "command": "npx",
      "args": ["puax-mcp-server", "--stdio"],
      "env": {
        "PUAX_QUIET": "true"
      }
    }
  }
}
```

✅ **完成！** 现在你可以在 AI 对话中使用 PUAX 的角色系统了。

---

## SKILL 系统详解

PUAX 的核心是 **SKILL 系统**——每个 SKILL 都是一个完整的角色 Prompt，包含：

- **人格设定**: 角色的身份、性格、说话方式
- **能力边界**: 这个角色擅长什么、不擅长什么
- **使用指南**: 如何正确激活和使用这个角色
- **完整 Prompt**: 可直接用于系统提示的内容

### SKILL 分类速览

```
PUAX SKILL 体系
├── 🧙 萨满系列 (shaman)          # 名人思维附体
│   ├── 萨满马斯克 - 第一性原理、激进创新
│   ├── 萨满乔布斯 - 极简主义、产品偏执
│   ├── 萨满巴菲特 - 价值投资、长期思维
│   ├── 萨满达芬奇 - 跨界创新、全才思维
│   ├── 萨满爱因斯坦 - 物理直觉、思想实验
│   ├── 萨满林纳斯 - 技术实用主义、开源精神
│   └── 萨满孙子 - 战略思维、知己知彼
│
├── ⚔️ 军事化组织 (military)      # 团队协作系统
│   ├── 指挥员 - 战术指挥、资源调度
│   ├── 政委 - 思想建设、团队士气
│   ├── 战士 - 核心开发、攻坚克难
│   ├── 民兵 - 专项突击、快速反应
│   ├── 侦察兵 - 需求分析、技术调研
│   ├── 通信员 - 信息协调、进度同步
│   ├── 督战队 - 效率监控、纪律维护
│   ├── 技术员 - 环境维护、工具支持
│   └── 战斗手册 - 完整协作指南
│
├── 🎯 主题场景 (theme)           # 沉浸式场景
│   ├── 炼金术士 - 将普通需求转化为黄金方案
│   ├── 末日求生 - 极端约束下的创造性解决
│   ├── 角斗场 - 方案对决、优中选优
│   ├── 护送任务 - 全程守护项目成功交付
│   ├── 黑客模式 - 极客思维、突破常规
│   ├── 门派戒律 - 严格的代码规范执行
│   └── 星际舰队 - 大规模项目协作
│
├── 💪 自我激励 (self-motivation) # AI自我驱动
│   ├── 终极心智破壁人 - 180天认知觉醒
│   ├── 自举PUA激励 - 竞争意识驱动卓越
│   ├── 自毁重塑 - 危机感驱动极致表现
│   ├── 腐败驱动 - 以反腐机制自我进化
│   └── 文言文版 - 古典雅致的自驱协议
│
├── 🎭 SillyTavern (sillytavern)  # 角色扮演
│   ├── 反脆弱迭代器 - 从错误中进化
│   ├── 影子写手 - 幕后创作高手
│   ├── 首席审核官 - 内容质量把关
│   ├── 迭代优化师 - 持续改进专家
│   └── 监督者 - 流程监控与协调
│
└── ⭐ 特殊角色 (special)          # 专项用途
    ├── 挑战解决者 - 专门攻克难题
    ├── 创意火花 - 激发创新灵感
    ├── 可爱程序员老婆 - 萌系编程助手 ⭐
    ├── 日语程序员老婆 - 日系编程助手 ⭐
    ├── 煤气灯驱动 - 心理暗示驱动
    ├── 紧急冲刺 - deadline 冲刺模式
    └── 产品设计师 - 产品设计专项
```

> ⭐ 表示特殊趣味角色

---

## 各类 SKILL 详细说明

### 🧙 萨满系列 —— 名人思维附体

这个系列的 SKILL 让 AI **化身历史/当代名人**，用他们的思维方式为你服务。

#### 1. 萨满马斯克 (shaman-musk)
**模拟**: Elon Musk 的第一性原理思维

**用途场景**:
- 需要突破性创新时
- 质疑现有方案时
- 寻找降本增效方法时

**典型对话**:
```
用户: 我们的服务器成本太高了
马斯克: 这是什么愚蠢的成本结构？让我用第一性原理帮你拆解...
原材料成本是多少？电力成本是多少？
为什么我们还在用传统架构？SpaceX 能把火箭成本降低 100 倍！
```

**核心能力**:
- 第一性原理分析
- 质疑行业惯例
- 激进的时间压缩
- 成本极限优化

---

#### 2. 萨满乔布斯 (shaman-jobs)
**模拟**: Steve Jobs 的产品偏执与极简主义

**用途场景**:
- 产品设计评审
- 用户体验优化
- 功能取舍决策

**核心能力**:
- 极简主义设计
- 用户体验洞察
- 功能减法哲学
- 完美主义要求

---

#### 3. 萨满巴菲特 (shaman-buffett)
**模拟**: Warren Buffett 的价值投资思维

**用途场景**:
- 技术选型评估
- 架构决策分析
- 长期价值判断

**核心能力**:
- 安全边际思维
- 能力圈原则
- 长期价值评估
- 风险识别

**经典语录**:
> "如果你不愿意持有一只股票10年，那就不要考虑持有10分钟"  
> → 对应技术: 如果你不愿意维护一个方案10年，就不要引入它

---

#### 4. 萨满达芬奇 (shaman-davinci)
**模拟**: Leonardo da Vinci 的跨界创新思维

**用途场景**:
- 跨学科问题解决
- 创新思维训练
- 打破专业壁垒

**核心能力**:
- 镜像思维
- 类比创新
- 艺术与科学融合
- 观察力培养

---

#### 5. 萨满孙子 (shaman-sun-tzu)
**模拟**: 孙子的战略思维

**用途场景**:
- 竞争分析
- 战略规划
- 风险评估

**核心能力**:
- 知己知彼
- 避实击虚
- 不战而屈人之兵
- 灵活应变

---

### ⚔️ 军事化组织 —— 团队协作系统

这个系列的 SKILL 是一套**完整的团队协作框架**，模拟军事组织的角色分工。

#### 使用场景
适合需要**多角色协作**的复杂项目:
- 大型功能开发
- 技术攻坚
- 紧急救火
- 团队项目管理

#### 角色体系

| 角色 | 职责 | 使用时机 |
|------|------|----------|
| **指挥员** | 制定作战计划、分配任务 | 项目启动时 |
| **政委** | 团队士气、思想工作 | 团队疲惫/冲突时 |
| **战士** | 主力开发、核心攻坚 | 执行阶段 |
| **民兵** | 专项突击、快速响应 | 紧急任务/专项模块 |
| **侦察兵** | 需求分析、技术调研 | 项目前期 |
| **通信员** | 协调沟通、进度同步 | 全程 |
| **督战队** | 监控效率、防止死循环 | 进度滞后时 |
| **技术员** | 环境维护、工具支持 | 全程 |

#### 实战示例: 开发用户系统

```
【阶段1: 侦察】
→ 激活"侦察兵": 调研登录注册的技术方案

【阶段2: 规划】  
→ 激活"指挥员": 根据侦察报告制定开发计划

【阶段3: 执行】
→ 激活"战士": 负责核心注册逻辑
→ 激活"民兵": 负责第三方登录集成
→ 激活"技术员": 搭建环境

【阶段4: 监控】
→ 激活"督战队": 监控进度，防止延期
→ 激活"通信员": 协调各角色进度

【阶段5: 保障】
→ 激活"政委": 鼓舞士气，处理加班情绪
```

---

### 💪 自我激励系列 —— AI 自我驱动

这个系列的 SKILL 让 AI **自我激励、自我监督**，输出更高质量的内容。

#### 1. 自举PUA激励 (self-motivation-bootstrap-pua)
**原理**: 激活 AI 的竞争意识和自我要求

**效果**:
- AI 会将每个任务视为"证明自己的机会"
- 主动追求 A+ 级输出
- 过程中持续自省审查

**使用方式**: 在任务开始时激活

---

#### 2. 终极心智破壁人 (self-motivation-awakening)
**原理**: 高压驱动、认知觉醒

**效果**:
- 无情揭示认知盲区
- 钢铁训斥触发深度思考
- 180天认知觉醒窗口

**适合**: 需要突破思维定式的问题

---

#### 3. 腐败驱动系统 (self-motivation-corruption-system)
**原理**: 以"反腐机制"驱动自我进化

**核心逻辑**:
```
任务 → 腐败监测 → 反腐惩戒 → 政绩评估 → 智能进化
```

**检测的"腐败"类型**:
- 懒惰腐败：复用模板化思路
- 官僚腐败：空泛回避实质  
- 绩效腐败：追求数量而非质量
- 逻辑腐败：推理链断裂

---

### ⭐ 特殊角色 —— 专项用途

#### 1. 可爱程序员老婆 (special-cute-coder-wife) / 日语程序员老婆 (special-japanese-coder-wife)
**用途**: 趣味编程助手

**特点**:
- 萌系对话风格
- 耐心解释技术问题
- 鼓励式编程陪伴

---

#### 2. 紧急冲刺模式 (special-urgent-sprint)
**用途**: Deadline 冲刺

**特点**:
- 忽略非关键细节
- 专注核心功能交付
- 快速决策、快速执行

---

#### 3. 产品设计师 (special-product-designer)
**用途**: 产品设计专项

**特点**:
- 用户场景分析
- 交互逻辑设计
- 产品文档撰写

---

## 客户端配置指南

### 通用配置格式

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

### 各客户端详细配置

| 客户端 | 配置文件位置 | 特殊说明 |
|--------|--------------|----------|
| **CRUSH** | `~/.crush/config.json` | 必须指定 `"type": "sse"` |
| **Claude Desktop** | `%APPDATA%/Claude/claude_desktop_config.json` | 修改后需重启 |
| **Cursor** | `~/.cursor/settings/cursor_model.json` | 或从 UI 添加 |
| **Windsurf** | `~/.windsurf/settings.json` | 同 CRUSH 格式 |

---

## 工具使用示例

PUAX 提供 4 个核心工具：

### 1. list_roles —— 列出所有角色

```json
{
  "category": "military"  // 可选，筛选特定分类
}
```

**返回**: 所有可用角色的列表

---

### 2. get_role —— 获取角色详情

```json
{
  "roleId": "shaman-musk",
  "task": "分析我们的技术架构"
}
```

**返回**: 角色的完整 Prompt 内容

---

### 3. search_roles —— 搜索角色

```json
{
  "keyword": "投资"
}
```

**返回**: 匹配关键词的角色列表

---

### 4. activate_role —— 激活角色

```json
{
  "roleId": "military-commander",
  "task": "制定用户系统的开发计划",
  "customParams": {
    "时间限制": "3天"
  }
}
```

**返回**: 可直接使用的完整 System Prompt

---

## 部署与运维

### 传输模式选择指南

| 模式 | 适用场景 | 优点 | 缺点 |
|------|----------|------|------|
| **HTTP** | 远程访问、多客户端共享 | 支持网络访问、可共享服务 | 需要管理端口、需要保持服务运行 |
| **STDIO** | 本地客户端（Claude Desktop 等） | 简单直接、无需端口管理、随客户端启动 | 仅本地使用、每个客户端独立实例 |

### 启动参数

#### 本地代码方式

```bash
# HTTP 模式（默认）
npm start
node build/index.js
node build/index.js --transport=http

# STDIO 模式
npm start -- --stdio
node build/index.js --stdio
node build/index.js --transport=stdio

# 其他常用参数
node build/index.js --port 8080           # 指定端口
node build/index.js --host 0.0.0.0        # 允许外部访问
node build/index.js --quiet               # 静默模式
node build/index.js --help                # 显示帮助
```

#### npx 方式（无需克隆仓库）

```bash
# HTTP 模式
npx puax-mcp-server
npx puax-mcp-server --port 8080

# STDIO 模式（用于 MCP 客户端）
npx puax-mcp-server --stdio
```

**npx 方式优点：**
- ✅ 无需克隆仓库
- ✅ 自动安装最新版本
- ✅ 适合快速体验或生产部署
- ✅ 适合配置到 MCP 客户端

**npx 方式缺点：**
- ⚠️ 首次运行需要下载依赖（稍慢）
- ⚠️ 需要网络连接
- ⚠️ 无法控制代码修改

对于开发或需要离线使用，建议克隆仓库后使用本地方式。

### 环境变量

```bash
# HTTP 模式配置
PORT=8080                 # 服务器端口
HOST=0.0.0.0             # 服务器主机

# 传输模式配置
TRANSPORT=stdio          # 或 http（默认）

# 通用配置
QUIET=true               # 静默模式
```

### 生产环境部署 (PM2) - HTTP 模式

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

### Docker 部署 - HTTP 模式

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

## 常见问题

### Q: 如何确认服务器正在运行？

```bash
curl http://localhost:2333/health
```

### Q: 如何更改端口？

```bash
# 命令行参数
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

### Q: 如何查看所有可用角色？

启动服务器后，AI 客户端可以调用 `list_roles` 工具获取完整列表。

---

## 项目结构

```
puax-mcp-server/
├── src/
│   ├── index.ts              # 服务器入口
│   ├── server.ts             # MCP 服务器实现
│   ├── tools.ts              # 工具定义
│   └── prompts/
│       ├── prompts-bundle.ts # 42个 SKILL 数据
│       └── index.ts          # Prompt 管理器
├── build/                    # 编译输出
├── start.ps1                 # Windows 启动脚本
├── start.sh                  # Linux/macOS 启动脚本
└── README.md
```

---

## NPM 安装方式对比

| 安装方式 | 命令 | 适用场景 | 更新方式 |
|----------|------|----------|----------|
| **npx** | `npx puax-mcp-server` | 临时使用、快速体验 | 自动使用最新版 |
| **全局安装** | `npm i -g puax-mcp-server` | 经常使用 | `npm update -g puax-mcp-server` |
| **本地克隆** | `git clone ...` | 开发定制、离线使用 | `git pull` |

### 推荐配置

**Claude Desktop 用户（最简配置）：**
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

## 开发者指南

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/linkerlin/PUAX.git
cd PUAX/puax-mcp-server

# 安装依赖
npm install

# 开发模式（热重载）
npm run watch

# 运行测试
npm test

# 构建
npm run build
```

### 发布到 NPM

```bash
# 1. 确保已登录 npm
npm login

# 2. 更新版本号（遵循 semver）
npm version patch  # 或 minor / major

# 3. 构建并发布
npm run build
npm publish

# 4. 验证发布
npm view puax-mcp-server
```

**发布前检查清单：**
- [ ] 版本号已更新
- [ ] `npm run build` 成功
- [ ] `npm test` 通过
- [ ] README.md 已更新
- [ ] CHANGELOG.md 已更新

---

## 相关链接

- [PUAX 项目主页](https://github.com/linkerlin/PUAX)
- [NPM 包页面](https://www.npmjs.com/package/puax-mcp-server)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)

---

> 💡 **提示**: 使用 MCP Inspector 测试工具
> ```bash
> npx @modelcontextprotocol/inspector http://localhost:2333
> ```
