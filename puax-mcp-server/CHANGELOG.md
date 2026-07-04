# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.10.0] - 2026-07-04

### Added
- 🔍 **TF-IDF 混合触发检测** — `core/text-similarity.ts`：正则优先 + 语义兜底（paraphrase 可命中）
- 📊 **匿名使用统计** — `core/usage-stats.ts` + `puax_get_usage_stats` / `puax_set_usage_stats_opt_out`
- 📡 **OpenTelemetry 集成** — `core/telemetry.ts`：`telemetry.jsonl` 本地 span + `PUAX_OTEL_ENDPOINT` OTLP/JSON 导出
- MCP 工具 `puax_flush_telemetry`

### Changed
- `TriggerDetector.checkTrigger`：正则未命中时走语义路径（阈值 0.62）；语料含 pattern + description + name
- `server/core.ts` 工具调用自动埋点（usage + trace span）
- `recommend_role` / `activate_with_context` 记录角色推荐/激活统计

### Environment
- `PUAX_USAGE_STATS=0` — 关闭匿名统计（默认开启，仅本地 `~/.puax/usage-stats.json`）
- `PUAX_OTEL_ENABLED=1` — 写入 `~/.puax/telemetry.jsonl`
- `PUAX_OTEL_ENDPOINT` — OTLP/JSON HTTP 导出
- `PUAX_TELEMETRY_DIR` — 遥测目录

测试环境（`JEST_WORKER_ID`）自动跳过统计写入。

## [3.9.1] - 2026-07-04

### Added
- 🌶️ **更多风味** — Amazon / Google / Xiaomi 完整行为约束 + 导出元数据
- `google-postmortem` 方法论（Blameless Postmortem + 10x 思维）
- `role-mappings.yaml` 新增 amazon / google / xiaomi `flavor_overlay`

### Changed
- `export-platform` 风味数据改从 `flavor-methodologies.yaml` 单一数据源加载（`getFlavorExportList`）
- 风味总数 8 → 11（含 tencent、baidu 导出元数据补全）

## [3.9.0] - 2026-07-04

### Added
- 🎭 **自定义角色** — `puax_register_custom_role` / `puax_list_custom_roles` / `puax_remove_custom_role`
- `core/custom-role-store.ts` — 持久化 `~/.puax/custom-roles.json`
- `prompts/skill-catalog.ts` — 内置 bundle + 自定义角色统一目录
- 自定义角色自动并入 `recommend_role` 推荐池（`recommended_for_triggers` + `task_types`）

## [3.8.5] - 2026-07-04

### Changed
- ⚡ **消除剩余假异步** — `trigger-loader`、`hooks/trigger-detector-enhanced`、`hook-manager`、平台 `export()`、`export-platform` 及 MCP hook/detect 工具 handler 改为同步路径
- `codebuddy-adapter` 移除动态 `import('fs')`，改用静态 fs 同步 IO

## [3.8.4] - 2026-07-03

### Added
- 🔌 **轻量 DI** — `core/service-registry.ts`：核心服务单例 + 测试注入
- 📈 **性能基准守门** — `evals/benchmark.js` → `results/benchmark.json`

### Changed
- MCP 工具层（`recommend_role` / `detect_trigger` / `activate_with_context`）复用单例，推荐缓存跨调用生效
- `hooks/service-container` 默认从 `getCoreServices()` 取核心依赖

## [3.8.3] - 2026-07-03

### Added
- 🛡️ **L4 治理评测** — `evals/test-governance.js`（Task Contract、防作弊、诊断/信心门控，无 LLM）
- 💓 **会话心跳评测** — `evals/test-heartbeat.js`（断点恢复、压力升级、过期清理）
- `evals/scenarios/governance/*.json` 治理场景夹具

### Changed
- 🔧 **trigger-detector 合并** — `EnhancedTriggerDetector` 并入 `core/trigger-detector.ts`，删除 `trigger-detector-enhanced.ts`

## [3.8.2] - 2026-07-03

### Added
- 📊 **L4 Scorecard** — `run-l4.js scorecard` 汇总通过率 + `results/scorecard.json`
- `run-all --skip-complete` 跳过已有完整对照的场景

### Changed
- `DEEPSEEK_MODEL` 必填，移除已下架 `deepseek-chat` 默认值

## [3.8.1] - 2026-07-03

