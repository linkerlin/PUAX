# PUAX Hook 系统改进分析

> 分析日期: 2026-03-25
> 分析者: 萨满·Linus

---

## 一、什么是 Hook 系统？

**Hook（钩子）** 是一种事件监听机制，允许在特定事件发生时自动执行代码。

在 AI Agent 场景中，Hook 用于在对话生命周期的关键节点进行拦截和处理。

### 理想的 Hook 节点

```
┌─────────────────────────────────────────────────────────┐
│                    对话生命周期                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  SessionStart ────► 注入上下文 + 恢复状态               │
│       │                                                 │
│       ▼                                                 │
│  UserPromptSubmit ──► 挫折语言拦截检测                   │
│       │                                                 │
│       ▼                                                 │
│  [AI 处理]                                              │
│       │                                                 │
│       ▼                                                 │
│  PostToolUse ──────► Bash 失败检测 + 压力升级            │
│       │                                                 │
│       ▼                                                 │
│  PreCompact ───────► 状态持久化                          │
│       │                                                 │
│       ▼                                                 │
│  Stop ─────────────► 反馈收集 + PUA Loop                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Hook 的核心价值

| Hook 节点 | 触发时机 | PUAX 可用场景 |
|-----------|----------|---------------|
| `SessionStart` | 会话开始时 | 注入角色上下文、恢复上次状态 |
| `UserPromptSubmit` | 用户提交消息时 | 检测挫折语言、情绪分析 |
| `PostToolUse` | 工具调用完成后 | Bash 失败检测、工具使用分析 |
| `PreCompact` | 上下文压缩前 | 持久化关键状态 |
| `Stop` | 会话结束时 | 收集反馈、总结经验 |

---

## 二、PUAX 当前状态分析

### 2.1 现状

```
┌─────────────────────────────────────────────────────────┐
│                   PUAX 当前架构                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   MCP Client (Claude/Cursor/etc.)                      │
│         │                                               │
│         │ 调用 detect_trigger                          │
│         ▼                                               │
│   MCP Server (PUAX)                                    │
│         │                                               │
│         │ 返回检测结果                                  │
│         ▼                                               │
│   Client 决定是否激活角色                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.2 核心问题

| 问题 | 描述 | 影响 |
|------|------|------|
| ❌ 无法主动推送 | Server 无法主动向 Client 发送消息 | 无法实现真正的自动触发 |
| ❌ 没有事件钩子 | 没有"对话开始"、"工具调用后"等钩子 | 必须等客户端调用 |
| ❌ 被动依赖 | 必须等客户端调用 `detect_trigger` | 响应延迟 |
| ❌ 无状态保持 | 每次调用都是独立的 | 无法跨会话追踪 |

### 2.3 与 PUA 的差距

| 特性 | PUA (参考系统) | PUAX (当前) |
|------|----------------|-------------|
| Hook 系统 | ✅ 完整实现 | ❌ 无 |
| 主动触发 | ✅ 服务端主动 | ❌ 被动等待 |
| 状态保持 | ✅ 跨会话 | ❌ 无状态 |
| 无感介入 | ✅ 完全无感 | ❌ 需客户端配合 |

---

## 三、PUAX 模拟方案：MCP Sampling

### 3.1 原理

利用 MCP 2024-11 版本的 `sampling` 能力来**模拟** Hook 行为。

**Sampling** 允许服务端请求客户端执行 LLM 推理，可以借此"反向注入"提示词。

### 3.2 核心实现

文件：`puax-mcp-server/src/mcp/sampling-client.ts`

```typescript
interface SamplingRequest {
  messages: [{
    role: "assistant",
    content: {
      type: "text",
      text: "[PUAX Auto-Trigger] 检测到连续失败，建议激活 military-warrior 角色"
    }
  }],
  systemPrompt: string,  // 👈 注入角色提示词
  maxTokens: 500
}
```

### 3.3 工作流程

