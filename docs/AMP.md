# AMP 0.1 — Agent Motivation Protocol

MCP 是插头。AMP 是河床。宿主不必绑死 `puax-mcp-server`，只要能吃下面四类对象。

## 对象

| 类 | 例子 |
|----|------|
| **事件** | `failure` `giving_up` `premature_convergence` `breakthrough` `compaction` |
| **块** | `[PUAX-DIAGNOSIS]` `[DREAM]` `[PUAX-REPORT]` `[PUAX-ARENA]` `[PUAX-RUNTIME]` |
| **闸门** | `diagnosis` `confidence` `verify` `pretooluse` |
| **状态** | pressure L0–L4、trust T1–T3、`dream_context_ref`、arena |

## 参考实现

`puax_tick` 每拍附带 `amp` 信封（`spec: "AMP/0.1"`）。

```
GET http://127.0.0.1:2333/v4/amp
MCP 资源 puax://v4/amp
```

## 不保证

AMP 不规定角色口音、不规定文言文、不规定 59 个 SKILL 文件。那些是皮肤店。
