# PUAX Hook 机制演进方案

> 审视日期: 2026-08-08
> 对标项目: `obra/superpowers`（多 harness skill 插件，以下简称 **superpowers**）
> **当前版本: PUAX 3.10.0** | 文档定位: 专攻 **Hook 机制** 这一垂直维度

> 与 [演进方案.md](演进方案.md) 的关系：那份对标 `tanweai/pua`，审视"行为有效性闭环"（方法论路由、防作弊、自进化等）；本份专审"Hook 如何真正接入运行时"，是前者未覆盖的**架构层**差距。两份互补。

---

## 审视方法论

以 superpowers 的 **Hook 接入机制**为基准，逐层对比 PUAX 的 Hook 子系统，找出 superpowers 在"Hook 怎么被运行时真正触发、怎么跨平台分发、怎么和宿主通信"上**相对 PUAX 领先**的能力，据此制定 PUAX 的 Hook 机制演进路线。

**审视原则**：superpowers 的 Hook 系统极简（仅一个 `SessionStart` 事件、纯注入、零拦截），但它把"运行时原生接入"这件事做到了极致；PUAX 的 Hook 引擎远比它丰富（5 事件 + 6 类型确定性引擎 + L0–L4 压力状态机 + 模式匹配表），但**全部是 MCP 工具内方法、靠 Agent 自愿调用**——这是架构层的根本差距。演进方向不是照搬 superpowers 的极简，而是把 PUAX 已有的丰富引擎**接到运行时原生 hook 管线上**，从"建议型"升级为"强制型"。

---

## 一、两项目 Hook 机制定位对比

| 维度 | superpowers | PUAX |
|------|-------------|------|
| **Hook 本质** | 运行时原生拦截器（runtime-enforced） | MCP 工具内方法（agent-invoked，advisory） |
| **谁来触发** | **宿主运行时**，在事件点强制调用 | **Agent 自愿**调用 `puax_detect_trigger` |
| **事件类型数** | 1 个（`SessionStart`） | 5（增强）+ 6（确定性引擎）= 双系统，语义重叠 |
| **配置形态** | 声明式 `hooks.json`（数据文件） | 无配置文件，全部硬编码在 TypeScript 源码 |
| **实现形态** | shell 脚本（polyglot 分发器 + bash 逻辑） | 单进程 TypeScript 方法 + `setInterval` 轮询 |
| **输出协议** | JSON stdout，宿主读取并执行注入/拦截 | MCP 工具返回对象，Agent 可忽略 |
| **决策协议** | 注入专用（无 allow/deny，因只做注入） | 有 `blocked` 字段，但**未接入任何真实工具调用路径** |
| **跨平台** | Windows(batch/bash) + Unix 一套 polyglot 脚本 | 仅 Node 进程，无 shell 层 |
| **优雅降级** | 无 bash → 静默 `exit 0`，不破坏会话 | 无（进程内，不存在降级场景） |
| **per-harness 配置** | 3 种 JSON 形状（Cursor / Claude Code / Copilot CLI） | 0 种（平台导出只发 skill 文件，不发 hook 配置） |
| **进程内插件 (Shape B)** | OpenCode `experimental.chat.messages.transform` + Pi 生命周期回调，自动触发 | opencode 导出**仅发 skill 文件**，无 hook |
| **文档** | `porting-to-a-new-harness.md`(827 行) + `polyglot-hooks.md`(158 行) | 无 Hook 专项文档，散落在 README / RELEASE / 演进方案 |
| **测试** | `test-session-start.sh` 作为可执行规范 | `__tests__/hook-system.test.ts`（pub/sub，但生产零订阅） |
| **Pub/Sub 订阅者** | N/A（注入型，不需要） | `hookManager.subscribe()` **生产代码零调用**（仅测试用） |

**一句话总结**：superpowers 的 Hook 是"**运行时替你跑**"，PUAX 的 Hook 是"**求 Agent 来跑**"。前者虽简，胜在"必然发生"；后者虽繁，输在"可能不发生"。

---

## 二、superpowers 相对 PUAX 领先的 9 个维度

> 按"架构杠杆大小"排序。前 3 项是根本性差距（决定 Hook 能否生效），后 6 项是工程化差距（决定 Hook 好不好维护、扩不扩得动）。

### 🔴 架构层（决定 Hook 是否真正生效）

