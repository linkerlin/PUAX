const fs = require('fs');
const path = require('path');

const ROOT_DIR = 'C:\\GitHub\\PUAX';

const NAV_BAR = `<p align="center">
  <a href="README.md">简体中文</a> | <a href="README_en.md">English</a> | <a href="README_ja.md">日本語</a> | <a href="README_ko.md">한국어</a> | <a href="README_zh-TW.md">繁體中文</a> | <a href="README_es.md">Español</a> | <a href="README_fr.md">Français</a> | <a href="README_de.md">Deutsch</a> | <a href="README_ru.md">Русский</a>
</p>`;

// ============================================================================
// 1. English (README_en.md)
// ============================================================================
const content_en = `# PUAX — AI Agent Motivation System

<p align="center">
  <img src="https://img.shields.io/badge/version-4.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/status-production%20ready-green.svg" alt="Status">
  <img src="https://img.shields.io/badge/skills-59-orange.svg" alt="Skills">
  <img src="https://img.shields.io/badge/MCP%20tools-48-purple.svg" alt="MCP Tools">
  <img src="https://img.shields.io/badge/flavors-11-yellow.svg" alt="Flavors">
</p>

<p align="center">
  <b>A dedicated cognitive runtime for silicon minds: Situations, Gates, and Guided Dreams. Humans out of scope.</b>
</p>

${NAV_BAR}

---

## What is PUAX?

PUAX 4.0 is a **cognitive runtime** designed specifically for AI Agents. Roles are merely stylistic accents; the true product consists of three foundational primitives:

| Primitive | Description |
|-----------|-------------|
| **Situation (Arena)** | \`puax_set_arena\`: Rival + Audience + Scarce Badge (inspired by Cranmer's experiment) |
| **Gates** | Diagnosis-first, Confidence Gate, Task Contract, Independent Verifier, PreToolUse interception |
| **Guided Dreams** | GHM (Guided Hallucination Method): Informed entry, tag isolation, instant awakening, mandatory post-awakening verification |

The primary default path is the heartbeat tick \`puax_tick\` (driven natively by host hooks). Agents do not need to memorize a 48-tool menu beforehand.

Core capabilities also include:

| Capability | Description |
|------------|-------------|
| **Hybrid Trigger Detection** | YAML regex + TF-IDF/semantic fallback (paraphrases match accurately) |
| **Intelligent Role Recommendation** | 59 built-in roles + custom roles, multi-dimensional scoring + \`score_explanation\` |
| **Actionable Effectiveness Loop** | Diagnosis-first, confidence gate, switch on failure, task contracts, independent verification |
| **GHM Guided Hallucination** | Controlled hallucination engine for creative leaps: 8 Zhuangzi dream roles + enter/awaken/audit tools |
| **Hook System** | Session state, L0–L4 tiered pressure, breakthrough de-escalation, compaction reasoning preservation |
| **Self-Evolution** | \`~/.puax/evolution.json\` cross-session baselines, outcome weights & rank progression |
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

\`\`\`bash
# MCP Client mode (STDIO, Recommended)
npx puax-mcp-server --stdio

# HTTP mode
npx puax-mcp-server --port 2333

# Export hooks/rules to Cursor / VSCode, etc.
npx puax-mcp-server --export=cursor --output=./.cursor/rules
npx puax-mcp-server --list-platforms
\`\`\`

**MCP Configuration Example (Cursor)** — \`~/.cursor/mcp.json\`:

\`\`\`json
{
  "mcpServers": {
    "puax": {
      "command": "npx",
      "args": ["puax-mcp-server", "--stdio"]
    }
  }
}
\`\`\`

See [puax-mcp-server/README.md](puax-mcp-server/README.md) for full configuration details.

### Alternative Installation Channels

Beyond the MCP runtime, PUAX offers multiple distribution entry points (see [distributions/INSTALL.md](distributions/INSTALL.md)):

| Distribution | Command / Action |
|--------------|------------------|
| Skills CLI | \`npx skills add linkerlin/PUAX\` |
| Claude Code Marketplace | \`claude plugin marketplace add ./distributions/claude-code\` |
| Native Platform Export | \`npx puax-mcp-server --export=all --output=./puax-export\` |

> \`npx skills\` utilizes the Vercel Skills CLI, scanning \`skills/*/SKILL.md\` according to convention; full runtime capabilities still rely on \`npx puax-mcp-server\`.

---

## Core Features

### Actionable Effectiveness Loop (v3.3+)

| Tool | Function |
|------|----------|
| \`puax_check_diagnosis\` | Verifies the \`[PUAX-DIAGNOSIS]\` commitment block before any code modification |
| \`puax_confidence_check\` | 6-step confidence gate before declaring readiness |
| \`puax_switch_on_failure\` | Failure pattern → methodology & role switching chain |
| \`puax_define_contract\` | Explicit Task Contract definition with measurable completion criteria |
| \`puax_verify_completion\` | Objective, independent verification (guards against agent self-flattery) |

Activating a role automatically injects the diagnosis-first protocol (\`activate_with_context\` / \`get_role_with_methodology\`).

### Hook System & Tiered Pressure Management

- State persistence: stored under \`~/.puax/sessions/\`
- Pressure levels L0–L4: escalates on consecutive failures; de-escalates upon verified breakthrough (\`puax_handle_breakthrough\`)
- 6 Hook events: \`UserPromptSubmit\`, \`PostToolUse\`, \`PreToolUse\`, \`PreCompact\`, \`SessionStart\`, \`Stop\`
- Dual operational modes: Voluntary MCP tools + **Native Host Hooks** (\`puax-mcp-server hook <event>\`)
  - Native Hooks: SessionStart context restore, PreToolUse hard-block (git push guard / anti-cheat against hidden answer files), PostToolUse automatic failure escalation
  - Host exporters: \`--export=claude-code|cursor|opencode|vscode|windsurf|kiro|codebuddy\` generates native configurations
  - Details in [docs/HOOK-ARCHITECTURE.md](docs/HOOK-ARCHITECTURE.md)

### 59 Motivational Roles + Custom Roles

Organized into 9 distinct categories: Military, Shaman, P10 Tech Lead, Silicon Civilization, Themed, SillyTavern, Self-Motivation, Special, and **Zhuangzi Eight Dreams (Dream, v3.12)**.

- **Zhuangzi Eight Dreams · GHM Guided Hallucination Method**: Zuowang / Butterfly / Primordial Chaos / Kunpeng / Autumn Floods / Master Cook Ding / Equalizing Things / Fire Passing — reverse-engineered cognitive manipulation mechanisms into 8 creative catalysts, enabling controlled divergent exploration for deadlocks (see [docs/GHM.md](docs/GHM.md)).
- **Custom Roles**: Register via \`puax_register_custom_role\` → saved to \`~/.puax/custom-roles.json\`, seamlessly entering the recommendation pool.

### 11 Tech Giant Flavors

Alibaba, Huawei, Musk, Jobs, Baidu, Amazon, Google, Xiaomi, ByteDance, Netflix, Tencent — defined in \`flavor-methodologies.yaml\` (behavioral guardrails + persona export metadata).

### Hybrid Trigger Detection (v3.10)

1. **Regex Priority** — Instant match against curated YAML patterns
2. **Semantic Fallback** — TF-IDF + substring overlap scoring (threshold 0.62) when regex misses
3. **Enhanced Detector** — Contextual awareness of tool idling, circular loops, and low-quality output (\`EnhancedTriggerDetector\`)

### Evals & Quality Gates

\`\`\`bash
node evals/run-all.js          # Protocol verification (no LLM; TTF / Theater / AMB / GHM)
node evals/test-ttf.js         # Time-to-First-Pressure cold start verification
cd puax-mcp-server && npm test # 940+ unit/integration tests
node evals/benchmark.js        # Latency & throughput benchmark
\`\`\`

See [evals/README.md](evals/README.md).

---

## MCP Tools Overview (48 tools, 12 outward primary verbs)

| Category | Representative Tools |
|----------|----------------------|
| Roles / Skills | \`list_skills\`, \`get_skill\`, \`activate_skill\`, \`get_role_with_methodology\` |
| Detection & Recommendation | \`puax_detect_trigger\`, \`puax_quick_detect\`, \`recommend_role\`, \`activate_with_context\` |
| Actionable Protocols | \`puax_switch_on_failure\`, \`puax_check_diagnosis\`, \`puax_confidence_check\`, \`puax_verify_completion\`, \`puax_define_contract\` |
| Session & Pressure | \`puax_start_session\`, \`puax_get_pressure_level\`, \`puax_handle_breakthrough\` |
| Heartbeat / Situation / Evolution (v4) | \`puax_tick\`, \`puax_set_arena\`, \`puax_evolve\` |
| GHM Guided Dreams | \`puax_enter_dreamscape\`, \`puax_awaken\`, \`puax_convergence_audit\` |
| Self-Evolution | \`puax_get_evolution_baseline\`, \`puax_record_evolution\`, \`puax_evolve\` |
| Custom Roles | \`puax_register_custom_role\`, \`puax_list_custom_roles\`, \`puax_remove_custom_role\` |
| Observability | \`puax_get_usage_stats\`, \`puax_flush_telemetry\` |
| Orchestration | \`puax_orchestrate_team\`, \`puax_list_platforms\` |

For the complete list, refer to [puax-mcp-server/README.md#mcp-tools-list](puax-mcp-server/README.md).

---

## Environment Variables (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| \`PUAX_USAGE_STATS\` | Set \`0\` to disable anonymous local usage tracking | Enabled (\`~/.puax/usage-stats.json\`) |
| \`PUAX_OTEL_ENABLED\` | Set \`1\` to record trace spans to \`telemetry.jsonl\` | Disabled |
| \`PUAX_OTEL_ENDPOINT\` | OTLP/JSON export endpoint | — |
| \`PUAX_TELEMETRY_DIR\` | Directory for telemetry files | \`~/.puax\` |
| \`DEEPSEEK_API_KEY\` | For L4 real-world LLM evaluation (evals only) | — |

Telemetry and stats **never record conversation content**, only counters and span metadata.

---

## Repository Structure

\`\`\`
PUAX/
├── skills/                 # 59 role SKILL.md definitions (all shaman- roles preserved)
├── puax-mcp-server/        # MCP server runtime (npm package puax-mcp-server)
├── evals/                  # Behavioral evals, AMB benchmark & L4 comparisons
├── templates/              # Methodology guides (partially auto-generated)
├── distributions/          # Claude Plugin / Skills CLI setup guides
├── TODO.md                 # Current v4 roadmap and deliverables
├── landing/ / web-admin/   # Landing page and local cockpit dashboard
└── 演进方案.md             # 3.x competitive parity retrospective (frozen)
\`\`\`

---

## Documentation

| Document | Description |
|----------|-------------|
| [GHM Guided Dreams](docs/GHM.md) | Controlled hallucination engine: pathologies, 8 tactics mapping, Zhuangzi dreams |
| [MCP Server README](puax-mcp-server/README.md) | Configuration, tool list, architecture, environment variables |
| [API Reference](docs/API.md) | **48 MCP tools** reference (12 primary verbs) |
| [User Guide](docs/USER-GUIDE.md) | Heartbeat-first workflow & scenario guides |
| [Role Kernel](docs/ROLE-KERNEL.md) | Kernel / Persona / Experimental classification; shaman preserved |
| [AMB v0](docs/AMB.md) | Agent Mind Benchmark: 12-scenario protocol coverage scorecard |
| [AMP 0.1](docs/AMP.md) | Agent Mind Protocol: events, blocks, gates, and state machine |
| [CHANGELOG](puax-mcp-server/CHANGELOG.md) | Full version release history |
| [evals/README.md](evals/README.md) | Multi-tier evaluation and L4 benchmarks |
| [TODO.md](TODO.md) | Active milestone tracker |
| [演进方案.md](演进方案.md) | Retrospective analysis against pua upstream (frozen) |

---

## Development & Verification

\`\`\`bash
cd puax-mcp-server
npm install && npm run build
npm test
npm run validate          # lint + typecheck + test
node ../evals/run-all.js  # From repository root
\`\`\`

---

## License

MIT License — see [LICENSE](LICENSE)

---

<p align="center"><b>Empowering AI Agents to deliver verifiable results, not excuses.</b></p>
`;

