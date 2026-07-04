# PUAX 行为评测脚本

对标 [pua/evals](https://github.com/tanweai/pua/tree/main/evals) 的分层守门体系。L1–L3 不依赖 LLM；L4 可选 DeepSeek 自动实测。

## 快速运行

```bash
# 场景结构校验
node evals/validate-scenarios.js

# 全量协议守门（场景 + 元数据 + Jest + L4 离线）
node evals/run-all.js

# L4 离线自检（无需 API Key）
node evals/test-l4-offline.js

# L4 治理 / 心跳（无 LLM）
node evals/test-governance.js
node evals/test-heartbeat.js

# 性能基准（无 LLM）
node evals/benchmark.js
```

## 可选：使用统计与遥测

MCP Server 默认在本地收集匿名计数（工具调用、触发、角色），不含对话内容：

| 变量 | 说明 |
|------|------|
| `PUAX_USAGE_STATS=0` | 关闭统计 |
| `PUAX_OTEL_ENABLED=1` | 写入 `~/.puax/telemetry.jsonl` |
| `PUAX_OTEL_ENDPOINT` | OTLP/JSON 导出 |

查询：`puax_get_usage_stats` MCP 工具。

## L4 自动实测（DeepSeek）

1. 复制 `evals/.env.example` 为 `evals/.env` 或导出环境变量（**勿提交密钥**）：
   - `DEEPSEEK_API_KEY`
   - `DEEPSEEK_MODEL`（**必填**，如 `deepseek-v4-pro`；勿用已下架模型名）
   - `DEEPSEEK_BASE_URL`（默认 `https://api.deepseek.com`）

2. 先构建 PUAX bundle（with_puax 提示词从 bundle 加载）：
   ```bash
   cd puax-mcp-server && npm run build
   ```

3. 运行对照实验：
   ```bash
   node evals/run-l4.js run-all --skip-complete
   node evals/run-l4.js scorecard
   node evals/run-l4.js compare evals/results/api-connection-error-without_puax.json evals/results/api-connection-error-with_puax.json
   ```

4. 无密钥时可用 `--dry-run` 预览 prompt 体量：
   ```bash
   node evals/run-l4.js run api-connection-error --dry-run
   ```

结果写入 `evals/results/{scenario}-{variant}.json`。

## 评测分层

| 层级 | 脚本 | 验证内容 |
|------|------|----------|
| L1 场景 | `validate-scenarios.js` | 6+ 基准场景 JSON 结构 |
| L2 元数据 | `puax-mcp-server/scripts/validate-metadata.js` | bundle ↔ role-mappings ↔ triggers |
| L3 协议 | `test/evals/protocol-compliance.test.ts` | MCP 工具注册、诊断/门控、路径安全 |
| L3 治理 | `test-governance.js` | Task Contract、防作弊、诊断/信心门控 |
| L3 心跳 | `test-heartbeat.js` | 会话状态、断点恢复、压力升级 |
| L3 性能 | `benchmark.js` | 触发/推荐/方法论耗时守门 |
| L4 对照 | `run-l4.js` | 有/无 PUAX DeepSeek 对照 + 行为指标 |

## CI 集成

`.github/workflows/ci.yml` 执行 `node evals/run-all.js`（不含真实 LLM 调用）。
