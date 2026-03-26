# PUAX 2.0 系统性改进方案与实施计划

> 基于 `./pua/` 与 `./puax/` 项目对比分析，找出 PUAX 相对 PUA 的不足之处，制定可分布实施的改进路线图

---

## 📊 执行摘要

### 核心发现

| 维度 | PUA (参考基准) | PUAX (当前状态) | 差距等级 |
|------|---------------|-----------------|---------|
| 平台生态覆盖 | 9+ 平台 | MCP 协议 only | 🔴 高 |
| 角色数量 | 13种方法论风味 | 42+ 角色/8种风味 | 🟡 中 |
| 产品化程度 | Landing Page + 官网 | https://puax.net/ | 🔴 高 |
| 多语言支持 | 中/英/日 | 中文为主 | 🟡 中 |
| Hook 系统 | 完整 v3 Hook | 无 | 🔴 高 |
| 社区运营 | 排行榜 + 反馈系统 | 基础框架 | 🟡 中 |
| 技术架构 | Skill 文件系统 | MCP Server | 🟢 PUAX领先 |
| 智能推荐 | 方法论路由 | 多维度评分算法 | 🟢 PUAX领先 |

### 建议优先级

```
P0 ( critical ) : 平台生态扩展、Hook系统、Landing Page
P1 ( high )     : 多语言、社区运营、方法论深度
P2 ( medium )   : 角色扩展、风味增加、文档完善
```

---

## 一、详细差距分析

### 1.1 平台生态覆盖差距 🔴

**PUA 支持的平台：**
- Claude Code (Plugin + Command)
- OpenAI Codex CLI
- Cursor (.mdc rules)
- Kiro (Steering + Skills)
- CodeBuddy (Skills)
- OpenClaw (Skills)
- Google Antigravity (Skills)
- OpenCode (Skills)
- VSCode Copilot (Instructions)

**PUAX 当前状态：**
- 仅 MCP Server 协议 (HTTP/SSE/STDIO)
- 依赖客户端支持 MCP

**影响：**
- 潜在用户群体受限
- 无法触达非 MCP 生态用户
- 与 PUA 相比市场竞争力弱

### 1.2 Hook 系统差距 🔴

**PUA v3 Hook 系统：**
```json
{
  "SessionStart": "注入 additionalContext + 恢复状态",
  "PostToolUse": "Bash 失败检测 + 压力升级",
  "UserPromptSubmit": "挫折语言拦截",
  "PreCompact": "状态持久化",
  "Stop": "反馈收集 + PUA Loop"
}
```

**PUAX 当前状态：**
- 无 Hook 系统
- 完全依赖客户端调用 MCP 工具
- 无法实现真正的自动触发

**影响：**
- "自动触发"只是被动等待客户端调用
- 无法实现跨会话状态保持
- 无法做到真正的"无感"介入

### 1.3 产品化与品牌差距 🔴

**PUA：**
- 专业 Landing Page (openpua.ai)
- 完整的品牌视觉系统
- Telegram/Discord 社区
- WeChat 群组运营
- 微信公众号/助手

**PUAX：**
- GitHub README 为主
- 无独立网站
- 社区运营缺失

### 1.4 方法论体系差距 🟡

**PUA 方法论深度：**
- 13种大厂风味，每种都有完整的方法论文档
- P7/P9/P10 分级角色体系
- Agent Team 协作模式
- 方法论智能路由

**PUAX：**
- 8种大厂风味
- 角色分类丰富但方法论深度不足
- 缺少分级体系

### 1.5 多语言支持差距 🟡

**PUA：**
- 中文 (默认)
- 英文 (PIP Edition)
- 日文

**PUAX：**
- 主要支持中文
- 英文支持不完整

---

## 二、改进路线图

### 阶段一：基础能力补齐 (P0) - 4周

#### Week 1-2: MCP 增强与 Hook 模拟

**目标：** 在不改变架构的前提下，最大化 MCP 的能力

