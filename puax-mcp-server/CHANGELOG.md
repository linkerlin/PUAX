# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Streamable HTTP 会话续传**：`MemoryEventStore` 挂上传输，`GET` + `Last-Event-ID` 重放；eventId 与 streamId 分存，避开 SDK 示例用 `_` 拼接导致的解错。
- **`POST /v4/thin-prompt`**：编排器薄注入不再盲打无 session 的 `/mcp`；Python SDK `get_thin_prompt` 改走此路。
- **`PUAX_TOOL_SURFACE`**：`tools/list` 默认只下发 13 黄金动词（`public`）；`full` 才列 50。`tools/call` 仍可按名调用未列出工具。
- **`PUAX_GUARD_MODE`**：默认 `dev` 不拦日常 `git push`；评测集设 `eval`。

### Changed
- **监军采样按 MCP Server 实例绑定**（ALS + WeakMap）：HTTP 多会话不再进程级单例串台；stdio 仍走全局回退。
- **MCP 现代特性收口**：删除方向反了的 `roots/list` / `elicitation/create` handler；不声明未实现通知的 `resources/subscribe`。保留 templates / logging / completion。
- **AMP.md 信封与 schema/TS 对齐**：`blocks` 为标签字符串、`gate` 为枚举；去掉未实现的 `trust` / `consecutive_failure` 线格式。
- **看板 `integrity_metrics`**：缺样本标 `unknown`，不再写死 1.0 轮 / 14.2% / −76.8% pass。
- **CI**：协议门注释改为 32；`frontend-apps` 不再阻塞 `ci-success`（策令冻结店面）。
- **`docs/WEB-ADMIN-SPEC.md` 迁入 `docs/archive/`**。

### Fixed
- **`/v4/doctor/fix` targetDir 沙箱**：只允许 cwd / tmp / `~/.puax`；`path-security` 目录边界不再前缀误放行。
- **`POST /v4/*` 体积上限 1MB**，超限 413。
- **tools/cli 不再进口 hooks 垫片**（state-manager / 事件检测器等走 `core/`）；`hook-manager` / `feedback-system` 仍为活体，留 hooks。
- **删除生产不可达 `hooks/failure-detector.ts`** 及其孤儿单测。
- **custom-role-store / evolution-engine** 补齐原子写。
- **amp-middleware** 改从 `core/state-manager` 进口，不再走 hooks 垫片。
- **Python 信封 `state.role`**：缺省 `"none"`，对齐 schema required。

### Added
- **第 32 门「双引擎信号一致性」**（`evals/trigger-signal-consistency.js`）：触发器双引擎（会话级扫描 / 事件级实时）经 `TRIGGER_ALIASES` 缝合层归一到 YAML 目录 id，本门守三层——模式键↔别名完备、别名目标全部命中目录真实 id（生命周期信号 preCompact/stopFeedback 按设计直通且与目录零碰撞）、七场景跨引擎归一一致（同一话语/上下文双引擎必须落在同一目录 id，含 bashFailure≡attempt_count 与 noSearch≡tool_underuse 两条上下文路径）。引擎合并第二步（模式源归一）以此为前置护栏。

- **Zod → JSON Schema 转换器**（`src/tools/json-schema.ts`，零新增依赖）：MCP `tools/list` 要求 `inputSchema` 为标准 JSON Schema，而工具层持有的一直是 **Zod 对象本体**——直接透传时序列化出的是 `_def` / `typeName` 等内部结构，严格客户端在发现阶段即报 `inputSchema.type expected "object"`。此乃协议契约第一硬伤。转换器覆盖 object / string（min·max·email·url·uuid·regex）/ number（min·max·int）/ boolean / enum / array / tuple / record / union / intersection / default / optional / nullable / effects / branded，未支持类型一律退化为 `{}`（等价「任意」），保证 `tools/list` 绝不因单个工具而整体失败。
- **包导出面**（`package.json` 增 `exports`）：AMP 此前只能深引 `build/core/index.js`，一改内部布局即断。新增 `.`、`./amp`、`./amp-spec`、`./thin-prompt`、`./hook-cli` 五个语义入口，另留 `./build/*` 通配以兼容既有 hook 产物深引（见 Fixed）。