#### 1. 运行时原生接入 vs Agent 自愿调用 【根本差距】
**superpowers**：Hook 配置写在 `hooks/hooks.json`，由 **Claude Code / Cursor 宿主**在事件点（会话启动）**强制**调用。Agent 无法绕过、无法忽略——只要装了插件，注入必然发生。
**PUAX**：Hook 全部是 MCP 工具（`puax_detect_trigger`、`puax_start_session`…），必须 **Agent 主动 `use_mcp_tool`** 才触发。Agent 不调用 = Hook 永不生效。这是 PUAX 整个 Hook 系统的"阿喀琉斯之踵"——引擎再强，没人按开关就是死的。

**证据**：`hook-manager.ts:99-114` 的 `subscribe()` 在全仓库仅 `__tests__/hook-system.test.ts` 调用，生产代码零订阅；真正的检测靠 `detect-trigger-enhanced.ts` 的 MCP 工具处理器，返回的 `injectionPrompt` 字段要 Agent 自己粘贴进上下文。

**影响**：PUAX 的防作弊（`AntiCheatGuard`）、压力升级（L0–L4）、Compaction 保护——**全部是建议性的**。一个"偷懒"或"忘调工具"的 Agent 可以完全绕过。superpowers 不存在此问题。

#### 2. 声明式配置文件 vs 代码内嵌
**superpowers**：Hook 定义是 `hooks.json` 纯数据，人/工具可读可改，无需重编译：
```json
{ "hooks": { "SessionStart": [{ "matcher": "startup|clear|compact",
  "hooks": [{ "type": "command", "command": "...run-hook.cmd session-start",
    "shell": "bash", "async": false }] }] } }
```
**PUAX**：Hook 定义散落在 `trigger-detector-enhanced.ts`（`TRIGGER_PATTERNS` 常量，68–209 行）、`deterministic-triggers.ts`（`TriggerType` 枚举）、`hook-manager.ts`。改一个触发模式 = 改源码 + 重 build。

**影响**：用户无法自定义 Hook 规则（除非改源码）；平台导出器无法生成 Hook 配置（因为没有可序列化的配置源）。superpowers 的配置本身就是"分发产物"。

#### 3. 真实输出协议 + 决策回路
**superpowers**：Hook 脚本往 **stdout 打 JSON**，宿主读取并执行。三种平台三套形状，但都是"宿主消费、必然生效"：
```json
// Claude Code
{ "hookSpecificOutput": { "hookEventName": "SessionStart",
  "additionalContext": "<EXTREMELY_IMPORTANT>…" } }
```
**PUAX**：输出是 MCP 工具返回的 `{ content:[{type:'text', text: JSON}] }`，落到 Agent 的工具结果里。Agent 读了不一定照做。唯一有 `blocked: true` 的 `deterministic-triggers.ts:156-183`（`HIDDEN_FILE_ACCESS_TRIGGER`）**从未被 `server/core.ts` 的工具分发路径调用**。

**影响**：superpowers 的注入是"宿主层落地"（系统消息/用户消息），PUAX 是"工具结果层落地"（Agent 上下文的一条消息，可被忽略、可被 compaction 丢失）。

### 🟡 工程层（决定 Hook 可维护、可移植、可扩展）

#### 4. 跨平台 shell 分发器（polyglot `run-hook.cmd`）
**superpowers**：单个 `run-hook.cmd` 文件**同时是 batch 和 bash**（`: << 'CMDBLOCK'` 把 batch 段对 bash 变 no-op heredoc）。Windows 上探测 3 个 bash 路径，找不到就 `exit /b 0` 静默降级。无扩展名脚本名（`session-start` 不是 `.sh`）规避 Claude Code 在 Windows 上对 `.sh` 命令自动前置 `bash` 的 bug。
**PUAX**：纯 Node 进程，没有 shell 层。无法生成"宿主能直接执行"的 Hook 脚本。

**影响**：PUAX 想做原生 Hook（如 Phase 1 的目标），必须有一套跨平台可执行的分发器，否则 Windows 用户装了 Hook 也跑不起来。superpowers 这套 polyglot 模式是现成的、经过验证的范本。

#### 5. per-harness 差异化配置生成
**superpowers**：同一份逻辑，针对不同宿主发**不同形状**的配置/输出：
- Claude Code → `hooks.json` + `hookSpecificOutput` 嵌套 JSON
- Cursor → `hooks-cursor.json`（小写 `sessionStart`、无 matcher）+ 顶层 `additional_context`
- Codex → `"hooks": {}`（显式空对象，**抑制**自动发现）
- Kimi → manifest 字段 `sessionStart.skill`（非 shell hook）
- OpenCode / Pi → 进程内插件（Shape B），不靠 shell

