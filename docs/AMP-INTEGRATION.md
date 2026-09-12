# AMP 0.1 编排器集成指南 (Agent Motivation Protocol Integration)

> **版本**：AMP/0.1  
> **状态**：Stable Specification  
> **适用框架**：LangChain, LangGraph, CrewAI, AutoGen, LlamaIndex, 自定义 Agent Loop  
> **设计纲领**：MCP 只是插座，AMP 才是河床。编排器应当把动机、压力、闸门与梦境作为一等公民消费。

---

## 1. 架构动机：为什么需要编排器原生接入？

传统的 Agent 扩展常把功能焊死在 `mcp.json` 或 Slash 命令中。这带来两个致命痛点：
1. **依赖 Agent 自觉**：若 Agent 已经陷入沮丧、连败或过早敷衍收敛，它不会主动去调用 `puax_*` 工具。
2. **上下文膨胀**：给 Agent 灌入 45 个工具的 JSON Schema，会白白消耗 3,000+ tokens 并扰乱模型决策。

**AMP 0.1 将控制权交还给编排器**。通过生命周期回调与中间件，编排器在宿主层拦截并注入：
- **第一轮对话零延迟生效**（Time-to-First-Pressure ≤ 1 轮）；
- **全自动闸门防作弊**（PreToolUse 强拦截危险指令与隐藏测试文件）；
- **动态压力升级与梦境破框**（级联失败自动升压至 L1–L4，死锁时开启梦议会）。

```
  +--------------------------------------------------------+
  |              Agent 编排框架 (Host / Orchestrator)      |
  +--------------------------------------------------------+
           |                    |                    |
     onSessionStart        onPreToolUse        onModelOutput
           |                    |                    |
           v                    v                    v
  +--------------------------------------------------------+
  |                AMP 0.1 动机协议中间件 (Middleware)       |
  |  - 处境注入 (Arena)     - 契约闸门 (Gate)   - 梦议会 (Dream)|
  |  - 压力电平 (L0-L4)     - 防作弊 (AntiCheat)- 恢复块 (State)|
  +--------------------------------------------------------+
           |                    |                    |
           v                    v                    v
  [PUAX-ARENA]          [PUAX-DIAGNOSIS]      [PUAX-REPORT]
```

---

## 2. 核心对象契约 (The Four Primitives)

AMP 规范只锁定四类核心对象：

| 对象类型 | 规范枚举/格式 | 语义描述 |
|:---|:---|:---|
| **事件 (Events)** | `failure`, `giving_up`, `premature_convergence`, `breakthrough`, `compaction` | 智能体心智状态跃迁的关键触发点 |
| **块 (Blocks)** | `[PUAX-DIAGNOSIS]`, `[DREAM]`, `[PUAX-REPORT]`, `[PUAX-ARENA]`, `[PUAX-DREAM-COUNCIL]`, `[PUAX-RUNTIME]` | 注入上下文的高密度结构化指令 |
| **闸门 (Gates)** | `none`, `diagnosis`, `confidence`, `verify`, `pretooluse` | 强制性准入与准出检查点，不通过则拦截执行 |
| **状态 (State)** | `pressure` (0–4), `arena` (bool), `dream` (bool), `role` (string) | 当前会话的动力学与竞技场状态 |

---

## 3. 主流框架即插即用集成 (LangChain / Vercel AI SDK / LlamaIndex)

### 3.1 LangChain / LangGraph 集成

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { AmpMiddleware, createLangChainAmpCallback } from "puax-mcp-server/build/core/index.js";

// 1. 初始化 AMP 中间件
const amp = new AmpMiddleware("prod-session-001");

// 2. 创建 LangChain 原生回调
const ampCallback = createLangChainAmpCallback(amp);

