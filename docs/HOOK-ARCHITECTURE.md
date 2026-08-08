# PUAX Hook 架构

> 版本: v3.11 | 配套: [Hook机制演进方案.md](../Hook机制演进方案.md)

本文档定义 PUAX 的 Hook 接入架构（Shape A/B/C 路由表、per-harness JSON 契约、gotcha 附录）。
设计对标 obra/superpowers 的 `porting-to-a-new-harness.md`。

---

## 一、两种形态（双模并存）

PUAX 的 Hook 能力分两层：

| 形态 | 触发方式 | 适用 | 代表宿主 |
|------|----------|------|---------|
| **MCP 模式**（原有） | Agent 自愿调用 `puax_detect_trigger` 等工具 | 智能激励（角色推荐、压力升级） | 所有 MCP 客户端 |
| **原生 Hook 模式**（v3.11 新增） | 宿主运行时在事件点强制调用 | 强制守卫（防作弊、git 拦截）+ 会话注入 | Claude Code / Cursor / opencode |

两者共用同一检测引擎。原生 Hook 统一经 **hook CLI**（`puax-mcp-server hook <事件>`）
调用引擎共享层，避免两份实现漂移。

```
宿主运行时（Claude Code / Cursor / opencode）
   │  SessionStart / PreToolUse / PostToolUse / UserPromptSubmit ...
   ▼
Shape A（shell hook）          Shape B（进程内插件）
hooks/hook.js（node 入口）      .opencode/plugins/puax.js
   └─────────────┬────────────────┘
                 ▼
    puax-mcp-server hook <event>   ← 引擎共享层（cli/hook-cli.ts）
        ├─ EnhancedTriggerDetector（激励检测）
        ├─ DeterministicTriggersEngine（PreToolUse 拦截）
        ├─ AntiCheatGuard（git/CI/文件守卫）
        └─ StateManager / PressureSystem（状态与压力）
                 │
                 ▼
        宿主 JSON（stdout，严格一种形状）
```

## 二、事件与决策协议

统一事件枚举 `PuaxHookEvent`（`src/hooks/hook-event.ts`），六个一等公民：

| 事件 | 语义 | 输出 |
|------|------|------|
| `SessionStart` | 会话开始（startup/clear/compact） | 注入：断点恢复上下文 |
| `UserPromptSubmit` | 用户消息 | 注入：挫折/放弃检测结果 |
| `PostToolUse` | 工具执行后 | 注入：Bash 失败压力升级 |
| `PreToolUse` | 工具执行前（**可阻断**） | 决策：`block`/`approve` |
| `PreCompact` | 压缩前 | 静默：状态写入 journal |
| `Stop` | 会话结束 | 注入：结束反馈提示 |

### 注入协议（SessionStart / UserPromptSubmit / PostToolUse / Stop）

按宿主只输出**恰好一种**字段形状（严格互斥，防止双重注入）：

| 宿主 | 字段 |
|------|------|
| Claude Code | `{ "hookSpecificOutput": { "hookEventName": "...", "additionalContext": "..." } }` |
| Cursor | `{ "additional_context": "..." }` |
| Copilot CLI / SDK | `{ "additionalContext": "..." }` |

无内容时输出 `{}`（宿主忽略即可）。

### 决策协议（PreToolUse，仅 Claude Code）

```json
{ "hookSpecificOutput": { "hookEventName": "PreToolUse",
  "decision": "block", "reason": "GIT_BYPASS_BLOCKED: ..." } }
```

拦截规则：
1. `DeterministicTriggersEngine` — 隐藏文件/答案文件（`hidden_file_access`，优先级 200）
2. `AntiCheatGuard` — git 危险操作（stash / reset --hard / clean -f / push）+ CI 绕过 + 评分资产

非 Claude Code 宿主无此协议，输出 `{}` 静默放行。

## 三、Shape 路由表

| 宿主 | Shape | 产物 | 生成方式 |
|------|-------|------|---------|
| Claude Code | A（shell hook） | `hooks/hooks.json` + `hooks/` 脚本 | `--export=claude-code` |
| Cursor | A | `hooks/hooks-cursor.json` + `hooks/` 脚本 | `--export=cursor` |
| opencode | B（进程内插件） | `.opencode/plugins/puax.js` | `--export=opencode` |
| 其他（codex/pi 等） | C（指令文件） | skill/rule markdown | `--export=<platform>` |

Shape A 的 hooks.json 形态（Claude Code）：