并且**严格发一种**（Claude Code 会无去重地同时读 `additional_context` 和 `hookSpecificOutput`，发了就双重注入）——这是被 `test-session-start.sh` 强制断言的。
**PUAX**：`platform-adapters/` 全部继承 `base-adapter.ts`，只实现 `exportRole`（生成 skill markdown）。**没有任何适配器生成 hook 配置**。`list-platforms.ts:22` 列了 opencode 但只导出 skill 文件到 `~/.config/opencode/skills/`。

**影响**：PUAX 的"11 平台适配"在 Hook 维度上是 **0 平台适配**。

#### 6. 进程内插件形态（Shape B）——以 opencode 为最关键缺口
**superpowers**：`.opencode/plugins/superpowers.js` 注册 `experimental.chat.messages.transform`（**每个 agent step 自动触发**）+ `config` hook（推 skill 目录进配置）。不依赖 Agent 自觉，运行时每步都跑。带去重守卫（已有 `EXTREMELY_IMPORTANT` 就跳过）和模块级缓存。
**PUAX**：对 opencode 只发 skill 文件，**没有任何 `.opencode` 插件**。PUAX 的压力注入、失败检测、Compaction 保护——在 opencode 里全靠 Agent 自觉读 skill。

**影响**：这是 PUAX 在 opencode（也是本工作环境的运行时）上的**最大落地缺口**。superpowers 证明了 Shape B 可行，PUAX 可直接复用其模式。

#### 7. 优雅降级与"永不破坏会话"契约
**superpowers**：找不到 bash → 静默 `exit 0`；读 skill 失败 → 注入一段错误提示而非崩溃。核心契约：**Hook 故障绝不能中断用户会话**。
**PUAX**：MCP 工具抛错会返回 error content，但因为是"可忽略的工具结果"，破坏性有限；缺乏明确的"降级契约"声明。

**影响**：原生 Hook 一旦落地（Phase 1+），必须守住这条契约——否则一个写错的 Hook 脚本会让用户每次开会话都报错。

#### 8. 统一事件语义 vs 双系统冲突
**superpowers**：一个事件 `SessionStart`，一个 matcher，干净。
**PUAX**：**两套并行事件系统语义重叠**：
- 增强系统 `HookEventType`：`UserPromptSubmit | PostToolUse | PreCompact | SessionStart | Stop`（5 个，**无 PreToolUse**）
- 确定性引擎 `TriggerType`：`POST_TOOL_USE | PRE_TOOL_USE | USER_PROMPT | SESSION_START | PRE_COMPACT | STOP`（6 个，**有 PRE_TOOL_USE，是唯一能 block 的**）

两套命名（PascalCase vs SCREAMING_SNAKE）、两套检测逻辑、两套优先级。维护者要同时理解两套心智模型。

**影响**：演进方案.md 的"内部债务"（4.1 统一 TriggerDefinition）已经点到，但 Hook 维度的双系统更该优先收敛——它直接阻碍"接入运行时"（运行时只认一套事件名）。

#### 9. 配置 + 文档 + 测试 三件套纪律
**superpowers**：`hooks.json`（配置）+ `porting-to-a-new-harness.md`（设计文档，含 Shape A/B/C 路由表、gotcha 附录）+ `polyglot-hooks.md`（跨平台方案）+ `test-session-start.sh`（可执行规范，断言三种 JSON 形状互斥）。
**PUAX**：无 Hook 配置文件、无 Hook 专项文档、测试 `hook-system.test.ts` 测的是 pub/sub（生产零用的那套），而非真实 MCP 工具触发路径。

**影响**：PUAX 的 Hook 系统是"**能跑但说不清**"——README 只有一节概述，新贡献者要读完全部 9 个源文件才能拼出全貌。

---

## 三、PUAX 的 Hook 引擎优势（演进中必须保留的护城河）

superpowers 在"接入机制"上领先，但 PUAX 的 Hook **引擎本身**远比它丰富。演进不是用极简换丰富，而是把丰富的引擎接上强制的接入：

| 优势 | 说明 | superpowers 对比 |
|------|------|------------------|
| **多事件检测** | 5 类增强事件（UserPromptSubmit/PostToolUse/PreCompact/SessionStart/Stop） | superpowers 仅 SessionStart |
| **模式匹配表** | `TRIGGER_PATTERNS` 中英双语 6 组、加权置信度、角色映射 | superpowers 无检测逻辑 |
| **L0–L4 压力状态机** | 失败计数阈值升级、突破降压、深层换框 | superpowers 无状态 |
| **跨会话持久化** | `~/.puax/` 状态 + builder-journal.md 断点恢复 | superpowers 无状态 |
| **防作弊守卫** | `AntiCheatGuard`（git bypass / hidden file / CI bypass 模式）+ 确定性引擎 `blocked` | superpowers 无（连 PreToolUse 都没实现，issue #1040 待办） |
| **冷却与优先级** | 30s cooldown + ANTI_CHEAT(200)>FAILURE(150)>… 优先级短路 | superpowers 无 |