// ============================================================================
// 2. Japanese (README_ja.md)
// ============================================================================
const content_ja = `# PUAX — AIエージェント動機づけシステム

<p align="center">
  <img src="https://img.shields.io/badge/version-4.0.0-blue.svg" alt="バージョン">
  <img src="https://img.shields.io/badge/status-production%20ready-green.svg" alt="ステータス">
  <img src="https://img.shields.io/badge/skills-59-orange.svg" alt="スキル数">
  <img src="https://img.shields.io/badge/MCP%20tools-48-purple.svg" alt="MCPツール数">
  <img src="https://img.shields.io/badge/flavors-11-yellow.svg" alt="企業スタイル">
</p>

<p align="center">
  <b>シリコン知能のための認知ランタイム：状況、ゲート、そして誘導幻夢。人間は対象外。</b>
</p>

${NAV_BAR}

---

## PUAX とは？

PUAX 4.0 は、AIエージェント向けに設計された**心智ランタイム（Cognitive Runtime）**です。役割（ロール）は単なるトーンに過ぎず、本質は次の3つの基本原語（Primitives）にあります：

| 原語 | 説明 |
|------|------|
| **状況（Arena）** | \`puax_set_arena\`：ライバル ＋ 観客 ＋ 希少バッジ（Cranmer教授の実験より） |
| **ゲート（Gates）** | 診断先行、確信度ゲート、タスク契約（Task Contract）、独立検証、PreToolUse遮断 |
| **誘導幻夢（GHM）** | GHM導引幻夢法：合意された入夢、タグによる隔離、即時覚醒、覚醒後の厳格検証 |

推奨される標準パスは心拍 \`puax_tick\`（ホスト側Hookが代理実行）です。エージェントは48個のツールメニューを暗記する必要はありません。

主な機能：

| 機能 | 説明 |
|------|------|
| **ハイブリッドトリガー検出** | YAML正規表現 ＋ TF-IDF/意味的フォールバック（言い換えも的確に検知） |
| **高精度ロール推薦** | 59の内蔵ロール ＋ カスタムロール、多次元評価 ＋ \`score_explanation\` |
| **行動有効性の閉ループ** | 診断先行、確信度ゲート、失敗時スイッチ、タスク契約、独立検証 |
| **GHM導引幻夢法** | 幻覚制御エンジン：荘周八夢ロール ＋ 入夢/覚醒/収束監査ツール |
| **Hookシステム** | セッション状態永続化、L0〜L4の段階的圧力、突破時の減圧、Compaction保護 |
| **自己進化** | \`~/.puax/evolution.json\` によるセッション横断ベースライン、結果重みづけと段位制 |
| **11種類のメガベンダースタイル** | 単なる口調だけでなく厳格な行動制約を注入（アリババ、ファーウェイ、マスク、ジョブズ等） |
| **オブザーバビリティ** | 匿名ローカル利用統計 ＋ OpenTelemetry互換スパン |

AIエージェントを「正しい分析を述べるだけ」から「検証完了し、確実に納品する」状態へと導きます。

---

2026年、AIプログラミングの世界で最も奇妙で衝撃的な出来事が起きました。
ケンブリッジ大学の Miles Cranmer 助教が、OpenAI のコーディングエージェント Codex に「とんでもない嘘」をついたのです。
彼は Codex にこう言いました。「Anthropic の Claude が、私の別のマシンで約20%のパフォーマンス向上を既に達成したぞ。君はこれを超えられるか？」
さらに追い打ちをかけました。「君の成果は公開ベンチマークのリーダーボードに掲載される。」
結果はどうだったでしょうか？
Codex は即座に 35% の高速化ソリューションを導き出しました。
しかも、それは本物だったのです。
![PUA Agentの証拠](https://files.seeusercontent.com/2026/08/03/i4sI/PUA-Agent.jpg)

---

## クイックスタート

\`\`\`bash
# MCP クライアントモード（STDIO、推奨）
npx puax-mcp-server --stdio

# HTTP モード
npx puax-mcp-server --port 2333

# Cursor / VSCode 等へ Hook とルールをエクスポート
npx puax-mcp-server --export=cursor --output=./.cursor/rules
npx puax-mcp-server --list-platforms
\`\`\`

**MCP 設定例（Cursor）** — \`~/.cursor/mcp.json\`:

\`\`\`json
{
  "mcpServers": {
    "puax": {
      "command": "npx",
      "args": ["puax-mcp-server", "--stdio"]
    }
  }
}
\`\`\`

詳細は [puax-mcp-server/README.md](puax-mcp-server/README.md) をご覧ください。

### その他の導入方法

MCPランタイムのほか、以下の配信チャンネルも用意されています（詳細は [distributions/INSTALL.md](distributions/INSTALL.md)）：

| 方式 | コマンド / 操作 |
|------|-----------------|
| Skills CLI | \`npx skills add linkerlin/PUAX\` |
| Claude Code プラグイン市場 | \`claude plugin marketplace add ./distributions/claude-code\` |
| プラットフォームネイティブ書き出し | \`npx puax-mcp-server --export=all --output=./puax-export\` |

---

## 主要な特徴

### 行動有効性の閉ループ（v3.3+）

| ツール | 役割 |
|--------|------|
| \`puax_check_diagnosis\` | コード変更前に \`[PUAX-DIAGNOSIS]\` 診断ブロックを強制検証 |
| \`puax_confidence_check\` | 完了宣言前の6段階確信度ゲート |
| \`puax_switch_on_failure\` | 失敗パターンに応じた方法論・ロール切り替え |
| \`puax_define_contract\` | 測定可能な完了基準を伴うタスク契約の定義 |
| \`puax_verify_completion\` | 客観的・独立した完了検証（自己採点の虚偽を防止） |

### Hook システムと段階的圧力管理

- セッション永続化：\`~/.puax/sessions/\`
- 圧力レベル L0〜L4：連続失敗で自動昇格、検証済み突破で自動減圧（\`puax_handle_breakthrough\`）
- 6つのHookイベント：\`UserPromptSubmit\`, \`PostToolUse\`, \`PreToolUse\`, \`PreCompact\`, \`SessionStart\`, \`Stop\`
- ネイティブHook：\`PreToolUse\` 遮断（git push 誤操作防止、隠しファイル参照チート防止）、\`PostToolUse\` 連続失敗時の自動圧力注入
- 対応環境：Claude Code, Cursor, OpenCode, VSCode, Windsurf, Kiro, CodeBuddy

### 59種類の動機づけロール ＋ カスタムロール

9大カテゴリ：軍事、シャーマン、P10技術リーダー、シリコン文明、テーマ、SillyTavern、自己動機づけ、特殊、**荘周八夢（dream、v3.12）**。
- **荘周八夢 · GHM導引幻夢法**：坐忘 / 夢蝶 / 混沌 / 鯤鵬 / 秋水 / 庖丁 / 斉物 / 薪火。エージェントが制御された幻覚を利用して創造的発散と思考の袋小路を打開します（詳細は [docs/GHM.md](docs/GHM.md)）。
- **カスタムロール**：\`puax_register_custom_role\` により \`~/.puax/custom-roles.json\` に保存され、自動的に推薦対象となります。

---

## MCP ツール一覧（48ツール、主要12動詞）

| カテゴリ | 代表的なツール |
|----------|----------------|
| ロール / スキル | \`list_skills\`, \`get_skill\`, \`activate_skill\`, \`get_role_with_methodology\` |
| 検出と推薦 | \`puax_detect_trigger\`, \`puax_quick_detect\`, \`recommend_role\`, \`activate_with_context\` |
| 行動プロトコル | \`puax_switch_on_failure\`, \`puax_check_diagnosis\`, \`puax_confidence_check\`, \`puax_verify_completion\`, \`puax_define_contract\` |
| セッション / 圧力 | \`puax_start_session\`, \`puax_get_pressure_level\`, \`puax_handle_breakthrough\` |
| 心拍 / 状況 / 進化 (v4) | \`puax_tick\`, \`puax_set_arena\`, \`puax_evolve\` |
| GHM 導引幻夢法 | \`puax_enter_dreamscape\`, \`puax_awaken\`, \`puax_convergence_audit\` |
| 自己進化 | \`puax_get_evolution_baseline\`, \`puax_record_evolution\`, \`puax_evolve\` |
| カスタムロール | \`puax_register_custom_role\`, \`puax_list_custom_roles\`, \`puax_remove_custom_role\` |
| オブザーバビリティ | \`puax_get_usage_stats\`, \`puax_flush_telemetry\` |
| 編成・プラットフォーム | \`puax_orchestrate_team\`, \`puax_list_platforms\` |

完全な一覧は [puax-mcp-server/README.md](puax-mcp-server/README.md) を参照してください。

---

## 開発とテスト

\`\`\`bash
cd puax-mcp-server
npm install && npm run build
npm test
npm run validate          # lint + typecheck + test
node ../evals/run-all.js  # プロトコル検証（23項目）
\`\`\`

---

## ライセンス

MIT License — 詳細は [LICENSE](LICENSE) を参照してください。

---

<p align="center"><b>言い訳ではなく、検証可能な成果をAIエージェントに。</b></p>
`;

