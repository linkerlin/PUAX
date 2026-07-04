# PUAX 使用指南

> **版本**: 3.10.0 | 配套 [API 参考](API.md) · [MCP README](../puax-mcp-server/README.md)

---

## 1. 五分钟上手

```bash
npx puax-mcp-server --stdio
```

在 Cursor / Claude Desktop 的 MCP 配置中加入 `puax-mcp-server --stdio` 后，Agent 即可调用 42 个 MCP 工具。

**最简单路径**：让 Agent 调用 `activate_with_context`，传入最近几轮对话，自动完成检测 → 推荐 → 注入带 `[PUAX-DIAGNOSIS]` 的 System Prompt。

---

## 2. 我该用哪个工具？

| 你的目标 | 推荐工具 |
|----------|----------|
| 快速判断要不要干预 | `puax_quick_detect` |
| 有会话、要压力升级 | `puax_detect_trigger` + `puax_start_session` |
| 只要推荐哪个角色 | `recommend_role` |
| 要完整 prompt + 方法论 | `get_role_with_methodology` |
| 一条龙自动化 | `activate_with_context` |
| 同一思路反复失败 | `puax_switch_on_failure` |
| 准备改代码前 | `puax_check_diagnosis` |
| 准备交付前 | `puax_confidence_check` → `puax_verify_completion` |
| 长任务/compaction | `puax_update_reasoning_state` |
| 会话结束复盘 | `puax_record_evolution` + `puax_end_session` |

---

## 3. 典型场景

### 场景 A：用户说「为什么还不行？」

1. `puax_quick_detect` 或 `puax_detect_trigger` → 得到 `user_frustration` 等  
2. `recommend_role` → 例如 `military-commander`  
3. `get_role_with_methodology` → 注入 prompt + 华为味（可选）  
4. Agent 输出必须先含 `[PUAX-DIAGNOSIS]`，再动手  

### 场景 B：Agent 想放弃

触发器：`giving_up_language`  
推荐：`military-warrior` / `military-commissar`  
若已激活仍失败 → `puax_switch_on_failure`，`failure_mode: "giving_up"`

### 场景 C：反复修不对（原地打转）

1. `failure_mode: "spinning"` 调用 `puax_switch_on_failure`  
2. 跟随输出的 `to_methodology`（如 `musk-algorithm` → `jobs-subtraction`）  
3. L2+ 压力时留意 prompt 中的**换框提示**（换视角 / 抽象层 / 约束）

### 场景 D：准备说「完成了」

1. 会话开始时 `puax_define_contract` 定义验收标准  
2. 交付前 `puax_confidence_check`（6 步门控）  
3. `puax_verify_completion` 独立验证 — **Agent 自评不算数**

### 场景 E：连续失败 3 次后终于成功

调用 `puax_handle_breakthrough` → 压力归零、味道认可、提示方法论沉淀。

---

## 4. Hook 会话模式

适合长时间、多轮 Coding Agent：

```
puax_start_session(session_id)
  ↓ 每轮用户消息
puax_detect_trigger(session_id, event_type: UserPromptSubmit, ...)
  ↓ 需要时
recommend_role / activate_with_context
  ↓ 观察
puax_get_pressure_level
  ↓ 结束
puax_end_session + puax_record_evolution
```

状态保存在 `~/.puax/sessions/`，Compaction 前用 `puax_update_reasoning_state` 保护推理链。

---

## 5. 风味与语气

**风味**（11 种）：在 `get_role_with_methodology` 中设 `options.include_flavor`。

- 调试僵局 → `huawei`（RCA）  
- 架构/规划 → `amazon` 或 `google`  
- 快速交付 → `xiaomi`（专注、极致、快）  
- 数据/性能 → `bytedance`  

**语气变体**：`strict`（默认严厉）/ `yes`（鼓励）/ `mama`（唠叨）  
**英文**：`language: "en"` 启用 PIP Edition 修辞层（角色正文仍为中文 bundle）。

---

## 6. 自定义角色

```json
puax_register_custom_role({
  "id": "custom-my-reviewer",
  "name": "严审官",
  "description": "专做 code review 施压",
  "content": "…完整 system prompt…",
  "recommended_for_triggers": ["low_quality"],
  "task_types": ["review"]
})
```

注册后立即进入 `recommend_role` 推荐池；`list_skills` 的 `category: "custom"` 可列出。

---

## 7. 平台导出（不用 MCP 时）

```bash
npx puax-mcp-server --export=cursor --output=./.cursor/rules
npx puax-mcp-server --list-platforms
```

将 50 角色导出为 Cursor Rules、VSCode Copilot Instructions、Skill.md 等。风味数据来自 `flavor-methodologies.yaml` 单一数据源。

---

## 8. 评测与质量守门

开发/发版前：

```bash
node evals/run-all.js              # 12 项协议守门
cd puax-mcp-server && npm test       # 578+ 测试
node evals/benchmark.js            # 性能基准
```

可选 L4 DeepSeek 对照实验见 [evals/README.md](../evals/README.md)。

---

## 9. 隐私与可观测性

- **使用统计**：默认本地匿名计数；`PUAX_USAGE_STATS=0` 关闭  
- **遥测**：`PUAX_OTEL_ENABLED=1` 写 `~/.puax/telemetry.jsonl`  
- **查询**：`puax_get_usage_stats`  
- 均**不记录**对话正文  

---

## 10. 故障排除

| 现象 | 处理 |
|------|------|
| 检测不敏感 | `puax_detect_trigger` 提高 `sensitivity: "high"`；v3.10 已支持语义 paraphrase |
| 推荐不合适 | 检查 `task_context.task_type`；设置 `user_preferences` |
| MCP 连不上 | `curl localhost:2333/health` 或改 `--stdio` |
| 角色找不到 | 内置用 `skillId`；自定义须 `custom-` 前缀 |

---

## 11. 角色速查

| 场景 | 角色 ID |
|------|---------|
| 用户沮丧 | `military-commander` |
| 连续失败 | `military-warrior`, `military-commissar` |
| 需要创意 | `shaman-musk` |
| 深度分析 | `shaman-einstein`, `military-scout` |
| 质量审查 | `shaman-jobs`, `silicon-auditor` |
| 自我驱动 | `self-motivation-awakening` |

完整列表：`list_skills` 或 `get_categories`。

---

## 相关链接

- [API 参考](API.md) — 42 工具参数与示例  
- [CHANGELOG](../puax-mcp-server/CHANGELOG.md) — 版本历史  
- [TODO](../TODO.md) — 路线图（P0–P3 已基本完成）