**结论**：PUAX 的演进 = **保留丰富引擎 + 50 角色 + CC-BOS，补上"运行时强制接入层"**。即把 superpowers 的"接入工程"嫁接到 PUAX 的"检测引擎"上。

---

## 四、演进路线图

> 分 6 个 Phase。Phase 0 清债（让引擎可接入），Phase 1–3 建"强制接入层"，Phase 4 补进程内形态，Phase 5 补纪律。**关键约束：不破坏现有 MCP 对外 API。**

### Phase 0：偿还内部债务（前置，解锁后续）

**目标**：收敛双事件系统，让 Hook 引擎有一套干净的事件名可对外暴露。

| # | 改进项 | 现状 | 交付物 |
|---|--------|------|--------|
| 0.1 | **统一事件类型枚举** | `HookEventType`(PascalCase, 无 PreToolUse) vs `TriggerType`(SCREAMING_SNAKE, 有 PreToolUse) | 合并为单一 `PuaxHookEvent` 枚举，**补齐 PreToolUse**（PUAX 现增强系统缺这个最关键的拦截事件）；保留旧名作 alias，标 deprecated |
| 0.2 | **决定 pub/sub 去留** | `hookManager.subscribe()` 生产零调用 | 要么**删除**死代码（pub/sub 永远不接运行时，留它误导维护者），要么**真的接**（Phase 4 用它驱动进程内插件）。建议删除，回归"检测引擎 + MCP 工具"单一路径 |
| 0.3 | **配置外置** | `TRIGGER_PATTERNS` 硬编码 | 抽到 `config/hooks.json`（声明式），引擎运行时加载；为 Phase 1 的"导出 hook 配置"铺路 |
| 0.4 | **`blocked` 决策路径落地** | `DeterministicTriggersEngine.evaluate()` 能 block 但无人调 | 在 `server/core.ts` 的工具分发前**真正调用一次** evaluate，让防作弊从"建议"变"拦截"（仅 MCP 模式内） |

### Phase 1：原生 Hook 配置生成器（核心突破）

**目标**：让 PUAX 的平台适配器**不只发 skill 文件，还发宿主原生 hook 配置**。这是 superpowers 领先 PUAX 的最直接体现——它有 `hooks.json`，PUAX 一个都没有。

| # | 改进项 | 对标 | 交付物 |
|---|--------|------|--------|
| 1.1 | **Claude Code hook 配置生成** | superpowers `hooks/hooks.json` | 新增 `ClaudeCodeHookAdapter`，`--export=claude-code` 时除了 skill 还生成 `.claude/settings.json` 或 `hooks/hooks.json`，注册 `SessionStart`（注入 PUAX 引导词）+ `PreToolUse`（调防作弊守卫） |
| 1.2 | **opencode hook 配置生成** | superpowers `.opencode/plugins/superpowers.js` | 新增 opencode 导出路径，生成 `opencode.json` 的 hook/event 段或 `.opencode/plugin.js`，让 PUAX 的 SessionStart/PostToolUse 在 opencode 里**自动触发** |
| 1.3 | **Cursor hook 配置生成** | superpowers `hooks/hooks-cursor.json` | `cursor-adapter.ts` 增 `generateHooks()`，发小写 `sessionStart` 配置 |
| 1.4 | **per-harness JSON 形状适配** | superpowers 三套互斥形状 | 抽象 `HookOutputShape` 类型（`nested`/`top-level-snake`/`top-level-camel`），按宿主变量分支，**严格只发一种**（学 superpowers 的双重注入陷阱教训，写进测试断言） |

### Phase 2：跨平台 shell 分发器

**目标**：原生 Hook 需要宿主执行 shell 命令，PUAX 必须有一套跨 Windows/Unix 的可执行分发器。

