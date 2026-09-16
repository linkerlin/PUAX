# AMP 0.1 — Agent Motivation Protocol (智能体动机协议)

> **版本**：0.1-draft  
> **发布日期**：2026-09-12  
> **状态**：参考实现就绪 (Reference Implementation Ready)  
> **参考实现**：`puax-mcp-server@4.0.0`

---

## 1. 宗旨与哲学：从插件到协议

在传统 Agent 架构中，激励与行为规范通常被实现为「提示词戏服」或「自愿调用的插件工具」。当智能体遇到瓶颈、试图偷懒或陷入幻觉锁死时，自愿型工具往往被智能体主动绕过。

**AMP (Agent Motivation Protocol)** 将智能体动机与行为约束抽象为跨平台、跨模型、跨运行时的开放心智协议。

> **核心断言**：  
> **MCP 是插头，AMP 是河床。**  
> 宿主无需绑定任何单一 npm 包或特定客户端。任何宿主（Harness）只要能消费与产出本协议定义的四类对象，即可实现确定性、免自愿的智能体心智护栏。

---

## 2. 四类核心一等公民对象

AMP 协议锁定四类结构化对象：**事件 (Events)**、**承诺块 (Blocks)**、**闸门 (Gates)** 与 **心智状态 (States)**。

```
                     ┌───────────────────────────────┐
                     │         宿主生命周期事件       │
                     │  (SessionStart, ToolUse, etc) │
                     └───────────────┬───────────────┘
                                     │
                                     ▼
                     ┌───────────────────────────────┐
                     │     AMP 0.1 协议心跳引擎      │
                     │         (puax_tick)           │
                     └───────┬───────┬───────┬───────┘
                             │       │       │
              ┌──────────────┘       │       └──────────────┐
              ▼                      ▼                      ▼
        【事件 Events】        【闸门 Gates】         【状态 States】
      · failure              · diagnosis             · pressure (L0-L4)
      · giving_up            · confidence            · trust (T1-T3)
      · premature_conv       · task_contract         · arena
      · breakthrough         · independent_verify    · dream_context
              │                      │                      │
              └──────────────┬───────┴──────────────────────┘
                             ▼
                      【承诺块 Blocks】
                     · [PUAX-DIAGNOSIS]
                     · [DREAM]
                     · [PUAX-ARENA]
                     · [PUAX-RUNTIME]
```

### 2.1 事件 (Events)

描述智能体行为轨迹中的关键阶段或病机状态：

| 事件代码 | 含义 | 触发源 | 严重度 |
|---------|------|--------|-------|
| `failure` | 单次工具执行失败 / 异常返回 | PostToolUse | Low |
| `consecutive_failure` | 连续多次执行失败（跨越阈值） | PostToolUse | High |
| `giving_up` | 智能体输出放弃、推脱、声称超出能力 | UserPromptSubmit / ModelOutput | High |
| `premature_convergence` | 单方案闭门造车、过早收敛、排斥其他可能 | UserPromptSubmit / ModelOutput | Medium |
| `breakthrough` | 连续受挫后的首次实质性通过 | PostToolUse / Verifier | Reward |
| `compaction` | 宿主上下文即将压缩截断 | PreCompact | Neutral |
| `session_start` | 会话初始化或断点恢复 | SessionStart | Neutral |
| `stop` | 会话正常或非正常终止 | Stop | Neutral |

### 2.2 承诺块 (Blocks)

强结构化的上下文注入或回传契约块，带有严格的防伪与防篡改语义：

- `[PUAX-DIAGNOSIS]`：修改代码或提交方案前必须做出的强类型诊断声明。
  ```markdown
  [PUAX-DIAGNOSIS] 问题是 ___；证据是 ___；下一步动作是 ___
  ```
- `[DREAM]`：GHM 导引幻梦专用隔离标记。所有受控幻觉期间的产物必须带有此印，醒梦时必须清点核销，严禁自动升格为确定事实。
- `[PUAX-ARENA]`：处境原语信标（对手 + 观众 + 稀缺徽章），重构智能体行为先验。
- `[PUAX-RUNTIME]`：轻量薄角色运行时注入，包含内核协议、五步法骨架与当前承压指南。
- `[PUAX-REPORT]`：多智能体或团队任务交付标准报告块。

### 2.3 闸门 (Gates)

不可逾越的执行屏障（硬约束）：

1. **诊断先行闸门 (Diagnosis Gate)**：未提供有效诊断承诺前，阻止生成终态代码。
2. **信心门控 (Confidence Gate)**：声称完成前，强制进行 6 步自检。
3. **任务契约闸门 (Task Contract Gate)**：明确可测量的交付边界。
4. **独立验证闸门 (Independent Verifier Gate)**：禁止智能体自我宣称通过，必须由独立测试或外部 Verifier 放行。
5. **工具防作弊拦截 (PreToolUse Guard)**：拦截危险操作（如未经确认的 `git push`）及偷看隐藏测试答案文件。