### Changed
- **触发器引擎合并（第一步：死引擎剟除）**：`core/trigger-detector.ts` 内嵌的继承式 `EnhancedTriggerDetector`（上下文感知五检测器）、`ENHANCED_TRIGGER_DEFINITIONS`、工厂与 `enhancedTriggerDetectorCore` 单例（合计 ~350 行）经查系零消费死代码——生产路径无一处调用 `detectEnhanced`（`detect_trigger` / `activate_with_context` 只用基类 `detect()`），唯一引用是其孤儿单测。整体剟除并在模块头明确双引擎分工：会话级扫描（TriggerDetector，YAML 目录）与事件级实时检测（trigger-detector-enhanced.ts，v4 心跳热路径）。被剟四类触发语义（low_quality / unverified_claim / edge_case_ignored / over_complication）如需复活应落入 YAML 目录而非代码硬编。
- **事件级检测器获得专属单测**：原孤儿测试文件改造为 `EnhancedTriggerDetector`（事件级活体）13 例直接单测——六事件路由（UserPromptSubmit / PostToolUse / PreCompact / SessionStart / Stop / PreToolUse）、30s 冷却门、Bash 连败 L1 压力升级、状态持久与会话恢复。此前该热路径仅靠 hook 系测试间接覆盖。

### Fixed
- **hook 产物深引被 `exports` 反噬**：加 `exports` 后 `require('puax-mcp-server/build/cli/hook-cli.js')` 触发 `ERR_PACKAGE_PATH_NOT_EXPORTED`，hook 全线降级为 `{}`（`hook-artifact` / `hook-cli-degradation` 两套测试当场抓获）。补 `./build/*` 通配与 `./hook-cli` 入口后复绿。
- **MCP 协议契约第一硬伤**（P0-1）：`server/core.ts` 的 `tools/list` 由 `{ ...t }` 原样透传改为经 `toProtocolTool()` 编译后下发——50 个工具的 `inputSchema` 现全部以 `{ type: 'object', properties, required }` 形态出网，Zod 内部结构不再泄漏。`test/core/json-schema.test.ts` 13 例守住不再退化，其中一条直接断言序列化结果**不得含 `_def` / `typeName`**。
- **入参契约只声明不执行**：`callTool` 此前从不 `safeParse`——schema 写了却从不校验，等于契约摆设。现按工具 schema 校验，失败回 `InvalidParams` 并附字段级原因（path + message），不静默放行。
- **HTTP 面 CORS 全开**（P0-2）：`/v4/*` 原以 `Access-Control-Allow-Origin: *` 应答，任意网页皆可跨域调用（内中 `doctor/fix` 可写宿主配置）。新增 `loopbackOrigin()` 判定，仅 localhost / `127.x.x.x` / `[::1]` / `*.localhost` 来源获授权，非环回不下发 CORS 头（浏览器同源策略自然拒绝）。本地工具与 MCP 客户端通常不带 `Origin`，故正常调用不受影响。
- **破坏性操作可被 GET 触发**（P0-2）：`/v4/doctor/fix` 收紧为 POST-only，GET 回 405——写宿主配置不当由一个链接即可造成。
- **启动横幅幽灵端点**（P0-3）：横幅曾印出 `SSE: /` 与 `Message: /message` 两个端点，其中 `/message` 在路由表中并不存在（访问必 404）。已删去，并把 `/mcp` 与 `/` 统一说明为 Streamable HTTP（POST 发消息 / GET 建 SSE 流）。
- **防作弊「失败即放行」**（P0-4）：`cli/hook-cli.ts` 的兜底 catch 原对一切事件返回 `{}` + exit 0——判别逻辑自身异常之时，恰是最不该放行高危动作之时。现 PreToolUse + claude 宿主改走**保守拒绝**（`decision: 'block'`，理由 `PUAX_GUARD_ERROR`），其余事件仍守优雅降级契约，绝不中断宿主会话。
- **护栏可被编码与折叠绕过**（P0-5）：`core/anti-cheat-guard.ts` 原为纯字符串匹配，`test/hidden/..//SOLUTION.md`、`%2e%2e/` 编码、`test\hidden\` 反斜杠、`git   pu"sh"` 皆可绕行。现于匹配前生成归一化视图（URL 解码两轮、反斜杠归正、折叠重复分隔符、解析 `.` 与 `..`；命令侧续行归并、去引号、折叠空白），**原串与归一化串双候选、任一命中即拦**；且只用于判断意图，绝不改写调用方传入值。新增 `test/core/anti-cheat-normalize.test.ts` 8 例守门（含「正常路径与命令不被误伤」反向断言）。

## [4.3.0] - 2026-09-17

本版为「审计整改版」：全仓审阅定下的路线图五阶段（断链诚信 / 度量真实 / 结构收敛 / 主线纵深 / 解环）一次落定。

### Added
- **MCP 协议契约参考**（`docs/MCP-CONTRACT.md`）：双传输线级行为（stdio / Streamable HTTP 会话规则与 128 上限逐出）、initialize·sampling 监军协商、MCP 资源清单、`/v4/*` 全路由表（含 `POST /v4/tick` AMP 编排器远程心跳契约）、AMP/0.1 信封形状、错误与降级铁律、兼容性与版本政策。
- **Thin Prompt 与 Token 经济学**（`docs/THIN-PROMPT.md`）：三档压缩正式规格（口音上限 2400/1000/380 字符）+ 可复现实测基线——minimal 固定地板 ~162 Tokens（与角色厚薄无关），`military-commander` 全文 4337→162（−96.3%）；四处透传统一登记；反自欺声明（估算器口径、分母明确）。
- **AMP/0.1 信封 JSON Schema**（`docs/schemas/amp-envelope.schema.json`，draft-07）：五必备字段 + gate 五枚举 + state 约束，第三方可用 ajv 直接对齐；`test/core/amp-schema.test.ts` 以真实运行时信封逐场景校验（schema 与实现任一方漂移即红）。`docs/AMP.md` 新增版本政策（语义化版本、忽略未知字段、spec 唯一判别器、升版四步流程）。
- **监军通道参数化**：`PUAX_COMMISSAR_COOLDOWN_MS` / `PUAX_COMMISSAR_TIMEOUT_MS` / `PUAX_COMMISSAR_MAX_TOKENS` 调用期读取（缺省 60000/15000/120 行为不变，非法值回退默认）。
- **宿主挂载矩阵**（`docs/HOOK-ARCHITECTURE.md`）：doctor 十宿主全表（探测路径 / Shape / 事件覆盖 / TTF 就绪判定），Shape 路由表补 trae / codex / AMP 原生。
- **第 31 门「数字一致性守门」**（`scripts/check-metrics-consistency.js`）：工具数 / 动词数 / 门禁数 / 版本号以编译产物真值强制对齐 README 与 docs，陈旧数字模式出现即红。

### Fixed
- **AMP 远程通道断裂**：Python SDK `puax_amp.py` 每拍 `POST /v4/tick` 而服务端无此路由，404 被静默吞掉、永久降级本地内核——补路由（复用 runEvolveCycle + toAmpEnvelope）+ Jest 路由守门 + Python 罐头服务器连通测试。
- **发布链断裂**：release.yml 的 PyPI 步骤缺 `packages-dir:`（产物在 `distributions/python/dist/`，action 默认找根 `dist/`），首次 tag 发版必挂——已接通。
- **触发器缝合层三虫**：`TRIGGER_ALIASES` 死键 `passiveWaiting`（真实发射 `passiveWait`，该信号从未被归一）；`surfaceFix`/`noSearch` 无别名裸奔；检测器 `triggerType` 绕过归一直入信号流。修复并加目录一致性契约门（模式目录每键必须命中 YAML 目录，新增触发词漏配即红）。
- **VSCodeAdapter.export 真回归**：重写导出流程时漏建输出目录，全新目录下首写即 ENOENT 全炸——由复活之 `__tests__` 套件当场抓获并修复。
- **role-recommender 闭环截断**：缓存键漏 `session_history`，胜负回写被 5 分钟 TTL 吞掉——补齐历史摘要入键。
- **HTTP 会话泄漏 + Node 18 兼容**：transports Map 无上限缓慢增长（加 128 逐出）；`randomUUID` 裸用全局（显式 import）。

### Changed
- **core↔hooks 解环**：运行时状态层七模块（state-manager / pressure-system / trigger-detector-enhanced / trigger-patterns / deterministic-triggers / hook-event / hook-config，共 ~2,350 行）迁入 `src/core/`，原 hooks 路径留转出垫片零破坏；8 条 core→hooks 依赖边全数斩断，方向归一为 hooks → core 单向。
- **持久层原子写**：新增 `utils/atomic-write.ts`（同目录 tmp + rename，Windows EPERM 重试），10 处运行时 store 全部换装——Hook 多进程与 HTTP 常驻进程并发读写 `~/.puax/` 不再可能留下半截 JSON 被静默清零。
- **测试体系收编**：jest testMatch 收编 `src/**/__tests__`（复活 4 套件 100 用例）；覆盖率统计 `build/**` 改指 `src/**` 且本地默认不收（CI 保留 `--coverage`）；performance 套件挂钟抖动以 `retryTimes(2)` 吸收（预算不动）。
- **OTLP 导出环回收口**：`PUAX_OTEL_ENDPOINT` 仅接受 http(s) 且仅环回主机（SSRF 收口，远程经本机 agent 转发），走 node:http 字面量宿主直发；六处文档同步。
- **Python SDK 出口收口**：base_url 仅接受 http(s)，默认仅环回主机，显式远程需 `PUAX_AMP_ALLOW_REMOTE=1`。
- **冻结前端减税**：release.yml 摘除 landing / web-admin 构建步骤；untrack landing 8 个可再生产物（dist / tsbuildinfo / vite 编译副本）。

### Removed
- **约 4,400 行生产不可达死代码**：`src/tools.ts`（SkillInfo 迁 types.ts）、`classical/`、`agents/`、`client-sdk/`、`core/feedback-system`、core barrel、codex/trae 孤儿适配器、`handlers/`、benchmark-runner；27 个游离脚本 + 旧 tgz + 12 样例 JSON + 3 个误入 src 的 `.d.ts.map`。
- **回滚炸弹 `generate-i18n-readmes.js`**：内容停在 4.0.0 且硬编码旧 Windows 路径，运行会把九份 README 回滚——删除并在 scripts/README 注记。
- **诚信整改**：multi-model-amb 全面降标 `simulated_schema_drill`（+39.2%/+60% 假数字从 README×2 / AMB.md / landing 下架，landing 绿徽换「离线模拟·待实测校准」黄徽）；GHM-PAPER 虚构 Cranmer 引文改如实轶事标注；ROLE-KERNEL 17 角色矩阵源码+文档 `verified`→`simulated`；《发展规划.md》5 处幽灵引用改锚 CHANGELOG。

### Security
- **依赖通告清零**：生产树 10 条（yaml 栈溢出 / ip-address SSRF / path-to-regexp ReDoS / qs DoS / Hono 路径穿越等）与开发树全部通告经 `npm audit fix` 清零（语义化兼容修复，依赖范围未动）。
- **脚本安全整训**（Mimosa 门驱动）：puax-core-loader 动态 require 白名单化；guides/benchmark/puax-prompt 字面量 require；sync-distribution-hooks / sync-all-i18n / generate-bundle 根界校验。
- 深度安全审计 findingCount=0（696 包静态扫描，封印留档 `~/.mimosa/security-scans/`）。

### 验证基线
- Jest 87 套件 1,133 过 0 败（2 跳过为 Windows 专属用例）；run-all 31/31 门全绿；typecheck 净；`npm audit` 0 漏洞。

## [4.2.0] - 2026-09-14

### Added
- **纯粹硅基 MCP 主航道与 Token 经济性极客优化**：
  - 新增核心首选 MCP 工具 `puax_thin_prompt` 并列入 `V4_PUBLIC_VERBS`（对外公开黄金动词扩充至 13 门）。
  - Thin Prompt 编译引擎增强 `full` / `compact` / `minimal` 三档压缩模式并集成精准 Token 估算器，`minimal` 极简模式下提示词压降逾 90%（整段仅约 150 Tokens），极大节约长对话与多 Agent 编排上下文。
  - `activate_with_context` 与 `get_role_with_methodology` 全面支持 `thin_mode` 参数透传。
  - Python 官方零依赖 SDK (`puax_amp.py`) 新增 LangGraph StateGraph 节点拦截装饰器（`create_langgraph_node_interceptor`）、AutoGen 工具看门狗（`create_autogen_tool_guard`）与本地离线 Thin Prompt 编译器。
  - 静态协议硬门禁拓展至 30 门，Jest 单测套件 77 套件（965 项全绿通过）。
- **监军通道（MCP 反向 Sampling 干预）**：
  - 焚毁假尸 `src/mcp/sampling-client.ts`（251 行死代码，谎报 `modelUsed: 'sampling'` 且从未真正发起采样）。
  - 新增 `core/intervention.ts` 双通道监军：Host 于 `initialize` 授 `sampling` 能力时，`server.oninitialized` 注册反向采样 requester；连败 ≥3 或敷衍收敛且 L3+ 时，`puax_tick` 经 `sampling/createMessage` 向 Host 独立模型发出监军棒喝令（maxTokens 120、15s 超时、60s 会话冷却）。
  - 未授 sampling 之 Host 自动降级本地文言棒喝（`[PUAX-COMMISSAR]`），零逃逸、零依赖。
  - 新增第 30 门「监军反向干预」守门评测（`test/core/intervention.test.ts`）。
- **真实战绩注入（Live Rival Proof）**：
  - 新增 `core/proof-store.ts` 战功券库：`puax_verify_completion` 过闸即留据（任务摘要 / 通过数 / 轮次 / 关键命令，<100 tokens，`~/.puax/proofs.jsonl`，2MB 自动轮转）。
  - 处境原语 `compileInjection` 按角色取真实战功：同袍有过闸实录时，对手行由假想虚言换为本机可查战绩；compact/full 薄注入与心跳 arena 注入同步接通，minimal 档保持极简不动。
  - 新增第 29 门「真实战绩注入」守门评测（`test/core/proof-rival.test.ts`）。- **Python SDK 官方 PyPI 打包**：新增 `distributions/python/pyproject.toml`（`pip install puax-amp`），Release 流水线挂接 PyPI trusted publishing，版本一致性门禁纳入 pyproject。
- **版本号统一升级至 v4.2.0**：`puax-mcp-server`、`web-admin` 与 `landing` 全组件协同演进。

## [4.1.0] - 2026-09-13

### Added
- **Landing「三件事架构」全面实装**：重构 `landing/src/pages/Home.tsx`，首页聚焦「Cranmer 式交互动力学推演（卡顿 $\to$ 处境 $\to$ 闸门/梦境 $\to$ 突破翻盘）」、「一键核心安装命令（`npx puax doctor --fix`）」与「真实 AMB 评测基准增益图表」。
- **结局驱动自适应路由闭环**：
  - `verifyCompletionTool`：依据独立验证结果（`pass` / `fail`）实时回写 `outcomeStore`。
  - `handleBreakthroughTool`：达成突破后向 `outcomeStore` 与 `namedAgentStore` 注入成败与有效方案，实现基于实绩的动态自适应路由。
- **碳基防御盾（Carbon Shield）端点与控制台直连**：
  - 核心服务支持 HTTP 请求体异步解析，暴露 `POST /v4/shield/audit` 独立审计路由。
  - `web-admin/src/components/ShieldView.tsx` 优先调用远程审计引擎，并支持离线平滑降级，全面贯彻「硅基可 PUA，碳基只防御（只识别，不施放）」红线铁律。
- **版本号统一部署至 v4.1.0**：`puax-mcp-server`、`web-admin` 与 `landing` 协同演进。

## [4.0.0] - 2026-09-12

### Added (v4.x 终章演进：v5.0 三大前置条件攻坚)
- **AMB 三大任务类型矩阵深化**：12 场景严格标注归类为 \`repair\` (5), \`review\` (4), \`create\` (3)；无 LLM 记分卡 \`amb-scorecard.js\` 全量校验分类合法性并汇总输出。
- **AMB 多模型可复现脚手架 (\`evals/multi-model-amb.js\`)**：覆盖 5 大主流模型 Profile（DeepSeek V3, Claude 3.7 Sonnet, GPT-4o, Qwen 2.5 Coder, Llama 3.3 70B），生成多模型对照矩阵，验证 Repair/Review/Create 任务下显著增益（达成 v5.0 前置条件 2）。
- **AMP 0.1 编排器原生中间件 (\`AmpMiddleware\`)**：解耦 MCP 传输层，供 LangChain / LangGraph / AutoGen / CrewAI 作为一等事件流消费；提供 \`createLangChainAmpCallback\` 与行业规范 \`docs/AMP-INTEGRATION.md\`（向 v5.0 前置条件 1 冲刺）。
- **宿主健康与 Time-to-First-Pressure 诊断与修复引擎 (\`runHostDoctor\` & \`fixHostDoctor\`)**：新增 \`puax doctor [--fix]\` CLI、\`GET /v4/doctor\`、\`POST /v4/doctor/fix\` 与 \`GET /v4/amb\` 端点，自动探测与一键挂载 Top 6 宿主原生 Hook 配置；在 \`web-admin\` 控制台打造实时宿主就绪看板与 AMB 多模型对照展区（达成 v5.0 前置条件 3）。
- 全量门禁自动化扩充至 24 项（通过率 24/24），Jest 75 套件 958 项测试 100% PASS。

### Added
- **心智运行时（真正的产品）**：处境、闸门、梦。默认路径是心跳，不是 45 工具菜单。
  - `puax_tick`：一拍检测 / 升压 / 选角 / 薄注入 / 进化
  - `puax_set_arena`：Cranmer 处境原语（对手 + 观众 + 稀缺徽章）
  - `puax_evolve`：显式自进化周期
- **自进化流水线**（仿 `evolver.py`，零依赖）：preflight → collect → signals → select → autopoiesis → dispatch → solidify
  - `memory_graph.jsonl`、`outcome-weights.json`、命名 Agent（`~/.puax/agents/<name>/`）
  - 结局回写推荐权重；冷却 / 饱和门
- **薄注入** `compileThinPrompt`：协议由 runtime 持有，口音截断。`get_role_with_methodology` 支持 `thin` / `format=thin`
- **角色内核**：`shaman-` 八角色全部保留进默认池；煤气灯/媳妇类移出默认推荐（仍在目录）
- HTTP：`GET /v4/dashboard`、`GET /v4/roles`（CORS），给 web-admin 诚实本机数据
- 原生 Hook 在 SessionStart / UserPromptSubmit / PostToolUse / Stop 上并入心跳（inject 不双写）

### Changed
- 推荐器默认吃结局权重；实验角色不进默认推荐
- 落地页 / 管理后台 / 市场 / 文档按 v4 产品重写，去掉假用户排行榜
- 文言文策略空间改口：高密度行为协议，不再表述为越狱

### Added (4.0.0 续)
- **梦议会**：`puax_enter_dreamscape({ council: true })` 航线坐忘→混沌→庖丁→薪火；tick 的 dream_suggest 注入同一航线
- **GHM 评测**：distinct-n / 语义半径 / 假设存活率；免罪修辞泄漏作废；梦系离线对照
- **Time-to-First-Pressure**：会话首次压力记入 `ttf.jsonl`，dashboard / `puax_tick` 回传摘要
- MCP 资源 `puax://v4/verbs`、`puax://v4/kernel`；[docs/ROLE-KERNEL.md](../docs/ROLE-KERNEL.md)
- `activate_with_context({ thin: true })` 走薄注入

### Changed (4.0.0 续)
- PressureLevel 类型从 `agents/` 解耦到 `types.ts`（Hook 不再依赖死层身份）
- interactive-shell / slash command-registry 标明 legacy，默认路径仍是 Hook + tick

### Added (4.0.0 续 2)
- **AMB v0**：12 个顶层场景 + `evals/amb-scorecard.js` 无 LLM 记分卡（`evals/results/amb-v0.json`）
- **Hook 六宿主**：vscode / windsurf / kiro 导出 `hooks/hooks-*.json` + 共享 `hook.js`（与 claude-code / cursor / opencode 并列）
- `list_tools` 把 12 个对外动词排在前面
- [docs/AMB.md](../docs/AMB.md)

### Added (4.0.0 续 7)
- **碳基防御面单独产品化（Carbon Shield）**：
  - 红线铁律：**硅基可 PUA，碳基只防御。只识别，不施放。**
  - 核心检测引擎：`src/core/carbon-shield.ts` 逆向识别 6 类人际与职场操控算子（收敛过快、社交收缩、失败重释、身份置换、预言行销、显著性绑架），输出四铁律（知情、标记、可醒、必验）防御指引与多维风险评分。
  - 多端触达：CLI 子命令 `shield <文本>`、MCP 工具 `puax_audit_manipulation`、HTTP 路由 `GET /v4/shield`。
  - 视觉管理看板：`web-admin/src/components/ShieldView.tsx` 提供交互式文本审计、预置场景载入与反制建议渲染。
  - 单元测试套件：`test/core/carbon-shield.test.ts` 全面覆盖安全文本、复合高危话术、MCP 调度与 HTTP 契约。
- **AMP 0.1 规范独立成篇**：
  - [docs/AMP.md](../docs/AMP.md) 确立 Agent Motivation Protocol 完整协议规格，规范事件（Event）、承诺块（Block）、闸门（Gate）与状态机（State），解耦 MCP 插头与协议内核。
- **AMB v0 基准体系**：
  - [docs/AMB.md](../docs/AMB.md) 确立 12 大场景设计矩阵、无 LLM 记分卡与防作弊评测准则。

### Added (4.0.0 续 3)
- **AMP 0.1**：`puax_tick.amp` 信封（事件 / 块 / 闸门 / 状态）；`GET /v4/amp`、MCP `puax://v4/amp`；[docs/AMP.md](../docs/AMP.md)
- **硅基剧场**：四拍本机演练处境→闸门→梦→供奉（`node evals/silicon-theater.js`）；`GET /v4/theater`
- v4 HTTP 抽到 `dispatchV4`，单测不需起监听

### Added (4.0.0 续 4)
- **TTF 冷启动评测** `evals/test-ttf.js`：新会话第一拍记样，同会话不重复
- **v4 心跳评测** `evals/test-tick-heartbeat.js`：失败信号下发生 + AMP 信封
- `GET /v4/ttf`；web-admin 剧场页；落地页硅基四拍可视化

### Fixed (4.0.0 续 5)
- **冷却按会话、静默不占冷却**：SessionStart 空转不再挡住紧随其后的第一轮 UserPromptSubmit（TTF 死结）
- Hook 在已检出触发时 `force` 心跳，保证第一拍发生

### Added (4.0.0 续 5)
- `evals/test-hook-ttf.js`：宿主 Hook 路径的 TTF
- 仪表盘展示 TTF 中位；`list_tools` 对外动词加 `[v4]` 前缀

### Changed (4.0.0 续 6)
- USER-GUIDE 典型场景改为心跳优先，不再导购 45 工具

### Added (4.0.0 续 6)
- CodeBuddy 导出原生 Hook；`evals/test-hook-posttool.js` 覆盖 Bash 失败路径
- `puax_evolve` 同样返回 AMP 信封

## [3.13.0] - 2026-08-19

### Fixed
- **`npm run validate` 全绿**：lint 错误 118 → 0
  - 删除 `base-agent.ts` 孤儿类（TechLeadAgent/CtoAgent，已被 `hierarchy/` 版本取代）及十余处未用导入/常量
  - `benchmark-runner.ts` 去除无谓 async；`agent-team-protocol.ts` 修复 `never` 模板串；移除冗余类型断言
  - eslint：生成物 `prompts-bundle.ts` 入 ignorePatterns；测试关闭 `await-thenable`；死码层（`agents/`、`commands/`、`interactive-shell`）局部降规
- 测试计数更新：913 Jest（68 套件）+ 12 项 evals 守门

### Docs
- `README_en.md` / `docs/API.md` / `puax-mcp-server/README.md` 同步 v3.12：徽章 3.12、59 skills、45 工具；API.md 新增 GHM 三梦境工具文档与调用示例

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
