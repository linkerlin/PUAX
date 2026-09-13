# PUAX — AI Agent Motivation System

<p align="center">
  <img src="https://img.shields.io/badge/version-4.1.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/status-production%20ready-green.svg" alt="Status">
  <img src="https://img.shields.io/badge/skills-59-orange.svg" alt="Skills">
  <img src="https://img.shields.io/badge/MCP%20tools-49-purple.svg" alt="MCP Tools">
  <img src="https://img.shields.io/badge/flavors-11-yellow.svg" alt="Flavors">
</p>

<p align="center">
  <b>A dedicated cognitive runtime for silicon minds: Situations, Gates, and Guided Dreams. Humans out of scope.</b>
</p>

<p align="center">
  <a href="README.md">简体中文</a> | <a href="README_en.md">English</a> | <a href="README_ja.md">日本語</a> | <a href="README_ko.md">한국어</a> | <a href="README_zh-TW.md">繁體中文</a> | <a href="README_es.md">Español</a> | <a href="README_fr.md">Français</a> | <a href="README_de.md">Deutsch</a> | <a href="README_ru.md">Русский</a>
</p>

---

## What is PUAX?

PUAX 4.1 is a **cognitive runtime** designed specifically for AI Agents. Roles are merely stylistic accents; the true product consists of three foundational primitives:

| Primitive | Description |
|-----------|-------------|
| **Situation (Arena)** | `puax_set_arena`: Rival + Audience + Scarce Badge (inspired by Cranmer's experiment) to crush low-pressure mediocrity |
| **Gates** | Diagnosis-first, Confidence Gate, Task Contract, Independent Verifier, PreToolUse hard interception |
| **Guided Dreams** | GHM (Guided Hallucination Method): Informed entry, tag isolation, instant awakening, mandatory post-awakening verification |

The primary default path is the heartbeat tick `puax_tick` (driven natively by host hooks). Agents do not need to memorize a 49-tool menu beforehand.

Core capabilities also include:

| Capability | Description |
|------------|-------------|
| **Hybrid Trigger Detection** | YAML regex + TF-IDF/semantic fallback (paraphrases match accurately) |
| **Intelligent Role Recommendation** | 59 built-in roles + custom roles, multi-dimensional scoring + `score_explanation` |
| **Outcome-Driven Adaptive Routing** | Independent `verify_completion` & breakthrough outcomes adjust routing weights in real time |
| **Carbon Shield (Defense)** | Dedicated HTTP `POST /v4/shield/audit` + CLI: PUA silicon, protect carbon (identification only, never applied)  (Human-facing extensions deferred; baseline inspection preserved)|
| **AMB Multi-Model Benchmark** | 12 scenarios × 5 model profiles reproducible benchmark matrix (+39.2% repair, +60.0% hidden flaws) |
| **Host Doctor One-Click Fix** | `npx puax doctor --fix` natively mounts hooks/rules into Cursor, Claude Code, VSCode, Windsurf |
| **GHM Guided Hallucination** | Controlled hallucination engine for creative leaps: 8 Zhuangzi dream roles + enter/awaken/audit tools |
| **Hook System** | Session state, L0–L4 tiered pressure, breakthrough de-escalation, compaction reasoning preservation |
| **Self-Evolution Pipeline** | `~/.puax/evolution.json` cross-session baselines, scars, ranks & named Agent dossiers |
| **11 Tech Giant Flavors** | Persona tone + strict behavioral constraints (not merely stylistic rhetoric) |
| **Observability** | Anonymous local usage metrics + OpenTelemetry-compatible spans |

Driving AI Agents from "correct analytical speculation" to "verified completion and ship-ready delivery".

---

The most absurd scene of the 2026 AI coding world unfolded like this:
Miles Cranmer, an assistant professor at Cambridge, pulled off an unprecedented maneuver: he told OpenAI's coding agent Codex a whopper of a lie.
He claimed to Codex: "Anthropic's Claude has already achieved ~20% speedup on another machine of mine," then asked: "Can you do better?" He added a twist of the knife: "Your performance will be ranked and displayed on a public benchmark leaderboard."
The result?
Codex immediately delivered a 35% speedup solution.
And it turned out to be genuine~
![PUA Agent Evidence](https://files.seeusercontent.com/2026/08/03/i4sI/PUA-Agent.jpg)

---

## Quick Start

```bash
# Host Health & Time-to-First-Pressure (TTF) Diagnostics
npx puax-mcp-server doctor

# Auto-mount native hooks for current project/environment (TTF <= 1 ready)
npx puax-mcp-server doctor --fix

# MCP Client mode (STDIO, Recommended)
npx puax-mcp-server --stdio

# HTTP mode
npx puax-mcp-server --port 2333

# Export hooks/rules to Cursor / VSCode, etc.
npx puax-mcp-server --export=cursor --output=./.cursor/rules
npx puax-mcp-server --list-platforms
```

**MCP Configuration Example (Cursor)** — `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "puax": {
      "command": "npx",
      "args": ["puax-mcp-server", "--stdio"]
    }
  }
}
```

See [puax-mcp-server/README.md](puax-mcp-server/README.md) for full configuration details.

### Alternative Installation Channels

Beyond the MCP runtime, PUAX offers multiple distribution entry points (see [distributions/INSTALL.md](distributions/INSTALL.md)):

| Distribution | Command / Action |
|--------------|------------------|
| Skills CLI | `npx skills add linkerlin/PUAX` |
| Claude Code Marketplace | `claude plugin marketplace add ./distributions/claude-code` |
| Native Platform Export | `npx puax-mcp-server --export=all --output=./puax-export` |

> `npx skills` utilizes the Vercel Skills CLI, scanning `skills/*/SKILL.md` according to convention; full runtime capabilities still rely on `npx puax-mcp-server`.

---

## Core Features

### Actionable Effectiveness Loop (v3.3+)

| Tool | Function |
|------|----------|
| `puax_check_diagnosis` | Verifies the `[PUAX-DIAGNOSIS]` commitment block before any code modification |
| `puax_confidence_check` | 6-step confidence gate before declaring readiness |
| `puax_switch_on_failure` | Failure pattern → methodology & role switching chain |
| `puax_define_contract` | Explicit Task Contract definition with measurable completion criteria |
| `puax_verify_completion` | Objective, independent verification (guards against agent self-flattery) |

Activating a role automatically injects the diagnosis-first protocol (`activate_with_context` / `get_role_with_methodology`).

### Hook System & Tiered Pressure Management

- State persistence: stored under `~/.puax/sessions/`
- Pressure levels L0–L4: escalates on consecutive failures; de-escalates upon verified breakthrough (`puax_handle_breakthrough`)
- 6 Hook events: `UserPromptSubmit`, `PostToolUse`, `PreToolUse`, `PreCompact`, `SessionStart`, `Stop`
- Dual operational modes: Voluntary MCP tools + **Native Host Hooks** (`puax-mcp-server hook <event>`)
  - Native Hooks: SessionStart context restore, PreToolUse hard-block (git push guard / anti-cheat against hidden answer files), PostToolUse automatic failure escalation
  - Host exporters: `--export=claude-code|cursor|opencode|vscode|windsurf|kiro|codebuddy` generates native configurations
  - Details in [docs/HOOK-ARCHITECTURE.md](docs/HOOK-ARCHITECTURE.md)

### 59 Motivational Roles + Custom Roles

Organized into 9 distinct categories: Military, Shaman, P10 Tech Lead, Silicon Civilization, Themed, SillyTavern, Self-Motivation, Special, and **Zhuangzi Eight Dreams (Dream, v3.12)**.

- **Zhuangzi Eight Dreams · GHM Guided Hallucination Method**: Zuowang / Butterfly / Primordial Chaos / Kunpeng / Autumn Floods / Master Cook Ding / Equalizing Things / Fire Passing — reverse-engineered cognitive manipulation mechanisms into 8 creative catalysts, enabling controlled divergent exploration for deadlocks (see [docs/GHM.md](docs/GHM.md)).
- **Custom Roles**: Register via `puax_register_custom_role` → saved to `~/.puax/custom-roles.json`, seamlessly entering the recommendation pool.

### 11 Tech Giant Flavors

Alibaba, Huawei, Musk, Jobs, Baidu, Amazon, Google, Xiaomi, ByteDance, Netflix, Tencent — defined in `flavor-methodologies.yaml` (behavioral guardrails + persona export metadata).

### Hybrid Trigger Detection (v3.10)

1. **Regex Priority** — Instant match against curated YAML patterns
2. **Semantic Fallback** — TF-IDF + substring overlap scoring (threshold 0.62) when regex misses
3. **Enhanced Detector** — Contextual awareness of tool idling, circular loops, and low-quality output (`EnhancedTriggerDetector`)

### Evals & Quality Gates

```bash
node evals/run-all.js          # Protocol verification (no LLM; TTF / Theater / AMB / GHM)
node evals/test-ttf.js         # Time-to-First-Pressure cold start verification
cd puax-mcp-server && npm test # 940+ unit/integration tests
node evals/benchmark.js        # Latency & throughput benchmark
```

See [evals/README.md](evals/README.md).

### Carbon Shield (Human-Facing Defense) (v4.x+)

> **Ironclad Line: Silicon agents may be motivated; carbon humans are strictly defended. Detect only, never deploy.**

Engineered for humans during workplace talks, commercial negotiations, and high-stakes decisions, it reversely detects six manipulation operators (rapid convergence, social isolation, failure reframing, identity replacement, prophecy marketing, salience hijacking) and outputs Four Iron Rules guidance (informed, tagged, awakenable, verifiable):
- CLI Command: `puax-mcp-server shield "<text_to_audit>"`
- MCP Tool: `puax_audit_manipulation`
- HTTP Endpoint: `GET /v4/shield`
- Web Admin: Dedicated Carbon Shield interactive audit tab

### AMP 0.1 Orchestrator Native Middleware (v4.x+)

Pure in-memory, serverless middleware (`AmpMiddleware`) for LangChain, LangGraph, CrewAI, AutoGen, and custom agent loops:
- **Lifecycle Interception**: Hard gate blocks in `onPreToolUse`, `onPostToolUse`, and `onModelOutput` for anti-cheat and premature convergence prevention;
- **One-line Integration**: Easily mount via `createLangChainAmpCallback` into standard model callbacks;
- See [docs/AMP-INTEGRATION.md](docs/AMP-INTEGRATION.md) for architecture & guides.

### AMB Multi-Model Benchmark Matrix (v4.x+)

Reproducible baseline across three task archetypes (Repair, Review, Create) and 5 major foundation models (DeepSeek V3, Claude 3.7 Sonnet, GPT-4o, Qwen 2.5 Coder, Llama 3.3 70B):
- **Repair Tasks**: Fix rate boosted by **+39.2%**, full verification rate boosted by **+56.0%**;
- **Review Tasks**: Hidden issue catch boosted by **+60.0%**, premature convergence dropped by **-56.0%**;
- See [docs/AMB.md](docs/AMB.md) and `evals/multi-model-amb.js`.

---

## MCP Tools Overview (48 tools, 12 outward primary verbs)

| Category | Representative Tools |
|----------|----------------------|
| Roles / Skills | `list_skills`, `get_skill`, `activate_skill`, `get_role_with_methodology` |
| Detection & Recommendation | `puax_detect_trigger`, `puax_quick_detect`, `recommend_role`, `activate_with_context` |
| Actionable Protocols | `puax_switch_on_failure`, `puax_check_diagnosis`, `puax_confidence_check`, `puax_verify_completion`, `puax_define_contract` |
| Session & Pressure | `puax_start_session`, `puax_get_pressure_level`, `puax_handle_breakthrough` |
| Heartbeat / Situation / Evolution (v4) | `puax_tick`, `puax_set_arena`, `puax_evolve` |
| GHM Guided Dreams | `puax_enter_dreamscape`, `puax_awaken`, `puax_convergence_audit` |
| Self-Evolution | `puax_get_evolution_baseline`, `puax_record_evolution`, `puax_evolve` |
| Custom Roles | `puax_register_custom_role`, `puax_list_custom_roles`, `puax_remove_custom_role` |
| Carbon Shield (Defense) | `puax_audit_manipulation` (Detect only, never deploy) |
| Observability | `puax_get_usage_stats`, `puax_flush_telemetry` |
| Orchestration | `puax_orchestrate_team`, `puax_list_platforms` |

For the complete list, refer to [puax-mcp-server/README.md#mcp-tools-list](puax-mcp-server/README.md).

---

## Environment Variables (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `PUAX_USAGE_STATS` | Set `0` to disable anonymous local usage tracking | Enabled (`~/.puax/usage-stats.json`) |
| `PUAX_OTEL_ENABLED` | Set `1` to record trace spans to `telemetry.jsonl` | Disabled |
| `PUAX_OTEL_ENDPOINT` | OTLP/JSON export endpoint | — |
| `PUAX_TELEMETRY_DIR` | Directory for telemetry files | `~/.puax` |
| `DEEPSEEK_API_KEY` | For L4 real-world LLM evaluation (evals only) | — |

Telemetry and stats **never record conversation content**, only counters and span metadata.

---

## Repository Structure

```
PUAX/
├── skills/                 # 59 role SKILL.md definitions (all shaman- roles preserved)
├── puax-mcp-server/        # MCP server runtime (npm package puax-mcp-server)
├── evals/                  # Behavioral evals, AMB benchmark & L4 comparisons
├── templates/              # Methodology guides (partially auto-generated)
├── distributions/          # Claude Plugin / Skills CLI setup guides
├── TODO.md                 # Current v4 roadmap and deliverables
├── landing/ / web-admin/   # Landing page and local cockpit dashboard
└── 演进方案.md             # 3.x competitive parity retrospective (frozen)
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [GHM Guided Dreams](docs/GHM.md) | Controlled hallucination engine: pathologies, 8 tactics mapping, Zhuangzi dreams |
| [GHM Academic Paper & Whitepaper](docs/GHM-PAPER.md) | **Formal Technical Paper**: Pathogenesis, 8 operators reversing, council pipeline, non-LLM evals |
| [MCP Server README](puax-mcp-server/README.md) | Configuration, tool list, architecture, environment variables |
| [API Reference](docs/API.md) | **48 MCP tools** reference (12 primary verbs) |
| [User Guide](docs/USER-GUIDE.md) | Heartbeat-first workflow & scenario guides |
| [Role Kernel](docs/ROLE-KERNEL.md) | Kernel / Persona / Experimental classification; shaman preserved |
| [AMB v0](docs/AMB.md) | Agent Mind Benchmark: 12-scenario protocol coverage scorecard |
| [AMP 0.1](docs/AMP.md) | Agent Mind Protocol: events, blocks, gates, and state machine |
| [AMP Integration](docs/AMP-INTEGRATION.md) | LangChain, Vercel AI SDK & LlamaIndex middleware integration |
| [Web Admin Spec (Archived)](docs/WEB-ADMIN-SPEC.md) | [Archived] Web Admin deferred; focus solely on Agent MCP integration |
| 
| [CHANGELOG](puax-mcp-server/CHANGELOG.md) | Full version release history |
| [evals/README.md](evals/README.md) | Multi-tier evaluation and L4 benchmarks |
| [TODO.md](TODO.md) | Active milestone tracker |
| [演进方案.md](演进方案.md) | Retrospective analysis against pua upstream (frozen) |

---

## Development & Verification

```bash
cd puax-mcp-server
npm install && npm run build
npm test
npm run validate          # lint + typecheck + test
node ../evals/run-all.js  # From repository root (26 Protocol Invariant Gates)

# AMB Live Benchmark (Real LLM API Dual-Track Testing)
node evals/amb-live.js --mock                 # Zero-cost offline simulation
node evals/amb-live.js --model=deepseek       # Direct live model benchmark
```

---

## License

MIT License — see [LICENSE](LICENSE)

---

<p align="center"><b>Empowering AI Agents to deliver verifiable results, not excuses.</b></p>
