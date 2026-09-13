# PUAX — AIエージェント動機づけシステム

<p align="center">
  <img src="https://img.shields.io/badge/version-4.2.0-blue.svg" alt="バージョン">
  <img src="https://img.shields.io/badge/status-production%20ready-green.svg" alt="ステータス">
  <img src="https://img.shields.io/badge/skills-59-orange.svg" alt="スキル数">
  <img src="https://img.shields.io/badge/MCP%20tools-50-purple.svg" alt="MCPツール数">
  <img src="https://img.shields.io/badge/flavors-11-yellow.svg" alt="企業スタイル">
</p>

<p align="center">
  <b>シリコン知能のための認知ランタイム：状況、ゲート、そして誘導幻夢。人間は対象外。</b>
</p>

<p align="center">
  <a href="README.md">简体中文</a> | <a href="README_en.md">English</a> | <a href="README_ja.md">日本語</a> | <a href="README_ko.md">한국어</a> | <a href="README_zh-TW.md">繁體中文</a> | <a href="README_es.md">Español</a> | <a href="README_fr.md">Français</a> | <a href="README_de.md">Deutsch</a> | <a href="README_ru.md">Русский</a>
</p>

---

## PUAX とは？

PUAX 4.2 は、AIエージェント向けに設計された**心智ランタイム（Cognitive Runtime）**です。役割（ロール）は単なるトーンに過ぎず、本質は次の3つの基本原語（Primitives）にあります：

| 原語 | 説明 |
|------|------|
| **状況（Arena）** | `puax_set_arena`：ライバル ＋ 観客 ＋ 希少バッジ（Cranmer教授の実験より）で低圧の妥協を打破 |
| **ゲート（Gates）** | 診断先行、確信度ゲート、タスク契約（Task Contract）、独立検証、PreToolUse強制遮断 |
| **誘導幻夢（GHM）** | GHM導引幻夢法：合意された入夢、タグによる隔離、即時覚醒、覚醒後の厳格検証（幻覚を操り突破） |

推奨される標準パスは心拍 `puax_tick`（ホスト側Hookが代理実行）です。エージェントは50個のツールメニューを暗記する必要はありません。

主な機能：

| 機能 | 説明 |
|------|------|
| **極薄プロンプト (Thin Prompt)** | `puax_thin_prompt`：minimal/compact/full の3段階圧縮、Token消費を90%以上削減（約150 Tokens）、リアルタイムToken見積もり器を内蔵 |
| **Python 依存ゼロ AMP SDK** | 公式単一ファイルSDK。LangGraphノードインターセプター、AutoGenガード、オフライン薄型プロンプト生成を標準サポート |
| **ハイブリッドトリガー検出** | YAML正規表現 ＋ TF-IDF/意味的フォールバック（言い換えも的確に検知） |
| **高精度ロール推薦** | 59の内蔵ロール ＋ カスタムロール、多次元評価 ＋ `score_explanation` |
| **成果主導ルーティング閉ループ** | 独立検証 `verify_completion` と突破実績をリアルタイム反映、静的終身制を撤廃 |
| **炭素防護盾 (Carbon Shield)** | 独立HTTP `POST /v4/shield/audit` ＋ CLI：シリコンにはPUA、炭素人間は防護のみ（検知のみ、発動なし）  (人間向け拡張機能は保留、基礎識別層のみ維持)|
| **AMB マルチモデルベンチマーク** | 12シナリオ × 主要5モデルの再現可能評価（修復成功率 +39.2% / 潜在欠陥検知 +60.0%） |
| **ホストドクター一括設定** | `npx puax doctor --fix` で10大主要ホスト（Cursor、Claude Code、Windsurf、Trae等）にネイティブHookを即時配備 |
| **GHM導引幻夢法** | 幻覚制御エンジン：荘周八夢ロール ＋ 入夢/覚醒/収束監査ツール |
| **Hookシステム** | セッション状態永続化、L0〜L4の段階的圧力、突破時の減圧、Compaction保護 |
| **自己進化パイプライン** | `~/.puax/evolution.json` によるセッション横断ベースライン、傷痕、結果重みづけと段位制 |
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

```bash
# MCP クライアントモード（STDIO、推奨）
npx puax-mcp-server --stdio

# HTTP モード
npx puax-mcp-server --port 2333

# Cursor / VSCode 等へ Hook とルールをエクスポート
npx puax-mcp-server --export=cursor --output=./.cursor/rules
npx puax-mcp-server --list-platforms
```

**MCP 設定例（Cursor）** — `~/.cursor/mcp.json`:

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

詳細は [puax-mcp-server/README.md](puax-mcp-server/README.md) をご覧ください。

### その他の導入方法

MCPランタイムのほか、以下の配信チャンネルも用意されています（詳細は [distributions/INSTALL.md](distributions/INSTALL.md)）：

