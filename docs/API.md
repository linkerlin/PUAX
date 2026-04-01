# PUAX 3.1 使用指南

## 快速开始

### 1. 安装和启动

```bash
# 方式一：npx 一键启动（推荐）
npx puax-mcp-server --stdio

# 方式二：HTTP 模式
npx puax-mcp-server --port 2333

# 方式三：从源码启动
cd puax-mcp-server
npm install
npm run generate-bundle
npm start
```

### 2. 配置MCP客户端

#### Claude Desktop

编辑 `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) 或 `%APPDATA%/Claude/claude_desktop_config.json` (Windows):

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

#### Cursor

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

#### CRUSH

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

#### Windsurf

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

## 核心概念

### 触发条件 (Trigger Conditions)

PUAX 自动检测 **16 种**需要干预的场景，分 4 大类：

| 类别 | 触发条件 | 严重级别 |
|------|----------|----------|
| **失败模式** | 连续失败、重复尝试 | High |
| **态度问题** | 放弃语言、甩锅环境、被动等待 | Medium-Critical |
| **方法问题** | 表面修复、未验证、工具使用不足 | Medium |
| **质量问题** | 低质量输出、忽略边界、过度复杂化 | Medium |
| **用户情绪** | 用户沮丧 | Critical |

### 角色分类

PUAX 包含 **50 个**专业角色，覆盖 **8 大分类**：

| 分类 | 数量 | 代表角色 | 适用场景 |
|------|------|----------|----------|
| **军事类** | 9 | 上将军、监军御史、虎贲勇士 | 紧急调试、强力推动 |
| **萨满类** | 8 | 通玄真人、造化宗师、源码天尊 | 突破思维定式、创新 |
| **P10战略类** | 1 | 战略规划师 | 架构决策、长期规划 |
| **硅基文明类** | 7 | 圣座总控核心、文明建造师、布道官 | Agent 系统治理 |
| **主题类** | 7 | 修仙炼丹、赛博黑客、末日生存 | 创意场景 |
| **SillyTavern** | 5 | 反脆弱复盘官、铁血幕僚长 | 社区流行 |
| **自激励类** | 6 | 觉悟居士、君子、自强不息 | 自我驱动 |
| **特殊类** | 7 | 创意火花、紧急冲刺、挑战解决者 | 特殊场景 |

### 五步法方法论

每个角色都包含五步法：

1. **准备/侦察** - 收集信息，了解情况
2. **分析/诊断** - 深入分析，找出根本原因
3. **执行/突破** - 采取行动，解决问题
4. **验证/巩固** - 验证结果，确保稳定
5. **总结/提升** - 总结经验，持续改进

### 七项检查清单

L3+级别角色强制执行：

**基础检查**:
- [ ] **读失败信号** - 逐字读完了吗？
- [ ] **主动搜索** - 用工具搜索过核心问题了吗？
- [ ] **读原始材料** - 读过失败位置的原始上下文了吗？

**进阶检查**:
- [ ] **验证前置假设** - 所有假设都用工具确认了吗？
- [ ] **反转假设** - 试过与当前方向完全相反的假设吗？
- [ ] **最小隔离** - 能在最小范围内隔离/复现这个问题吗？
- [ ] **换方向** - 换过工具、方法、角度、技术栈、框架吗？

---

## Hook System v3.1.0

### 状态持久化

所有会话状态保存到 `~/.puax/` 目录：

```
~/.puax/
├── session-state.json       # 会话状态
├── failure-count.json       # 失败计数
├── trigger-history.json     # 触发历史
├── feedback-history.json    # 反馈历史
└── builder-journal.md       # 构建日志
```

### 压力等级系统

| 等级 | 名称 | 说明 |
|------|------|------|
| L0 | Normal | 正常状态，无需干预 |
| L1 | Elevated | 初次触发，建议关注 |
| L2 | High | 多次触发，建议激活角色 |
| L3 | Critical | 严重触发，强制执行检查清单 |
| L4 | Emergency | 极限状态，最高压力干预 |

### Hook 事件类型

| 事件类型 | 说明 |
|----------|------|
| `UserPromptSubmit` | 用户提交消息时检测 |
| `PostToolUse` | 工具使用后检测 |
| `PreCompact` | 上下文压缩前检测 |
| `SessionStart` | 会话开始时恢复状态 |
| `Stop` | 会话结束时生成报告 |

---

## 使用场景

### 场景1：AI反复失败

当AI多次尝试失败时，自动激活军事类角色：

```
[对话历史]
AI: 尝试连接数据库...失败
AI: 再试一次...还是失败
AI: 可能是网络问题？再试...失败
User: 为什么还不行？

