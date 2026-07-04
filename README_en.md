# PUAX — AI Agent Motivation System

<p align="center">
  <img src="https://img.shields.io/badge/version-3.10.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/status-production%20ready-green.svg" alt="Status">
  <img src="https://img.shields.io/badge/skills-50-orange.svg" alt="Skills">
  <img src="https://img.shields.io/badge/MCP%20tools-42-purple.svg" alt="MCP Tools">
</p>

<p align="center">
  <b>When AI Agents stall, PUAX provides roles, methodologies, and behavior protocols</b>
</p>

<p align="center">
  <a href="README.md">简体中文</a> | <a href="README_en.md">English</a>
</p>

---

## What is PUAX?

PUAX drives **effective agent behavior**, not just better prompts:

- **Hybrid trigger detection** — YAML regex + TF-IDF/semantic fallback
- **50 roles + custom roles** — smart recommendation with `score_explanation`
- **Behavior loop** — diagnosis-first, confidence gate, failure switching, task contracts
- **Hook System** — session state, L0–L4 pressure, breakthrough de-escalation
- **11 company flavors** — rhetoric + behavior constraints
- **Observability** — anonymous local usage stats + OTel-compatible spans

```bash
npx puax-mcp-server --stdio
```

See [puax-mcp-server/README.md](puax-mcp-server/README.md) and [CHANGELOG](puax-mcp-server/CHANGELOG.md).

---

## Quick links

| Doc | Description |
|-----|-------------|
| [README.md](README.md) | Main doc (Chinese) |
| [puax-mcp-server/README.md](puax-mcp-server/README.md) | MCP setup & 42 tools |
| [API Reference](docs/API.md) | 42 MCP tools (v3.10) |
| [User Guide](docs/USER-GUIDE.md) | Scenario workflows |

---

## Optional environment variables

| Variable | Purpose |
|----------|---------|
| `PUAX_USAGE_STATS=0` | Disable anonymous usage stats |
| `PUAX_OTEL_ENABLED=1` | Write spans to `~/.puax/telemetry.jsonl` |
| `PUAX_OTEL_ENDPOINT` | OTLP/JSON export URL |

---

## License

MIT License — see [LICENSE](LICENSE)
