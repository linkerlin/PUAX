# PUAX MCP API 参考

> **版本**: 3.10.0 | **MCP 工具**: 42 | **内置角色**: 50 + 自定义  
> 变更历史见 [puax-mcp-server/CHANGELOG.md](../puax-mcp-server/CHANGELOG.md)

---

## 安装与连接

```bash
npx puax-mcp-server --stdio          # MCP 客户端（推荐）
npx puax-mcp-server --port 2333      # HTTP 模式
curl http://localhost:2333/health    # 健康检查
```

**Cursor / Claude Desktop 配置**：

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

所有工具通过 MCP `callTool(name, arguments)` 调用，返回 JSON 文本。

---

## 推荐工作流

### 标准闭环

```
puax_detect_trigger / puax_quick_detect
    → recommend_role
    → get_role_with_methodology 或 activate_with_context
    → [Agent 执行 + PUAX-DIAGNOSIS]
    → puax_check_diagnosis
    → puax_confidence_check
    → puax_verify_completion（对照 Task Contract）
```

### 失败切换

```
puax_switch_on_failure
    → get_role_with_methodology（新角色）
    → 继续执行
```

### 会话 + 压力

```
puax_start_session
    → puax_detect_trigger（每轮）
    → puax_get_pressure_level
    → puax_handle_breakthrough（突破后）
    → puax_record_evolution + puax_end_session
```

---

## MCP 工具索引（42）

### SKILL / 角色管理（5）

| 工具 | 说明 | 主要参数 |
|------|------|----------|
| `list_skills` | 列出角色 | `category`, `includeCapabilities` |
| `get_skill` | 获取角色详情 | `skillId`, `task`, `section` |
| `search_skills` | 关键词搜索 | `keyword` |
| `activate_skill` | 激活并返回 prompt | `skillId`, `task`, `customParams` |
| `get_categories` | 分类统计 | — |

### 检测与推荐（5）

| 工具 | 说明 | 主要参数 |
|------|------|----------|
| `puax_detect_trigger` | Hook 增强触发检测（YAML + 上下文 + 压力） | `session_id`, `event_type`, `context` |
| `puax_quick_detect` | 无会话快速检测 | `text`, `task_context` |
| `recommend_role` | 多维度角色推荐 | `detected_triggers`, `task_context`, `user_preferences`, `session_history` |
| `get_role_with_methodology` | 角色 + 方法论 + 清单 + 风味 | `role_id`, `options.include_flavor`, `tone_variant`, `language` |
| `activate_with_context` | 一键检测→推荐→激活 | `context`, `options.auto_detect`, `tone_variant`, `language` |

**`recommend_role` 输出要点**：`primary`（含 `score_explanation` 逐步得分）、`alternatives`、`activation_suggestion`。

**`get_role_with_methodology` options**：

| 字段 | 值 | 说明 |
|------|-----|------|
| `include_flavor` | `alibaba` / `huawei` / `amazon` / `google` / `xiaomi` 等 11 种 | 叠加行为约束 + 修辞 |
| `tone_variant` | `strict` / `yes` / `mama` | 语气变体 |
| `language` | `zh` / `en` | PIP Edition 英文修辞层 |
| `format` | `full` / `compact` / `prompt_only` | 输出粒度 |

### 行为有效性闭环（6）

| 工具 | 说明 | 主要参数 |
|------|------|----------|
| `puax_switch_on_failure` | 失败后角色/方法论切换 | `current_role_id`, `failure_mode`, `attempt_count`, `task_type` |
| `puax_check_diagnosis` | 验证 `[PUAX-DIAGNOSIS]` 块 | `diagnosis_text` |
| `puax_confidence_check` | 6 步信心门控 | `claims`, `evidence`, `session_id` |
| `puax_define_contract` | 定义 Task Contract | `intent`, `acceptance`, `forbidden`, `verify_commands` |
| `puax_verify_completion` | 独立 verifier（非自评） | `contract_id`, `evidence`, `agent_claim` |
| `puax_quality_compass` | Quality Compass + Trust + Recovery | `session_id`, `context` |