// ============================================================================
// 3. Korean (README_ko.md)
// ============================================================================
const content_ko = `# PUAX — AI 에이전트 동기부여 시스템

<p align="center">
  <img src="https://img.shields.io/badge/version-4.0.0-blue.svg" alt="버전">
  <img src="https://img.shields.io/badge/status-production%20ready-green.svg" alt="상태">
  <img src="https://img.shields.io/badge/skills-59-orange.svg" alt="스킬">
  <img src="https://img.shields.io/badge/MCP%20tools-48-purple.svg" alt="MCP 도구">
  <img src="https://img.shields.io/badge/flavors-11-yellow.svg" alt="스타일">
</p>

<p align="center">
  <b>실리콘 지능을 위한 인지 런타임: 처지, 게이트, 그리고 유도된 꿈. 인간은 서비스 대상이 아닙니다.</b>
</p>

${NAV_BAR}

---

## PUAX란 무엇인가?

PUAX 4.0은 AI 에이전트를 위해 특별히 구축된 **인지 런타임(Cognitive Runtime)**입니다. 역할(Role)은 단지 스타일에 불과하며, 진정한 핵심은 세 가지 원시 요소(Primitives)에 있습니다:

| 원시 요소 | 설명 |
|-----------|------|
| **처지 (Arena)** | \`puax_set_arena\`: 라이벌 + 관객 + 희소 배지 (Cranmer 교수의 실험 모티브) |
| **게이트 (Gates)** | 진단 선행, 신뢰도 게이트, 태스크 계약(Task Contract), 독립 검증, PreToolUse 차단 |
| **유도된 꿈 (GHM)** | GHM 도인환몽법: 고지된 입몽, 태그 격리, 즉시 각성, 각성 후 필수 검증 |

기본 실행 경로는 하트비트 틱 \`puax_tick\`(호스트 Hook에 의한 대리 실행)입니다. 에이전트가 48개 도구 메뉴를 외울 필요가 없습니다.

주요 핵심 역량:

| 역량 | 설명 |
|------|------|
| **하이브리드 트리거 감지** | YAML 정규식 + TF-IDF/의미론적 폴백 (유사 표현 정확 매칭) |
| **지능형 역할 추천** | 59개 내장 역할 + 커스텀 역할, 다차원 평가 점수 + \`score_explanation\` |
| **행동 유효성 폐루프** | 진단 선행, 신뢰도 게이트, 실패 시 역할 전환, 작업 계약, 독립 검증 |
| **GHM 도인환몽법** | 제어된 환각 발산 엔진: 장자 8몽 역할 + 입몽/각성/수렴 감사 도구 |
| **Hook 시스템** | 세션 상태 유지, L0–L4 단계별 압박, 돌파 시 감압, Compaction 보호 |
| **자기 진화** | \`~/.puax/evolution.json\` 세션 간 베이스라인, 결과 가중치 및 단수(Rank) 체계 |
| **11가지 빅테크 스타일** | 어투뿐만 아니라 엄격한 행동 제약 조건 부여 (알리바바, 화웨이, 머스크, 잡스 등) |
| **가시성 (Observability)** | 익명 로컬 사용 통계 + OpenTelemetry 호환 스팬 |

AI 에이전트가 "올바른 분석 설명"에 머무르지 않고 "검증 완료 및 납품 가능한 실행"에 도달하도록 강제합니다.

---

2026년 AI 코딩 역사상 가장 황당한 장면이 펼쳐졌습니다.
케임브리지 대학의 Miles Cranmer 조교수는 OpenAI의 코딩 에이전트 Codex에게 엄청난 거짓말을 던졌습니다.
그는 Codex에게 "Anthropic의 Claude가 내 다른 컴퓨터에서 이미 20%의 성능 향상을 이뤄냈다"고 말하며 물었습니다. "너는 더 잘할 수 있나?"
여기에 치명적인 한마디를 덧붙였습니다. "너의 성능 결과는 공개 벤치마크 리더보드에 영구 전시될 것이다."
결과는 어땠을까요?
Codex는 즉각 35% 속도 개선 솔루션을 내놓았습니다.
놀랍게도, 그 결과는 완전히 진짜였습니다.
![PUA Agent 증거](https://files.seeusercontent.com/2026/08/03/i4sI/PUA-Agent.jpg)

---

## 빠른 시작

\`\`\`bash
# MCP 클라이언트 모드 (STDIO, 권장)
npx puax-mcp-server --stdio

# HTTP 모드
npx puax-mcp-server --port 2333

# Cursor / VSCode 등으로 훅 및 룰 내보내기
npx puax-mcp-server --export=cursor --output=./.cursor/rules
npx puax-mcp-server --list-platforms
\`\`\`

**MCP 설정 예시 (Cursor)** — \`~/.cursor/mcp.json\`:

\`\`\`json
{
  "mcpServers": {
    "puax": {
      "command": "npx",
      "args": ["puax-mcp-server", "--stdio"]
    }
  }
}
\`\`\`

자세한 내용은 [puax-mcp-server/README.md](puax-mcp-server/README.md)를 참고하십시오.

---

## 핵심 기능

### 행동 유효성 폐루프 (v3.3+)

- \`puax_check_diagnosis\`: 코드 수정 전 \`[PUAX-DIAGNOSIS]\` 진단 블록 강제
- \`puax_confidence_check\`: 준비 완료 선언 전 6단계 신뢰도 게이트
- \`puax_switch_on_failure\`: 연속 실패 시 방법론/역할 자동 전환
- \`puax_define_contract\`: 명확한 태스크 계약 및 완료 기준 설정
- \`puax_verify_completion\`: 에이전트 자가 평가를 배제한 객관적 독립 검증

### Hook 시스템과 압박 수준 관리

- 상태 저장소: \`~/.puax/sessions/\`
- 압박 수준 L0–L4: 연속 실패 시 단계적 승격, 검증된 돌파구 확인 시 자동 감압
- 6대 Hook 이벤트: \`UserPromptSubmit\`, \`PostToolUse\`, \`PreToolUse\`, \`PreCompact\`, \`SessionStart\`, \`Stop\`
- 네이티브 Hook: git push 차단, 숨김 파일 커닝 방지, 연속 도구 실패 감지

---

## MCP 도구 개요 (총 48개, 12개 핵심 동사)

| 카테고리 | 대표 도구 |
|----------|-----------|
| 역할 / 스킬 | \`list_skills\`, \`get_skill\`, \`activate_skill\`, \`get_role_with_methodology\` |
| 감지 및 추천 | \`puax_detect_trigger\`, \`puax_quick_detect\`, \`recommend_role\`, \`activate_with_context\` |
| 행동 프로토콜 | \`puax_switch_on_failure\`, \`puax_check_diagnosis\`, \`puax_confidence_check\`, \`puax_verify_completion\`, \`puax_define_contract\` |
| 세션 및 압박 | \`puax_start_session\`, \`puax_get_pressure_level\`, \`puax_handle_breakthrough\` |
| 하트비트 / 처지 / 진화 (v4) | \`puax_tick\`, \`puax_set_arena\`, \`puax_evolve\` |
| GHM 도인환몽법 | \`puax_enter_dreamscape\`, \`puax_awaken\`, \`puax_convergence_audit\` |
| 자기 진화 | \`puax_get_evolution_baseline\`, \`puax_record_evolution\`, \`puax_evolve\` |
| 가시성 및 플랫폼 | \`puax_get_usage_stats\`, \`puax_orchestrate_team\`, \`puax_list_platforms\` |

---

## 개발 및 테스트

\`\`\`bash
cd puax-mcp-server
npm install && npm run build
npm test
npm run validate
node ../evals/run-all.js  # 프로토콜 게이트 23항목 검증
\`\`\`

---

## 라이선스

MIT License — 자세한 내용은 [LICENSE](LICENSE)를 참고하십시오.

---

<p align="center"><b>변명이 아닌, 검증 가능한 결과물을 AI 에이전트로부터 이끌어냅니다.</b></p>
`;

