# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.12.0] - 2026-08-19

### Added
- 🦋 **GHM 导引幻梦法（Guided Hallucination Methodology）** — 详见 [docs/GHM.md](../docs/GHM.md)
  - 核心命题：「被动幻觉是错误，主动幻觉是创造」。在既有"防幻觉"收敛纪律之上，补一层"驭幻觉"发散引擎
  - 病机模型：收敛先验→强行收束→互证互强→双向幻觉（人机互激的过早收敛）
- ✨ **庄周八梦角色套系（dream 类，8 角色）** — `skills/dream-*/SKILL.md`，文言正文，取《庄子》典故
  - 坐忘(空杯破先入) / 梦蝶(可能性轰炸) / 混沌(自洽宇宙) / 鲲鹏(谶语回溯) / 秋水(渐进升维) / 庖丁(错误重释) / 齐物(假设平权) / 薪火(醒梦验真)
  - 每角色含五步法（庄子原典词汇）+ 梦境安全协议（四铁律）+ 检查清单；发散七式 `recommended_temperature` 0.8–0.9
  - 角色总数 51 → 59；`strategy-space.ts` RoleIdentity 与 domain 类型同步扩展
- 🔧 **3 个梦境 MCP 工具** — `tools/dreamscape.ts`
  - `puax_enter_dreamscape`：知情入梦 + boundary 预算硬顶（objective/max_turns/max_hypotheses/min_hypotheses/kill_criteria）+ `[DREAM]` 协议注入（标记权在工具层）
  - `puax_awaken`：醒梦强制三分类（HYPOTHESIS/INSIGHT/DISCARDED）；缺引用拒收、缺印作废、超限全废、HYPOTHESIS 永不自动升格为结论
  - `puax_convergence_audit`：虚假收敛审计（检测人机互激的过早收敛）；高精度低召回，疑似时仅注入 L1 提醒级信号，不打断工作流
- 🎯 **4 个新触发条件** — `triggers.yaml`：`premature_convergence`（过早收敛）/ `creative_block`（创作卡壳）/ `assumption_lock`（假设锁定）/ `low_novelty`（产物同质），含 zh/en 正则与新 `divergence` 触发类别
- 🗺️ **role-mappings 扩展**：4 触发→八梦映射、creative/analysis 任务类型入池、8 角色 role_metadata、2 个角色组合（庄周全梦组合/庖丁解牛组合）
- 📄 **docs/GHM.md 方法论白皮书**：病机→八术映射→八梦→安全铁律机制化→工具用法→操控识别防御篇（八术仅限 Agent 内部认知操作，人际应用版本不发布）

### Design
- 本版本经「创造派 vs 验证派」双 Agent 设计评审 PK 定稿：标记权归工具层（防自评权复辟）、预算硬顶与配额并行、审计挂接 L1 压力级、审计只杀重复空洞不杀离奇、INSIGHT 禁入事实层、验证分层（序薪按成本×价值排序）

### Fixed
- **polyglot `run-hook.cmd` bash 分支在 Git Bash 下 exit 1**：`pwd` 输出 MSYS 路径（`/c/...`），Windows 原生 node 将其解析为盘符根路径导致 `MODULE_NOT_FOUND`。bash 分支现经 `cygpath -m` 转换为 mixed 路径（`C:/...`）后再 exec node；无 cygpath 环境（Linux/macOS）保持原逻辑。`distributions/claude-code/hooks/run-hook.cmd` 单一数据源副本同步更新

### Tests
- 新增 `test/tools/dreamscape.test.ts`（13 项）：三工具全链路 + 验证派四红线（无印拒收不可补票 / 永不自动升格 / 超预算全部作废 / 宁漏报勿误伤）
- 新增 `test/tools/dream-registration.test.ts`（21 项）：四触发 zh/en 检测 + 目录定义 + 推荐链路 + bundle 注册 + manifest 一致性 + 策略空间 + category 枚举

## [3.11.0] - 2026-08-08

### Added
- 🪝 **原生 Hook 层（运行时强制接入）** — 详见 [docs/HOOK-ARCHITECTURE.md](../docs/HOOK-ARCHITECTURE.md) 与 [Hook机制演进方案.md](../Hook机制演进方案.md)
  - `puax hook <事件>` 子命令（引擎共享层）：SessionStart / UserPromptSubmit / PostToolUse / PreToolUse / PreCompact / Stop，支持 stdin 宿主载荷合并
  - per-harness 输出形状严格互斥（claude=`hookSpecificOutput` / cursor=`additional_context` / sdk=`additionalContext`），防双重注入
  - PreToolUse 强制决策回路：DeterministicTriggersEngine + AntiCheatGuard 在工具执行前 `block`/`approve`
  - `--export=claude-code`：生成 `hooks/hooks.json`（SessionStart 注入 + PreToolUse/PostToolUse 拦截）+ hook 脚本产物
  - `--export=opencode`：生成 `.opencode/plugins/puax.js`（Shape B 进程内插件，每 step 自动触发）
  - `--export=cursor`：生成 `hooks/hooks-cursor.json`
- 🛡️ **MCP 工具守卫** — `core/tool-guard.ts`：工具分发前调用确定性引擎，防作弊从"建议"变"拦截"
- 🔒 AntiCheatGuard 新增 `git push` 拦截（对齐 git-guardrails 业界实践）
- 统一事件枚举 `PuaxHookEvent`（`hooks/hook-event.ts`），补齐 `PreToolUse` 一等公民