**`failure_mode` 枚举**（`puax_switch_on_failure`）：`spinning`, `giving_up`, `poor_quality`, `not_searching`, `passive_wait`, `unverified_completion`, `over_complication` 等。

### 会话与压力（5）

| 工具 | 说明 | 主要参数 |
|------|------|----------|
| `puax_start_session` | 启动会话 | `session_id`, `initial_context` |
| `puax_end_session` | 结束并可选反馈 | `session_id`, `collect_feedback` |
| `puax_get_session_state` | 查询状态 | `session_id` |
| `puax_reset_session` | 重置失败/压力 | `session_id` |
| `puax_get_pressure_level` | L0–L4 压力 | `session_id` |

### 进化与 Compaction（3）

| 工具 | 说明 | 主要参数 |
|------|------|----------|
| `puax_get_evolution_baseline` | 读取 `~/.puax/evolution.json` | — |
| `puax_record_evolution` | 会话结束更新基线 | `pua_effects`, `success`, `breakthrough`, `anti_pattern` |
| `puax_update_reasoning_state` | Compaction 前保存推理状态 | `session_id`, `tried_approaches`, `excluded_possibilities`, `next_hypothesis` |

### 突破与编排（3）

| 工具 | 说明 | 主要参数 |
|------|------|----------|
| `puax_handle_breakthrough` | 连续失败≥3 后成功降压 | `session_id` |
| `puax_orchestrate_team` | Agent Team + `[PUAX-REPORT]` | `action`, `team_id`, `report` |
| `puax_list_platforms` | 导出平台列表 | — |

### 自定义角色（3）

| 工具 | 说明 | 主要参数 |
|------|------|----------|
| `puax_register_custom_role` | 注册到 `~/.puax/custom-roles.json` | `id`（须 `custom-` 前缀）, `name`, `content`, `recommended_for_triggers` |
| `puax_list_custom_roles` | 列表 | — |
| `puax_remove_custom_role` | 删除 | `id` |

### 反馈（5）

| 工具 | 说明 | 主要参数 |
|------|------|----------|
| `puax_submit_feedback` | 提交会话反馈 | `session_id`, `feedback` |
| `puax_get_feedback_summary` | 汇总统计 | `days` |
| `puax_get_improvement_suggestions` | 改进建议 | — |
| `puax_export_feedback` | 导出 JSON/CSV | `format` |
| `puax_generate_pua_loop_report` | PUA 循环报告 | `session_id` |

### 可观测性（3）

| 工具 | 说明 | 主要参数 |
|------|------|----------|
| `puax_get_usage_stats` | 匿名本地统计摘要 | `days` |
| `puax_set_usage_stats_opt_out` | 关闭/恢复统计 | `opt_out` |
| `puax_flush_telemetry` | 刷出 OTel span | — |

### Legacy 别名（4）

| 工具 | 说明 |
|------|------|
| `list_roles` / `get_role` / `search_roles` / `activate_role` | 等同 SKILL 工具，请优先用 `list_skills` 等 |

---

## 调用示例

### 触发检测 + 推荐

```json
// puax_quick_detect
{ "text": "为什么还不行？我已经试了三次了" }

// recommend_role
{
  "detected_triggers": ["user_frustration", "consecutive_failures"],
  "task_context": {
    "task_type": "debugging",
    "urgency": "critical",
    "attempt_count": 3
  }
}
```

### 一键激活

```json
{
  "context": {
    "conversation_history": [
      { "role": "user", "content": "API 还是连不上" },
      { "role": "assistant", "content": "可能是网络问题，我再试一次…" }
    ],
    "task_context": { "attempt_count": 2 }
  },
  "options": {
    "auto_detect": true,
    "include_methodology": true,
    "tone_variant": "strict",
    "language": "zh"
  }
}
```

### 失败后切换

