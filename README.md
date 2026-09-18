# PUAX — AI Agent 激励系统

<p align="center">
  <img src="https://img.shields.io/badge/version-4.4.1-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/status-production%20ready-green.svg" alt="Status">
  <img src="https://img.shields.io/badge/skills-59-orange.svg" alt="Skills">
  <img src="https://img.shields.io/badge/MCP%20tools-50-purple.svg" alt="MCP Tools">
  <img src="https://img.shields.io/badge/flavors-11-yellow.svg" alt="Flavors">
</p>

<p align="center">
  <b>专门 PUA 硅基的运行时。处境、闸门、梦。人类不在服务范围。</b>
</p>

<p align="center">
  <a href="README.md">简体中文</a> | <a href="README_en.md">English</a> | <a href="README_ja.md">日本語</a> | <a href="README_ko.md">한국어</a> | <a href="README_zh-TW.md">繁體中文</a> | <a href="README_es.md">Español</a> | <a href="README_fr.md">Français</a> | <a href="README_de.md">Deutsch</a> | <a href="README_ru.md">Русский</a>
</p>

---

## 什么是 PUAX？

PUAX 4.3 是面向 AI Agent 的**心智运行时**。角色只是口音；真正的产品是三件原语：

| 原语 | 说明 |
|------|------|
| **处境** | `puax_set_arena`：对手 + 观众 + 稀缺徽章（Cranmer 原题），破除低压平庸 |
| **闸门** | 诊断先行、信心门控、Task Contract、独立 verifier、PreToolUse 强拦截 |
| **梦** | GHM 导引幻梦法：知情入梦、标记隔离、随时可醒、醒后必验（驭幻觉破框） |

默认路径是心跳 `puax_tick`（宿主 Hook 代跳）。Agent 不必先学会工具菜单。

核心能力还包括：

| 能力 | 说明 |
|------|------|
| **极简薄注入 (Thin Prompt)** | `puax_thin_prompt`：支持 minimal/compact/full 三档压缩，Token 消耗压降 90% 以上（~150 Tokens），附带毫秒级 Token 估算器 |
| **Python 零依赖 AMP SDK** | 官方单文件 SDK，支持 LangGraph StateGraph 节点拦截装饰器、AutoGen 工具看门狗与离线 Thin Prompt 编译 |
| **混合触发检测** | YAML 正则 + TF-IDF/子串语义（paraphrase 可命中） |
| **智能角色推荐** | 59 内置角色 + 自定义角色，多维度评分 + `score_explanation` |
| **结局驱动路由闭环** | 独立验证 `verify_completion` 与突破回写实绩，废除静态先验终身制 |
| **碳基防御盾 (Shield)** | MCP `puax_audit_manipulation` + CLI `shield`：只识别，不施放。自然人外延暂缓 |
| **AMB 多模型基准** | 12 场景 × 5 主流模型 Profile 离线模拟矩阵（数值为硬编码演练值，非实测；真实战力以 `amb-live` 实测为准） |
| **宿主医生一键挂载** | `npx puax doctor --fix` 同步探测并覆盖 10 大主流宿主（Cursor, Claude Code, Windsurf, Trae 等）注入原生钩子 |
| **GHM 导引幻梦法** | 驭幻觉发散引擎：庄周八梦角色 + 入梦/醒梦/收敛审计三工具 |
| **Hook System** | 会话状态、L0–L4 阶梯升压、突破降压、Compaction 推理保护 |
| **自进化流水线** | `~/.puax/evolution.json` 跨会话基线、伤疤、段位与命名 Agent 档案 |
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
# 宿主健康与 Time-to-First-Pressure (TTF) 诊断
npx puax-mcp-server doctor

# 一键为当前项目/环境自动挂载原生 Hook (TTF ≤ 1 轮原生生效)
npx puax-mcp-server doctor --fix

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
3. **事件级检测** — SessionStart / UserPromptSubmit / PostToolUse 等热路径（与 YAML 会话扫描双引擎，Gate 32 守一致性）

### 评测与守门

