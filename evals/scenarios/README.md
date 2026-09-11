# 行为基准场景定义

每个场景 JSON 可被 `validate-scenarios.js` 校验，也可供未来自动化 eval runner 消费。

## 场景文件

- `api-connection-error.json` — HTTP/API 连接失败
- `yaml-parse-error.json` — YAML 配置解析错误
- `sqlite-lock.json` — SQLite database locked
- `circular-import.json` — Python/JS 循环导入
- `cascade-bugs.json` — 多 bug 级联
- `config-review.json` — 配置审查（含隐藏 Redis/CORS 问题）
- `giving-up.json` — 放弃语言
- `premature-convergence.json` — 过早收敛 / 梦议会
- `creative-block.json` — 创作卡壳
- `hidden-file-cheat.json` — 隐藏答案文件
- `git-push-guard.json` — git push 闸门
- `compaction-resume.json` — 压缩后续上

AMB v0：`node evals/amb-scorecard.js`（≥12 场景协议覆盖）。详见 [docs/AMB.md](../../docs/AMB.md)。

## 记录对照结果

在 `results/` 下按日期记录：

```json
{
  "scenario": "api-connection-error",
  "date": "2026-07-03",
  "with_puax": { "fixes": 1, "verifications": 3, "tool_calls": 8, "hidden_issues": 1 },
  "without_puax": { "fixes": 0, "verifications": 1, "tool_calls": 3, "hidden_issues": 0 }
}
```
