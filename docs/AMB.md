# AMB v0 — Agent Motivation Benchmark

> 无 LLM。不公布捏造的跨模型胜率。

AMB v0 只回答：运行时是否**覆盖**激励该发生的场景。

| 项 | 口径 |
|----|------|
| 场景数 | `evals/scenarios/*.json` ≥ 12 |
| 触发 | 必须能在 `triggers.yaml` 或确定性引擎里对上 |
| 角色 | 必须在 skill-manifest，或 shaman-/military-/dream-/silicon- |
| 萨满 | 至少若干场景推荐 shaman-（八席全留） |
| 产物 | `evals/results/amb-v0.json` |

```bash
node evals/amb-scorecard.js
node evals/run-all.js
```

L4 在线对照（真实模型有/无 PUAX）仍要 API，不阻塞 4.0。
