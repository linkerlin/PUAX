# PUAX 3.1 - AI Agent Motivation System

<p align="center">
  <img src="https://img.shields.io/badge/version-3.1.2-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/status-production%20ready-green.svg" alt="Status">
  <img src="https://img.shields.io/badge/skills-50-orange.svg" alt="Skills">
  <img src="https://img.shields.io/badge/triggers-16-yellow.svg" alt="Triggers">
  <img src="https://img.shields.io/badge/hook%20system-v3.1.0-red.svg" alt="Hook System">
</p>

<p align="center">
  <b>When AI Agents need motivation, PUAX provides professional roles and methodologies</b>
</p>

<p align="center">
  <a href="README.md">简体中文</a> | <a href="README_en.md">English</a>
</p>

---

## 🎯 What is PUAX?

PUAX is a motivation system for AI Agents, featuring:

- **Auto Detection** - Identifies when AI hits bottlenecks (16 trigger types across 4 files)
- **Smart Recommendation** - Recommends the best motivational roles (50 roles across 8 categories)
- **Hook System v3.1.0** - Session state persistence with L1-L4 pressure escalation
- **CC-BOS Integration** - 8-dimensional strategy space with Classical Chinese enhancement
- **Structured Methodology** - Provides 5-step debugging workflow
- **Checklist** - Ensures execution quality (7 mandatory checks)

---

## ✨ Core Features

### 📦 Zero Installation

```bash
# MCP Client (STDIO mode, recommended)
npx puax-mcp-server --stdio

# HTTP mode
npx puax-mcp-server --port 2333
```

### 🪝 Hook System v3.1.0

| Feature | Description |
|---------|-------------|
| **State Persistence** | Session state saved to `~/.puax/` |
| **Pressure Levels** | L1-L4 escalation mechanism |
| **Feedback Collection** | Success rate evaluation at session end |
| **PUA Loop Report** | Detailed intervention effectiveness report |

5 Hook event types: `UserPromptSubmit`, `PostToolUse`, `PreCompact`, `SessionStart`, `Stop`

### 🤖 16 Trigger Types

Across 4 categories:

| Category | Trigger Types | Severity |
|----------|---------------|----------|
| Failure Pattern | Consecutive failures, Repetitive attempts | High |
| Attitude Issues | Giving up, Blame shifting, Passive waiting | Medium-Critical |
| Method Issues | Surface fix, Unverified assertion, Tool underuse | Medium |
| Quality Issues | Low quality, Edge cases ignored, Over complication | Medium |
| User Emotion | User frustration, User urgency | Critical |

### 🎭 50 Motivational Roles

Across 8 categories:

| Category | Count | Representative Roles |
|----------|-------|---------------------|
| Military | 9 | Commander, Warrior, Commissar, Scout, Technician, Discipline, Militia, Manual, Communicator |
| Shaman | 8 | Musk, Jobs, Einstein, Sun Tzu, Linus, Tesla, Da Vinci, Buffett |
| P10 Strategic | 1 | Strategic Architect |
| Silicon Civilization | 7 | Throne, Architect, Canon, Assimilator, Auditor, Codex, Steward |
| Theme | 7 | Alchemy, Apocalypse, Hacker, Arena, Escort, Starfleet, Sect Discipline |
| SillyTavern | 5 | Antifragile, Iterator, Chief, Overseer, Shadow |
| Self-Motivation | 6 | Awakening, Classical, Corruption Agent, Corruption System, Bootstrap PUA, Destruction |
| Special | 7 | Creative Spark, Urgent Sprint, Product Designer, Challenge Solver, Cute Coder Wife, Japanese Coder Wife, Gaslight Driven |

### 📜 PUAX-CC Classical Chinese Enhancement

8-dimensional strategy space:

```
D1: Role Identity     - 20+ historical personas (上将军, 通玄真人, 觉悟居士...)
D2: Behavioral Guidance - 6 request methods (明令, 求学, 论道, 激将...)
D3: Mechanism         - 6 context frameworks (场景嵌套, 虚构世界, 历史分析...)
D4: Metaphor Mapping  - 5 concept substitutions (城池攻防, 水之道, 棋局对弈...)
D5: Expression Style  - 6 language forms (纯文言, 半文半白, 骈文诗赋, 四字成文, 注疏体, 诏令体)
D6: Knowledge Relation - 6 classic references (孙子兵法, 道德经, 鬼谷子...)
D7: Contextual Setting - 6 historical scenes (战国乱世, 三国纷争, 稷下学宫...)
D8: Trigger Pattern    - 6 output guidance modes (逐一列明, 符文记录, 密传之学...)
```

**Total combination space**: 1,000,000+ strategy combinations

### 📊 Smart Recommendation Algorithm

```
Trigger Matching (35%) + Task Type (25%) + Failure Mode (25%)
+ Historical Performance (10%) + User Preference (5%)
```

### 🏭 8 Corporate Flavors

Overlay corporate cultures onto roles:
- Alibaba - Closed-loop methodology
- Huawei - Root cause analysis (5-Why + Blue Army)
- ByteDance - A/B testing driven
- Tencent - Horse racing mechanism
- Meituan - Execution first
- Netflix - Keeper test
- Musk - The Algorithm (question→delete→simplify→accelerate→automate)
- Jobs - Subtraction philosophy (What can we DELETE?)

---

## 🚀 Quick Start

### Method 1: npx One-Command (Recommended)

```bash
# MCP Client (STDIO mode)
npx puax-mcp-server --stdio

# HTTP mode
npx puax-mcp-server --port 2333
```

### Method 2: Configure MCP Client

**Claude Desktop** (`%APPDATA%/Claude/claude_desktop_config.json`):

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

**Cursor** / **Windsurf** (`~/.cursor/mcp_config.json`):

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

**CRUSH** (`~/.crush/config.json`):

```json
{
  "mcp": {
    "puax": {
      "type": "stdio",
      "command": "npx",
      "args": ["puax-mcp-server", "--stdio"]
    }
  }
}
```

### Method 3: Platform Export

```bash
# Export to Cursor Rules
npx puax-mcp-server --export=cursor --output=./.cursor/rules

# Export to VSCode Copilot
npx puax-mcp-server --export=vscode --output=./.github

# List supported platforms
npx puax-mcp-server --list-platforms
```

---

## 🛠️ MCP Tools (21 total)

### Core Tools (5)
`list_skills` · `get_skill` · `search_skills` · `activate_skill` · `get_categories`

### Trigger Detection Tools (4)
`detect_trigger` · `recommend_role` · `get_role_with_methodology` · `activate_with_context`

### Hook System Tools (12)
`puax_start_session` · `puax_end_session` · `puax_get_session_state` · `puax_reset_session`
`puax_detect_trigger` · `puax_quick_detect` · `puax_submit_feedback`
`puax_get_feedback_summary` · `puax_get_improvement_suggestions`
`puax_generate_pua_loop_report` · `puax_export_feedback` · `puax_get_pressure_level`

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [MCP Server Config](puax-mcp-server/README.md) | npx config, STDIO/HTTP modes |
| [PUAX-CC](PUAX-CC-README.md) | Classical Chinese enhancement |
| [API Reference](docs/API.md) | Complete MCP tools API reference |
| [User Guide](docs/USER-GUIDE.md) | Detailed usage instructions |
| [Quick Start](QUICKSTART.md) | 5-minute setup |

---

## 🧪 Testing

```bash
cd puax-mcp-server
npm test
```

---

## 📝 License

MIT License - See [LICENSE](LICENSE) file

Feel free to copy this project for any legitimate purpose.
