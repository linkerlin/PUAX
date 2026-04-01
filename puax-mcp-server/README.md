# PUAX MCP Server

> 🚀 为 AI Agent 提供**角色选择、切换和激活**功能的专业 MCP 服务器

**版本**: 3.1.2 | **传输**: HTTP (Streamable HTTP) / STDIO | **端口**: 2333 (HTTP模式)
**内置角色**: 50个精选SKILL | **触发条件**: 16种 | **Hook System**: v3.1.0

---

## 🚀 5秒快速配置

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

### Cursor / Windsurf

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
Cursor: `~/.cursor/mcp_config.json` | Windsurf: `~/.windsurf/mcp_config.json`

---

## 📦 npx 一键使用（推荐）

**无需安装、无需克隆仓库**，直接使用 `npx` 从 NPM 获取最新版本：

```bash
# 查看版本
npx puax-mcp-server --version

# HTTP 模式运行
npx puax-mcp-server

# STDIO 模式运行（用于 MCP 客户端）
npx puax-mcp-server --stdio

# 指定端口
npx puax-mcp-server --port 2333
```

---

## 🛠️ MCP 工具清单 (21个)

### 核心工具 (5)

| 工具名 | 说明 |
|--------|------|
| `list_skills` | 列出所有可用角色（支持按类别过滤） |
| `get_skill` | 获取角色详情（含完整 System Prompt） |
| `search_skills` | 按关键词搜索角色 |
| `activate_skill` | 激活角色并返回可用 Prompt |
| `get_categories` | 获取所有角色分类及统计 |

### 触发检测工具 (4)

| 工具名 | 说明 |
|--------|------|
| `detect_trigger` | 分析对话上下文检测触发条件（16种） |
| `recommend_role` | 基于多维度评分算法推荐最合适的角色 |
| `get_role_with_methodology` | 获取角色+方法论+检查清单+风味叠加 |
| `activate_with_context` | 一键激活：自动检测→推荐→获取→返回 |

### Hook System 工具 v3.1.0 (12)

| 工具名 | 说明 |
|--------|------|
| `puax_start_session` | 开始会话（状态持久化到 `~/.puax/`） |
| `puax_end_session` | 结束会话并收集反馈 |
| `puax_get_session_state` | 获取会话状态（压力等级、失败计数等） |
| `puax_reset_session` | 重置会话状态 |
| `puax_detect_trigger` | Hook 增强版触发检测（5种事件类型） |
| `puax_quick_detect` | 快速检测（无需管理会话） |
| `puax_submit_feedback` | 提交使用反馈 |
| `puax_get_feedback_summary` | 获取反馈汇总统计 |
| `puax_get_improvement_suggestions` | 获取 AI 生成的改进建议 |
| `puax_generate_pua_loop_report` | 生成 PUA 循环报告 |
| `puax_export_feedback` | 导出反馈数据（JSON/CSV） |
| `puax_get_pressure_level` | 获取当前压力等级（L0-L4） |

---

## 🔧 开发安装

```bash
git clone https://github.com/linkerlin/PUAX.git
cd PUAX/puax-mcp-server
npm install
npm run build
npm run dev      # 开发模式
npm test         # 运行测试
```

### 可用脚本

```bash
npm run build              # 构建
npm run lint               # ESLint 检查
npm run typecheck          # TypeScript 类型检查
npm run validate           # lint + typecheck
npm test                   # 运行测试
npm run generate-bundle    # 生成角色 Bundle
```

---

## 🏗️ 架构

