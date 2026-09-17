# PUAX — AI Agent 激勵系統

<p align="center">
  <img src="https://img.shields.io/badge/version-4.3.0-blue.svg" alt="版本">
  <img src="https://img.shields.io/badge/status-production%20ready-green.svg" alt="狀態">
  <img src="https://img.shields.io/badge/skills-59-orange.svg" alt="Skills">
  <img src="https://img.shields.io/badge/MCP%20tools-50-purple.svg" alt="MCP Tools">
  <img src="https://img.shields.io/badge/flavors-11-yellow.svg" alt="企業風味">
</p>

<p align="center">
  <b>專為矽基而生的心智運行時。處境、閘門、夢。人類不在服務範圍。</b>
</p>

<p align="center">
  <a href="README.md">简体中文</a> | <a href="README_en.md">English</a> | <a href="README_ja.md">日本語</a> | <a href="README_ko.md">한국어</a> | <a href="README_zh-TW.md">繁體中文</a> | <a href="README_es.md">Español</a> | <a href="README_fr.md">Français</a> | <a href="README_de.md">Deutsch</a> | <a href="README_ru.md">Русский</a>
</p>

---

## 什麼是 PUAX？

PUAX 4.3 是面向 AI Agent 的**心智運行時（Cognitive Runtime）**。角色只是口音；真正的產品是三件核心原語：

| 原语 | 說明 |
|------|------|
| **處境（Arena）** | `puax_set_arena`：對手 + 觀眾 + 稀缺徽章（Cranmer 原題），擊碎低壓平庸 |
| **閘門（Gates）** | 診斷先行、信心門控、Task Contract、獨立 verifier、PreToolUse 強制攔截 |
| **夢（Guided Dreams）** | GHM 導引幻夢法：知情入夢、標記隔離、隨時可醒、醒後必驗（馭幻覺破局） |

預設路徑為心跳 `puax_tick`（由宿主 Hook 代跳）。Agent 不必先死背 50 個工具清單。

核心能力還包括：

| 能力 | 說明 |
|------|------|
| **極簡薄注入 (Thin Prompt)** | `puax_thin_prompt`：支援 minimal/compact/full 三檔壓縮，Token 消耗壓降 90% 以上（~150 Tokens），附帶毫秒級 Token 估算器 |
| **Python 零依賴 AMP SDK** | 官方單檔案中介軟體，支援 LangGraph 節點攔截裝飾器、AutoGen 看門狗與離線薄注入編譯 |
| **混合觸發檢測** | YAML 正則 + TF-IDF/子串語義兜底（換句話說亦能精準命中） |
| **智慧角色推薦** | 59 內建角色 + 自訂角色，多維度評分 + `score_explanation` |
| **結局驅動路由閉環** | 獨立驗證 `verify_completion` 與突破實績回寫，廢除靜態終身制 |
| **碳基防禦盾 (Shield)** | 獨立 HTTP `POST /v4/shield/audit` + CLI：矽基可 PUA，碳基只防禦（只識別，不施放）  （自然人向終端外延功能暫緩，維持基礎識別層）|
| **AMB 多模型基準** | 12 場景 × 5 主流模型 Profile 可復現矩陣（修復率 +39.2% / 隐蔽問題 +60.0%） |
| **宿主醫生一鍵掛載** | `npx puax doctor --fix` 同步覆蓋 10 大主流宿主（Cursor, Claude Code, Windsurf, Trae 等）注入原生鉤子 |
| **GHM 導引幻夢法** | 馭幻覺發散引擎：莊周八夢角色 + 入夢/醒夢/收斂審計三工具 |
| **Hook System** | 會話狀態、L0–L4 階梯壓力、突破降壓、Compaction 推理保護 |
| **自進化管線** | `~/.puax/evolution.json` 跨會話基線、傷痕、段位與命名 Agent 檔案 |
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

```bash
# MCP 客戶端模式（STDIO，推薦）
npx puax-mcp-server --stdio

# HTTP 模式
npx puax-mcp-server --port 2333

# 匯出至 Cursor / VSCode 等
npx puax-mcp-server --export=cursor --output=./.cursor/rules
npx puax-mcp-server --list-platforms
```

**MCP 配置範例（Cursor）** — `~/.cursor/mcp.json`:

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

詳見 [puax-mcp-server/README.md](puax-mcp-server/README.md)。

---

## 核心特性

### 行為有效性閉環（v3.3+）

| 工具 | 作用 |
|------|------|
| `puax_check_diagnosis` | 改動程式碼前強制驗證 `[PUAX-DIAGNOSIS]` 承諾塊 |
| `puax_confidence_check` | 交付前 6 步信心門控 |
| `puax_switch_on_failure` | 失敗模式 → 方法論/角色切換鏈 |
| `puax_define_contract` | Task Contract 定義具體驗收標準 |
| `puax_verify_completion` | 客觀獨立驗證（拒絕 Agent 自我吹噓） |

### Hook 系統與壓力管理

- 狀態持久化：`~/.puax/sessions/`
- 壓力等級 L0–L4：連續失敗升級；突破成功後自動降壓
- 原生 Hook：PreToolUse 強制攔截（git push 防護、隱藏解答檔防作弊）、PostToolUse 連續失敗自動注入

---

## MCP 工具概覽（48 個工具，主路徑 12 個對外動詞）

| 類別 | 代表工具 |
|------|----------|
| 角色/SKILL | `list_skills`, `get_skill`, `activate_skill`, `get_role_with_methodology` |
| 檢測與推薦 | `puax_detect_trigger`, `puax_quick_detect`, `recommend_role`, `activate_with_context` |
| 行為協議 | `puax_switch_on_failure`, `puax_check_diagnosis`, `puax_confidence_check`, `puax_verify_completion`, `puax_define_contract` |
| 心跳 / 處境 / 薄注入 / 進化 (v4) | `puax_tick`, `puax_set_arena`, `puax_thin_prompt`, `puax_evolve` |
| GHM 導引幻夢法 | `puax_enter_dreamscape`, `puax_awaken`, `puax_convergence_audit` |
| 自進化 | `puax_get_evolution_baseline`, `puax_record_evolution`, `puax_evolve` |
| 碳基防禦面（Carbon Shield） | `puax_audit_manipulation`（只識別，不施放） |
| 可觀測性 | `puax_get_usage_stats`, `puax_flush_telemetry` |

---

## 開發與測試

```bash
cd puax-mcp-server
npm install && npm run build
npm test
npm run validate
node ../evals/run-all.js  # 從儲存庫根目錄執行（31 項協議鐵律門禁）

# 眞實大模型 API 連通壓測與雙軌對比評測 (AMB Live)
node evals/amb-live.js --mock                 # 離線模擬壓測（零成本、秒級閉環）
node evals/amb-live.js --model=deepseek       # 直連 DeepSeek 眞實雙軌評測
```

---

## 許可證

MIT License — 詳見 [LICENSE](LICENSE)

---

<p align="center"><b>讓 AI Agent 不再尋找藉口，端出經得起驗證的實質成果。</b></p>