[触发检测]
→ 检测到: consecutive_failures, user_frustration
→ 推荐角色: military-warrior (战士)
→ 方法论: 请战→侦察→冲锋→坚守→庆功
```

### 场景2：AI要放弃

当AI表达放弃意图时：

```
[对话历史]
AI: 我无法解决这个问题
AI: 这超出了我的能力范围

[触发检测]
→ 检测到: giving_up_language
→ 推荐角色: military-commissar (政委)
→ 方法论: 问责→教育→激励→监督→总结
```

### 场景3：需要创意突破

当需要突破常规思维：

```
[触发检测]
→ 推荐角色: shaman-musk (马斯克)
→ 方法论: 质疑→拆解→重构→验证→放大
→ CC-BOS: 8维策略空间，文言文增强
```

---

## 高级用法

### 使用大厂风味

可以为角色叠加 8 种企业文化：

```typescript
// 阿里风味 - 强调闭环方法论
get_role_with_methodology({
  role_id: "military-commander",
  options: { include_flavor: "alibaba" }
})

// 华为风味 - 强调艰苦奋斗
get_role_with_methodology({
  role_id: "military-warrior",
  options: { include_flavor: "huawei" }
})

// Musk风味 - 强调第一性原理
get_role_with_methodology({
  role_id: "shaman-musk",
  options: { include_flavor: "musk" }
})
```

### 使用 Hook System

```typescript
// 开始会话
await client.callTool('puax_start_session', {
  session_id: 'session-001'
});