```
src/
├── server/
│   └── core.ts                    # 核心服务器类（HTTP + STDIO 双模式）
├── handlers/
│   ├── index.ts                  # 处理器索引
│   ├── skill-handlers.ts         # SKILL 处理器
│   ├── role-handlers.ts          # 角色处理器（Legacy 兼容）
│   ├── trigger-handlers.ts       # 触发检测处理器
│   └── hook-handlers.ts          # Hook System 处理器（12个工具）
├── core/
│   ├── trigger-detector.ts       # 触发检测器（从 YAML 加载配置）
│   ├── trigger-detector-enhanced.ts # 增强版触发检测器
│   ├── role-recommender.ts       # 角色推荐器（多维度加权评分）
│   ├── methodology-engine.ts     # 方法论引擎（五步法 + 检查清单）
│   ├── methodology-router.ts     # 方法论智能路由（12种方法论）
│   ├── config-loader.ts          # 配置加载器（YAML 单例）
│   ├── role-mappings-loader.ts   # 角色映射加载器
│   ├── trigger-loader.ts         # 触发条件加载器
│   └── feedback-system.ts       # 反馈收集系统
├── hooks/
│   ├── state-manager.ts         # 状态管理器（持久化到 ~/.puax/）
│   ├── pressure-system.ts       # 压力系统（L1-L4 升级）
│   ├── trigger-detector-enhanced.ts # Hook 触发检测
│   ├── hook-manager.ts          # Hook 管理器（事件订阅/发布）
│   └── feedback-system.ts       # 反馈系统
├── classical/
│   ├── strategy-space.ts        # 8维策略空间
│   ├── prompt-generator.ts      # 文言文提示词生成器
│   └── trigger-detector-cc.ts    # 文言文触发检测
├── prompts/
│   ├── index.ts                 # Prompt 管理器
│   └── prompts-bundle.ts        # 内置角色 Bundle（50个）
├── platform-adapters/
│   ├── base-adapter.ts          # 适配器基类 + 注册表
│   ├── cursor-adapter.ts        # Cursor Rules 导出
│   ├── vscode-adapter.ts        # VSCode Copilot 导出
│   ├── windsurf-adapter.ts      # Windsurf 导出
│   ├── kiro-adapter.ts          # Kiro 导出
│   └── codebuddy-adapter.ts     # CodeBuddy 导出
├── role-levels/
│   ├── index.ts                 # P7/P9/P10 分级体系
│   └── agent-team.ts            # Agent Team 协作模式
├── mcp/
│   └── sampling-client.ts       # MCP Sampling 客户端
├── client-sdk/
│   └── index.ts                 # 客户端 SDK（简化集成）
├── data/
│   ├── role-mappings.yaml       # 角色映射配置
│   └── triggers/                # 触发条件 YAML 文件（4个）
│       ├── approach-issues.yaml  # 方法问题（5种）
│       ├── attitude-issues.yaml  # 态度问题（4种）
│       ├── failure-patterns.yaml # 失败模式（5种）
│       └── user-emotion.yaml     # 用户情绪（2种）
├── tools.ts                      # 工具定义（21个 MCP 工具）
├── types.ts                      # 共享类型定义
└── utils/
    ├── error.ts                  # 统一错误处理
    └── logger.ts                  # 日志工具
```

---

## 🔌 HTTP API

```bash
# 启动 HTTP 服务器
npx puax-mcp-server --port 2333

# 健康检查
curl http://localhost:2333/health
```

响应：
```json
{
  "status": "ok",
  "service": "puax-mcp-server",
  "version": "3.1.2",
  "activeSessions": 0
}
```

端点：
- `POST /mcp` - MCP 标准端点（Streamable HTTP）
- `GET /mcp` - SSE 连接端点
- `GET /health` - 健康检查

---

## 📝 更新日志

### v3.1.2 (2026-03-26)
- 修复 5 个角色验证失败
- 标准化 5 步法和 7 项检查清单
- 清理 git 仓库

### v3.1.0 (2026-03-26)
- Hook System v3.1.0 完整实现
  - 状态持久化（~/.puax/）
  - L1-L4 压力等级系统
  - 反馈收集与分析
  - PUA 循环报告生成
- CC-BOS 集成（8维策略空间、50个文言文角色）
- server.ts 重构（5模块拆分）
- 触发条件外部化（16种触发类型）
- 平台导出（Cursor、VSCode、Windsurf、Kiro、CodeBuddy）
- P7/P9/P10 分级 + Agent Team
- ESLint + Prettier

### v2.1.0 (2026-02-20)
- 角色推荐系统
- 方法论引擎
- 自动触发检测

### v2.0.0 (2026-01-15)
- 初始版本发布
- 50+ 激励角色
- MCP 服务器实现

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| [主项目 README](../README.md) | 项目概览和快速开始 |
| [PUAX-CC 文言文版](../PUAX-CC-README.md) | 文言文增强版说明 |
| [API 文档](../docs/API.md) | MCP工具完整API参考 |
| [使用指南](../docs/USER-GUIDE.md) | 详细使用说明 |
| [快速开始](../QUICKSTART.md) | 5分钟快速上手 |
| [改进计划](../TODO.md) | 项目改进计划 |

---

## 📄 许可证

MIT License