```json
{
  "current_role_id": "military-warrior",
  "failure_mode": "spinning",
  "attempt_count": 4,
  "task_type": "debugging",
  "previous_roles": ["military-warrior", "military-scout"]
}
```

### Task Contract + 验证

```json
// puax_define_contract
{
  "intent": "修复 API 连接超时",
  "acceptance": ["curl 200", "集成测试通过"],
  "forbidden": ["跳过 TLS 验证", "硬编码密钥"],
  "verify_commands": ["npm test -- api", "curl -f http://localhost:8080/health"]
}

// puax_verify_completion
{
  "contract_id": "...",
  "evidence": ["test log", "curl output"],
  "agent_claim": "已完成"
}
```

### 自定义角色

```json
{
  "id": "custom-api-hunter",
  "name": "API 猎手",
  "description": "专啃连接与超时问题",
  "content": "# 你是 API 连接调试专家…",
  "recommended_for_triggers": ["consecutive_failures", "user_frustration"],
  "task_types": ["debugging"]
}
```

---

## 核心概念

### 触发检测（v3.10 混合）

1. **YAML 正则** — `triggers.yaml` 定义 13+ 主触发器  
2. **语义兜底** — 正则未命中时 TF-IDF + 子串重叠（阈值 0.62）  
3. **增强检测** — 工具闲置、低质量输出等（`EnhancedTriggerDetector`）

常见 `detected_triggers` ID：`user_frustration`, `consecutive_failures`, `giving_up_language`, `blame_environment`, `passive_wait`, `tool_underuse`, `surface_fix`, `parameter_tweaking` 等。

### 压力等级

| 等级 | 说明 |
|------|------|
| L0 | 正常 |
| L1 | 初次关注 |
| L2 | 建议激活角色 + 换视角提示 |
| L3 | 强制检查清单 + 换抽象层 |
| L4 | 最高压力 + 换约束 |
| 突破 | 连续失败≥3 后成功 → `puax_handle_breakthrough` 归零 |

### 11 种大厂风味

`flavor-methodologies.yaml` 定义行为约束（非仅修辞）：

阿里、华为、Musk、Jobs、百度、**Amazon**、**Google**、**小米**、字节、Netflix、腾讯

### 方法论路由

`methodology-router.ts` 按任务类型 / 失败模式选择 13 种方法论之一（如 `huawei-rca`, `amazon-backwards`, `google-postmortem`, `xiaomi-focus`）。

---

## 本地数据（`~/.puax/`）

| 路径 | 内容 |
|------|------|
| `usage-stats.json` | 匿名工具/触发/角色计数 |
| `telemetry.jsonl` | OTel 兼容 span（可选） |
| `evolution.json` | 自进化基线 |
| `custom-roles.json` | 用户自定义角色 |
| `feedback/` | 反馈数据 |
| `sessions/` | Hook 会话状态 |

---

## 环境变量

| 变量 | 说明 |
|------|------|
| `PUAX_USAGE_STATS=0` | 关闭匿名统计 |
| `PUAX_OTEL_ENABLED=1` | 写入 `telemetry.jsonl` |
| `PUAX_OTEL_ENDPOINT` | OTLP/JSON HTTP 导出 |
| `PUAX_TELEMETRY_DIR` | 遥测目录 |

---

## CLI 导出（非 MCP）

```bash
npx puax-mcp-server --export=cursor --output=./.cursor/rules
npx puax-mcp-server --export=all --output=./puax-export
npx puax-mcp-server --list-platforms
```

支持 Cursor、VSCode、Windsurf、Kiro、CodeBuddy、Codex、OpenCode、OpenClaw、Antigravity、Trae、pi 等。

---

## 相关文档

| 文档 | 说明 |
|------|------|
| [USER-GUIDE.md](USER-GUIDE.md) | 场景化使用指南 |
| [puax-mcp-server/README.md](../puax-mcp-server/README.md) | 架构与开发 |
| [evals/README.md](../evals/README.md) | 评测体系 |