| 任务 | 描述 | 产出 |
|------|------|------|
| MCP Sampling 集成 | 利用 MCP 2024-11 版本的 sampling 能力实现主动触发 | `src/mcp/sampling-client.ts` |
| 客户端状态同步 | 设计客户端状态同步协议 | `docs/client-state-protocol.md` |
| 自动触发增强 | 改进 `detect_trigger` 工具，支持更多触发模式 | 触发条件 +5 |

**技术方案：**
```typescript
// 利用 MCP sampling 实现类 Hook 行为
// 当 detect_trigger 检测到高置信度触发时，
// 通过 sampling 请求客户端执行特定提示词注入

interface SamplingRequest {
  messages: [
    {
      role: "assistant",
      content: {
        type: "text",
        text: "[PUAX Auto-Trigger] 检测到连续失败，建议激活 military-warrior 角色"
      }
    }
  ],
  systemPrompt: string,  // 注入的角色提示词
  maxTokens: 500
}
```

#### Week 3-4: 平台适配层

**目标：** 为非 MCP 平台提供支持

| 平台 | 适配方案 | 优先级 |
|------|---------|--------|
| Cursor | 生成 `.cursor/rules/puax.mdc` | P0 |
| VSCode Copilot | 生成 `.github/copilot-instructions.md` | P0 |
| Kiro | 生成 `.kiro/steering/puax.md` | P1 |
| CodeBuddy | 生成 `.codebuddy/skills/puax/SKILL.md` | P1 |

**实现：**
```bash
# 新增 CLI 命令
npx puax-mcp-server --export cursor --output ./.cursor/rules/
npx puax-mcp-server --export vscode --output ./.github/
npx puax-mcp-server --export kiro --output ./.kiro/steering/
```

### 阶段二：产品化建设 (P0-P1) - 6周

#### Week 5-6: Landing Page 开发

**技术栈：**
- 复用 PUA landing 的架构 (Vite + React + TypeScript + Tailwind)
- Cloudflare Pages 部署

**页面结构：**
```
/
├── index.html          # 首页 - 价值主张
├── guide.html          # 使用指南
├── leaderboard.html    # 排行榜 (集成现有数据)
├── marketplace.html    # 角色市场
├── contribute.html     # 贡献指南
└── blog/               # 博客文章
```

#### Week 7-8: 多语言支持

**目标：** 实现中/英双语支持

| 模块 | 工作量 | 策略 |
|------|-------|------|
| 角色描述 | 42个 × 2语言 | AI辅助翻译 + 人工校对 |
| 方法论文档 | 6大分类 | 优先翻译核心角色 |
| API 响应 | - | 根据请求头返回对应语言 |

**实现：**
```typescript
// src/i18n/index.ts
export const supportedLanguages = ['zh', 'en'] as const;

export function getRoleContent(roleId: string, lang: 'zh' | 'en'): RoleContent {
  const content = loadRoleBundle(roleId);
  return content[lang] || content.zh;
}
```

#### Week 9-10: 社区运营系统

**功能：**
1. **排行榜系统完善**
   - 对接 `analytics/role-analytics.ts`
   - 实时排行榜 API
   - 段位体系 (P5-P10)

2. **反馈收集**
   - 角色评分 (1-5星)
   - 使用体验反馈
   - 自动上报机制

### 阶段三：方法论深化 (P1) - 6周

#### Week 11-12: 方法论体系升级

**目标：** 将 PUA 的方法论深度引入 PUAX

| 角色分类 | 当前方法论 | 升级方向 |
|---------|-----------|---------|
| military | 军事五步法 | 增加战术手册、指挥链体系 |
| shaman | 名人思维 | 增加决策框架、思维模型 |
| theme | 场景沉浸 | 增加世界观设定、任务链 |
| self-motivation | 自驱协议 | 增加 High-Agency 五支柱 |