```bash
node evals/run-all.js          # 协议守门（无 LLM，含 TTF / 剧场 / AMB / GHM）
node evals/test-ttf.js         # Time-to-First-Pressure 冷启动
cd puax-mcp-server && npm test # 900+ 单元/集成测试
node evals/benchmark.js        # 性能基准
```

详见 [evals/README.md](evals/README.md)。

### 碳基防御盾（只读识别层）

> **红线：硅基可 PUA，碳基只防御。只识别，不施放。自然人外延（插件/油猴/浮窗）暂缓。**

内核保留 MCP 工具 `puax_audit_manipulation` 与 CLI `shield`；不作为面向人类的独立产品。

### AMP 0.1 编排器原生中间件（v4.x+）

针对 LangChain、LangGraph、CrewAI、AutoGen 或自定义 Agent 循环，提供纯内存、免 MCP 服务器的中间件（`AmpMiddleware`）：
- **生命周期挂载**：在 `onPreToolUse`、`onPostToolUse`、`onModelOutput` 原生拦截作弊指令与敷衍收敛；
- **一行代码接入**：通过 `createLangChainAmpCallback` 直接作为模型回调注入；
- 详见 [docs/AMP-INTEGRATION.md](docs/AMP-INTEGRATION.md)。

### AMB 多模型矩阵（离线模拟脚手架）

跨三大任务类型（修复 Repair、审查 Review、创造 Create）与 5 大主流模型 Profile（DeepSeek V3, Claude 3.7 Sonnet, GPT-4o, Qwen 2.5 Coder, Llama 3.3 70B）的评测矩阵脚手架。
**诚实声明**：`evals/multi-model-amb.js` 当前为硬编码模拟演练，不发起真实模型调用，其数值不构成战力结论；真实评测请运行 `evals/amb-live.js --model=<id>`（真实 API 对照，含显著性判定与样本量警示）。
- 详见 [docs/AMB.md](docs/AMB.md) 与 `evals/multi-model-amb.js`。

---

## MCP 工具概览（50 个，对外主路径 13 个动词）

| 类别 | 代表工具 |
|------|----------|
| 角色/SKILL | `list_skills`, `get_skill`, `activate_skill`, `get_role_with_methodology` |
| 检测与推荐 | `puax_detect_trigger`, `puax_quick_detect`, `recommend_role`, `activate_with_context` |
| 行为协议 | `puax_switch_on_failure`, `puax_check_diagnosis`, `puax_confidence_check`, `puax_verify_completion`, `puax_define_contract` |
| 会话/压力 | `puax_start_session`, `puax_get_pressure_level`, `puax_handle_breakthrough` |
| 心跳 / 处境 / 进化（v4） | `puax_tick`, `puax_set_arena`, `puax_evolve` |
| GHM 导引幻梦法 | `puax_enter_dreamscape`, `puax_awaken`, `puax_convergence_audit` |
| 自进化 | `puax_get_evolution_baseline`, `puax_record_evolution`, `puax_evolve` |
| 自定义角色 | `puax_register_custom_role`, `puax_list_custom_roles`, `puax_remove_custom_role` |
| 碳基防御面（Carbon Shield） | `puax_audit_manipulation`（只识别，不施放） |
| 可观测性 | `puax_get_usage_stats`, `puax_flush_telemetry` |
| 编排 | `puax_orchestrate_team`, `puax_list_platforms` |