```json
{ "hooks": {
    "SessionStart": [{ "matcher": "startup|clear|compact",
      "hooks": [{ "type": "command", "command": "node \"./hooks/hook.js\" session-start",
                  "shell": "bash", "async": false }] }],
    "PreToolUse": [{ "matcher": "Bash|Read|Write|Edit",
      "hooks": [{ "type": "command", "command": "node \"./hooks/hook.js\" pre-tool-use",
                  "shell": "bash", "async": false }] }],
    "PostToolUse": [{ "matcher": "Bash",
      "hooks": [{ "type": "command", "command": "node \"./hooks/hook.js\" post-tool-use",
                  "shell": "bash", "async": false }] }]
} }
```

要点：
- `matcher: "startup|clear|compact"` 排除 `resume`（恢复会话已有上下文，重复注入浪费 token）
- `async: false` 保证注入在模型首条消息**前**完成
- 事件一律走 `hook.js`（引擎共享层单通路）

## 四、优雅降级契约（不可破）

1. Hook 脚本/CLI 任何异常 → stdout `{}` + 退出码 0，**绝不中断宿主会话**（`runHook` 内 try/catch 兜底）
2. 依赖缺失（未安装 puax-mcp-server、无 node）→ 静默跳过
3. Hook 是"锦上添花"，不是"会话命门"

## 五、Gotcha 附录

1. **双重注入陷阱**：Claude Code 无去重地同时读取 `additional_context` 与 `hookSpecificOutput`。
   必须按宿主只发一种形状——由 `test/unit/hooks/hook-cli.test.ts` 强制断言。
2. **Windows `.sh` 前置 bug**：Claude Code 会对含 `.sh` 的命令自动前置 `bash`。
   事件脚本一律无扩展名（`session-start` 而非 `session-start.sh`）。
3. **`"shell": "bash"` 必填**：Claude Code ≥ 2.1.81 需要显式声明，避免 PowerShell ParserError /
   cmd 引号剥离。
4. **resume 语义**：`SessionStart` 不含 `resume`，恢复会话的注入靠 SessionStart 的
   断点检测（`~/.puax/` 状态）而非重复注入。
5. **stdin 载荷**：Claude Code 经 stdin 传 `{ tool_name, tool_input, tool_response, session_id }`，
   CLI 自动合并（显式 CLI 参数优先）。
6. **旧枚举清理**：`HookEventType` / `TriggerType` 为兼容别名，新代码一律用 `PuaxHookEvent`。

## 六、触发模式配置外置（v3.11）

触发模式默认值（内置 `TRIGGER_PATTERNS`）可从用户配置文件覆盖：

```bash
# 文件: ~/.puax/hooks.json（或环境变量 PUAX_HOOKS_CONFIG 指定路径）
{
  "triggerPatterns": {
    "userFrustration": {
      "zh": { "patterns": ["我的自定义词"], "weight": 1.5 }
    }
  }
}
```

合并语义：**子表级替换**——覆盖文件出现的组/子表（zh/en/generic）整体替换内置
同子表，未覆盖的子表沿用内置（加词不丢旧词）。要清空某子表，将其 `patterns`
置为 `[]`（空表永不匹配，等效删除）。结构校验：`patterns` 必须为 string 数组、
`weight` 必须为有限数字，非法子表整表跳过并告警（防字符串被迭代成单字符正则）。
文件缺失/JSON 非法一律回退内置，不抛错。

存储路径统一经 `src/utils/storage-paths.ts`（`getPuaxHome()`）解析，
`PUAX_HOME` 环境变量可重定向全部本地状态（含本配置文件的默认位置）。

## 七、相关文件

| 文件 | 作用 |
|------|------|
| `src/hooks/hook-event.ts` | 统一事件枚举 |
| `src/cli/hook-cli.ts` | 引擎共享层 CLI（Shape A/B 共用） |
| `src/core/tool-guard.ts` | MCP 工具分发前拦截（Phase 0.4） |
| `src/core/anti-cheat-guard.ts` | git/CI/文件守卫 |
| `src/platform-adapters/hook-templates.ts` | hook 脚本/插件模板 |
| `src/platform-adapters/claude-code-adapter.ts` | Shape A（Claude Code）生成器 |
| `src/platform-adapters/opencode-adapter.ts` | Shape B（opencode）生成器 |
| `test/unit/hooks/hook-cli.test.ts` | 输出形状互斥可执行规范 |
| `docs/polyglot-hooks.md` | 跨平台分发方案 |
