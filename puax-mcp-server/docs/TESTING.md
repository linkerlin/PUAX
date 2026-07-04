# PUAX MCP Server 测试指南

> 过时散落文档已归档至 `docs/archive/testing/` 与 `docs/archive/completion-reports/`。

## 快速命令

```bash
cd puax-mcp-server

npm test                    # 全量 Jest（549+）
npm run test:unit           # 单元测试
npm run test:integration    # 集成测试
npm run test:evals          # 协议合规守门
npm run validate:metadata   # bundle ↔ mappings 一致性
npm run validate            # lint + typecheck + test
```

## 行为评测（仓库根 `evals/`）

| 层级 | 命令 | 说明 |
|------|------|------|
| L1 | `node evals/validate-scenarios.js` | 场景 JSON 结构 |
| L2 | `node puax-mcp-server/scripts/validate-metadata.js` | 元数据一致性 |
| L3 | `npm test -- test/evals/protocol-compliance.test.ts` | MCP 协议守门 |
| L4 | `node evals/run-l4.js list` | 有/无 PUAX 对照记录（需 LLM 客户端） |
| 全量 | `node evals/run-all.js` | L1–L3 自动守门（CI） |

### L4 对照实验流程

```bash
# 配置密钥（见 evals/.env.example，勿提交 .env）
# 须同时设置 DEEPSEEK_API_KEY 与 DEEPSEEK_MODEL（如 deepseek-v4-pro）

cd puax-mcp-server && npm run build

# 单场景对照
node evals/run-l4.js run api-connection-error --variant=both

# 全量 6 场景
node evals/run-l4.js run-all

node evals/run-l4.js compare evals/results/api-connection-error-without_puax.json evals/results/api-connection-error-with_puax.json
```

## CI

`.github/workflows/ci.yml` 在测试前执行 `node evals/run-all.js`。