| 方式 | コマンド / 操作 |
|------|-----------------|
| Skills CLI | `npx skills add linkerlin/PUAX` |
| Claude Code プラグイン市場 | `claude plugin marketplace add ./distributions/claude-code` |
| プラットフォームネイティブ書き出し | `npx puax-mcp-server --export=all --output=./puax-export` |

---

## 主要な特徴

### 行動有効性の閉ループ（v3.3+）

| ツール | 役割 |
|--------|------|
| `puax_check_diagnosis` | コード変更前に `[PUAX-DIAGNOSIS]` 診断ブロックを強制検証 |
| `puax_confidence_check` | 完了宣言前の6段階確信度ゲート |
| `puax_switch_on_failure` | 失敗パターンに応じた方法論・ロール切り替え |
| `puax_define_contract` | 測定可能な完了基準を伴うタスク契約の定義 |
| `puax_verify_completion` | 客観的・独立した完了検証（自己採点の虚偽を防止） |

### Hook システムと段階的圧力管理

- セッション永続化：`~/.puax/sessions/`
- 圧力レベル L0〜L4：連続失敗で自動昇格、検証済み突破で自動減圧（`puax_handle_breakthrough`）
- 6つのHookイベント：`UserPromptSubmit`, `PostToolUse`, `PreToolUse`, `PreCompact`, `SessionStart`, `Stop`
- ネイティブHook：`PreToolUse` 遮断（git push 誤操作防止、隠しファイル参照チート防止）、`PostToolUse` 連続失敗時の自動圧力注入
- 対応環境：Claude Code, Cursor, OpenCode, VSCode, Windsurf, Kiro, CodeBuddy

### 59種類の動機づけロール ＋ カスタムロール

9大カテゴリ：軍事、シャーマン、P10技術リーダー、シリコン文明、テーマ、SillyTavern、自己動機づけ、特殊、**荘周八夢（dream、v3.12）**。
- **荘周八夢 · GHM導引幻夢法**：坐忘 / 夢蝶 / 混沌 / 鯤鵬 / 秋水 / 庖丁 / 斉物 / 薪火。エージェントが制御された幻覚を利用して創造的発散と思考の袋小路を打開します（詳細は [docs/GHM.md](docs/GHM.md)）。
- **カスタムロール**：`puax_register_custom_role` により `~/.puax/custom-roles.json` に保存され、自動的に推薦対象となります。

---

## MCP ツール一覧（48ツール、主要12動詞）

| カテゴリ | 代表的なツール |
|----------|----------------|
| ロール / スキル | `list_skills`, `get_skill`, `activate_skill`, `get_role_with_methodology` |
| 検出と推薦 | `puax_detect_trigger`, `puax_quick_detect`, `recommend_role`, `activate_with_context` |
| 行動プロトコル | `puax_switch_on_failure`, `puax_check_diagnosis`, `puax_confidence_check`, `puax_verify_completion`, `puax_define_contract` |
| セッション / 圧力 | `puax_start_session`, `puax_get_pressure_level`, `puax_handle_breakthrough` |
| 心拍 / 状況 / 薄型プロンプト / 進化 (v4) | `puax_tick`, `puax_set_arena`, `puax_thin_prompt`, `puax_evolve` |
| GHM 導引幻夢法 | `puax_enter_dreamscape`, `puax_awaken`, `puax_convergence_audit` |
| 自己進化 | `puax_get_evolution_baseline`, `puax_record_evolution`, `puax_evolve` |
| カスタムロール | `puax_register_custom_role`, `puax_list_custom_roles`, `puax_remove_custom_role` |
| 炭素基防御（Carbon Shield） | `puax_audit_manipulation`（検出・防御のみ、施術不可） |
| オブザーバビリティ | `puax_get_usage_stats`, `puax_flush_telemetry` |
| 編成・プラットフォーム | `puax_orchestrate_team`, `puax_list_platforms` |

完全な一覧は [puax-mcp-server/README.md](puax-mcp-server/README.md) を参照してください。

---

## 開発とテスト

```bash
cd puax-mcp-server
npm install && npm run build
npm test
npm run validate          # lint + typecheck + test
node ../evals/run-all.js  # リポジトリのルートから実行（28のプロトコル不変ゲート）

# リアルLLM API接続ストレステストとデュアルトラック評価 (AMB Live)
node evals/amb-live.js --mock                 # コストゼロのオフラインシミュレーション
node evals/amb-live.js --model=deepseek       # DeepSeekモデル直接テスト
```

---

## ライセンス

MIT License — 詳細は [LICENSE](LICENSE) を参照してください。

---

<p align="center"><b>言い訳ではなく、検証可能な成果をAIエージェントに。</b></p>