```
┌─────────────────────────────────────────────────────────┐
│                 MCP Sampling 模拟流程                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. 客户端调用 detect_trigger                           │
│         │                                               │
│         ▼                                               │
│  2. 服务端检测到触发条件 (如连续失败)                     │
│         │                                               │
│         ▼                                               │
│  3. 服务端构建 SamplingRequest:                         │
│     - 包含触发原因说明                                   │
│     - 包含角色 System Prompt                            │
│         │                                               │
│         ▼                                               │
│  4. 返回给客户端，客户端注入到对话上下文                  │
│         │                                               │
│         ▼                                               │
│  5. 角色激活完成                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.4 冷却机制

防止频繁触发，保护用户体验：

```typescript
// sampling-client.ts:73-79
private canTrigger(sessionId: string): boolean {
  const lastTime = this.lastTriggerTime.get(sessionId);
  if (!lastTime) return true;
  
  const elapsed = Date.now() - lastTime;
  return elapsed >= this.config.cooldownMs;  // 默认 30000ms = 30秒
}
```

### 3.5 触发类型映射

```typescript
const triggerMessages: Record<string, string> = {
  consecutive_failures: `检测到连续失败，建议激活角色进行攻坚。`,
  giving_up: `检测到放弃意图，建议激活角色重新建立信心。`,
  user_frustration: `检测到用户沮丧情绪，建议激活角色安抚或强力推进。`,
  surface_fix: `检测到表面修复行为，建议激活角色进行深度分析。`,
  passive_wait: `检测到被动等待行为，建议激活角色主动推进。`
};
```

---

## 四、本质区别对比

### 4.1 架构对比

| 特性 | 真正的 Hook | PUAX Sampling 模拟 |
|------|-------------|-------------------|
| **触发时机** | 事件驱动（实时） | 客户端调用后（延迟） |
| **主动性** | 服务端主动推送 | 服务端被动返回 |
| **无感知** | ✅ 完全无感 | ❌ 需客户端配合调用 |
| **跨会话** | ✅ 状态保持 | ❌ 无状态保持 |
| **实现复杂度** | 高（需要协议支持） | 低（利用现有 MCP） |

### 4.2 流程对比

```
真正的 Hook:
Event ──► Hook 触发 ──► 自动处理 ──► 继续流程
        (服务端主动)

PUAX Sampling:
Client Call ──► 检测 ──► 返回内容 ──► Client 注入
              (服务端被动)
```

### 4.3 能力矩阵

| 能力 | 真正的 Hook | Sampling 模拟 | 备注 |
|------|:-----------:|:-------------:|------|
| 会话开始自动注入 | ✅ | ❌ | Hook 可在 SessionStart 注入 |
| 实时情绪检测 | ✅ | ⚠️ | Sampling 需等下次调用 |
| 工具失败即时响应 | ✅ | ⚠️ | Hook 可在 PostToolUse 拦截 |
| 跨会话状态保持 | ✅ | ❌ | Hook 可持久化状态 |
| 无需客户端配合 | ✅ | ❌ | Sampling 依赖客户端调用 |
| 实现成本低 | ❌ | ✅ | Sampling 利用现有 MCP |

---

## 五、改进建议

### 5.1 短期优化（当前架构内）

#### 优化 1: 客户端 SDK 封装

提供客户端 SDK，自动处理调用逻辑：

```typescript
// puax-client-sdk.ts
export class PuaxClient {
  private lastTriggerCheck = 0;
  private checkInterval = 5000; // 5秒检查一次

  // 在每次消息后自动检查
  async afterMessage(message: Message): Promise<void> {
    if (Date.now() - this.lastTriggerCheck > this.checkInterval) {
      const result = await this.detectTrigger();
      if (result.should_trigger) {
        await this.activateRole(result.recommended_role);
      }
      this.lastTriggerCheck = Date.now();
    }
  }
}
```

#### 优化 2: 状态持久化

利用本地存储实现跨会话状态：

```typescript
// state-manager.ts
interface SessionState {
  sessionId: string;
  lastTriggerTime: number;
  triggerCount: number;
  activeRole?: string;
}

