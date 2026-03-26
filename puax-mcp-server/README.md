# PUAX MCP Server

> 🚀 为 AI Agent 提供**角色选择、切换和激活**功能的专业 MCP 服务器

**版本**: 2.2.0 | **传输**: HTTP (SSE) / STDIO | **端口**: 2333 (HTTP模式)  
**内置角色**: 50个精选SKILL | **Hook System**: v2.2.0

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

# 指定端口
npx puax-mcp-server --port 3000
```

### MCP 客户端配置示例（npx stdio）

所有配置均使用 **npx + STDIO 模式**，自动获取 NPM 最新版本：

---

## 🛠️ MCP 工具清单

### 核心工具

| 工具名 | 说明 |
|--------|------|
| `list_skills` | 列出所有可用角色 |
| `get_skill` | 获取角色详情 |
| `search_skills` | 搜索角色 |
| `activate_skill` | 激活角色 |
| `get_categories` | 获取角色分类 |

### 触发检测工具

| 工具名 | 说明 |
|--------|------|
| `detect_trigger` | 检测触发条件 |
| `recommend_role` | 推荐角色 |
| `get_role_with_methodology` | 获取角色+方法论 |
| `activate_with_context` | 根据上下文一键激活 |

### Hook System 工具 (v2.2.0)

| 工具名 | 说明 |
|--------|------|
| `puax_start_session` | 开始会话 |
| `puax_end_session` | 结束会话 |
| `puax_get_session_state` | 获取会话状态 |
| `puax_reset_session` | 重置会话 |
| `puax_detect_trigger` | 检测触发条件 |
| `puax_quick_detect` | 快速检测 |
| `puax_submit_feedback` | 提交反馈 |
| `puax_get_feedback_summary` | 获取反馈汇总 |
| `puax_get_improvement_suggestions` | 获取改进建议 |
| `puax_generate_pua_loop_report` | 生成 PUA 循环报告 |
| `puax_export_feedback` | 导出反馈数据 |
| `puax_get_pressure_level` | 获取压力等级 |

---

## 🔧 开发安装

如果你需要本地开发或修改：

```bash
# 克隆仓库
git clone https://github.com/linkerlin/PUAX.git
cd PUAX/puax-mcp-server

# 安装依赖
npm install

# 构建
npm run build

# 开发模式
npm run dev

# 测试
npm test
```

---

## 📋 可用脚本

```bash
# 构建
npm run build

# 代码检查
npm run lint
npm run typecheck

# 测试
npm test
npm run test:coverage

# 验证（lint + typecheck）
npm run validate
```

---

## 🏗️ 架构

```
src/
├── server/
│   └── core.ts              # 核心服务器类
├── handlers/
│   ├── index.ts             # 处理器索引
│   ├── skill-handlers.ts    # SKILL 处理器
│   ├── role-handlers.ts     # 角色处理器
│   ├── trigger-handlers.ts  # 触发检测处理器
│   └── hook-handlers.ts     # Hook System 处理器
├── classical/
│   ├── strategy-space.ts    # 8维策略空间
│   ├── prompt-generator.ts  # 文言文生成器
│   └── trigger-detector-cc.ts # 文言文触发检测
├── hooks/
│   ├── state-manager.ts     # 状态管理
│   ├── pressure-system.ts   # 压力系统
│   ├── trigger-detector-enhanced.ts # 增强触发检测
│   └── feedback-system.ts   # 反馈系统
├── core/
│   ├── trigger-detector.ts  # 触发检测器
│   ├── role-recommender.ts  # 角色推荐器
│   └── methodology-engine.ts # 方法论引擎
└── types.ts                 # 共享类型定义
```

---

## 🔌 HTTP API

### 启动 HTTP 服务器

```bash
npx puax-mcp-server --port 2333
```

### 健康检查

```bash
curl http://localhost:2333/health
```

响应：
```json
{
  "status": "ok",
  "service": "puax-mcp-server",
  "version": "2.2.0",
  "activeSessions": 0
}
```

---

## 📝 更新日志

### v2.2.0 (2026-03-26)

- ✨ Hook System v2.2.0 完整实现
  - 状态持久化（~/.puax/）
  - L1-L4 压力等级系统
  - 反馈收集与分析
  - PUA 循环报告生成
- ✨ CC-BOS 集成（PUAX-CC）
  - 8维策略空间
  - 文言文提示词生成器
  - 50个角色转换为文言文版
- ♻️ server.ts 重构
  - 拆分为 5 个模块
  - 更好的类型安全
  - 独立测试能力
- ⚙️ 触发条件外部化
  - YAML 配置文件
  - 15种触发类型
- 🛠️ ESLint + Prettier 配置

### v2.1.0 (2026-02-20)

- ✨ 新增角色推荐系统
- ✨ 新增方法论引擎
- ✨ 新增自动触发检测

### v2.0.0 (2026-01-15)

- 🎉 初始版本发布
- ✨ 50+ 激励角色
- ✨ MCP 服务器实现

---

## 📚 相关文档

- [主项目 README](../README.md)
- [PUAX-CC 文言文版](../PUAX-CC-README.md)
- [API 文档](../docs/API.md)
- [使用指南](../docs/USER-GUIDE.md)

---

## 🤝 贡献

欢迎提交 Issue 和 PR！

---

## 📄 许可证

MIT License