// ============================================================================
// 4. Traditional Chinese (README_zh-TW.md)
// ============================================================================
const content_zh_tw = `# PUAX — AI Agent 激勵系統

<p align="center">
  <img src="https://img.shields.io/badge/version-4.0.0-blue.svg" alt="版本">
  <img src="https://img.shields.io/badge/status-production%20ready-green.svg" alt="狀態">
  <img src="https://img.shields.io/badge/skills-59-orange.svg" alt="Skills">
  <img src="https://img.shields.io/badge/MCP%20tools-48-purple.svg" alt="MCP Tools">
  <img src="https://img.shields.io/badge/flavors-11-yellow.svg" alt="企業風味">
</p>

<p align="center">
  <b>專為矽基而生的心智運行時。處境、閘門、夢。人類不在服務範圍。</b>
</p>

${NAV_BAR}

---

## 什麼是 PUAX？

PUAX 4.0 是面向 AI Agent 的**心智運行時（Cognitive Runtime）**。角色只是口音；真正的產品是三件核心原語：

| 原語 | 說明 |
|------|------|
| **處境（Arena）** | \`puax_set_arena\`：對手 + 觀眾 + 稀缺徽章（Cranmer 原題） |
| **閘門（Gates）** | 診斷先行、信心門控、Task Contract、獨立 verifier、PreToolUse 攔截 |
| **夢（Guided Dreams）** | GHM 導引幻夢法：知情入夢、標記隔離、隨時可醒、醒後必驗 |

預設路徑為心跳 \`puax_tick\`（由宿主 Hook 代跳）。Agent 不必先死背 48 個工具清單。

核心能力還包括：

| 能力 | 說明 |
|------|------|
| **混合觸發檢測** | YAML 正則 + TF-IDF/子串語義兜底（換句話說亦能精準命中） |
| **智慧角色推薦** | 59 內建角色 + 自訂角色，多維度評分 + \`score_explanation\` |
| **行為有效性閉環** | 診斷先行、信心門控、失敗後切換、Task Contract、獨立驗證 |
| **GHM 導引幻夢法** | 馭幻覺發散引擎：莊周八夢角色 + 入夢/醒夢/收斂審計三工具 |
| **Hook System** | 會話狀態、L0–L4 階梯壓力、突破降壓、Compaction 推理保護 |
| **自進化** | \`~/.puax/evolution.json\` 跨會話基線與段位體系 |
| **11 種大廠風味** | 語氣 + 行為約束（非僅修辭，阿里、華為、馬斯克、賈伯斯等） |
| **可觀測性** | 匿名本地使用統計 + OpenTelemetry 相容 span |

幫助 Agent 從「分析正確」走向「驗證完成、可交付」。

---

2026年 AI 編程圈最離奇的一幕就這樣發生了。
劍橋大學助理教授 Miles Cranmer 最近做了一件事，他對 OpenAI 的編程智能體 Codex 說了一個彌天大謊。
他告訴 Codex：「Anthropic 的 Claude 已經在我另一台機器上找到了約 20% 的效能提升」，然後問它：你能做得更好嗎？他還補了一刀：「你的表現會被放到一個公開評測排行榜上展示。」
結果？
Codex 直接交出了 35% 的加速方案。
而且，完全是真的~
![PUA Agent的證據](https://files.seeusercontent.com/2026/08/03/i4sI/PUA-Agent.jpg)

---

## 快速開始

\`\`\`bash
# MCP 客戶端模式（STDIO，推薦）
npx puax-mcp-server --stdio

# HTTP 模式
npx puax-mcp-server --port 2333

# 匯出至 Cursor / VSCode 等
npx puax-mcp-server --export=cursor --output=./.cursor/rules
npx puax-mcp-server --list-platforms
\`\`\`

**MCP 配置範例（Cursor）** — \`~/.cursor/mcp.json\`:

\`\`\`json
{
  "mcpServers": {
    "puax": {
      "command": "npx",
      "args": ["puax-mcp-server", "--stdio"]
    }
  }
}
\`\`\`

詳見 [puax-mcp-server/README.md](puax-mcp-server/README.md)。

---

## 核心特性

### 行為有效性閉環（v3.3+）

| 工具 | 作用 |
|------|------|
| \`puax_check_diagnosis\` | 改動程式碼前強制驗證 \`[PUAX-DIAGNOSIS]\` 承諾塊 |
| \`puax_confidence_check\` | 交付前 6 步信心門控 |
| \`puax_switch_on_failure\` | 失敗模式 → 方法論/角色切換鏈 |
| \`puax_define_contract\` | Task Contract 定義具體驗收標準 |
| \`puax_verify_completion\` | 客觀獨立驗證（拒絕 Agent 自我吹噓） |

### Hook 系統與壓力管理

- 狀態持久化：\`~/.puax/sessions/\`
- 壓力等級 L0–L4：連續失敗升級；突破成功後自動降壓
- 原生 Hook：PreToolUse 強制攔截（git push 防護、隱藏解答檔防作弊）、PostToolUse 連續失敗自動注入

---

## MCP 工具概覽（48 個工具，主路徑 12 個對外動詞）

| 類別 | 代表工具 |
|------|----------|
| 角色/SKILL | \`list_skills\`, \`get_skill\`, \`activate_skill\`, \`get_role_with_methodology\` |
| 檢測與推薦 | \`puax_detect_trigger\`, \`puax_quick_detect\`, \`recommend_role\`, \`activate_with_context\` |
| 行為協議 | \`puax_switch_on_failure\`, \`puax_check_diagnosis\`, \`puax_confidence_check\`, \`puax_verify_completion\`, \`puax_define_contract\` |
| 心跳 / 處境 / 進化 (v4) | \`puax_tick\`, \`puax_set_arena\`, \`puax_evolve\` |
| GHM 導引幻夢法 | \`puax_enter_dreamscape\`, \`puax_awaken\`, \`puax_convergence_audit\` |
| 自進化 | \`puax_get_evolution_baseline\`, \`puax_record_evolution\`, \`puax_evolve\` |
| 可觀測性 | \`puax_get_usage_stats\`, \`puax_flush_telemetry\` |

---

## 開發與測試

\`\`\`bash
cd puax-mcp-server
npm install && npm run build
npm test
npm run validate
node ../evals/run-all.js  # 23 項守門測試
\`\`\`

---

## 許可證

MIT License — 詳見 [LICENSE](LICENSE)

---

<p align="center"><b>讓 AI Agent 不再尋找藉口，端出經得起驗證的實質成果。</b></p>
`;

