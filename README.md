# PUAX 2.1 - AI Agent 激励系统

<p align="center">
  <img src="https://img.shields.io/badge/version-2.1.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/status-production%20ready-green.svg" alt="Status">
  <img src="https://img.shields.io/badge/skills-46+-orange.svg" alt="Skills">
  <img src="https://img.shields.io/badge/triggers-15-yellow.svg" alt="Triggers">
</p>

<p align="center">
  <b>当 AI Agent 需要激励时，PUAX 提供专业的角色和方法论</b>
</p>

<p align="center">
  <a href="README.md">简体中文</a> | <a href="README_en.md">English</a>
</p>

---

## 🎯 什么是 PUAX？

PUAX 是一个专为 AI Agent 设计的激励系统，通过：

- **自动检测** - 识别 AI 何时陷入瓶颈（15种触发条件）
- **智能推荐** - 推荐最适合的激励角色（46+角色）
- **结构化方法论** - 提供五步法调试流程
- **检查清单** - 确保执行质量（七项强制检查）

帮助 AI Agent 突破困境，提升解决问题的能力。

---

## ✨ 核心特性

### 📦 零安装使用

```bash
# MCP 客户端一键启动（推荐）
npx puax-mcp-server --stdio

# HTTP 模式
npx puax-mcp-server
```

### 🤖 自动触发检测

检测 **15 种**需要干预的场景：

| 类别 | 触发条件 | 严重级别 |
|------|----------|----------|
| 失败模式 | 连续失败、重复尝试、参数微调 | High |
| 态度问题 | 放弃语言、甩锅环境、被动等待 | Medium-Critical |
| 用户情绪 | 用户挫折 | Critical |
| 方法问题 | 表面修复、未验证、工具使用不足 | Medium |
| 质量问题 | 低质量输出、忽略边界、过度复杂化 | Medium |

### 🎭 50+ 激励角色

覆盖 8 大分类的专业角色：

| 分类 | 数量 | 代表角色 |
|------|------|----------|
| 军事类 | 9 | 指挥员、战士、政委、侦察兵 |
| 萨满类 | 8 | 马斯克、乔布斯、爱因斯坦、孙子 |
| P10战略类 | 1 | 战略规划师 |
| 硅基文明类 | 7 | 圣座总控核心、文明建造师、布道官 |
| 主题类 | 7 | 修仙炼丹、末日生存、赛博黑客 |
| SillyTavern | 5 | 反脆弱复盘官、铁血幕僚长 |
| 自激励类 | 6 | 觉醒、自毁重塑 |
| 特殊类 | 7 | 创意火花、紧急冲刺、产品设计师 |

### 📊 智能推荐算法

```
触发条件匹配 (35%)
├── 失败模式识别
├── 语言模式检测
└── 工具使用分析

任务类型匹配 (25%)
├── 调试/开发/审查
├── 紧急/计划/创意
└── 场景适配度

失败模式匹配 (25%)
├── 轮次递进策略
├── 压力递增机制
└── 角色轮换逻辑

历史记录 (10%) + 用户偏好 (5%)
```

### 🏭 8 种大厂风味

可为角色叠加不同企业文化：
- 阿里味 - 闭环方法论
- 华为味 - 根因分析法
- 字节味 - A/B测试驱动
- 腾讯味 - 赛马机制
- 美团味 - 执行至上
- Netflix味 - Keeper测试
- Musk味 - The Algorithm
- Jobs味 - 减法哲学

---

## 🚀 快速开始

### 方式 1：npx 一键使用（推荐）

```bash
# MCP 客户端（STDIO 模式）
npx puax-mcp-server --stdio

# HTTP 模式
npx puax-mcp-server --port 2333
```

### 方式 2：配置 MCP 客户端

**Claude Desktop** (`%APPDATA%/Claude/claude_desktop_config.json`):

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

**Cursor** (`~/.cursor/mcp_config.json`):

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

**CRUSH** (`~/.crush/config.json`):

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

### 方式 3：平台导出

```bash
# 导出到 Cursor Rules
npx puax-mcp-server --export=cursor --output=./.cursor/rules

# 导出到 VSCode Copilot
npx puax-mcp-server --export=vscode --output=./.github

# 查看支持的平台
npx puax-mcp-server --list-platforms
```

---

## 🛠️ MCP 工具

### 1. detect_trigger - 触发检测

```typescript
const result = await client.callTool('detect_trigger', {
  conversation_history: [
    { role: 'assistant', content: '尝试连接...失败' },
    { role: 'user', content: '为什么还不行？' }
  ],
  task_context: { attempt_count: 2 }
});
```

### 2. recommend_role - 角色推荐

```typescript
const result = await client.callTool('recommend_role', {
  detected_triggers: ['user_frustration'],
  task_context: { task_type: 'debugging', urgency: 'critical' }
});
```

### 3. activate_with_context - 一键激活

```typescript
const result = await client.callTool('activate_with_context', {
  context: { conversation_history: messages },
  options: { auto_detect: true }
});
```

---

## 📖 文档

| 文档 | 说明 |
|------|------|
| [MCP Server 配置](puax-mcp-server/README.md) | npx 配置指南、STDIO/HTTP 模式详解 |
| [API文档](docs/API.md) | MCP工具完整API参考 |
| [使用指南](docs/USER-GUIDE.md) | 详细使用说明 |
| [Hook系统分析](Hook系统改进分析.md) | Hook 触发原理与改进方案 |
| [改进计划](TODO.md) | 项目改进计划 |
| [贡献指南](community/CONTRIBUTING.md) | 如何贡献角色 |

---

## 🧪 测试

```bash
cd puax-mcp-server
npm test
```

---

## 🤝 贡献

```bash
# 1. 使用模板创建角色
cp templates/SKILL-v2.0-template.md skills/my-role/SKILL.v2.md

# 2. 验证角色
node scripts/validate-role.js my-role

# 3. 生成Bundle
cd puax-mcp-server && npm run generate-bundle
```

---

## 📝 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

欢迎大家抄袭本项目，用于任何合法用途。

---

## 🙏 致谢

感谢所有贡献者和用户的支持！

---

<p align="center">
  <b>让 AI Agent 不再孤军奋战</b>
</p>