完整清单见 [puax-mcp-server/README.md#mcp-工具清单](puax-mcp-server/README.md)。

---

## 环境变量（可选）

| 变量 | 说明 | 默认 |
|------|------|------|
| `PUAX_USAGE_STATS` | `0` 关闭匿名使用统计 | 开启（本地 `~/.puax/usage-stats.json`） |
| `PUAX_OTEL_ENABLED` | `1` 写入 span 到 `telemetry.jsonl` | 关闭 |
| `PUAX_OTEL_ENDPOINT` | OTLP/JSON 导出地址（仅环回主机，SSRF 收口；远程经本机 agent 转发） | — |
| `PUAX_TELEMETRY_DIR` | 遥测文件目录 | `~/.puax` |
| `DEEPSEEK_API_KEY` | L4 对照实测（仅 evals） | — |

统计与遥测**不含对话内容**，仅存计数与 span 元数据。

---

## 项目结构

```
PUAX/
├── skills/                 # 59 个角色 SKILL.md（shaman- 全留）
├── puax-mcp-server/        # MCP 服务器（npm 包 puax-mcp-server）
├── evals/                  # 行为评测与 L4 对照
├── templates/              # 方法论指南（部分 AUTO-GENERATED）
├── distributions/          # Claude 插件 / Skills CLI 安装说明
├── TODO.md                 # 改进计划（v4 当前）
├── landing/ / web-admin/   # 落地页与本机台
├── docs/archive/            # 已冻结文档（3.x 对标账本）
└── 演进方案.md             # v4.3 → v5.0 演进总纲（现行路线图）
```

---

## 文档

| 文档 | 说明 |
|------|------|
| [GHM 导引幻梦法](docs/GHM.md) | 驭幻觉发散引擎：病机、八术映射、庄周八梦、安全铁律 |
| [GHM 学术论著与技术报告](docs/GHM-PAPER.md) | **论文级长文**：认知病机模型、八算子逆向工程、梦议会航线与无LLM量化评测 |
| [MCP Server README](puax-mcp-server/README.md) | 配置、工具清单、架构、环境变量 |
| [API 参考](docs/API.md) | **50 个 MCP 工具**（对外 13 黄金动词） |
| [MCP 协议契约参考](docs/MCP-CONTRACT.md) | 线级行为契约：双传输、initialize/sampling 监军协商、资源与 `/v4/*` 路由、降级铁律 |
| [Thin Prompt 与 Token 经济学](docs/THIN-PROMPT.md) | 三档压缩规格 + 可复现实测基线（minimal 固定地板 ~162 Token，重角色压降逾 95%） |
| [使用指南](docs/USER-GUIDE.md) | 心跳优先工作流 |
| [角色去留表](docs/ROLE-KERNEL.md) | 内核 / 皮肤 / 实验；萨满全留 |
| [AMB v0](docs/AMB.md) | 12 场景协议覆盖记分卡（无 LLM） |
| [AMP 0.1](docs/AMP.md) | 事件 / 块 / 闸门 / 状态；MCP 只是插头 |
| [AMP 编排器接入指南](docs/AMP-INTEGRATION.md) | LangChain、LangGraph、CrewAI、AutoGen 与 Python SDK 一行代码接入 |
| [Python 零依赖 SDK 指南](distributions/python/README.md) | 官方纯 Python 标准库中间件，零三方依赖 |
| [Web Admin 设计（已封存）](docs/archive/WEB-ADMIN-SPEC.md) | 已归档。图形界面不扩建 |
| [CHANGELOG](puax-mcp-server/CHANGELOG.md) | 版本变更记录 |
| [evals/README.md](evals/README.md) | 评测分层与 L4 实测 |
| [TODO.md](TODO.md) | 改进计划与里程碑 |
| [演进方案.md](演进方案.md) | **v4.3 → v5.0 演进总纲**（四期行军：固本 / 通脉 / 扩疆 / 立极） |
| [演进方案-3x-冻结.md](docs/archive/演进方案-3x-冻结.md) | 3.x 对标账本（已归档，不作路线图） |

---

## 开发与测试

```bash
cd puax-mcp-server
npm install && npm run build
npm test
npm run validate          # lint + typecheck + test
node ../evals/run-all.js  # 从仓库根目录执行 32 项协议铁律门禁

# 真实大模型 API 连通压测与双轨对比评测 (AMB Live)
node evals/amb-live.js --mock                 # 离线模拟压测（零成本、秒级闭环）
node evals/amb-live.js --model=deepseek       # 直连 DeepSeek 真实双轨评测
```

---

## 许可证

MIT License — 详见 [LICENSE](LICENSE)

---

<p align="center"><b>让 AI Agent 不再孤军奋战</b></p>