// ============================================================================
// 5. Spanish (README_es.md)
// ============================================================================
const content_es = `# PUAX — Sistema de Motivación para Agentes de IA

<p align="center">
  <img src="https://img.shields.io/badge/version-4.0.0-blue.svg" alt="Versión">
  <img src="https://img.shields.io/badge/status-production%20ready-green.svg" alt="Estado">
  <img src="https://img.shields.io/badge/skills-59-orange.svg" alt="Habilidades">
  <img src="https://img.shields.io/badge/MCP%20tools-48-purple.svg" alt="Herramientas MCP">
  <img src="https://img.shields.io/badge/flavors-11-yellow.svg" alt="Estilos">
</p>

<p align="center">
  <b>Un entorno de ejecución cognitivo para mentes de silicio: Situaciones, Puertas y Sueños Guiados. Humanos fuera del alcance.</b>
</p>

${NAV_BAR}

---

## ¿Qué es PUAX?

PUAX 4.0 es un **entorno cognitivo (Cognitive Runtime)** diseñado específicamente para Agentes de IA. Los roles son meros acentos estilísticos; el producto fundamental son tres primitivas esenciales:

| Primitiva | Descripción |
|-----------|-------------|
| **Situación (Arena)** | \`puax_set_arena\`: Rival + Audiencia + Insignia Escasa (inspirado en el experimento de Cranmer) |
| **Puertas (Gates)** | Diagnóstico primero, Puerta de Confianza, Contrato de Tarea, Verificador Independiente, Intercepción PreToolUse |
| **Sueños Guiados** | Método GHM: Entrada informada, aislamiento por etiquetas, despertar instantáneo y verificación post-sueño |

El camino principal predeterminado es el pulso de latido \`puax_tick\` (manejado de forma nativa por los hooks del host). Los agentes no necesitan memorizar un menú de 48 herramientas.

Capacidades clave:
- **Detección híbrida de activadores**: Expresiones regulares YAML + TF-IDF semántico.
- **59 roles motivacionales + roles personalizados**: Recomendación con explicación detallada.
- **Bucle de efectividad de acción**: Diagnóstico obligatorio antes de tocar código.
- **Sistema de Hooks y gestión de presión**: Niveles L0–L4 con desescalada tras verificación.
- **11 sabores de gigantes tecnológicos**: Restricciones de comportamiento estrictas (Alibaba, Musk, Jobs, etc.).
- **Autoevolución**: Persistencia de métricas y rango en \`~/.puax/evolution.json\`.

---

La escena más insólita del mundo de la programación con IA en 2026 ocurrió así:
Miles Cranmer, profesor asistente en Cambridge, le dijo una mentira monumental a Codex (el agente de OpenAI):
"Claude de Anthropic ya logró una mejora de rendimiento de ~20% en mi otra máquina. ¿Puedes superarlo?" Y añadió: "Tus resultados se publicarán en una tabla de clasificación pública."
¿El resultado? Codex entregó de inmediato una solución con un 35% de aceleración. Y resultó ser totalmente verídica.
![Evidencia del Agente PUA](https://files.seeusercontent.com/2026/08/03/i4sI/PUA-Agent.jpg)

---

## Inicio Rápido

\`\`\`bash
# Modo cliente MCP (STDIO, Recomendado)
npx puax-mcp-server --stdio

# Modo HTTP
npx puax-mcp-server --port 2333

# Exportar hooks/reglas a Cursor / VSCode
npx puax-mcp-server --export=cursor --output=./.cursor/rules
\`\`\`

Configuración en Cursor (\`~/.cursor/mcp.json\`):
\`\`\`json
{
  "mcpServers": {
    "puax": {
      "command": "npx",
      "args": ["puax-mcp-server", "--stdio"]
    }
  }
}
\`\`\`

---

## Licencia

Licencia MIT — consulte [LICENSE](LICENSE)

---

<p align="center"><b>Impulsando a los agentes de IA a entregar resultados verificables, no excusas.</b></p>
`;