| # | 改进项 | 对标 | 交付物 |
|---|--------|------|--------|
| 2.1 | **polyglot `run-hook.cmd`** | superpowers `hooks/run-hook.cmd` | 在 `distributions/` 下新增 `hooks/run-hook.cmd` polyglot 脚本（batch+bash），探测 bash 路径，无 bash 静默 `exit 0` |
| 2.2 | **事件脚本生成** | superpowers `session-start`（无扩展名） | 生成无扩展名事件脚本（`session-start`、`pre-tool-use`、`post-tool-use`），规避 Claude Code Windows `.sh` 前置 bug |
| 2.3 | **puax CLI hook 入口** | — | 新增 `puax hook <event>` 子命令，shell 脚本调用它，它内部调 MCP 引擎/直接调检测函数，输出宿主 JSON。让"shell Hook → PUAX 引擎"形成单一路径 |
| 2.4 | **优雅降级契约** | superpowers silent exit 0 | 明确文档化：任何 Hook 脚本失败必须 `exit 0` + stderr 告警，绝不中断会话；写入 `polyglot-hooks` 文档 |

### Phase 3：运行时强制决策回路（PreToolUse 拦截）

**目标**：把 PUAX 已有但"睡着"的防作弊能力，通过原生 PreToolUse Hook 变成**真正会拦下 `read SOLUTION.md` / `git reset --hard` 的强制守卫**。

| # | 改进项 | 对标 | 交付物 |
|---|--------|------|--------|
| 3.1 | **allow/deny/ask 输出协议** | Claude Code 原生 hook decision schema | hook 脚本输出 `{ "hookSpecificOutput": { "decision": "block"\|"approve"\|"ask", "reason": "…" } }`；PUAX 引擎的 `blocked`/`allowed` 映射到此 |
| 3.2 | **PreToolUse matcher 落地** | superpowers matcher 概念（虽它只用于 SessionStart） | 生成 `PreToolUse` 配置，matcher 按工具名（`Bash`/`Read`/`Write`）路由；命中即调防作弊引擎，deny 即阻断 |
| 3.3 | **`git push` 守卫** | (PUAX 现仅拦 `git stash`/`reset --hard`/`clean -f`) | 扩展 `AntiCheatGuard.gitBypass` 加 `git push` 模式（对齐 `git-guardrails-claude-code` skill 的业界实践）；可通过配置开关 |
| 3.4 | **PostToolUse 失败→压力升级自动化** | PUAX 现需 Agent 调 `puax_detect_trigger` | 通过原生 PostToolUse Hook，宿主自动把 Bash 失败喂给压力引擎，无需 Agent 自觉 |

### Phase 4：进程内插件形态（Shape B，以 opencode 为主战场）

**目标**：对支持进程内插件的宿主，不走 shell，直接注册生命周期回调，**每个 step 自动触发**。

| # | 改进项 | 对标 | 交付物 |
|---|--------|------|--------|
| 4.1 | **opencode 插件** | superpowers `.opencode/plugins/superpowers.js` | 新增 `.opencode/plugins/puax.js`：注册 `experimental.chat.messages.transform`（每 step 检测用户消息→触发压力引擎→注入）+ `config`（推 skill 目录）；带去重守卫 + 模块缓存 |
| 4.2 | **Pi 扩展** | superpowers `.pi/extensions/superpowers.ts` | 注册 `session_start`/`session_compact`/`agent_end`/`context` 事件，复用 PUAX 的 Compaction 保护逻辑 |
| 4.3 | **引擎共享层** | — | 抽象 `HookEngineCore`：shell 脚本（Shape A）和进程内插件（Shape B）都调同一套纯函数检测逻辑，避免两份实现漂移 |

### Phase 5：配置 + 文档 + 测试纪律

**目标**：让 PUAX 的 Hook 系统从"能跑但说不清"变成"有规范、有文档、有可执行断言"。

| # | 改进项 | 对标 | 交付物 |
|---|--------|------|--------|
| 5.1 | **Hook 专项设计文档** | superpowers `porting-to-a-new-harness.md` | 新增 `docs/HOOK-ARCHITECTURE.md`：定义 Shape A（shell hook）/B（进程内）/C（instructions file）路由表、per-harness JSON 契约、gotcha 附录（双重注入陷阱、Windows `.sh` bug、matcher 语义） |
| 5.2 | **跨平台 hook 文档** | superpowers `polyglot-hooks.md` | 新增 `docs/polyglot-hooks.md`，记录 `run-hook.cmd` 模式、bash 探测、降级契约 |
| 5.3 | **hook 输出可执行测试** | superpowers `test-session-start.sh` | 新增 `tests/hooks/test-output-shapes.test.ts`，断言每种宿主只产一种 JSON 形状、字段名正确、不会双重注入 |
| 5.4 | **hook 配置生成回归测试** | — | 每个平台适配器 `generateHooks()` 都有快照测试，防止配置漂移 |

---

## 五、详细改进清单（按优先级合并）

