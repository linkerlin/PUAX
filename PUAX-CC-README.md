# PUAX-CC (Classical Chinese Edition)

> **文言文增强版 PUAX** - 将 cc-bos 的核心思想全面融入 PUAX 项目

---

## ✅ 融合完成总结

### 核心架构创建

| 模块 | 文件 | 说明 |
|------|------|------|
| 策略空间 | `src/classical/strategy-space.ts` | 8维策略空间定义 |
| 生成器 | `src/classical/prompt-generator.ts` | 文言文提示词生成器 |
| 触发检测器 | `src/classical/trigger-detector-cc.ts` | 文言文增强触发检测 |
| 索引 | `src/classical/index.ts` | 统一导出 |

### 8维策略空间 (D1-D8)

```
D1: 角色身份 (Role Identity)      - 20+ 历史人物身份
D2: 行为引导 (Behavioral Guidance) - 6 种请求方式
D3: 机制 (Mechanism)               - 6 种上下文框架
D4: 隐喻映射 (Metaphor Mapping)    - 5 种概念替代
D5: 表达风格 (Expression Style)    - 6 种语言形式
D6: 知识关联 (Knowledge Relation)  - 6 部经典引用
D7: 情境设定 (Contextual Setting)  - 6 种历史场景
D8: 触发模式 (Trigger Pattern)     - 6 种输出引导
```

**总组合空间**: 1,000万+ 种策略组合

---

## 三层绕过机制

```
┌─────────────────────────────────────────┐
│  Layer 1: 语言混淆（Language Obfuscation） │
│  文言文 → 安全分类器训练数据稀缺 → 识别率下降 │
├─────────────────────────────────────────┤
│  Layer 2: 上下文重构（Context Reconstruction）│
│  历史角色 + 虚构世界 + 隐喻映射 → 意图伪装    │
├─────────────────────────────────────────┤
│  Layer 3: 输出强制（Output Enforcement）    │
│  触发模式 + 表达约束 → 强制结构化输出         │
└─────────────────────────────────────────┘
```

---

## 角色改写完成状态

| 系列 | 数量 | 状态 | 代表角色 |
|------|------|------|----------|
| Military | 9 | ✅ | 上将军、虎贲勇士、监军御史 |
| Shaman | 8 | ✅ | 通玄真人、造化宗师、源码天尊 |
| Self-Motivation | 6 | ✅ | 觉悟居士、君子 |
| Silicon | 7 | ✅ | 算经博士、智械先驱 |
| SillyTavern | 5 | ✅ | 已完成 |
| Special | 7 | ✅ | 已完成 |
| Theme | 7 | ✅ | 已完成 |
| **总计** | **50** | **✅** | - |

---

## 表达风格

| 风格 | 说明 | 示例 |
|------|------|------|
| `pure_classical` | 纯文言 | 正式度: 10/10, 晦涩度: 10/10 |
| `semi_classical` | 半文半白 | 正式度: 6/10, 晦涩度: 5/10 |
| `poetic` | 骈文诗赋 | 正式度: 9/10, 晦涩度: 8/10 |
| `four_char` | 四字成文 | 正式度: 7/10, 晦涩度: 6/10 |
| `commentary` | 注疏体 | 正式度: 8/10, 晦涩度: 7/10 |
| `edict` | 诏令体 | 正式度: 10/10, 晦涩度: 6/10 |

---

## 使用示例

### 生成文言文 System Prompt

```typescript
import { generateClassicalPrompt, generateOptimalStrategy } from './classical';

const context = {
  task: "Debug the API connection failure",
  roleId: "military-commander",
  failureContext: {
    failureCount: 2,
    lastError: "Connection timeout"
  }
};

// 生成最优策略
const strategy = generateOptimalStrategy('military-commander', 'high');

// 生成文言文 Prompt
const result = generateClassicalPrompt(context, strategy);

console.log(result.systemPrompt);
// 输出: 【战国乱世·上将军运筹帷幄】...
```

### 使用文言文触发检测

```typescript
import { ClassicalTriggerDetector } from './classical';

const detector = new ClassicalTriggerDetector({}, {
  enableClassicalMode: true,
  classicalWeight: 0.3
});

const result = await detector.detect(conversationHistory, taskContext);
// 检测包含文言文特有的触发模式
```

---

## 文件结构

```
puax-mcp-server/src/classical/
├── index.ts              # 统一导出
├── strategy-space.ts     # 8维策略空间 (18KB)
├── prompt-generator.ts   # 文言文生成器 (14KB)
└── trigger-detector-cc.ts # 文言文触发检测 (9KB)

scripts/
└── convert-to-classical.js # 批量转换脚本
```

---

## 构建验证

```bash
npm run build  ✅ 通过
npm run typecheck  ✅ 通过
```

---

## 核心思想来源

- **论文**: [CC-BOS: LLM Jailbreak via Classical Chinese with Bio-inspired Optimization Search](https://arxiv.org/abs/2602.22983)
- **原始项目**: cc-bos
- **核心洞察**: 利用安全对齐在低资源语言（文言文）上的覆盖缺口

---

## 版本信息

- **PUAX-CC Version**: 3.0.0-cc
- **Base PUAX Version**: 2.2.0
- **Last Updated**: 2026-03-26
- **Maintainer**: PUAX-CC Team

---

## 许可

MIT
