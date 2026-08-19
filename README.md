# PUAX — AI Agent 激励系统

<p align="center">
  <img src="https://img.shields.io/badge/version-3.12.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/status-production%20ready-green.svg" alt="Status">
  <img src="https://img.shields.io/badge/skills-59-orange.svg" alt="Skills">
  <img src="https://img.shields.io/badge/MCP%20tools-45-purple.svg" alt="MCP Tools">
  <img src="https://img.shields.io/badge/flavors-11-yellow.svg" alt="Flavors">
</p>

<p align="center">
  <b>当 AI Agent 陷入瓶颈时，PUAX 提供角色、方法论与行为协议，驱动有效行动</b>
</p>

<p align="center">
  <a href="README.md">简体中文</a> | <a href="README_en.md">English</a>
</p>

---

## 什么是 PUAX？

PUAX 是面向 AI Agent 的**激励与行为驱动**系统，核心能力包括：

| 能力 | 说明 |
|------|------|
| **混合触发检测** | YAML 正则 + TF-IDF/子串语义（paraphrase 可命中） |
| **智能角色推荐** | 59 内置角色 + 自定义角色，多维度评分 + `score_explanation` |
| **行为有效性闭环** | 诊断先行、信心门控、失败后切换、Task Contract、独立验证 |
| **GHM 导引幻梦法** | 驭幻觉发散引擎：庄周八梦角色 + 入梦/醒梦/收敛审计三工具（v3.12） |
| **Hook System** | 会话状态、L0–L4 压力、突破降压、Compaction 推理保护 |
| **自进化** | `~/.puax/evolution.json` 跨会话基线与段位 |
| **11 种大厂风味** | 语气 + 行为约束（非仅修辞） |
| **可观测性** | 匿名本地使用统计 + OpenTelemetry 兼容 span |

帮助 Agent 从「分析正确」走向「验证完成、可交付」。