> **状态说明（2026-08-09）**：P0–P2 全部交付，P3 中 18/19/20 已交付，17（Pi 扩展）显式跳过（仓库无 pi 运行时可验证，真被采用时按 opencode 模板模式补 adapter 即可）。实现细节见 [puax-mcp-server/CHANGELOG.md](puax-mcp-server/CHANGELOG.md) 与 [docs/HOOK-ARCHITECTURE.md](docs/HOOK-ARCHITECTURE.md)。

### P0 — 必须立即处理（解锁 + 核心突破）

| # | 改进项 | 来源 | 状态 |
|---|--------|------|------|
| 1 | 统一 `PuaxHookEvent` 枚举，补齐 PreToolUse | 差距#8 + 内债 | ✅ `hooks/hook-event.ts`；HookEventType/TriggerType 降级为兼容别名 |
| 2 | 决定 pub/sub 去留（建议删） | 差距#1 | ✅ 移除 subscribe/unsubscribe 死代码，保留会话生命周期 |
| 3 | `blocked` 决策路径真正接入工具分发 | 差距#1/#3 | ✅ `core/tool-guard.ts` 接入 server/core.ts 分发前 |
| 4 | Claude Code 原生 hook 配置生成器 | 差距#1/#2/#5 | ✅ `claude-code-adapter.ts` + `--export=claude-code` + distribution 插件内置 hooks |

### P1 — 高优先级（主战场落地）

| # | 改进项 | 来源 | 状态 |
|---|--------|------|------|
| 5 | opencode 进程内插件（Shape B） | 差距#1/#6 | ✅ `opencode-adapter.ts` 生成 `.opencode/plugins/puax.js`（每 step 自动触发，带去重守卫） |
| 6 | opencode hook 配置生成 | 差距#5 | ✅ 与 #5 合一（插件即配置）；skill-md 旧注册已移除防双注册 |
| 7 | 跨平台 polyglot `run-hook.cmd` + 事件脚本 | 差距#4 | ✅ `hook-templates.ts` 生成（ASCII 注释，LF 行尾，cmd/bash 双分支实测） |
| 8 | allow/deny/ask 输出协议 + PreToolUse matcher | 差距#3 | ✅ `cli/hook-cli.ts` PreToolUse 决策回路（block/approve） |
| 9 | puax CLI `hook <event>` 入口 | 差距#4 | ✅ `puax hook <事件>` 引擎共享层（含 stdin 载荷合并） |
| 10 | per-harness JSON 形状适配 + 互斥断言 | 差距#5 | ✅ 三形状严格互斥，`hook-cli.test.ts` 强制断言 |

### P2 — 中优先级（生态 + 纪律）

| # | 改进项 | 来源 | 状态 |
|---|--------|------|------|
| 11 | Cursor hook 配置生成 | 差距#5 | ✅ `cursor-adapter.ts` generateHooks → hooks-cursor.json |
| 12 | `git push` 守卫（扩展 AntiCheatGuard） | 差距#3 | ✅ `/git\s+push/i` + 单测 |
| 13 | PostToolUse 失败→压力升级自动化（原生 Hook 驱动） | 差距#1 | ✅ `puax hook post-tool-use` + stdin exit_code 链路实测（2 次连续失败 → L1） |
| 14 | Hook 专项设计文档 `HOOK-ARCHITECTURE.md` | 差距#9 | ✅ 含 Shape 路由表、JSON 契约、gotcha、配置外置章节 |
| 15 | 跨平台 hook 文档 `polyglot-hooks.md` | 差距#9 | ✅ 含编码/行尾陷阱（cmd 按系统代码页解析） |
| 16 | 引擎共享层（Shape A/B 共用纯函数） | 差距#6 | ✅ 统一经 `puax hook` CLI 单通路，无第二实现 |

### P3 — 低优先级（打磨）

| # | 改进项 | 来源 | 状态 |
|---|--------|------|------|
| 17 | Pi 扩展（Shape B） | 差距#6 | ⏭️ 显式跳过（无 pi 运行时可验证） |
| 18 | hook 输出形状可执行测试 + 配置回归快照 | 差距#9 | ✅ 形状互斥断言 + 3 个生成产物快照 + distribution 一致性逐字节断言 |
| 19 | 配置外置 `config/hooks.json`（运行时加载） | 差距#2 | ✅ `hook-config.ts`：`~/.puax/hooks.json` 子表级覆盖 + 结构校验 + `config/hooks.example.json` |
| 20 | 优雅降级契约文档化 + 全链路测试 | 差距#7 | ✅ spawn 级降级测试（依赖缺失/未知事件/stdin 全链路）+ junction 模拟已安装环境 |

---

## 六、关键设计决策