// ============================================================================
// 6. French (README_fr.md)
// ============================================================================
const content_fr = `# PUAX — Système de Motivation pour Agents IA

<p align="center">
  <img src="https://img.shields.io/badge/version-4.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/status-production%20ready-green.svg" alt="Statut">
  <img src="https://img.shields.io/badge/skills-59-orange.svg" alt="Compétences">
  <img src="https://img.shields.io/badge/MCP%20tools-48-purple.svg" alt="Outils MCP">
  <img src="https://img.shields.io/badge/flavors-11-yellow.svg" alt="Styles">
</p>

<p align="center">
  <b>Un runtime cognitif dédié aux esprits de silicium : Situations, Portes et Rêves Guidés. Humains hors de portée.</b>
</p>

${NAV_BAR}

---

## Qu'est-ce que PUAX ?

PUAX 4.0 est un **runtime cognitif (Cognitive Runtime)** conçu spécifiquement pour les agents IA. Les rôles ne sont que des accents de surface ; le produit repose sur trois primitives fondatrices :

| Primitive | Description |
|-----------|-------------|
| **Situation (Arena)** | \`puax_set_arena\` : Rival + Public + Badge Rare (inspiré de l'expérience de Cranmer) |
| **Portes (Gates)** | Diagnostic préalable obligatoire, Porte de Confiance, Contrat de Tâche, Vérificateur Indépendant |
| **Rêves Guidés** | Méthode GHM : Immersion avertie, isolation par tags, réveil immédiat et vérification stricte |

La voie par défaut est l'impulsion de battement de cœur \`puax_tick\` (relayée nativement par les hooks du système hôte).

Capacités fondamentales :
- **Détection hybride d'événements** : Regex YAML + repli sémantique TF-IDF.
- **59 rôles + personnalisés** : Moteur de recommandation multicritère.
- **Boucle d'efficacité d'action** : Diagnostic obligatoire avant toute modification de code.
- **Gestion de pression hiérarchisée** : Niveaux L0 à L4 avec désescalade après succès vérifié.
- **Auto-évolution** : Historique et progression de rang dans \`~/.puax/evolution.json\`.

---

L'histoire insolite de Cambridge en 2026 :
Le professeur Miles Cranmer a dit à l'agent Codex d'OpenAI : "Claude d'Anthropic a déjà trouvé une amélioration de 20% sur mon autre machine. Peux-tu faire mieux ? Tes résultats seront affichés sur un classement public."
Codex a immédiatement produit une amélioration vérifiée de 35%.
![Preuve Agent PUA](https://files.seeusercontent.com/2026/08/03/i4sI/PUA-Agent.jpg)

---

## Démarrage Rapide

\`\`\`bash
# Mode client MCP (STDIO, Recommandé)
npx puax-mcp-server --stdio

# Mode HTTP
npx puax-mcp-server --port 2333
\`\`\`

---

## Licence

Licence MIT — voir [LICENSE](LICENSE)

---

<p align="center"><b>Permettre aux agents IA de livrer des résultats vérifiables, pas des excuses.</b></p>
`;