### Added
- 🧪 **L4 DeepSeek 自动实测** — `evals/run-l4.js run` / `run-all`（密钥仅环境变量）
- `evals/lib/` — deepseek-client、response-analyzer、puax-prompt、l4-executor
- `evals/.env.example`、`evals/test-l4-offline.js`（CI 无密钥守门）

### Security
- API Key 禁止写入代码与文档；`DEEPSEEK_API_KEY` / `DEEPSEEK_MODEL` / `DEEPSEEK_BASE_URL` 运行时注入

## [3.8.0] - 2026-07-03

### Added
- 📜 **方法论指南自动生成** — `methodology-guide-generator.ts` + `npm run generate-guides`
- `methodologies.yaml` 新增 `category_guides`（军事/萨满话术库与隐喻）
- 8 个类别 `templates/{category}-methodology-guide.md` 由 YAML 单一数据源生成

### Changed
- `templates/military-methodology-guide.md`、`shaman-methodology-guide.md` 改为自动生成（勿手改）
- 新增 `templates/README.md` 说明维护流程

## [3.7.1] - 2026-07-03

### Changed
- 🔀 **handlers/ 并入 tools/** — 删除 `role/skill/trigger/hook-handlers` 及根目录 `hook-handlers.ts`
- 📋 **`tools/registry.ts`** — `buildToolHandlerMap` + `normalizeToolResponse` 统一分发
- ➕ **`puax_get_pressure_level`** 迁入 `hook-session.ts`（此前仅在废弃 handlers 中）
- `server/core.ts` 移除双路径 fallback，单一 `allTools` 分发

### Removed
- `handlers/hook-handlers.ts`、`role-handlers.ts`、`skill-handlers.ts`、`trigger-handlers.ts`
- `src/hook-handlers.ts`（重复实现）

## [3.7.0] - 2026-07-03

### Added
- 📦 **prompts-bundle 按类别拆分** — `bundles/bundle-*.ts`（8 类）+ `skill-manifest.ts` 元数据索引
- 🧪 **L4 对照评测** — `evals/run-l4.js`（scaffold / validate / compare / report）
- 📋 **测试文档归集** — `docs/TESTING.md` 统一入口

### Changed
- **懒加载** — `getBundledSkillById` 仅加载所属类别；`PromptManager` 启动只读 manifest
- **统一日志** — CLI 帮助/版本输出改用 `Logger.write`（stdio 安全）
- `evals/run-all.js` 增加 bundle 拆分与 L4 runner 守门

## [3.6.0] - 2026-07-03

### Added
- 📊 **推荐算法透明化** — `recommend_role` 返回 `score_explanation` 逐步加权说明
- 🛡️ **路径遍历防护** — `path-security.ts`；`export-platform` 输出路径校验
- 🧪 **行为评测守门** — `evals/run-all.js` + `test/evals/protocol-compliance.test.ts`
- 📋 **CI 增强** — workflow 增加 `node evals/run-all.js` 协议层守门

### Changed
- 消除 `base-adapter` / `vscode-adapter` 假异步 `Promise.resolve`
- `npm run validate:metadata` / `test:evals` 脚本

## [3.5.0] - 2026-07-03

### Added
- 🌐 **+6 平台适配器** — codex、opencode、openclaw、antigravity、trae、pi（SKILL.md 导出）
- 🇺🇸 **PIP Edition** — `i18n-en.ts` Amazon/Google/Meta/Netflix/Stripe 修辞层；`language=en` 激活/导出
- 📦 **分发渠道** — `distributions/claude-code/` 插件清单 + `distributions/INSTALL.md`
- 👥 **`puax_orchestrate_team`** — Agent Team 创建/上报/状态 + `[PUAX-REPORT]` 协议
- 🎭 **语气变体** — `tone_variant`: strict / yes / mama
- 📋 **`puax_list_platforms`** — 11 平台 + MCP + 安装路径一览

### Changed
- `export --export=all` 现导出全部已注册平台（11 个）
- `activate_with_context` / `get_role_with_methodology` 支持 `tone_variant` + `language`

## [3.4.0] - 2026-07-03

### Added
- 🎉 **`puax_handle_breakthrough`** — 连续失败≥3 后成功触发 `[PUAX 突破 ✨]` 降压 + 方法论沉淀
- 🧬 **自进化引擎** — `~/.puax/evolution.json` 基线/段位/内化模式；`puax_get_evolution_baseline` + `puax_record_evolution`
- 🛡️ **防作弊治理** — `puax_define_contract` + `puax_verify_completion`（权责分离）
- 🧠 **深层换框** — L2/L3/L4 注入认知换框提示（用户/攻击者/抽象层/约束反转）
- 📦 **`puax_quality_compass`** — Trust T1-T3 + 5 问自检 + Recovery Protocol + Calibration
- 💾 **Compaction 保护** — `puax_update_reasoning_state` + 会话 `<2h` 断点恢复
- 🎭 **味道行为约束** — `flavor-methodologies.yaml`（8 风味行为层，非仅语气）

### Changed
- `pressure-system.handleSuccess` 返回突破结果；`buildInjectionPrompt` 含换框段
- `state-manager` 扩展 `triedApproaches`/`peakPressureLevel` 等推理状态
- `puax_start_session` 启动时加载 evolution 基线 + compaction 恢复上下文

## [3.3.0] - 2026-07-03

### Added
- 🔄 **`puax_switch_on_failure`** — 失败后方法论/角色切换引擎，含切换前三问自检
- 🔍 **`puax_check_diagnosis`** — 诊断先行协议验证（`[PUAX-DIAGNOSIS]` + 证据来源）
- ✅ **`puax_confidence_check`** — 6 步信心门控（列声明→找漏洞→修或披露→跑证据→循环判定→事实100%）
- 📦 **`behavior-protocols.ts`** — 行为有效性核心逻辑，桥接 methodology-router 与 role-recommender
- 🧪 **`evals/`** — 6 个行为基准场景（对标 pua evals）+ 场景结构校验脚本

### Changed
- `activate_with_context` 激活时自动注入诊断先行协议
- 版本目标对齐演进方案 Phase 1（行为有效性闭环）

## [3.2.0] - 2026-04-15

### Changed
- 🛡️ **全面消除 TypeScript 严格模式 Lint 错误** - 从 279 个错误降至 0
  - 移除所有 `any` 类型，改用具体接口和类型断言
  - 修复所有 `@typescript-eslint/no-unsafe-*` 系列 warning
  - 修复所有 `@typescript-eslint/no-floating-promises` 错误
  - 修复所有 `@typescript-eslint/require-await` 错误
  - 移除不必要的 `async` 关键字（无 `await` 的函数）
  - 修复 `@typescript-eslint/no-var-requires`（改为静态 import）
  - 测试文件中 `@ts-ignore` 统一改为 `@ts-expect-error`

### Fixed
- 🔧 **hook-handlers.ts** - 为 14 个 handler 定义专用参数类型接口，替代 `args: any`
- 🔧 **client-sdk/index.ts** - 定义 `McpToolResult`、`TriggerResult` 等类型接口
- 🔧 **state-manager.ts** - `JSON.parse` 返回值添加 `as` 类型断言
- 🔧 **feedback-system.ts** (core) - 反序列化数据添加具体泛型类型
- 🔧 **methodology-router.ts** - YAML 解析结果添加类型断言
- 🔧 **hooks/** 目录 - `require()` 动态导入改为静态 `import` 解决 circular deps
- 🔧 **prompts/index.ts** - `any` 返回类型改为 `SkillSectionResult` 联合类型
- 🔧 **sampling-client.ts** - 移除未使用变量，返回类型具体化
- 🔧 **trigger-detector-enhanced.ts** - `metadata` 类型从 `any` 改为 `unknown` + 类型断言
- 🔧 **version.ts** - `JSON.parse` 结果添加 `PackageJson` 接口
- 🔧 **.eslintrc.json** - 添加 `test/` 到 ignorePatterns 避免 tsconfig 范围冲突
- 🧪 **测试文件** - 修复未使用导入、未使用变量、floating promises
- 🧪 506 个测试全部通过，零回归

## [3.1.1] - 2026-03-26

### Fixed
- 🐛 **修复 5 个角色验证失败问题** - 标准化五步法和检查清单格式
  - `military-commander` - 改用标准 Step 1-5 格式
  - `military-commissar` - 新增监军御史五步法（明察→定责→问责→整顿→归档）
  - `military-warrior` - 改用标准 Step 1-5 格式
  - `shaman-jobs` - 新增造化宗师五步法（审视→剖析→删减→打磨→验证）
  - `shaman-musk` - 新增通玄真人五步法（质疑→本质→重构→验证→实现）
- 📋 **统一七项检查清单格式** - 所有角色使用标准化检查清单

### Changed
- 📦 **清理 git 仓库** - 移除错误提交的 node_modules 和 coverage 文件
  - 删除 9,300 个错误提交的文件
  - 减少 repo 体积约 150MB+
  - 更新 .gitignore 使用全局忽略规则

## [3.1.0] - 2026-03-26

### Added
- ✨ **文言文风格角色** - 全面改用古典中文风格
  - 诏令体 System Prompt
  - 兵法/法家/道家经典引用
  - 古风话术库和唤醒语句

## [2.1.0] - 2026-03-25

### Added
- ✨ **平台导出工具** - 一键导出角色到各大编辑器
  - Cursor 适配器 (`.cursor/rules/*.mdc`)
  - VSCode Copilot 适配器 (`.github/copilot-instructions.md`)
  - Kiro 适配器 (`.kiro/steering/*.md`)
  - CodeBuddy 适配器 (`.codebuddy/skills/*/SKILL.md`)
  - Windsurf 适配器 (`.windsurf/rules/*.md`)
  - CLI 命令: `npx puax-mcp-server --export=<platform> --output=<path>`
- 🎯 **P7/P9/P10 分级角色体系**
  - P7 骨干工程师 - 执行 + 单点攻坚
  - P9 Tech Lead - 团队协调 + 任务分配
  - P10 首席架构师 - 战略规划 + 架构决策
  - 新增 `strategic-architect` (战略规划师) 角色
- 🤖 **Agent Team 协作模式**
  - 4种团队模板：冲刺团队、架构团队、创新团队、危机团队
  - 任务分配和进度跟踪
  - 协作剧本生成
- 🧭 **方法论智能路由**
  - 8种大厂方法论自动匹配
  - 任务类型 → 方法论映射
  - 失败模式 → 切换链
- 📊 **反馈收集系统**
  - 角色评分和统计
  - 触发器准确性分析
  - 本地数据存储 (`~/.puax/feedback/`)
- 🔍 **增强触发检测** - 新增5种触发条件
  - 工具使用不足
  - 低质量输出
  - 未验证断言
  - 忽略边界情况
  - 过度复杂化
- 🌐 **Landing Page** - 完整的项目展示网站
  - 首页、角色库、排行榜、导出工具、文档
- 🎛️ **Web 管理后台** - 可视化管理系统
  - 仪表盘、角色编辑器、统计视图

### Changed
- 🔧 重构项目结构，platform-adapters 移到 src 目录
- 📝 完善中文文档
- ✅ 新增 20+ 单元测试，总计 100+ 测试用例

## [2.0.0] - 2026-03-14

### Added
- ✨ **全新 2.0 版本发布** - 重大更新
- 🚀 优化 STDIO 传输模式，更稳定可靠
- 📝 完善文档和配置指南

## [1.6.0] - 2026-03-14

### Added
- ✨ **新增 STDIO 传输模式支持** - 现在支持 HTTP/SSE 和 STDIO 两种模式
  - 使用 `--stdio` 或 `--transport=stdio` 参数启动 STDIO 模式
  - STDIO 模式适用于 Claude Desktop 等本地 MCP 客户端
  - 环境变量 `TRANSPORT` 或 `PUAX_TRANSPORT` 也可设置传输模式
- 📝 更新 README.md 添加 STDIO 模式详细配置说明
- 🧪 新增 STDIO 模式测试用例
- 📦 添加 `test:stdio` 脚本到 package.json
- 🔧 添加 `publishConfig` 配置到 package.json

### Changed
- 🔀 重构 `server.ts` 支持多种传输模式
- 📝 更新帮助信息，包含 STDIO 相关选项
- 📦 更新 `files` 字段包含 CHANGELOG.md

## [1.5.0] - 2026-03-13

### Added
- ✨ 新增自动触发工具集
  - `detect_trigger` - 检测对话中需要激励的触发条件
  - `recommend_role` - 根据上下文推荐合适的角色
  - `get_role_with_methodology` - 获取带方法论的角色
  - `activate_with_context` - 根据上下文自动激活角色
- 🎯 新增 42 个 SKILL（角色）内置支持
- 🏗️ 新增角色分类系统（萨满、军事化、主题场景等 6 大系列）
- 📚 新增 prompts 资源支持

### Changed
- 🔧 迁移到 HTTP Streamable-HTTP 传输（SSE 兼容）
- 📦 升级 MCP SDK 到 v1.25.1+

## [1.0.0] - 2026-03-10

### Added
- 🎉 初始版本发布
- 🚀 基础 MCP 服务器功能
- 🛠️ 核心工具：list_roles, get_role, search_roles, activate_role
- 📡 HTTP 传输模式支持