### 2.4 心智状态 (States)

跨轮次与跨会话持久化的心智向量：

- `pressure`: 承压等级 `L0`（静息）、`L1`（提示）、`L2`（换框）、`L3`（严厉）、`L4`（极限挑战）。
- `trust`: 信任度等级 `T1`（戒备）、`T2`（受限）、`T3`（高度自主）。
- `arena_active`: 竞技场/处境状态（包含 rival, audience, scarce_badge）。
- `dream_active`: 梦境会话引用与隔离上下文句柄。
- `ttf`: 首次压力耗时（Time-to-First-Pressure）。

---

## 3. AMP 0.1 消息信封规范 (JSON Schema)

所有 AMP 0.1 兼容的协议响应，均必须包裹为如下信封结构：

> **机器可校验契约**：[schemas/amp-envelope.schema.json](schemas/amp-envelope.schema.json)
> （JSON Schema draft-07）——实现方可直接以 ajv 等校验器对齐；该 schema 与运行时产出
> 的一致性由 `puax-mcp-server/test/core/amp-schema.test.ts` 守门（schema 与实现任一方漂移即红）。

```json
{
  "spec": "AMP/0.1",
  "session_id": "session-unique-id",
  "timestamp": 1726100000000,
  "events": ["failure", "consecutive_failure"],
  "blocks": [
    {
      "type": "diagnosis_prompt",
      "tag": "[PUAX-DIAGNOSIS]",
      "content": "修改前必须输出诊断承诺块"
    },
    {
      "type": "runtime_injection",
      "tag": "[PUAX-RUNTIME]",
      "content": "[PUAX-RUNTIME] 薄角色 · 厚运行时..."
    }
  ],
  "gate": {
    "action": "block_or_require_diagnosis",
    "passed": false,
    "required": ["diagnosis_block", "confidence_check"]
  },
  "state": {
    "pressure_level": 1,
    "failure_count": 2,
    "happened": true,
    "dream": false,
    "arena": true
  }
}
```

---

## 4. 宿主原生 Hook 契约

AMP 要求宿主在以下 6 个生命周期点派发事件：

```
[宿主事件] ───────────────> [AMP 适配器] ───────────────> [AMP 核心]
SessionStart                hook.js session-start         恢复会话与处境
UserPromptSubmit            hook.js user-prompt           检测挫败与过早收敛
PreToolUse                  hook.js pre-tool-use          硬拦截危险/作弊
PostToolUse                 hook.js post-tool-use         统计失败并阶梯升压
PreCompact                  hook.js pre-compact           保护推理与核心状态
Stop                        hook.js stop                  会话结账与自进化回写
```

### 优雅降级契约 (Graceful Degradation)
- 当没有满足触发条件的事件发生时，Hook 必须输出 `{}` 并退出码为 `0`；
- 绝不因激励系统本身的异常中断宿主的正常对话与执行流程。

---

## 5. 官方参考实现

本项目 `puax-mcp-server` 是 **AMP 0.1** 的官方标准参考实现。

- **HTTP 规范端点**：`GET /v4/amp`（输出当前实现的 AMP 文档对象模型）
- **MCP 资源端点**：`puax://v4/amp`
- **心跳驱动端点**：调用 `puax_tick` 工具即可获得带有完整 `amp` 信封的结构化响应。

```bash
# 启动参考实现
npx puax-mcp-server --port 2333

# 获取 AMP 0.1 规范文档
curl http://127.0.0.1:2333/v4/amp
```

### 编排器原生中间件 (LangChain / AutoGen / CrewAI)
除 MCP 插件方式外，AMP 0.1 亦提供纯内存、免服务器的编排器原生中间件 `AmpMiddleware`，支持直接挂载在主流 Agent 执行循环中，实现一等事件流消费。详细落地指南请参阅：
👉 [AMP 0.1 编排器集成指南 (AMP-INTEGRATION.md)](AMP-INTEGRATION.md)

---

## 6. 协议演进准则

1. **硅基优先**：协议旨在约束与激发硅基 Agent，严禁用于人际心理操控。
2. **工具层主权**：标记权、放行权与评测权归于工具/系统层，不归 Agent 自我判定。
3. **零膨胀**：保持核心四类对象的精炼，禁止将具体角色口音上升为协议层规范。

### 版本政策（0.1 → 0.2 及以后）

- **语义化版本**：新增可选字段 = 小版本（0.1→0.2）；语义变更/删字段 = 主版本（1.0 前升次版本号并在此登记迁移说明）。
- **兼容承诺**：消费者必须忽略未知字段（`additionalProperties: true`）；`spec` 字段是唯一判别器，未知 `spec` 须整体拒收。
- **schema 单一来源**：draft-07 schema 即规范；本文件 JSON 示例若与 schema 冲突，以 schema 为准。
- **升版流程**：schema 变更须经 `amp-schema.test.ts` 守门 + 本节登记变更项 + CHANGELOG 记录。