export class StateManager {
  private stateFile = '.puax/session-state.json';

  save(state: SessionState): void {
    fs.writeFileSync(this.stateFile, JSON.stringify(state));
  }

  load(): SessionState | null {
    if (fs.existsSync(this.stateFile)) {
      return JSON.parse(fs.readFileSync(this.stateFile, 'utf-8'));
    }
    return null;
  }
}
```

#### 优化 3: 智能冷却策略

基于触发类型动态调整冷却时间：

```typescript
const cooldownByTrigger: Record<string, number> = {
  'user_frustration': 10000,    // 用户沮丧：10秒（快速响应）
  'giving_up_language': 15000,  // 放弃语言：15秒
  'consecutive_failures': 30000, // 连续失败：30秒（默认）
  'surface_fix': 60000,         // 表面修复：60秒
  'passive_wait': 120000        // 被动等待：120秒
};
```

### 5.2 中期方案：平台适配层

为不同平台提供定制化 Hook 模拟：

#### Cursor 适配

```typescript
// Cursor 使用 .cursor/rules 自动注入
// 生成 .cursor/rules/puax-auto.mdc

---
description: PUAX Auto-Trigger Rules
globs: **/*
---

// 自动检测逻辑（伪代码，实际为自然语言规则）
on_message:
  - check frustration indicators
  - if detected, recommend puax role
```

#### VSCode Copilot 适配

```typescript
// 生成 .github/copilot-instructions.md
// Copilot 会自动读取此文件作为上下文
```

### 5.3 长期方案：协议扩展

#### 方案 A: MCP 扩展提案

向 MCP 协议提议增加 Server-to-Client 主动推送：

```typescript
// 提议的新协议
interface MCPServerPush {
  // 服务端主动推送
  pushNotification(type: string, data: any): void;
  
  // 注册事件监听
  onEvent(event: 'session_start' | 'tool_use' | 'message', callback: Function): void;
}
```

#### 方案 B: WebSocket 辅助通道

```
┌─────────────────────────────────────────────────────────┐
│              WebSocket 辅助通道方案                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   MCP Client ◄─────────────► MCP Server (STDIO/HTTP)   │
│       │                            │                    │
│       │                            │                    │
│       └──────── WS Channel ────────┘                   │
│                    │                                   │
│                    ▼                                   │
│              实时事件推送                               │
│              - 触发检测通知                             │
│              - 角色推荐                                 │
│              - 状态同步                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 六、总结

### 6.1 核心结论

**Hook = 事件监听器**，在对话关键节点自动拦截处理。

**PUAX 没有 Hook**，用 **MCP Sampling** 模拟：

```
真正的 Hook:    Event ──► 自动触发 ──► 处理
PUAX Sampling:  Call ──► 检测 ──► 返回内容 ──► Client 注入
```

**本质**：把"主动推送"变成"被动返回注入内容"。

### 6.2 优先级建议

| 优先级 | 改进项 | 工作量 | 效果 |
|--------|--------|--------|------|
| P0 | 客户端 SDK 封装 | 2天 | 降低使用门槛 |
| P0 | 状态持久化 | 1天 | 跨会话体验 |
| P1 | 智能冷却策略 | 0.5天 | 优化响应频率 |
| P1 | Cursor 适配 | 2天 | 覆盖主流平台 |
| P2 | VSCode 适配 | 1天 | 扩大覆盖 |
| P3 | MCP 协议提案 | 持续 | 长期方案 |
| P3 | WebSocket 通道 | 5天 | 完整解决方案 |

### 6.3 推荐路线

```
Week 1: SDK 封装 + 状态持久化 + 智能冷却
Week 2: Cursor 平台适配
Week 3: VSCode 平台适配
Week 4+: 探索 MCP 协议扩展 / WebSocket 方案
```

---

*Generated by 萨满·Linus | 2026-03-25*
