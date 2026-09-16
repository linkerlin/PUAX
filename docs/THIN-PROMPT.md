# Thin Prompt 与 Token 经济学

> **版本**: 4.2.0 | 核心思想：**协议由运行时持有，角色只留口音**。
> 本文给出三档压缩模式的正式规格与可复现实测基线。宪法主轴「Thin Prompt Token 经济性」以此为准。

---

## 1. 设计立场

完整 SKILL（数千 Token 的方法论长文）在长对话与多 Agent 编排中是上下文税。PUAX 把「协议」（诊断先行、信心门控、验证闭环等步骤）收敛进**运行时薄注入**，角色内容只保留可辨识的「口音层」。口音按档截断，协议永不缺席。

## 2. 三档模式规格

| 模式 | 构成 | 口音层上限 | 适用 |
|---|---|---|---|
| `full` | 协议全步骤 + 口音层（定位/原则/禁项）+ 处境/诊断注入 | 2400 字符 | 深任务、单角色长程作战 |
| `compact` | 协议压缩步骤 + 口音层截断 + 注入 | 1000 字符 | 默认档：日常心跳推荐 |
| `minimal` | 单行协议骨架 + 一句话定位与禁项 + 处境注入（极简不动） | 380 字符 | 多 Agent 编排、长对话、上下文紧张 |

- 口音抽取自 SKILL 的 `## System Prompt`（缺省回退 `一句话定位/核心原则/禁止事项` 节）；超出上限即截断并注记「口音层截断，协议由运行时持有」。
- `minimal` 档刻意只取「定位 + 禁项」——**保留角色不可为的边界，舍弃角色擅长的铺陈**。

## 3. 实测 Token 基线（可复现）

估算口径：仓内 CJK 感知估算器（CJK 字符 ×1.4 + 其他 ×0.35；与主流 BPE 分词器偏差 <15%）。复现命令：

```bash
cd puax-mcp-server && npx tsc && node -e "
const { compileThinPrompt } = require('./build/core/thin-prompt.js');
for (const m of ['full','compact','minimal'])
  console.log(m, compileThinPrompt({ role_id: 'military-commander', mode: m }).estimated_tokens);"
```

实测数据（2026-09-17，v4.2.0，三代表性角色）：

| 角色 | 完整 SKILL | full | compact | minimal | minimal 相对全文压降 |
|---|---:|---:|---:|---:|---:|
| `military-commander`（方法论重） | ~4337 tok | 618 | 477 | **162** | **−96.3%** |
| `shaman-linus`（萨满八席） | ~1518 tok | 537 | 396 | **162** | **−89.3%** |
| `dream-zuowang`（梦系，协议附加） | ~1402 tok | 722 | 581 | **347** | **−75.2%** |

读法：

- `minimal` 的**固定地板约 162 Token**（协议骨架 + 边界），与角色厚薄无关——这就是「多 Agent 编排每角色固定税」的上界。
- 角色越厚（方法论长文），相对收益越大；指挥官全文 4337 Token 压到 162。
- 梦系角色地板略高（梦境协议 `[DREAM]` 安全铁律不可省）。

## 4. 接入面（四处透传）

| 入口 | 参数 |
|---|---|
| MCP 工具 `puax_thin_prompt` | `role_id`, `mode`（full/compact/minimal） |
| `activate_with_context` / `get_role_with_methodology` | `thin_mode` 透传（另支持 `thin` / `format=thin` 兼容形态） |
| HTTP `POST /v4/tick` | 响应 `amp` 信封随拍注入薄提示 |
| Python SDK（`pip install puax-amp`） | `mw.get_thin_prompt(role, mode=...)` 与离线编译器 `compile_local_thin_prompt`（无服务端依赖，含 CJK token 估算） |

## 5. TTF（Time-to-First-Pressure）权衡

- Token 经济与首次施压延迟是一对张力：`full` 信息最足但税重；`minimal` 让首拍注入在长上下文中几乎无感。
- 宿主 Hook 路径（SessionStart/UserPromptSubmit/PostToolUse）默认走 compact——**TTF ≤ 1 轮对话**由 Hook 原生挂载保证（`npx puax doctor --fix`），与压缩档位正交。
- 编排器多 Agent 场景建议：主 Agent compact、协作者 minimal。

## 6. 反自欺声明

上表为**估算器口径**的实测值（非特定商用分词器计数）；「压降逾 90%」类表述以完整 SKILL 为分母、以本表方法可复现。估算器与三档行为由 Jest 门（`thin-prompt-modes.test.ts`，run-all 守门）与协议合规门锁定，漂移即红。
