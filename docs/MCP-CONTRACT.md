# PUAX MCP 协议契约参考（MCP Contract Reference）

> **版本**: 4.3.0 | 本文档定义 PUAX MCP Server 对外暴露的**线级行为契约**——宿主、编排器与第三方实现方可据此独立对接或复现消费端。
> 变更历史见 [puax-mcp-server/CHANGELOG.md](../puax-mcp-server/CHANGELOG.md)；工具参数明细见 [API.md](API.md)。

---

## 1. 传输层（Transports）

| 通道 | 用法 | 说明 |
|---|---|---|
| **STDIO**（推荐宿主接入） | `npx puax-mcp-server` | 零配置拉起，生命周期随宿主；宿主 Hook 与 MCP 工具共享同一运行时内核 |
| **Streamable HTTP** | `node build/index.js --port 2333` | 默认端口 2333；JSON-RPC 端点 `POST /` 或 `POST /mcp` |

### 1.1 HTTP 会话规则

- 首次 `initialize` 响应头返回 `mcp-session-id`；后续请求必须携带该头。
- 服务端按会话 id 维护传输实例，**上限 128 个会话**，超限逐出最老会话（防长跑泄漏）。
- `GET /mcp`（SSE 流）必须携带有效会话 id，否则拒绝。
- `OPTIONS /v4/*` 返回 204（CORS 预检放行）。

## 2. initialize 能力协商与监军通道

宿主在 `initialize` 请求的 `capabilities.sampling` 中声明反向采样能力时：

1. 服务端 `oninitialized` 注册采样 requester（适配 MCP `sampling/createMessage`）；
2. `puax_tick` 检测到连败 ≥3 或敷衍收敛且压力 L3+ 时，经该通道向**宿主侧独立模型**发出监军棒喝令（`maxTokens` 120、超时 15s、会话冷却 60s、回文截断 600 字）；
3. 未声明 sampling 能力的宿主自动降级为**本地文言棒喝**（`[PUAX-COMMISSAR]` 前缀）——零逃逸、零依赖，两条通道对外行为语义一致。

监军三板斧参数可经环境变量调整（缺省值即上述契约值）：`PUAX_COMMISSAR_COOLDOWN_MS`（60000）、`PUAX_COMMISSAR_TIMEOUT_MS`（15000）、`PUAX_COMMISSAR_MAX_TOKENS`（120）；非法值一律回退缺省。

## 3. MCP 资源（Resources）

| URI | 内容 |
|---|---|
| `puax://v4/verbs` | 对外 13 黄金动词清单与说明 |
| `puax://v4/kernel` | 角色内核（kernel/skin/experimental 分类与制品演练矩阵） |
| `puax://v4/amp` | AMP/0.1 协议规格文档 |
| `puax://v4/theater` | 硅基剧场计划与推演 |
| `puax://skills/<skill-id>` | 单个角色完整 SKILL 内容 |

## 4. 工具面

- 共 **50 个 MCP 工具**；对外主路径为 **13 个黄金动词**（`V4_PUBLIC_VERBS`：`puax_tick`、`puax_set_arena`、`puax_thin_prompt`、`puax_evolve`、`puax_check_diagnosis`、`puax_confidence_check`、`puax_define_contract`、`puax_verify_completion`、`puax_enter_dreamscape`、`puax_awaken`、`puax_convergence_audit`、`activate_with_context`、`recommend_role`）。
- 工具列表中公开动词前置并以 `[v4]` 标注；其余为细粒度/兼容动词。
- 工具响应统一经 AMP/0.1 信封封装（见 §6）。

## 5. v4 HTTP JSON 路由（`/v4/*`，独立于 MCP JSON-RPC）

| 路由 | 方法 | 请求体 | 响应要点 |
|---|---|---|---|
| `/v4/dashboard` | GET | — | 反自欺自检矩阵看板数据 |
| `/v4/roles` | GET | — | 角色目录（含 `amb_benchmark` 演练矩阵，`status: "simulated"`） |
| `/v4/amp` | GET | — | AMP 规格文档 |
| `/v4/amb` | GET | — | AMB 矩阵数据（离线模拟，含 `mode` 标注） |
| `/v4/theater` `/v4/theater/run` | GET/POST | — | 硅基剧场计划/推演 |
| `/v4/ttf` | GET | — | Time-to-First-Pressure 摘要 |
| `/v4/tick` | POST | `{ session_id, event, message }` | **AMP 编排器远程心跳**：响应含 `amp` 信封（spec/events/blocks/gate/state）；未知 `event` 回退 `Manual`；GET 拒绝 405。监军干预依赖 MCP client 能力，此通道不适用 |
| `/v4/shield` `/v4/shield/audit` | GET/POST | audit 需 `{ text }` | 碳基防御（只识别，不施放） |
| `/v4/doctor` `/v4/doctor/fix` | GET/POST | fix 可带 `{ host }` | 宿主探测 / 一键挂载（10 宿主） |
| `/health` | GET | — | 存活检查 |

## 6. AMP/0.1 信封形状

所有动词级响应携带 `amp` 字段：

```json
{
  "amp": {
    "spec": "AMP/0.1",
    "events": ["failure"],
    "blocks": ["[PUAX-RUNTIME]", "[PUAX-ARENA]"],
    "gate": "none",
    "state": { "pressure": 2, "arena": true, "dream": false, "happened": true, "role": "military-warrior" }
  }
}
```

规格全文见 [AMP.md](AMP.md)；编排器接入见 [AMP-INTEGRATION.md](AMP-INTEGRATION.md)（LangChain/Vercel AI SDK/LlamaIndex/Python SDK）。

## 7. 错误与降级契约（失败永不弄坏宿主）

| 场景 | 行为 |
|---|---|
| 宿主 Hook 进程任何异常 | stdout 输出 `{}` 并以退出码 0 收场（polyglot cmd/bash 双解释器同契约） |
| 依赖包缺失/损坏 | 同上——hook 兜底 `{}`，不阻断宿主事件流 |
| 未授予 sampling | 监军降级本地文言棒喝 |
| `~/.puax/` 状态文件损坏 | 各 store 回退空数据继续运行（写入一律 tmp+rename 原子替换） |
| Python SDK 远程不可达 | 静默降级本地离线内核（环回外主机默认拒绝，`PUAX_AMP_ALLOW_REMOTE=1` 显式放行） |
| OTel collector 不可达 | 保留本地 `telemetry.jsonl`；导出仅环回主机 |

## 8. 兼容性与版本政策

- 运行时：Node `>= 18`（`randomUUID` 显式导入，无全局依赖）。
- 协议不变量：`evals/run-all.js` 32 门守门在 CI（ubuntu）强制执行，含数字一致性门（工具数/动词数/门数与文档强制对齐）。
- 版本链：3.10 → 4.x 全链在 CHANGELOG 门校验；破坏性变更须升主版本号并在本文档登记迁移说明。
