# PUAX 2.1 - AI Agent Motivation System

<p align="center">
  <img src="https://img.shields.io/badge/version-2.1.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/status-production%20ready-green.svg" alt="Status">
  <img src="https://img.shields.io/badge/skills-46+-orange.svg" alt="Skills">
  <img src="https://img.shields.io/badge/triggers-15-yellow.svg" alt="Triggers">
</p>

<p align="center">
  <b>When AI Agents need motivation, PUAX provides professional roles and methodologies</b>
</p>

<p align="center">
  <a href="README.md">简体中文</a> | <a href="README_en.md">English</a>
</p>

---

## 🎯 What is PUAX?

PUAX is a motivation system designed for AI Agents, featuring:

- **Auto Detection** - Identifies when AI hits bottlenecks (15 trigger types)
- **Smart Recommendation** - Recommends the best motivational roles (46+ roles)
- **Structured Methodology** - Provides 5-step debugging workflow
- **Checklist** - Ensures execution quality (7 mandatory checks)

Help AI Agents break through difficulties and improve problem-solving capabilities.

---

## ✨ Core Features

### 📦 Zero Installation

```bash
# MCP Client (STDIO mode, recommended)
npx puax-mcp-server --stdio

# HTTP mode
npx puax-mcp-server
```

### 🤖 Auto Trigger Detection

Detects **15 types** of scenarios requiring intervention:

| Category | Trigger Types | Severity |
|----------|---------------|----------|
| Failure Pattern | Consecutive failures, Repetitive attempts, Parameter tweaking | High |
| Attitude Issues | Giving up language, Blame shifting, Passive waiting | Medium-Critical |
| User Emotion | User frustration | Critical |
| Method Issues | Surface fix, No verification, Tool underuse | Medium |
| Quality Issues | Low quality output, Ignored edge cases, Over complication | Medium |

### 🎭 46+ Motivational Roles

Professional roles across 7 categories:

| Category | Count | Representative Roles |
|----------|-------|---------------------|
| Military | 9 | Commander, Warrior, Commissar, Scout |
| Shaman | 8 | Musk, Jobs, Einstein, Sun Tzu |
| Silicon Civilization | 4 | Core Controller, Civilization Builder |
| Theme | 7 | Alchemy, Apocalypse Survival, Cyber Hacker |
| SillyTavern | 5 | Antifragile Reviewer, Iron Chief of Staff |
| Self-Motivation | 6 | Awakening, Self-Destruction Rebirth |
| Special | 5 | Creative Spark, Urgent Sprint |

### 📊 Smart Recommendation Algorithm

```
Trigger Matching (35%)
├── Failure pattern recognition
├── Language pattern detection
└── Tool usage analysis

Task Type Matching (25%)
├── Debugging/Development/Review
├── Urgent/Planned/Creative
└── Scenario adaptation

Failure Mode Matching (25%)
├── Round progression strategy
├── Pressure escalation mechanism
└── Role rotation logic

History (10%) + User Preference (5%)
```

### 🏭 8 Corporate Flavors

Overlay different corporate cultures onto roles:
- Alibaba - Closed-loop methodology
- Huawei - Root cause analysis
- ByteDance - A/B testing driven
- Tencent - Horse racing mechanism
- Meituan - Execution first
- Netflix - Keeper test
- Musk - The Algorithm
- Jobs - Subtraction philosophy

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

**Cursor** (`~/.cursor/mcp_config.json`):

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

## 🛠️ MCP Tools

### 1. detect_trigger - Trigger Detection

```typescript
const result = await client.callTool('detect_trigger', {
  conversation_history: [
    { role: 'assistant', content: 'Trying to connect... failed' },
    { role: 'user', content: 'Why is it still not working?' }
  ],
  task_context: { attempt_count: 2 }
});
```

### 2. recommend_role - Role Recommendation

```typescript
const result = await client.callTool('recommend_role', {
  detected_triggers: ['user_frustration'],
  task_context: { task_type: 'debugging', urgency: 'critical' }
});
```

### 3. activate_with_context - One-Click Activation

```typescript
const result = await client.callTool('activate_with_context', {
  context: { conversation_history: messages },
  options: { auto_detect: true }
});
```

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [MCP Server Config](puax-mcp-server/README.md) | npx config guide, STDIO/HTTP mode details |
| [API Reference](docs/API.md) | Complete MCP tools API reference |
| [User Guide](docs/USER-GUIDE.md) | Detailed usage instructions |
| [Hook System Analysis](Hook系统改进分析.md) | Hook trigger principles and improvement plans |
| [Improvement Plan](TODO.md) | Project improvement roadmap |
| [Contributing](community/CONTRIBUTING.md) | How to contribute roles |

---

## 🧪 Testing

```bash
cd puax-mcp-server
npm test
```

---

## 🤝 Contributing

```bash
# 1. Create role from template
cp templates/SKILL-v2.0-template.md skills/my-role/SKILL.v2.md

# 2. Validate role
node scripts/validate-role.js my-role

# 3. Generate bundle
cd puax-mcp-server && npm run generate-bundle
```

---

## 📝 License

MIT License - See [LICENSE](LICENSE) file

Feel free to copy this project for any legitimate purpose.

---

## 🙏 Acknowledgments

Thanks to all contributors and users for your support!

---

<p align="center">
  <b>No AI Agent fights alone</b>
</p>