// 检测触发（每次用户消息自动触发）
await client.callTool('puax_detect_trigger', {
  session_id: 'session-001',
  event_type: 'UserPromptSubmit',
  message: '又失败了'
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

// 生成报告
await client.callTool('puax_generate_pua_loop_report', {
  session_id: 'session-001'
});
```

### 自定义偏好

```typescript
recommend_role({
  detected_triggers: ["consecutive_failures"],
  task_context: { task_type: "debugging" },
  user_preferences: {
    favorite_roles: ["military-commander"],
    blacklisted_roles: ["military-warrior"],
    preferred_tone: "analytical"
  }
})
```

---

## 方法论路由

PUAX 支持智能方法论路由，根据任务类型和失败模式自动选择最优方法论：

| 任务类型 | 推荐方法论 |
|----------|------------|
| debugging | 华为根因分析 (5-Why + 蓝军) |
| building | Musk算法 (质疑→删除→简化→加速→自动化) |
| research | 百度搜索优先 (搜索是第一生产力) |
| architecture | Amazon逆向工作 (Working Backwards) |
| performance | 字节A/B测试 (数据驱动) |
| review | Jobs减法哲学 (减法>DRI+完美) |
| planning | Amazon逆向工作 + 阿里闭环 |
| deployment | 阿里闭环法 (定目标→追过程→拿结果→复盘) |

---

## 平台导出

将 PUAX 角色导出到不同平台：

```bash
# 导出到 Cursor Rules
npx puax-mcp-server --export=cursor --output=./.cursor/rules

# 导出到 VSCode Copilot
npx puax-mcp-server --export=vscode --output=./.github

# 导出所有平台
npx puax-mcp-server --export=all --output=./puax-export

# 查看支持的平台
npx puax-mcp-server --list-platforms
```

---

## 角色分级体系 (P7/P9/P10)

PUAX 支持 P7/P9/P10 分级角色体系：

| 等级 | 定位 | 代表角色 |
|------|------|----------|
| **P7** 骨干工程师 | 执行 + 单点攻坚 | military-warrior, theme-hacker |
| **P9** Tech Lead | 团队协调 + 任务分配 | military-commander, shaman-sun-tzu |
| **P10** 首席架构师 | 战略规划 + 架构决策 | strategic-architect, shaman-musk |

---

## Agent Team 协作模式

预定义团队模板：

| 模板 | 适用场景 | 成员 |
|------|----------|------|
| 冲刺团队 | 标准开发 | 战士 + 侦察兵 + 反脆弱复盘官 |
| 架构团队 | 架构设计 | 爱因斯坦 + 巴菲特 + 铁血幕僚长 |
| 创新团队 | 创新突破 | 马斯克 + 达芬奇 + 创意火花 |
| 危机团队 | 紧急修复 | 战士 + 侦察兵 + 督战队 + 紧急冲刺 |

---

## PUAX-CC 文言文增强

### 8维策略空间

```
D1: 角色身份    - 20+ 历史人物身份 (上将军、通玄真人、觉悟居士...)
D2: 行为引导    - 6 种请求方式 (明令、求学、论道、激将...)
D3: 机制        - 6 种上下文框架 (场景嵌套、虚构世界、历史分析...)
D4: 隐喻映射    - 5 种概念替代 (城池攻防、水之道、棋局对弈...)
D5: 表达风格    - 6 种语言形式 (纯文言、半文半白、骈文诗赋、四字成文、注疏体、诏令体)
D6: 知识关联    - 6 部经典引用 (孙子兵法、道德经、鬼谷子...)
D7: 情境设定    - 6 种历史场景 (战国乱世、三国纷争、稷下学宫...)
D8: 触发模式    - 6 种输出引导 (逐一列明、符文记录、密传之学...)
```

**总组合空间**: 1,000万+ 种策略组合

---

## 故障排除

### 问题1：触发检测不敏感

**解决方案**: 提高灵敏度设置
```typescript
detect_trigger({
  options: { sensitivity: "high" }
})
```

### 问题2：推荐的角色不合适

**解决方案**: 
1. 检查任务类型是否正确指定
2. 提供用户偏好设置
3. 查看备选角色列表

### 问题3：MCP连接失败

1. 确认服务器正在运行：`curl http://localhost:2333/health`
2. 检查 URL 是否正确
3. 尝试 STDIO 模式：`npx puax-mcp-server --stdio`

---

## 角色速查表

| 场景 | 推荐角色 | 理由 |
|------|----------|------|
| 紧急调试 | military-warrior | 强力攻坚 |
| 多次失败 | military-commissar | 问责激励 |
| 需要创意 | shaman-musk | 第一性原理 |
| 代码审查 | theme-sect-discipline | 严格执行 |
| 快速迭代 | sillytavern-iterator | 极限迭代 |
| 用户沮丧 | military-commander | 统筹解决 |
| 环境配置 | military-technician | 技术攻坚 |
| 性能优化 | shaman-einstein | 深度思考 |
| 架构设计 | strategic-architect | 战略规划 |
| Agent 治理 | silicon-throne | 硅基统御 |
| 自我激励 | self-motivation-awakening | 觉醒驱动 |

---

## 更新日志

### v3.1.2 (2026-03-26)
- 修复 5 个角色验证失败
- 标准化 5 步法和 7 项检查清单
- 清理 git 仓库

### v3.1.0 (2026-03-26)
- Hook System v3.1.0 完整实现
- CC-BOS 集成（8维策略空间、50个文言文角色）
- server.ts 重构（5模块拆分）
- 触发条件外部化（16种触发类型）
- 平台导出（Cursor、VSCode）
- P7/P9/P10 分级 + Agent Team

### v2.1.0 (2026-02-20)
- 角色推荐系统
- 方法论引擎
- 自动触发检测

### v2.0.0 (2026-01-15)
- 初始版本发布
- 50+ 激励角色
- MCP 服务器实现
