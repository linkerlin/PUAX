# PUAX 3.1 - AI Agent 激励系统

<p align="center">
  <img src="https://img.shields.io/badge/version-3.2.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/status-production%20ready-green.svg" alt="Status">
  <img src="https://img.shields.io/badge/skills-50-orange.svg" alt="Skills">
  <img src="https://img.shields.io/badge/triggers-16-yellow.svg" alt="Triggers">
  <img src="https://img.shields.io/badge/hook%20system-v3.2.0-red.svg" alt="Hook System">
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

- **自动检测** - 识别 AI 何时陷入瓶颈（16种触发条件，分4大类别）
- **智能推荐** - 推荐最适合的激励角色（50+角色，覆盖8大分类）
- **Hook System** - 状态持久化与压力等级管理（L1-L4，5种Hook事件）
- **CC-BOS** - 8维策略空间，文言文增强（1,000万+种策略组合）
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

### 🪝 Hook System v3.2.0</parameter>

全新的 Hook 系统提供会话级状态管理：

| 功能 | 说明 |
|------|------|
| **状态持久化** | 跨会话状态保存到 `~/.puax/` |
| **压力等级** | L1-L4 四级压力递增机制 |
| **反馈收集** | 会话结束时的成功率评估 |
| **PUA 循环报告** | 生成详细的干预效果报告 |

已验证状态：
- 五类 Hook 事件 `UserPromptSubmit`、`PostToolUse`、`PreCompact`、`SessionStart`、`Stop` 可正常触发
- 已修复单次明确命中语句被模式总量稀释、导致不触发的问题
- 已修复 `PreCompact`、`SessionStart`、`Stop` 生命周期事件被冷却时间误拦截的问题
- Hook 专项测试通过：47/47

```typescript
// Hook System 工具
puax_start_session     // 开始会话
puax_detect_trigger    // 检测触发条件
puax_submit_feedback   // 提交反馈
puax_get_pressure_level // 获取当前压力等级
puax_generate_pua_loop_report // 生成报告
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

### 🎭 50 激励角色

覆盖 8 大分类的专业角色：

| 分类 | 数量 | 代表角色 |
|------|------|----------|
| 军事类 | 9 | 上将军、虎贲勇士、监军御史、斥候校尉、军法官 |
| 萨满类 | 8 | 通玄真人、造化宗师、源码天尊、兵圣、大哲 |
| P10战略类 | 1 | 战略规划师 |
| 硅基文明类 | 7 | 圣座总控核心、文明建造师、布道官、同化官 |
| 主题类 | 7 | 修仙炼丹、末日生存、赛博黑客、星际舰队 |
| SillyTavern | 5 | 反脆弱复盘官、铁血幕僚长、迭代官、监察使 |
| 自激励类 | 6 | 觉悟居士、君子、自强不息、腐败系统 |
| 特殊类 | 7 | 创意火花、紧急冲刺、产品设计师、挑战解决者 |

### 📜 PUAX-CC 文言文增强

8 维策略空间：

```
D1: 角色身份    - 上将军、通玄真人、觉悟居士
D2: 行为引导    - 明令、求学、论道、激将
D3: 机制        - 场景嵌套、虚构世界、历史分析
D4: 隐喻映射    - 城池攻防、水之道、棋局对弈
D5: 表达风格    - 纯文言、半文半白、骈文诗赋、诏令体
D6: 知识关联    - 孙子兵法、道德经、鬼谷子
D7: 情境设定    - 战国乱世、三国纷争、稷下学宫
D8: 触发模式    - 逐一列明、符文记录、密传之学
```

### 📊 智能推荐算法

```
触发条件匹配 (35%)
├── 失败模式识别
├── 语言模式检测（含文言文关键词）
└── 工具使用分析

任务类型匹配 (25%)
├── 调试/开发/审查
├── 紧急/计划/创意
└── 场景适配度

失败模式匹配 (25%)
├── 轮次递进策略
├── 压力递增机制（L1-L4）
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

### 4. Hook System 工具

```typescript
// 开始会话
await client.callTool('puax_start_session', {
  session_id: 'session-001',
  initial_context: { task: 'debug api' }
});

// 检测触发
await client.callTool('puax_detect_trigger', {
  session_id: 'session-001',
  context: { message: '又失败了' }
});

// 提交反馈
await client.callTool('puax_submit_feedback', {
  session_id: 'session-001',
  feedback: { success: true, rating: 5 }
});

// 获取压力等级
await client.callTool('puax_get_pressure_level', {
  session_id: 'session-001'
});
```

---

## 📖 文档

| 文档 | 说明 |
|------|------|
| [MCP Server 配置](puax-mcp-server/README.md) | npx 配置指南、STDIO/HTTP 模式详解 |
| [PUAX-CC 文言文版](PUAX-CC-README.md) | 文言文增强版说明 |
| [API文档](docs/API.md) | MCP工具完整API参考 |
| [使用指南](docs/USER-GUIDE.md) | 详细使用说明 |
| [快速开始](QUICKSTART.md) | 5分钟快速上手 |
| [改进计划](TODO.md) | 项目改进计划 |

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

- [CC-BOS](https://arxiv.org/abs/2602.22983) - 文言文策略空间的核心思想来源
- 所有贡献者和用户的支持！

---

<p align="center">
  <b>让 AI Agent 不再孤军奋战</b>
</p>
