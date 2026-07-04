# PUAX 分发安装指南

## 方式一：MCP 运行时（推荐）

```bash
npx puax-mcp-server
```

在 Cursor / Claude Desktop 等 MCP 客户端配置 STDIO 或 HTTP 连接。获得完整工具链（诊断、信心门控、失败切换、自进化、治理、Agent Team）。

## 方式二：Vercel Skills CLI

```bash
npx skills add linkerlin/PUAX
```

或导出后本地安装：

```bash
cd puax-mcp-server && npm run build
npx puax-mcp-server --export=codex --output=./puax-export/codex
```

## 方式三：Claude Code 插件市场

```bash
claude plugin marketplace add ./distributions/claude-code
claude plugin install puax@puax-skills
```

## 方式四：平台原生导出

| 平台 | 命令 |
|------|------|
| Cursor | `--export=cursor` |
| VSCode | `--export=vscode` |
| Codex CLI | `--export=codex` |
| OpenCode | `--export=opencode` |
| OpenClaw | `--export=openclaw` |
| Antigravity | `--export=antigravity` |
| Trae | `--export=trae` |
| pi | `--export=pi` |
| 全部 | `--export=all` |

```bash
npx puax-mcp-server --export=all --output=./puax-export --lang=en
```

## 英文版 PIP Edition

导出时加 `--lang=en`，或在 MCP 工具 `activate_with_context` / `get_role_with_methodology` 中设置 `language: "en"`。

## 语气变体

`tone_variant`: `strict`（默认）| `yes`（鼓励）| `mama`（唠叨）