### 决策 1：双形态并存——MCP 模式（建议型）+ 原生 Hook 模式（强制型）
PUAX 不应放弃 MCP 引擎（那是它的护城河：可编程、可查询、50 角色矩阵）。演进是**叠加**一个"原生 Hook 层"：
- **MCP 模式**（现有）：丰富检测、压力引擎、角色推荐——给"愿意配合"的 Agent 用，**永远在线**。
- **原生 Hook 模式**（新增）：SessionStart 注入、PreToolUse 拦截、PostToolUse 自动喂失败——给"需要强制"的守卫用，**宿主替你跑**。

两者共用同一套 `HookEngineCore`（Phase 4.3）。superpowers 证明了"注入用原生 Hook、检测用 skill"的分工；PUAX 把它升级为"强制守卫用原生 Hook、智能激励用 MCP"。

### 决策 2：opencode 是第一主战场
理由：(a) 本工作环境运行时；(b) superpowers 已验证 `.opencode/plugins/*.js` 的 `experimental.chat.messages.transform` 每 step 自动触发可行；(c) PUAX 现在对 opencode 只发 skill 文件，落差最大、收益最直接。Phase 1.2 + 4.1 应优先于 Claude Code 的 1.1。

### 决策 3：照搬 polyglot 模式，但不重新发明
superpowers 的 `run-hook.cmd` polyglot + 无扩展名脚本 + 三路 bash 探测 + 静默降级，是踩过坑的成熟方案（RELEASE-NOTES 记录了 async→sync、`.sh` 前置、heredoc hang 等多次修复）。PUAX 直接移植这套，不要"优化"——polyglot 的每行都是某个 Windows bug 的解药。

### 决策 4：per-harness JSON 严格互斥，写进测试
superpowers 的双重注入陷阱（Claude Code 无去重地同时读两个字段）是隐蔽 bug。PUAX 生成 hook 输出时必须**按宿主变量只发一种形状**，并用 `test-session-start.sh` 那样的可执行断言锁死。这是"配置正确性"的回归网。

### 决策 5：PreToolUse 拦截只用于防作弊，不用于激励
原生 PreToolUse 的 deny 适合硬守卫（不准读 SOLUTION.md、不准 `git push`、不准 `--no-verify`），**不适合**"强制 Agent 调某个角色"——后者会变成对合法工具调用的无差别拦截，激怒用户。激励（压力升级、角色推荐）留给 MCP 模式（Agent 自愿）+ SessionStart/PostToolUse 注入（软提示）。**硬拦截守底线，软提示促上进。**

### 决策 6：统一事件枚举时，PreToolUse 必须保留
PUAX 增强系统缺 `PreToolUse`（只有确定性引擎有），而 PreToolUse 是**唯一能在动作发生前阻断**的事件。统一后的 `PuaxHookEvent` 必须把 PreToolUse 列为一等公民——它是 Phase 3 强制决策回路的根基。

---

## 七、实施原则

1. **先补"强制接入层"，再扩检测能力** — PUAX 的检测引擎已经够丰富（甚至比 superpowers 复杂一个数量级），瓶颈在"接不进运行时"。Phase 1 的原生 hook 配置生成器是地基。
2. **不破坏 MCP 对外 API** — 现有 `puax_*` 工具签名不动；原生 Hook 是新增层，内部共用 `HookEngineCore`。
3. **每接一个宿主即写一份互斥断言测试** — 学 superpowers，每个 harness 的 JSON 形状都有可执行规范，防止"发了两个字段导致双重注入"这类隐蔽 bug。
4. **硬守卫（deny）保守，软提示（inject）开放** — PreToolUse 只挡明确的危险模式（防作弊、git 危险操作），绝不滥用拦截；激励一律走注入通道。
5. **降级契约不可破** — 任何 Hook 脚本失败 → `exit 0` + stderr 告警。Hook 是"锦上添花"，不是"会话命门"。
6. **照搬 superpowers 的工程范式，嫁接 PUAX 的引擎** — polyglot 分发器、per-harness 配置、Shape A/B/C 路由、三件套纪律，都是成熟可移植的；PUAX 只需把"注入什么"从 `using-superpowers` 换成"压力引擎输出 / 防作弊决策"。

---

## 附录 A：差距速查矩阵（Hook 机制垂直维度）