**新增内容：**
```yaml
# 方法论扩展
methodology_extensions:
  military:
    - 战术手册 (Tactical Playbook)
    - 指挥链协议 (Chain of Command)
    - 战情分析框架 (Situation Analysis)
  
  shaman:
    - 思维模型库 (Mental Models)
    - 决策框架 (Decision Framework)
    - 第一性原理训练
```

#### Week 13-14: P7/P9/P10 分级体系

**角色分级映射：**

| 级别 | 对应角色 | 能力范围 |
|------|---------|---------|
| P7 (骨干) | military-warrior, shaman-davinci | 执行 + 单点攻坚 |
| P9 (Tech Lead) | military-commander, sillytavern-chief | 团队协调 + 任务分配 |
| P10 (CTO) | 新增: strategic-architect | 战略规划 + 架构决策 |

**新增 P10 角色：**
```markdown
# strategic-architect (战略规划师)

## 定位
P10 CTO 级别的战略思考角色，专注于：
- 技术架构决策
- 长期规划制定
- 风险评估与规避
- 资源最优配置

## 能力
- 系统性思维
- 多维度权衡
- 长期价值判断
```

#### Week 15-16: Agent Team 协作模式

**目标：** 支持多 Agent 协作场景

**功能设计：**
```typescript
interface AgentTeamConfig {
  leader: 'strategic-architect' | 'military-commander';
  members: {
    executor: string;      // 执行者: military-warrior
    researcher: string;    // 研究员: shaman-einstein  
    reviewer: string;      // 审核员: sillytavern-chief
  };
  protocol: 'command-chain' | 'peer-to-peer';
}

// MCP Tool: configure_agent_team
```

### 阶段四：风味扩展与优化 (P2) - 4周

#### Week 17-18: 新增5种大厂风味

**新增风味：**
| 风味 | 来源 | 核心方法论 |
|------|-----|-----------|
| 🟠 Netflix | PUA | Keeper Test + 4A Feedback |
| ⬛ Musk | PUA | The Algorithm |
| ⬜ Jobs | PUA | 减法哲学 + DRI |
| 🔶 Amazon | PUA | Working Backwards |
| 🟦 JD | PUA | 客户体验零容忍 |

#### Week 19-20: 方法论智能路由

**实现：**
```typescript
// src/core/methodology-router.ts
export class MethodologyRouter {
  route(taskType: TaskType, failureMode: FailureMode): Methodology {
    // 任务类型 → 推荐方法论
    const taskMapping = {
      'debugging': 'huawei-rca',
      'building': 'musk-algorithm',
      'research': 'baidu-search',
      'architecture': 'amazon-backwards',
      'performance': 'bytedance-abtest'
    };
    
    // 失败模式 → 切换链
    const failureChains = {
      'spinning': ['musk', 'pinduoduo', 'huawei'],
      'giving_up': ['netflix', 'huawei', 'musk'],
      'poor_quality': ['jobs', 'xiaomi', 'netflix']
    };
    
    return this.selectMethodology(taskMapping[taskType], failureChains[failureMode]);
  }
}
```

---

## 三、技术实施细节

### 3.1 架构调整

```
puax/
├── puax-mcp-server/          # 现有 MCP 服务器
│   └── ...
├── 
├── platform-adapters/        # 【新增】平台适配器
│   ├── cursor/
│   │   └── adapter.ts        # 生成 .mdc 文件
│   ├── vscode/
│   │   └── adapter.ts        # 生成 copilot-instructions
│   └── common/
│       └── base-adapter.ts
│
├── landing/                  # 【新增】Landing Page
│   ├── src/
│   ├── public/
│   └── package.json
│
├── docs/                     # 【扩展】多语言文档
│   ├── zh/
│   ├── en/
│   └── ja/                   # 【未来】
│
└── scripts/                  # 【新增】构建脚本
    ├── export-platforms.ts   # 导出各平台配置
    └── generate-i18n.ts      # 生成 i18n 资源
```

### 3.2 MCP 能力增强