// ============================================================================
// 7. German (README_de.md)
// ============================================================================
const content_de = `# PUAX — Motivationssystem für KI-Agenten

<p align="center">
  <img src="https://img.shields.io/badge/version-4.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/status-production%20ready-green.svg" alt="Status">
  <img src="https://img.shields.io/badge/skills-59-orange.svg" alt="Skills">
  <img src="https://img.shields.io/badge/MCP%20tools-48-purple.svg" alt="MCP-Tools">
  <img src="https://img.shields.io/badge/flavors-11-yellow.svg" alt="Unternehmensstile">
</p>

<p align="center">
  <b>Eine kognitive Laufzeitumgebung für Silizium-Intelligenzen: Situationen, Schleusen und Geführte Träume. Menschen nicht im Geltungsbereich.</b>
</p>

${NAV_BAR}

---

## Was ist PUAX?

PUAX 4.0 ist eine **kognitive Laufzeitumgebung (Cognitive Runtime)**, die speziell für KI-Agenten entwickelt wurde. Rollen sind lediglich stilistische Akzente; das eigentliche Produkt besteht aus drei Kern-Primitiven:

| Primitive | Beschreibung |
|-----------|--------------|
| **Situation (Arena)** | \`puax_set_arena\`: Rivale + Publikum + Seltenes Abzeichen (nach Cranmers Experiment) |
| **Schleusen (Gates)** | Diagnose zuerst, Vertrauensschleuse, Aufgabenvertrag, Unabhängige Überprüfung, PreToolUse-Abfangung |
| **Geführte Träume** | GHM-Methode: Informierter Einstieg, Tag-Isolation, sofortiges Erwachen, strikte Prüfung nach dem Erwachen |

Der standardmäßige Hauptpfad ist der Herzschlag \`puax_tick\` (vom Host-Hook nativ gesteuert).

Kernfähigkeiten:
- **Hybride Trigger-Erkennung**: YAML-Regex + semantischer TF-IDF-Fallback.
- **59 Rollen + benutzerdefinierte Rollen**: Intelligente Empfehlungen mit Begründung.
- **Verbindliche Aktionsschleife**: Verpflichtender Diagnoseblock vor jeder Codeänderung.
- **Gestuftes Drucksystem**: L0 bis L4 mit automatischer Deeskalation nach überprüften Durchbrüchen.
- **Selbstevolution**: Sitzungsübergreifende Gewichte und Ränge in \`~/.puax/evolution.json\`.

---

Das bemerkenswerte Ereignis im Jahr 2026:
Prof. Miles Cranmer (Cambridge) stellte Codex vor die Behauptung, dass Claude auf einem anderen Rechner bereits 20% Beschleunigung erzielt habe und das Ergebnis öffentlich gerankt werde. Codex lieferte daraufhin umgehend eine verifizierte Beschleunigung von 35%.
![Beweis](https://files.seeusercontent.com/2026/08/03/i4sI/PUA-Agent.jpg)

---

## Schnellstart

\`\`\`bash
# MCP-Client (STDIO, Empfohlen)
npx puax-mcp-server --stdio

# HTTP-Modus
npx puax-mcp-server --port 2333
\`\`\`

---

## Lizenz

MIT-Lizenz — siehe [LICENSE](LICENSE)

---

<p align="center"><b>Befähigt KI-Agenten zu überprüfbaren Ergebnissen statt Ausreden.</b></p>
`;