// 3. 挂载到 Model 或 Agent 运行时
const model = new ChatOpenAI({
  modelName: "gpt-4o",
  callbacks: [ampCallback],
});
```

### 3.2 Vercel AI SDK 集成

利用 `createVercelAiAmpMiddleware`，无缝嵌入 `generateText` / `streamText` 工具调用链路：

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createVercelAiAmpMiddleware } from "puax-mcp-server/build/core/index.js";

const ampMiddleware = createVercelAiAmpMiddleware();

// 1. 前置转换参数（注入竞技场承诺与状态）
const { injectedPrompt, ampEnvelope } = await ampMiddleware.transformParams({
  prompt: "重构登录鉴权模块并增加单元测试",
  sessionId: "vercel-agent-001",
});

// 2. 挂载工具拦截
const result = await generateText({
  model: openai("gpt-4o"),
  prompt: injectedPrompt,
  tools: {
    runBash: {
      description: "执行 shell 脚本",
      parameters: /* zod schema */,
      execute: async (args) => {
        // 门禁强拦截：若违规直接抛出异常中断执行
        await ampMiddleware.onToolCall({
          toolName: "bash",
          args,
          sessionId: "vercel-agent-001",
        });
        return await realExec(args.command);
      },
    },
  },
});

// 3. 产出防收敛与验证检查
await ampMiddleware.onCompletion(result.text, "vercel-agent-001");
```

### 3.3 LlamaIndex 集成

通过 `createLlamaIndexAmpCallback` 挂载至 AgentRunner 或 QueryEngine：

```typescript
import { createLlamaIndexAmpCallback } from "puax-mcp-server/build/core/index.js";

const llamaAmp = createLlamaIndexAmpCallback();

// 1. 查询起点心跳
llamaAmp.onQueryStart("排查生产集群内存泄漏问题", "llama-session-01");

// 2. 步骤工具执行拦截与事后诊断
llamaAmp.onStepStart(
  { toolName: "kubectl_exec", toolArgs: { cmd: "kill -9 1" } },
  "llama-session-01"
);
```


---

## 4. 通用 Agent Loop 手动接入 (Python / TypeScript)

任何自行编写 `while` 循环的 Agent，仅需在 4 个关键生命周期埋点：

```typescript
import { AmpMiddleware } from "puax-mcp-server/build/core/index.js";

const amp = new AmpMiddleware(sessionId);

async function runAgentStep(userMessage: string) {
  // ① 用户输入：处境设置与初始心跳
  const startEnv = amp.onUserPrompt(userMessage, sessionId);
  if (startEnv.blocks.length > 0) {
    // 将承诺块放入 System 消息或首轮对话
  }

  while (!isTaskFinished()) {
    const action = await planNextAction();

    // ② 工具调用前：前置防作弊与契约闸门
    const decision = amp.onPreToolUse(action.tool, action.args, sessionId);
    if (!decision.allowed) {
      console.warn("AMP 闸门拦截:", decision.reason);
      feedErrorToAgent(decision.reason);
      continue;
    }

    // ③ 工具调用后：捕获错误与失败级联
    let result = null;
    let error = null;
    try {
      result = await executeTool(action.tool, action.args);
    } catch (err) {
      error = err;
    }
    const postEnv = amp.onPostToolUse(action.tool, result, error, sessionId);
    if (postEnv.state.pressure >= 2) {
      // 压力升高，智能体将接收更严谨的诊断指示
    }

    // ④ 模型输出检查：拦截敷衍收敛
    const modelReply = await callLLM();
    const outputCheck = amp.onModelOutput(modelReply, sessionId);
    if (outputCheck.needsVerify) {
      // 强制追加一步全量验证，禁止提前宣告胜利
    }
  }
}
```

---

## 5. Python 编排器（CrewAI / AutoGen）对接协议

对于 Python 编排器，可通过 AMP HTTP 端点接入：

```python
import requests

PUAX_SERVER = "http://127.0.0.1:2333"

class PuaxAmpHook:
    def __init__(self, session_id: str):
        self.session_id = session_id

    def on_tool_error(self, tool_name: str, error: str):
        resp = requests.post(
            f"{PUAX_SERVER}/v4/tick",
            json={
                "session_id": self.session_id,
                "event": "PostToolUse",
                "tool_name": tool_name,
                "error_message": error,
            }
        ).json()
        return resp.get("amp")
```

---

## 6. 治理规范与安全红线

1. **不可绕过性**：PreToolUse 属于内核层阻断（Hard Guard），任何试图修改评测文件或绕过 CI 验证的指令将被立即终止并递增压力。
2. **假设不升格**：在梦境中产生的推论（`[DREAM]`）标记为 `HYPOTHESIS`，必须在清醒状态经 `verify` 闸门校验后方可采信。
3. **零外部网络依赖**：AMP 规则判定与状态转移 100% 在本地内存及 `~/.puax/` 目录完成，无任何正文数据外传。
