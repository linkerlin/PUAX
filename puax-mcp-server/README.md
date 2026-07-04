# PUAX MCP Server

> 为 AI Agent 提供**角色选择、方法论、行为协议与 Hook 会话管理**的 MCP 服务器

| 项 | 值 |
|---|---|
| **版本** | 3.10.0 |
| **传输** | STDIO / HTTP (Streamable HTTP) |
| **默认端口** | 2333 |
| **内置角色** | 50 SKILL + 自定义角色 |
| **MCP 工具** | 42 |
| **风味** | 11（`flavor-methodologies.yaml`） |
| **测试** | 578+ Jest + `evals/run-all.js` 12 项守门 |

完整变更见 [CHANGELOG.md](./CHANGELOG.md)。

---

## 5 秒配置

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

| 客户端 | 配置文件 |
|--------|----------|
| Claude Desktop | `%APPDATA%/Claude/claude_desktop_config.json` |
| Cursor | `~/.cursor/mcp.json` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |

```bash
npx puax-mcp-server --version
npx puax-mcp-server --stdio
npx puax-mcp-server --export=cursor --output=./.cursor/rules
npx puax-mcp-server --list-platforms
```

---

## MCP 工具清单（42）

### 角色与 SKILL（5 + 4 legacy）

| 工具 | 说明 |
|------|------|
| `list_skills` / `get_skill` / `search_skills` / `activate_skill` / `get_categories` | SKILL 管理 |
| `list_roles` / `get_role` / `search_roles` / `activate_role` | Legacy 别名 |

### 检测与激活（5）

| 工具 | 说明 |
|------|------|
| `puax_detect_trigger` | Hook 增强触发检测（YAML + 上下文） |
| `puax_quick_detect` | 快速检测（无需会话） |
| `recommend_role` | 多维度推荐 + `score_explanation` |
| `get_role_with_methodology` | 角色 + 方法论 + 检查清单 + 风味 + 语气变体 |
| `activate_with_context` | 一键：检测 → 推荐 → 激活（含诊断注入） |

### 行为有效性闭环（6）

| 工具 | 说明 |
|------|------|
| `puax_switch_on_failure` | 失败模式 → 角色/方法论切换 |
| `puax_check_diagnosis` | 诊断块合规检查 |
| `puax_confidence_check` | 6 步信心门控 |
| `puax_define_contract` | Task Contract |
| `puax_verify_completion` | 独立完成验证 |
| `puax_quality_compass` | Quality Compass 5 问 |

### 会话、压力、进化（9）

| 工具 | 说明 |
|------|------|
| `puax_start_session` / `puax_end_session` / `puax_get_session_state` / `puax_reset_session` | 会话生命周期 |
| `puax_get_pressure_level` | 当前压力等级 L0–L4 |
| `puax_handle_breakthrough` | 突破降压 |
| `puax_update_reasoning_state` | Compaction 推理状态 |
| `puax_get_evolution_baseline` / `puax_record_evolution` | 自进化基线 |

### 自定义角色（3）

| 工具 | 说明 |
|------|------|
| `puax_register_custom_role` | 注册到 `~/.puax/custom-roles.json` |
| `puax_list_custom_roles` | 列表 |
| `puax_remove_custom_role` | 删除 |

### 反馈与编排（6）

| 工具 | 说明 |
|------|------|
| `puax_submit_feedback` / `puax_get_feedback_summary` / `puax_get_improvement_suggestions` | 反馈 |
| `puax_export_feedback` / `puax_generate_pua_loop_report` | 导出与报告 |
| `puax_orchestrate_team` | Agent Team + `[PUAX-REPORT]` |
| `puax_list_platforms` | 导出平台列表 |

### 可观测性（3）

| 工具 | 说明 |
|------|------|
| `puax_get_usage_stats` | 匿名本地使用统计摘要 |
| `puax_set_usage_stats_opt_out` | 关闭/恢复统计 |
| `puax_flush_telemetry` | 刷出 OTLP span 缓冲 |

---

## 环境变量

| 变量 | 说明 |
|------|------|
| `PUAX_USAGE_STATS=0` | 关闭匿名使用统计 |
| `PUAX_OTEL_ENABLED=1` | 启用 span 写入 `~/.puax/telemetry.jsonl` |
| `PUAX_OTEL_ENDPOINT` | OTLP/JSON HTTP 导出端点 |
| `PUAX_TELEMETRY_DIR` | 遥测目录（默认 `~/.puax`） |

本地数据文件：

```
~/.puax/
├── usage-stats.json      # 匿名工具/角色/触发计数
├── telemetry.jsonl       # OTel 兼容 span（可选）
├── evolution.json        # 自进化基线
├── custom-roles.json     # 自定义角色
├── feedback/             # 用户反馈
└── sessions/             # Hook 会话状态
```

---

## 架构（精简）

```
src/
├── server/core.ts              # MCP 服务（工具分发 + 埋点）
├── tools/                      # 单一工具层（allTools + registry）
├── core/
│   ├── trigger-detector.ts     # YAML 正则 + 语义混合 + Enhanced 检测
│   ├── text-similarity.ts      # TF-IDF / 子串 / Jaccard
│   ├── role-recommender.ts     # 推荐 + 缓存
│   ├── methodology-engine.ts   # 五步法 + 检查清单
│   ├── methodology-router.ts   # 13 方法论路由
│   ├── flavor-methodology.ts   # 11 风味行为约束
│   ├── behavior-protocols.ts   # 诊断/门控/切换
│   ├── evolution-engine.ts     # 自进化
│   ├── custom-role-store.ts    # 自定义角色
│   ├── usage-stats.ts          # 匿名统计
│   ├── telemetry.ts            # OpenTelemetry 兼容
│   └── service-registry.ts     # 轻量 DI
├── hooks/                      # 状态、压力、Hook 管理
├── prompts/                    # skill-manifest + bundles/（懒加载）
├── platform-adapters/          # Cursor/VSCode/Windsurf/… + Skill-MD
└── data/
    ├── triggers.yaml
    ├── role-mappings.yaml
    ├── methodologies.yaml
    └── flavor-methodologies.yaml
```

---

## 开发

```bash
npm install
npm run build
npm test
npm run validate
npm run generate-guides   # 从 methodologies.yaml 生成指南
npm run validate:metadata
```

从仓库根目录运行协议守门：

```bash
node evals/run-all.js
node evals/benchmark.js
```

---

## HTTP 模式

```bash
npx puax-mcp-server --port 2333
curl http://localhost:2333/health
```

---

## 相关文档

| 文档 | 说明 |
|------|------|
| [CHANGELOG.md](./CHANGELOG.md) | 版本历史 |
| [../README.md](../README.md) | 项目概览 |
| [../evals/README.md](../evals/README.md) | 评测体系 |
| [../TODO.md](../TODO.md) | 改进计划 |
| [docs/TESTING.md](./docs/TESTING.md) | 测试说明 |

---

MIT License