---
2026年AI编程圈最离谱的一幕就这样发生了。
剑桥大学助理教授 Miles Cranmer 最近干了一件事，他对 OpenAI 的编程智能体 Codex 撒了一个弥天大谎。
他告诉 Codex："Anthropic 的 Claude 已经在我另一台机器上找到了约 20% 的性能提升"，然后问它：你能不能做得更好？他还补了一刀："你的表现会被放到一个公开评测排行榜上展示。"结果？
Codex 直接交出了35%的加速方案。
而且，看起来是真的~
![PUA Agent的证据.jpg](https://files.seeusercontent.com/2026/08/03/i4sI/PUA-Agent.jpg)

---

## 快速开始

```bash
# MCP 客户端（STDIO，推荐）
npx puax-mcp-server --stdio

# HTTP 模式
npx puax-mcp-server --port 2333

# 导出到 Cursor / VSCode 等
npx puax-mcp-server --export=cursor --output=./.cursor/rules
npx puax-mcp-server --list-platforms
```

**MCP 配置示例（Cursor）** — `~/.cursor/mcp.json`：

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

详见 [puax-mcp-server/README.md](puax-mcp-server/README.md)。

### 其他安装方式

除 MCP 运行时外，PUAX 亦提供以下入口（详见 [distributions/INSTALL.md](distributions/INSTALL.md)）：

| 方式 | 命令 |
|------|------|
| Skills CLI | `npx skills add linkerlin/PUAX` |
| Claude Code 插件市场 | `claude plugin marketplace add ./distributions/claude-code` |
| 平台原生导出 | `npx puax-mcp-server --export=all --output=./puax-export` |

> `npx skills` 借用 Vercel Skills CLI，按约定扫描 `skills/*/SKILL.md`，与 PUAX 角色目录结构相符；其完整工具链仍需 `npx puax-mcp-server`。

---

## 核心特性

### 行为有效性闭环（v3.3+）

| 工具 | 作用 |
|------|------|
| `puax_check_diagnosis` | 验证 `[PUAX-DIAGNOSIS]` 诊断块 |
| `puax_confidence_check` | 6 步信心门控 |
| `puax_switch_on_failure` | 失败模式 → 方法论/角色切换链 |
| `puax_define_contract` | Task Contract 定义 |
| `puax_verify_completion` | 独立验证（非 Agent 自评） |

激活角色时自动注入诊断先行协议（`activate_with_context` / `get_role_with_methodology`）。

### Hook System 与压力管理

- 状态持久化：`~/.puax/sessions/`
- 压力 L0–L4，连续失败升级；突破成功后降压（`puax_handle_breakthrough`）
- 6 类 Hook 事件：`UserPromptSubmit`、`PostToolUse`、`PreToolUse`、`PreCompact`、`SessionStart`、`Stop`
- 双模并存：MCP 工具（Agent 自愿）+ **原生 Hook**（v3.11，宿主强制，`puax-mcp-server hook <事件>`）
  - 原生 Hook：SessionStart 注入、PreToolUse 强制拦截（git push / 隐藏文件防作弊）、PostToolUse 失败自动升级
  - 平台导出：`--export=claude-code|cursor|opencode` 自动生成宿主 hook 配置与脚本
  - 详见 [docs/HOOK-ARCHITECTURE.md](docs/HOOK-ARCHITECTURE.md)

### 59 激励角色 + 自定义角色

9 大分类：军事、萨满、P10、硅基、主题、SillyTavern、自激励、特殊、**庄周八梦（dream，v3.12）**。

庄周八梦 · GHM 导引幻梦法：坐忘 / 梦蝶 / 混沌 / 鲲鹏 / 秋水 / 庖丁 / 齐物 / 薪火——从认知操控机制逆向工程八术，让 Agent 主动利用受控幻觉进行发散思考与创作创新（详见 [docs/GHM.md](docs/GHM.md)）。

自定义角色：`puax_register_custom_role` → 写入 `~/.puax/custom-roles.json`，自动进入推荐池。

### 11 种大厂风味

阿里、华为、Musk、Jobs、百度、Amazon、Google、小米、字节、Netflix、腾讯 — 定义于 `flavor-methodologies.yaml`（行为约束 + 导出元数据）。

### 混合触发检测（v3.10）

1. **正则优先** — 命中 YAML 模式即触发  
2. **语义兜底** — 未命中时 TF-IDF + 子串重叠（阈值 0.62）  
3. **增强检测** — 工具闲置、低质量输出等上下文感知（`EnhancedTriggerDetector`）

### 评测与守门

```bash
node evals/run-all.js          # 12 项协议守门（无 LLM）
cd puax-mcp-server && npm test # 900+ 单元/集成测试
node evals/benchmark.js        # 性能基准
```

详见 [evals/README.md](evals/README.md)。

---

## MCP 工具概览（45 个）

| 类别 | 代表工具 |
|------|----------|
| 角色/SKILL | `list_skills`, `get_skill`, `activate_skill`, `get_role_with_methodology` |
| 检测与推荐 | `puax_detect_trigger`, `puax_quick_detect`, `recommend_role`, `activate_with_context` |
| 行为协议 | `puax_switch_on_failure`, `puax_check_diagnosis`, `puax_confidence_check`, `puax_verify_completion`, `puax_define_contract` |
| 会话/压力 | `puax_start_session`, `puax_get_pressure_level`, `puax_handle_breakthrough` |
| GHM 导引幻梦法 | `puax_enter_dreamscape`, `puax_awaken`, `puax_convergence_audit`（v3.12） |
| 自进化 | `puax_get_evolution_baseline`, `puax_record_evolution` |
| 自定义角色 | `puax_register_custom_role`, `puax_list_custom_roles`, `puax_remove_custom_role` |
| 可观测性 | `puax_get_usage_stats`, `puax_flush_telemetry` |
| 编排 | `puax_orchestrate_team`, `puax_list_platforms` |

完整清单见 [puax-mcp-server/README.md#mcp-工具清单](puax-mcp-server/README.md)。

---

## 环境变量（可选）

| 变量 | 说明 | 默认 |
|------|------|------|
| `PUAX_USAGE_STATS` | `0` 关闭匿名使用统计 | 开启（本地 `~/.puax/usage-stats.json`） |
| `PUAX_OTEL_ENABLED` | `1` 写入 span 到 `telemetry.jsonl` | 关闭 |
| `PUAX_OTEL_ENDPOINT` | OTLP/JSON 导出地址 | — |
| `PUAX_TELEMETRY_DIR` | 遥测文件目录 | `~/.puax` |
| `DEEPSEEK_API_KEY` | L4 对照实测（仅 evals） | — |

统计与遥测**不含对话内容**，仅存计数与 span 元数据。

---

## 项目结构

```
PUAX/
├── skills/                 # 50 个角色 SKILL.md
├── puax-mcp-server/        # MCP 服务器（npm 包 puax-mcp-server）
├── evals/                  # 行为评测与 L4 对照
├── templates/              # 方法论指南（部分 AUTO-GENERATED）
├── distributions/          # Claude 插件 / Skills CLI 安装说明
├── TODO.md                 # 改进计划（P0–P3）
└── 演进方案.md             # 与 pua 差距对标
```

---

## 文档

| 文档 | 说明 |
|------|------|
| [GHM 导引幻梦法](docs/GHM.md) | 驭幻觉发散引擎：病机、八术映射、庄周八梦、安全铁律 |
| [MCP Server README](puax-mcp-server/README.md) | 配置、工具清单、架构、环境变量 |
| [API 参考](docs/API.md) | **45 个 MCP 工具**参数与示例（v3.12） |
| [使用指南](docs/USER-GUIDE.md) | 场景化工作流 |
| [CHANGELOG](puax-mcp-server/CHANGELOG.md) | 版本变更记录 |
| [evals/README.md](evals/README.md) | 评测分层与 L4 实测 |
| [TODO.md](TODO.md) | 改进计划与里程碑 |
| [演进方案.md](演进方案.md) | 差距分析（v3.10 关闭状态表） |

---

## 开发与测试

```bash
cd puax-mcp-server
npm install && npm run build
npm test
npm run validate          # lint + typecheck + test
node ../evals/run-all.js  # 从仓库根目录
```

---

## 许可证

MIT License — 详见 [LICENSE](LICENSE)

---

<p align="center"><b>让 AI Agent 不再孤军奋战</b></p>