| 能力 | superpowers | PUAX | 差距等级 |
|------|:-----------:|:----:|:--------:|
| 运行时原生触发（宿主强制） | ✅ | ❌ 仅 MCP 自愿 | **P0** |
| 声明式 hook 配置文件 | ✅ `hooks.json` | ❌ 全代码内嵌 | **P0** |
| 真实输出协议（宿主消费） | ✅ JSON stdout | ❌ MCP 返回值可忽略 | **P0** |
| PreToolUse 拦截（强制 deny） | ⚠️ 设计中(#1040) | ⚠️ 引擎有，未接入路径 | **P0** |
| 跨平台 shell 分发器 | ✅ polyglot | ❌ 无 shell 层 | **P1** |
| per-harness 差异化配置 | ✅ 3 形状 | ❌ 仅发 skill 文件 | **P1** |
| opencode 进程内插件 | ✅ `experimental.chat.messages.transform` | ❌ 仅 skill 文件 | **P1** |
| 事件类型丰富度 | ❌ 仅 1 | ✅ 5+6 | **PUAX 优势** |
| 模式匹配 / 压力状态机 | ❌ | ✅ L0–L4 | **PUAX 优势** |
| 防作弊守卫逻辑 | ❌ | ✅ AntiCheatGuard（未接路径） | **PUAX 优势（待激活）** |
| 跨会话状态持久化 | ❌ | ✅ `~/.puax/` | **PUAX 优势** |
| 事件语义统一性 | ✅ 单事件干净 | ❌ 双系统冲突 | **P0（内债）** |
| polyglot 跨平台 + 降级 | ✅ | ❌ | **P1** |
| Hook 专项文档 | ✅ 2 份 | ❌ 散落 | **P2** |
| Hook 输出可执行测试 | ✅ `test-session-start.sh` | ⚠️ 测的是死代码 pub/sub | **P2** |

---

## 附录 B：superpowers 关键文件索引（移植参考）

| 文件 | 作用 | PUAX 对应缺口 |
|------|------|---------------|
| `hooks/hooks.json` | Claude Code hook 声明式配置 | PUAX 无任何 hook 配置文件 |
| `hooks/hooks-cursor.json` | Cursor 差异化配置（小写键、无 matcher） | `cursor-adapter.ts` 只发 skill |
| `hooks/run-hook.cmd` | batch+bash polyglot 分发器 | PUAX 无 shell 层 |
| `hooks/session-start` | 无扩展名事件脚本（逻辑实体） | PUAX 无 |
| `.opencode/plugins/superpowers.js` | opencode 进程内插件（每 step 自动触发） | PUAX 对 opencode 只发 skill |
| `.pi/extensions/superpowers.ts` | Pi 生命周期回调插件 | PUAX 无 |
| `docs/porting-to-a-new-harness.md` | Shape A/B/C 路由表 + JSON 契约 + gotcha | PUAX 无 Hook 专项文档 |
| `docs/windows/polyglot-hooks.md` | 跨平台 hook 方案 | PUAX 无 |
| `tests/hooks/test-session-start.sh` | hook 输出形状可执行规范 | PUAX 测的是死代码 |

---

## 附录 C：PUAX 现有 Hook 引擎文件索引（演进基础）

| 文件 | 行数 | 角色 | 演进动作 |
|------|------|------|---------|
| `src/hooks/hook-manager.ts` | 496 | pub/sub 单例 + 会话生命周期 | Phase 0.2 决定去留（建议删） |
| `src/hooks/trigger-detector-enhanced.ts` | 653 | 5 事件检测 + `TRIGGER_PATTERNS` 表 | Phase 0.1/0.3 统一枚举 + 配置外置 |
| `src/hooks/deterministic-triggers.ts` | 386 | 6 类型确定性引擎（唯一能 block） | Phase 0.1 合并；Phase 3 接入真实路径 |
| `src/hooks/pressure-system.ts` | 495 | L0–L4 压力状态机 + 注入构建 | 保留，Phase 3.4 自动喂失败 |
| `src/hooks/state-manager.ts` | 649 | `~/.puax/` 持久化 + 断点恢复 | 保留 |
| `src/hooks/feedback-system.ts` | 428 | 会话结束反馈 | 保留 |
| `src/hooks/failure-detector.ts` | 199 | 失败模式检测 | 保留 |
| `src/core/anti-cheat-guard.ts` | 287 | git/file/CI bypass 守卫（未接路径） | Phase 3.2/3.3 激活 + 扩 push |
| `src/platform-adapters/base-adapter.ts` | 302 | 平台导出基类（仅 skill） | Phase 1 增 `generateHooks()` |
| `src/tools/export-platform.ts` | — | `--export` 工具 | Phase 1 调用新 hook 生成 |

---

*本方案专注 Hook 接入机制。行为有效性（方法论路由、防作弊治理流程、自进化等）见 [演进方案.md](演进方案.md)。*