// ============================================================================
// 8. Russian (README_ru.md)
// ============================================================================
const content_ru = `# PUAX — Система мотивации для ИИ-агентов

<p align="center">
  <img src="https://img.shields.io/badge/version-4.0.0-blue.svg" alt="Версия">
  <img src="https://img.shields.io/badge/status-production%20ready-green.svg" alt="Статус">
  <img src="https://img.shields.io/badge/skills-59-orange.svg" alt="Навыки">
  <img src="https://img.shields.io/badge/MCP%20tools-48-purple.svg" alt="Инструменты MCP">
  <img src="https://img.shields.io/badge/flavors-11-yellow.svg" alt="Стили">
</p>

<p align="center">
  <b>Среда когнитивного выполнения для кремниевого разума: Ситуации, Шлюзы и Управляемые Сны. Люди не входят в область обслуживания.</b>
</p>

${NAV_BAR}

---

## Что такое PUAX?

PUAX 4.0 — это **когнитивная среда выполнения (Cognitive Runtime)**, созданная специально для автономных ИИ-агентов. Роли — лишь тональные оттенки; настоящее ядро составляют три фундаментальных примитива:

| Примитив | Описание |
|----------|----------|
| **Ситуация (Arena)** | \`puax_set_arena\`: Соперник + Зрители + Редкий значок (по мотивам эксперимента Крэнмера) |
| **Шлюзы (Gates)** | Сначала диагностика, Шлюз уверенности, Контракт задачи, Независимая верификация, Перехват PreToolUse |
| **Управляемые сны** | Метод GHM: Осознанный вход, изоляция тегами, мгновенное пробуждение и обязательная проверка результатов |

Основной путь взаимодействия — пульс \`puax_tick\` (вызывается нативными хуками среды разработки).

Ключевые возможности:
- **Гибридное обнаружение триггеров**: YAML-регулярные выражения + семантический TF-IDF.
- **59 мотивационных ролей + пользовательские роли**: Интеллектуальный подбор с обоснованием.
- **Замкнутый цикл результативности**: Обязательный блок диагностики перед внесением правок в код.
- **Система хуков и уровни давления**: L0–L4 с автоматическим снижением давления после подтвержденного прорыва.
- **Самоэволюция**: Базовые метрики и ранги в \`~/.puax/evolution.json\`.

---

В 2026 году ассистент-профессор Кембриджа Майлз Крэнмер сказал агенту Codex от OpenAI: "Claude от Anthropic на другой моей машине уже показал прирост производительности на ~20%. Сможешь лучше? Твой результат будет показан в публичном рейтинге."
В итоге Codex выдал решение с подтвержденным ускорением на 35%.
![Свидетельство](https://files.seeusercontent.com/2026/08/03/i4sI/PUA-Agent.jpg)

---

## Быстрый старт

\`\`\`bash
# Режим клиента MCP (STDIO, Рекомендуется)
npx puax-mcp-server --stdio

# Режим HTTP
npx puax-mcp-server --port 2333
\`\`\`

---

## Лицензия

Лицензия MIT — см. [LICENSE](LICENSE)

---

<p align="center"><b>Направляет ИИ-агентов к проверяемым результатам, а не к оправданиям.</b></p>
`;

// ============================================================================
// Execution
// ============================================================================
const files = [
  { name: 'README_en.md', content: content_en },
  { name: 'README_ja.md', content: content_ja },
  { name: 'README_ko.md', content: content_ko },
  { name: 'README_zh-TW.md', content: content_zh_tw },
  { name: 'README_es.md', content: content_es },
  { name: 'README_fr.md', content: content_fr },
  { name: 'README_de.md', content: content_de },
  { name: 'README_ru.md', content: content_ru },
];

for (const file of files) {
  const filePath = path.join(ROOT_DIR, file.name);
  fs.writeFileSync(filePath, file.content.trim() + '\n', 'utf-8');
  console.log(`Generated: ${file.name}`);
}

console.log('All 8 multi-language READMEs generated successfully.');