### Changed
- `HookEventType` / `TriggerType` 降级为兼容别名（值对齐统一枚举），新增代码一律用 `PuaxHookEvent`
- `HookManager` 移除死代码 pub/sub（subscribe/unsubscribe），保留会话生命周期与检测路由
- `DeterministicTriggersEngine.evaluate` 同步化（去除假异步）
- 平台导出不再只发 skill 文件，同时发宿主 hook 配置（`PlatformAdapter.generateHooks()`）
- **触发模式配置外置** — `TRIGGER_PATTERNS` 抽至 `hooks/trigger-patterns.ts`，新增 `hooks/hook-config.ts` 支持 `~/.puax/hooks.json`（或 `PUAX_HOOKS_CONFIG`）组级覆盖，文件缺失/非法一律回退内置

### Tests
- 新增 `test/unit/hooks/hook-config.test.ts`（配置外置合并/降级语义）
- 新增 `test/unit/hooks/hook-cli-degradation.test.ts`（spawn 真实进程验证降级契约）
- 新增 `test/unit/hooks/hook-artifact.test.ts`（junction 模拟已安装环境，验证生成 hook.js 的 stdin 全链路：PreToolUse 拦截/放行、SessionStart、PostToolUse 连续失败升级；polyglot run-hook.cmd 双分支；opencode 插件语法 node --check）
- 新增 `test/unit/hooks/hook-events.test.ts`（SessionStart 断点恢复注入、Stop 反馈、PreCompact 静默持久化、PreToolUse 路由、evaluate 同步性回归）
- `hook-export.test.ts` 增加生成产物快照（hooks.json / hooks-cursor.json / puax.js 防漂移）

### Fixed
- 生成产物 `hooks/hook.js` 误用 `mainHookCli`（不读 stdin）→ 改用 `mainHookCliWithStdin`，修复经生成产物走 PreToolUse 时 stdin 载荷（tool_name/tool_input）被忽略、拦截永远放行的问题
- `run-hook.cmd` 模板 REM 注释含中文 → cmd.exe 按系统代码页解析 UTF-8 字节导致批处理解析损坏；全部改为 ASCII 注释（对齐 superpowers 原版约定，LF 行尾保持）
- **`parseHookArgs` 吞值 bug**：未知 flag 会消耗相邻 token（`--foo --message X` 导致 message 丢失）；改为只对已知带值 flag 消耗下一个 token
- **配置覆盖无校验**：`patterns: "xy"`（字符串）会被 `for...of` 迭代成单字符正则导致灾难性假触发；`hook-config` 现校验子表结构（patterns 必须 string[]、weight 必须有限数字），非法子表整表跳过并告警
- **opencode 平台双重注册**：`skill-md-platform-adapter` 与专属 `opencode-adapter` 同名注册（行为依赖 import 顺序）；从 skill-md EXTENDED_PLATFORMS 移除 opencode，注册唯一化
- **opencode 插件 Windows 兼容**：模板 `execFileSync('npx')` 在 Windows 上因 npx 是 npx.cmd 而 ENOENT（插件静默失效）；改为按平台选 `npx.cmd`/`npx`
- 顺带清理 skill-md 的 `exportFlavor` 未用变量（lint）

### Removed
- `src/platform-adapters/` 下过期编译产物（base-adapter/cursor-adapter/vscode-adapter 的 .js/.d.ts/.js.map，遮蔽 TS 源码导致 jest 加载旧代码）

### Docs
- 新增 `docs/HOOK-ARCHITECTURE.md`（Shape A/B/C 路由表 + per-harness JSON 契约 + gotcha 附录）
- 新增 `docs/polyglot-hooks.md`（跨平台分发方案）
- `docs/API.md` 补充 Hook CLI 章节与 `PUAX_HOOKS_CONFIG` 环境变量；`distributions/INSTALL.md` 补充原生 Hook 接入指南

### Distribution
- `distributions/claude-code/` 插件集成原生 hooks（hooks.json + hook.js + run-hook.cmd + 事件脚本），插件安装即得 SessionStart 注入 / PreToolUse 拦截 / PostToolUse 失败升级
- 新增 `scripts/sync-distribution-hooks.js`（`npm run sync:hooks`）——distribution 与 `--export=claude-code` 单一数据源，防两处漂移（由 `test/unit/platform-adapters/distribution-hooks.test.ts` 断言）
- 新增 `config/hooks.example.json`（触发模式覆盖格式示例）

### Fixed (review round 2)
- **TriggerCache 永不命中 + 内存泄漏**：key 含毫秒 `ctx.timestamp` 导致永不重复 → 缓存永不命中且 Map 无限膨胀；key 去掉 timestamp（同会话/触发器/事件/工具 TTL 内只触发一次）+ 惰性清理过期条目 + 上限 1000 保护。同时修复缓存命中跳过 `blocked` 结果导致的"TTL 内二次触达放行"漏洞（block 硬守卫幂等返回）
- **测试污染真实 `~/.puax/`**：新增 `utils/storage-paths.ts`（`getPuaxHome()`，支持 `PUAX_HOME` 环境变量），state-manager / usage-stats / evolution-engine / custom-role-store / telemetry / hook-config / core-feedback-system 全部改用；jest setup 设置 `PUAX_HOME` 到按 pid 唯一的临时目录，测试不再读写真实用户状态
- **`readStdinPayload` 200ms 竞态**：收到数据后仍可能被 200ms 兜底超时丢载荷；改为"无数据才超时放行，收到数据等 end"

## [3.10.1] - 2026-07-04

### Fixed
- `--version` 不再因顶层 import 触发 PromptManager 初始化（无多余日志）
- `loadVersion()` 固定从包根 `package.json` 读取版本，移除易误导的 `3.2.0` fallback

### Note
- 若在本仓库目录内 `npx puax-mcp-server@x.y.z` 仍显示旧版，请检查 `~/.node_modules` 全局旧安装，或改用 `node build/index.js --version`

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