**新增 Tools：**

```typescript
// 1. 平台导出工具
interface ExportPlatformArgs {
  platform: 'cursor' | 'vscode' | 'kiro' | 'codebuddy';
  outputPath: string;
  roleFilter?: string[];
  flavorFilter?: string[];
}

// 2. 状态同步工具 (模拟 Hook)
interface SyncStateArgs {
  sessionId: string;
  state: {
    pressureLevel: number;
    failureCount: number;
    currentRole?: string;
  };
}

// 3. Agent Team 配置工具
interface ConfigureAgentTeamArgs {
  teamConfig: AgentTeamConfig;
  projectContext: string;
}
```

### 3.3 客户端集成 SDK

**@puax/client-sdk：**
```typescript
// 简化客户端集成
import { PUAXClient } from '@puax/client-sdk';

const puax = new PUAXClient({
  mcpServer: 'stdio',  // 或 HTTP URL
  autoTrigger: true,
  defaultLanguage: 'zh'
});

// 自动检测并触发
puax.on('triggerDetected', async (event) => {
  const role = await puax.recommendRole(event.triggers);
  await puax.activateRole(role.id);
});

// 状态同步
puax.syncState({
  pressureLevel: 2,
  failureCount: 3
});
```

---

## 四、里程碑与验收标准

### Milestone 1: 基础能力补齐 (Week 4)

**验收标准：**
- [ ] `detect_trigger` 支持 20+ 触发条件
- [ ] 支持 Cursor/VSCode 平台导出
- [ ] MCP Sampling 集成完成

### Milestone 2: 产品化上线 (Week 10)

**验收标准：**
- [ ] Landing Page 部署到 puax.ai
- [ ] 中英双语支持完成
- [ ] 排行榜系统上线

### Milestone 3: 方法论升级 (Week 16)

**验收标准：**
- [ ] 方法论深度与 PUA 持平
- [ ] P7/P9/P10 分级体系上线
- [ ] Agent Team 协作模式可用

### Milestone 4: 生态完善 (Week 20)

**验收标准：**
- [ ] 13种大厂风味全部支持
- [ ] 方法论智能路由实现
- [ ] 用户满意度达到 4.5/5

---

## 五、风险与缓解策略

| 风险 | 概率 | 影响 | 缓解策略 |
|------|-----|------|---------|
| MCP Sampling 支持有限 | 中 | 高 | 准备降级方案：客户端轮询 |
| 翻译质量不达标 | 中 | 中 | 建立社区校对机制 |
| 开发资源不足 | 高 | 高 | 分阶段实施，优先P0 |
| 与 PUA 定位重叠 | 低 | 中 | 差异化：技术深度 vs 产品广度 |

---

## 六、贡献指南

### 如何参与改进

1. **Fork 仓库** 并创建功能分支
2. **选择任务** 从上方路线图中选择
3. **提交 PR** 遵循现有 commit 规范

### 需要的贡献

- 🎭 **角色创作者**: 创建新角色
- 🌍 **翻译贡献者**: 英/日文翻译
- 💻 **平台适配**: 新平台适配器
- 📖 **文档维护**: 使用指南、API 文档

---

## 七、附录

### A. 参考资源

- PUA GitHub: https://github.com/tanweai/pua
- PUA Landing: https://openpua.ai
- MCP Protocol: https://modelcontextprotocol.io

### B. 术语对照

| PUA 术语 | PUAX 术语 | 说明 |
|---------|----------|------|
| Skill | Role | 角色/技能 |
| Flavor | Flavor | 大厂风味 |
| Hook | Sampling | 自动触发机制 |
| P7/P9/P10 | Role Level | 角色等级 |

### C. 变更日志

| 日期 | 版本 | 变更 |
|------|-----|------|
| 2026-03-25 | v1.0 | 初始版本 |

---

<p align="center">
  <b>让 PUAX 成为 AI Agent 激励系统的技术标杆</b>
</p>
