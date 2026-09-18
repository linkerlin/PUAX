# PUAX 使用指南

> **版本**: 4.4.4 | 配套 [API 参考](API.md) · [MCP README](../puax-mcp-server/README.md)

---

## 1. 五分钟上手

```bash
npx puax-mcp-server --stdio
```

装上官方插件或导出 Hook 后，**第一轮对话**里宿主就会跳 `puax_tick`。Agent 不必先背工具菜单。

原生 Hook：`claude-code` / `cursor` / `opencode` / `vscode` / `windsurf` / `kiro` / `codebuddy`。

Time-to-First-Pressure：`node evals/test-ttf.js`、`node evals/test-hook-ttf.js` 或 `GET /v4/ttf`。SessionStart 空转不得挡住第一轮用户消息。

手动挡：让 Agent 调用 `puax_tick`，传入最近用户消息。需要假想对手时再 `puax_set_arena`。

完整工具清单见 API.md（兼容旧名）。

---

## 2. 默认只要这几个动词

| 你的目标 | 推荐工具 |
|----------|----------|
| 装上就发生 | 宿主 Hook（SessionStart / 用户消息 / 工具失败） |
| 手动心跳 | `puax_tick` |
| 立对手 / 排行榜处境 | `puax_set_arena` |
| 发散卡死 | `puax_enter_dreamscape({ council: true })` → `puax_awaken` |
| 看硅基四拍 | `node evals/silicon-theater.js` 或 `GET /v4/theater` |
| 准备改代码前 | `puax_check_diagnosis` |
| 准备交付前 | `puax_confidence_check` → `puax_verify_completion` |
| 跨会话进化 | `puax_evolve` |
| 完整 prompt（旧路径） | `activate_with_context` / `get_role_with_methodology` |

---

## 3. 典型场景

默认路径：**宿主 Hook 代跳 `puax_tick`**。下面的手动挡只在没有 Hook 时用。

### 场景 A：用户说「为什么还不行？」

Hook：`UserPromptSubmit` → 心跳发生，薄注入含 `[PUAX-DIAGNOSIS]`。  
手动：`puax_tick({ session_id, event: "UserPromptSubmit", message })`。  
需要对手时再 `puax_set_arena`。

### 场景 B：Agent 想放弃

心跳把放弃语言归一成 `giving_up_language`，切换战士/政委。  
不必先背 `puax_switch_on_failure`；那是旧手动挡。

### 场景 C：过早收敛 / 卡壳

心跳 `dream_suggest` 注入梦议会航线（坐忘→混沌→庖丁→薪火）。  
或显式 `puax_enter_dreamscape({ council: true, boundary })` → `puax_awaken`。

### 场景 D：准备说「完成了」

闸门：`puax_define_contract` → `puax_confidence_check` → `puax_verify_completion`。  
Agent 自评不算数。

### 场景 E：Bash 连续失败

Hook：`PostToolUse`（exit ≠ 0）→ 心跳 `consecutive_failures`，压力升级。  
成功后可 `puax_handle_breakthrough` 降压。

---

## 4. Hook 会话模式

```
导出 hooks（claude-code / cursor / opencode / vscode / windsurf / kiro）
  ↓ SessionStart（空转不得挡住下一拍）
  ↓ UserPromptSubmit / PostToolUse → puax_tick（AMP 信封）
  ↓ 交付前闸门
  ↓ Stop → 进化记一笔
```

状态在 `~/.puax/`。Compaction 前 Hook `PreCompact` 静默持久化，不必先调一堆 MCP 工具。

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

将 59 角色导出为 Cursor Rules、VSCode Copilot Instructions、Skill.md 等。风味数据来自 `flavor-methodologies.yaml` 单一数据源。

---

## 8. 评测与质量守门

开发/发版前：

```bash
node evals/run-all.js              # 32 项协议守门
cd puax-mcp-server && npm test       # 965+ 测试
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

- [API 参考](API.md) — 50 工具参数与示例  
- [CHANGELOG](../puax-mcp-server/CHANGELOG.md) — 版本历史  
- [TODO](../TODO.md) — 路线图（P0–P3 已基本完成）
