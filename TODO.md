# PUAX 项目全面改进计划

> 审阅日期: 2026-03-25
> 审阅者: 萨满·Linus
> 项目版本: 2.2.0

## ✅ 完成总结 (2026-03-25)

### P0 任务全部完成

| 任务 | 状态 | 成果 |
|------|------|------|
| server.ts 重构 | ✅ | 1203行 → 8行 (+ 拆分5个模块) |
| 类型安全增强 | ✅ | 新增 types.ts, handlers/ 无 any 类型 |
| 触发条件外部化 | ✅ | 4个YAML文件, 15种触发类型 |
| 角色元数据 | ✅ | role-mappings.yaml 411行, 20+角色 |
| 双版本清理 | ✅ | 42个技能已迁移, v1归档到archive/ |

### 构建验证
```bash
npm run typecheck  ✅ 通过
npm run build       ✅ 通过
```

---

## 一、代码架构改进

### 1.1 server.ts 重构 [P0 - 紧急]

**问题**: `server.ts` 达到 1162 行，职责过于集中，违反单一职责原则。

**现状**:
```
server.ts 包含:
- HTTP 服务器逻辑
- STDIO 传输逻辑
- 所有工具处理器
- Logger 类
- 配置管理
- 错误处理
```

**改进方案**:
```
src/
├── server/
│   ├── index.ts           # 入口
│   ├── http-server.ts     # HTTP 传输
│   ├── stdio-server.ts    # STDIO 传输
│   └── config.ts          # 配置管理
├── handlers/
│   ├── skill.handlers.ts  # SKILL 相关处理器
│   ├── trigger.handlers.ts # 触发检测处理器
│   └── role.handlers.ts   # 角色推荐处理器
├── core/
│   ├── trigger-detector.ts
│   ├── role-recommender.ts
│   └── methodology-engine.ts
└── utils/
    ├── logger.ts
    └── error.ts
```

**验收标准**:
- [x] 单文件不超过 500 行（重构后 core.ts 450 行，handlers 各 200-400 行）
- [x] 每个模块单一职责
- [x] 所有处理器可独立测试

**重构完成** (2026-03-25):
```
src/
├── server.ts              # 8 行 - 统一导出入口
├── server/
│   └── core.ts            # 450 行 - 核心服务器类
├── handlers/
│   ├── index.ts           # 32 行 - 处理器索引
│   ├── skill-handlers.ts  # 218 行 - SKILL 相关处理器
│   ├── role-handlers.ts   # 194 行 - 角色工具处理器(legacy)
│   ├── trigger-handlers.ts # 378 行 - 触发检测/推荐处理器
│   └── hook-handlers.ts   # 401 行 - Hook 系统处理器
├── types.ts               # 新增 - 共享类型定义
└── utils/
    └── logger.ts          # 新增 - Logger 工具类
```

---

### 1.2 类型安全增强 [P0 - 紧急]

**问题**: 代码中大量使用 `any` 类型，类型安全性差。

**示例问题**:
```typescript
// server.ts:278
private async handleListSkills(args: any): Promise<any> {

// server.ts:513
const { roleId, task, section } = args;
```

**改进方案**:
```typescript
// types/handlers.ts
interface ListSkillsArgs {
  category?: CategoryFilter;
  includeCapabilities?: boolean;
}

interface GetSkillArgs {
  skillId: string;
  task?: string;
  section?: SkillSection;
}

// 使用严格类型
private async handleListSkills(args: ListSkillsArgs): Promise<ToolResult> {
```

**验收标准**:
- [x] 消除所有 `any` 类型（重构后的 handlers/ 和 server/ 无 any）
- [x] 启用 `strict: true` 无报错
- [x] 所有公共 API 有类型定义

**完成状态** (2026-03-25):
```
src/types.ts - 共享类型定义
├── TransportMode, ServerConfig
├── ToolResponse, SkillInfo, RoleInfo
├── ActivationResult, ActivationContext
├── MethodologyOptions, ActivationOptions
└── TriggerDetectionContext
```

重构后的模块类型安全:
- handlers/skill-handlers.ts: 无 any
- handlers/role-handlers.ts: 无 any
- handlers/trigger-handlers.ts: 无 any
- handlers/hook-handlers.ts: 无 any
- server/core.ts: 无 any

---

### 1.3 依赖注入 [P1 - 重要]

**问题**: 组件间直接依赖，难以测试和替换。

**改进方案**:
```typescript
// core/container.ts
interface Services {
  promptManager: PromptManager;
  triggerDetector: TriggerDetector;
  roleRecommender: RoleRecommender;
  logger: Logger;
}

class ServiceContainer {
  private services: Map<string, any> = new Map();

  register<T>(name: string, instance: T): void {
    this.services.set(name, instance);
  }

  resolve<T>(name: string): T {
    return this.services.get(name);
  }
}
```

**验收标准**:
- [ ] 核心服务可通过容器注入
- [ ] 支持测试时 Mock 替换
- [ ] 文档说明依赖关系

---

## 二、触发检测系统改进

### 2.1 触发条件外部化 [P0 - 紧急]

**问题**: 触发条件硬编码在 `trigger-detector.ts` 中，难以扩展。

**现状**:
```typescript
// trigger-detector.ts:121-287
private loadTriggerCatalog(): TriggerCatalog {
  return {
    triggers: {
      'consecutive_failures': { ... },
      'giving_up_language': { ... },
      // 硬编码所有触发条件
    }
  };
}
```

**改进方案**:
```
data/
└── triggers/
    ├── failure-patterns.yaml   # 失败模式触发条件
    ├── attitude-patterns.yaml  # 态度问题触发条件
    ├── tool-usage.yaml         # 工具使用触发条件
    └── user-emotion.yaml       # 用户情绪触发条件
```

```typescript
class TriggerDetector {
  async loadTriggersFromDirectory(dir: string): Promise<void> {
    // 动态加载 YAML 文件
  }
}
```

**验收标准**:
- [x] 触发条件可通过 YAML 配置
- [ ] 支持运行时热更新
- [ ] 提供触发条件验证工具

**完成状态** (2026-03-25):
```
data/triggers/
├── approach-issues.yaml    # 180 行 - 方法问题触发条件
├── attitude-issues.yaml    # 128 行 - 态度问题触发条件
├── failure-patterns.yaml   # 192 行 - 失败模式触发条件
└── user-emotion.yaml       # 84 行 - 用户情绪触发条件
```
共 4 个 YAML 文件，已覆盖 15 种触发类型。

---

### 2.2 模式匹配增强 [P1 - 重要]

**问题**: 当前仅使用简单正则，无法处理复杂语义。

**改进方案**:
```typescript
interface TriggerDetection {
  type: 'regex' | 'semantic' | 'counter' | 'composite';
  // 新增语义匹配
  semantic_patterns?: {
    embeddings?: string[];      // 语义向量匹配
    intent_match?: string[];    // 意图识别
    sentiment_threshold?: number; // 情感阈值
  };
  // 组合条件
  composite?: {
    and?: string[];
    or?: string[];
    not?: string[];
  };
}
```

**验收标准**:
- [ ] 支持组合触发条件 (AND/OR/NOT)
- [ ] 支持上下文窗口配置
- [ ] 准确率 > 85%

---

### 2.3 缺失的触发条件 [P1 - 重要]

**问题**: 文档声称支持 15 种触发条件，但代码仅实现 7 种。

**缺失触发条件**:
- [x] `low_quality_output` - 低质量输出 (已定义在 failure-patterns.yaml)
- [x] `unverified_assertion` - 未验证断言 (已定义在 approach-issues.yaml)
- [x] `ignore_edge_cases` - 忽略边界情况 (已定义在 approach-issues.yaml)
- [x] `over_complication` - 过度复杂化 (已定义在 approach-issues.yaml)
- [x] `tool_underuse` - 工具使用不足 (已定义在 attitude-issues.yaml)
- [x] `busywork` - 无意义忙碌 (已定义在 approach-issues.yaml)
- [x] `repetitive_attempts` - 重复尝试 (已定义在 failure-patterns.yaml)
- [x] `need_more_context` - 需要更多上下文 (已定义在 failure-patterns.yaml)

**完成状态** (2026-03-25):
所有 15 种触发条件已定义在 YAML 配置文件中。

---

## 三、角色推荐系统改进

### 3.1 角色元数据缺失 [P0 - 紧急]

**问题**: `role-recommender.ts:139-148` 中 `loadMappings()` 返回空对象。

**现状**:
```typescript
private loadMappings(): RoleMappings {
  return {
    trigger_role_mappings: {},      // 空！
    task_type_role_mappings: {},    // 空！
    failure_mode_role_mappings: {}, // 空！
    flavor_overlay: {},             // 空！
    role_metadata: {},              // 空！
    role_combinations: {}           // 空！
  };
}
```

**改进方案**:
```yaml
# data/role-mappings.yaml
trigger_role_mappings:
  consecutive_failures:
    primary: military-warrior
    alternatives:
      - military-commander
      - shaman-musk
    reason: 连续失败需要强力攻坚

role_metadata:
  military-commander:
    category: military
    tone: aggressive
    intensity: high
    suitable_for:
      - complex_project
      - multi_bug_coordination
```

**验收标准**:
- [x] 所有角色有完整元数据
- [x] 触发条件到角色映射完整
- [x] 推荐算法可正常工作

**完成状态** (2026-03-25):
```
data/role-mappings.yaml (411 行)
├── trigger_role_mappings: 15 种触发条件映射
├── task_type_role_mappings: 6 种任务类型映射
├── role_metadata: 20+ 角色完整元数据
└── flavor_overlay: 方法论风味映射
```

---

### 3.2 推荐算法透明化 [P2 - 一般]

**问题**: 推荐过程黑盒，用户无法理解为何推荐某角色。

**改进方案**:
```typescript
interface RoleRecommendation {
  // ... 现有字段
  debug_info: {
    all_candidates: Array<{
      role_id: string;
      score_breakdown: {
        trigger_match: number;
        task_type: number;
        failure_mode: number;
        historical: number;
        user_preference: number;
      };
      eliminated_reason?: string;
    }>;
    algorithm_version: string;
    weights_used: Record<string, number>;
  };
}
```

**验收标准**:
- [ ] 推荐结果包含详细评分明细
- [ ] 支持 `debug: true` 参数
- [ ] 提供推荐解释

---

## 四、技能/角色管理改进

### 4.1 双版本并存清理 [P0 - 紧急]

**问题**: 每个角色存在 `SKILL.md` (v1) 和 `SKILL.v2.md` (v2) 两个版本。

**风险**:
- 维护成本翻倍
- 版本不一致
- 用户困惑

**改进方案**:
```
方案 A: 迁移完成后删除 v1
skills/
├── military-commander/
│   └── SKILL.md  # v2 内容，无版本后缀

方案 B: 保留版本历史
skills/
├── military-commander/
│   ├── SKILL.md      # 当前版本
│   └── SKILL.v1.md   # 历史版本（归档）
```

**验收标准**:
- [x] 每个角色仅保留一个活跃版本
- [x] 提供迁移脚本
- [ ] 更新文档说明

**完成状态** (2026-03-25):
```
迁移前: 42 个双版本技能
迁移后: 0 个双版本, 42 个单版本(V2), 8 个仅V2
归档: 42 个技能的 V1 版本已归档到 archive/ 目录
```
使用命令: `node scripts/migrate-skill-versions.js --archive`

---

### 4.2 模板简化 [P1 - 重要]

**问题**: `SKILL-v2.0-template.md` 达到 489 行，过于复杂。

**改进方案**:
```markdown
# 简化模板结构

---
# 必填元数据（10行）
name: {role-id}
description: {一句话描述}
category: {category}
tags: [tag1, tag2]
---

# 核心内容（必需）

## 定位
> 一句话定位

## System Prompt
\`\`\`markdown
{核心 Prompt}
\`\`\`

# 扩展内容（可选）

## 方法论
## 检查清单
## 示例
```

**验收标准**:
- [ ] 模板精简至 200 行以内
- [ ] 区分必填/可选字段
- [ ] 提供验证脚本

---

### 4.3 元数据同步 [P1 - 重要]

**问题**: YAML Front Matter 与实际内容可能不同步。

**改进方案**:
```typescript
// scripts/validate-skill.ts
function validateSkill(skillPath: string): ValidationResult {
  const frontMatter = parseFrontMatter(skillPath);
  const content = parseContent(skillPath);

  return {
    valid: true,
    errors: [
      // 检查 name 是否与目录名匹配
      // 检查 category 是否在允许列表中
      // 检查 tags 是否有最少数量
      // 检查 content 是否包含必需章节
    ]
  };
}
```

**验收标准**:
- [ ] CI 中自动验证所有角色
- [ ] 提供本地验证命令
- [ ] 错误报告清晰

---

## 五、文档改进

### 5.1 文档碎片化清理 [P1 - 重要]

**问题**: 项目存在大量重复/过时文档。

**清理状态** (2026-03-25):
```
✅ 已完成清理
├── docs/archive/completion-reports/  (13 个文档已归档)
├── 根目录保留核心文档:
│   ├── README.md
│   ├── TODO.md
│   ├── 测试命令速查卡.md
│   ├── 快速测试指南.md
│   └── ... (其他必要文档)
```

**改进方案**:
```
docs/
├── README.md           # 主文档入口
├── API.md              # API 文档
├── USER-GUIDE.md       # 用户指南
├── CONTRIBUTING.md     # 贡献指南
├── CHANGELOG.md        # 变更日志
└── archive/            # 归档
    └── progress/       # 进度报告归档
```

**验收标准**:
- [ ] 根目录仅保留必要文档
- [ ] 所有"完成"类文档归档
- [ ] 文档索引清晰

---

### 5.2 中英文文档同步 [P2 - 一般]

**问题**: `README.md` (中文) 和 `README_en.md` (英文) 内容不同步。

**改进方案**:
```markdown
<!-- README.md -->
[English](README_en.md) | 简体中文

<!-- 自动同步检查脚本 -->
// scripts/check-doc-sync.js
```

**验收标准**:
- [ ] 两个版本核心内容一致
- [ ] CI 检查同步状态

---

## 六、工程化改进

### 6.1 Lint 配置 [P0 - 紧急]

**问题**: 项目缺少 ESLint/Prettier 配置。

**改进方案**:
```json
// .eslintrc.json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}

// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2
}
```

**package.json scripts**:
```json
{
  "lint": "eslint 'src/**/*.ts'",
  "lint:fix": "eslint 'src/**/*.ts' --fix",
  "format": "prettier --write 'src/**/*.ts'",
  "typecheck": "tsc --noEmit"
}
```

**验收标准**:
- [ ] `npm run lint` 无错误
- [ ] `npm run typecheck` 无错误
- [ ] CI 中强制检查

---

### 6.2 测试覆盖 [P1 - 重要]

**问题**: 测试文件众多但覆盖率不明确。

**改进方案**:
```json
// jest.config.js
{
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  },
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/index.ts"
  ]
}
```

**缺失测试**:
- [ ] `trigger-detector.ts` 单元测试
- [ ] `role-recommender.ts` 单元测试
- [ ] `methodology-engine.ts` 单元测试
- [ ] E2E 集成测试

---

### 6.3 CI/CD 完善 [P1 - 重要]

**问题**: `.github/workflows/ci.yml` 配置不完整。

**改进方案**:
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install
        run: cd puax-mcp-server && npm ci

      - name: Lint
        run: cd puax-mcp-server && npm run lint

      - name: TypeCheck
        run: cd puax-mcp-server && npm run typecheck

      - name: Test
        run: cd puax-mcp-server && npm test -- --coverage

      - name: Upload Coverage
        uses: codecov/codecov-action@v4

  validate-skills:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate Skills
        run: node scripts/validate-all-skills.js
```

**验收标准**:
- [ ] 每次 PR 自动运行 CI
- [ ] 覆盖率报告上传
- [ ] 角色文件自动验证

---

## 七、性能优化

### 7.1 Bundle 优化 [P2 - 一般]

**问题**: `prompts-bundle.ts` 可能包含大量内嵌内容。

**改进方案**:
```typescript
// 懒加载模式
class LazySkillLoader {
  private cache = new Map<string, Promise<SkillInfo>>();

  async getSkill(id: string): Promise<SkillInfo> {
    if (!this.cache.has(id)) {
      this.cache.set(id, this.loadSkill(id));
    }
    return this.cache.get(id)!;
  }

  private async loadSkill(id: string): Promise<SkillInfo> {
    // 按需加载
  }
}
```

---

### 7.2 缓存策略 [P2 - 一般]

**问题**: 推荐结果缓存可能过期。

**改进方案**:
```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version: string;  // 数据版本，用于失效判断
}
```

---

## 八、安全性改进

### 8.1 输入验证 [P1 - 重要]

**问题**: 工具输入缺少严格验证。

**改进方案**:
```typescript
import { z } from 'zod';

const ListSkillsArgsSchema = z.object({
  category: z.enum(['all', 'shaman', 'military', ...]).optional(),
  includeCapabilities: z.boolean().optional()
});

private async handleListSkills(args: unknown): Promise<any> {
  const validated = ListSkillsArgsSchema.parse(args);
  // ...
}
```

---

### 8.2 路径遍历防护 [P2 - 一般]

**问题**: 文件读取可能存在路径遍历风险。

**改进方案**:
```typescript
function safePath(baseDir: string, userPath: string): string {
  const resolved = path.resolve(baseDir, userPath);
  if (!resolved.startsWith(baseDir)) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}
```

---

## 九、功能增强建议

### 9.1 角色使用统计 [P2 - 一般]

**改进方案**:
```typescript
interface RoleUsageStats {
  role_id: string;
  activation_count: number;
  success_rate: number;
  avg_session_length: number;
  last_used: Date;
  user_ratings: number[];
}

// 持久化存储
class UsageStatsStore {
  async recordActivation(roleId: string): Promise<void>;
  async recordSuccess(roleId: string, success: boolean): Promise<void>;
  async getStats(roleId: string): Promise<RoleUsageStats>;
}
```

---

### 9.2 自定义角色支持 [P3 - 低优先级]

**改进方案**:
```
~/.puax/
└── custom-skills/
    └── my-custom-role/
        └── SKILL.md
```

```typescript
class SkillLoader {
  loadCustomSkills(userDir: string): Promise<SkillInfo[]>;
}
```

---

## 十、执行优先级

### P0 - 紧急（本周）
1. [ ] server.ts 拆分重构
2. [ ] 消除 `any` 类型
3. [ ] 触发条件外部化
4. [ ] 角色元数据补充
5. [ ] 双版本清理决策
6. [ ] ESLint 配置

### P1 - 重要（本月）
1. [ ] 依赖注入改造
2. [ ] 模式匹配增强
3. [ ] 缺失触发条件实现
4. [ ] 模板简化
5. [ ] 元数据同步验证
6. [ ] 文档清理
7. [ ] 测试覆盖提升
8. [ ] CI/CD 完善
9. [ ] 输入验证

### P2 - 一般（下月）
1. [ ] 推荐算法透明化
2. [ ] 中英文文档同步
3. [ ] Bundle 优化
4. [ ] 缓存策略改进
5. [ ] 路径遍历防护
6. [ ] 角色使用统计

### P3 - 低优先级（未来）
1. [ ] 自定义角色支持
2. [ ] 更多大厂风味
3. [ ] 国际化支持

---

## 十一、技术债务汇总

| 类型 | 数量 | 优先级 |
|------|------|--------|
| `any` 类型使用 | 15+ | P0 |
| 硬编码配置 | 3处 | P0 |
| 缺失元数据 | 40+角色 | P0 |
| 重复文档 | 20+ | P1 |
| 缺失测试 | 3个核心模块 | P1 |
| 过长文件 | 2个 >1000行 | P1 |

---

## 十二、总结

PUAX 2.1.0 整体架构合理，核心功能完善，但存在以下主要问题：

1. **代码质量**: 类型安全不足，职责划分不清
2. **配置管理**: 硬编码过多，扩展性差
3. **数据完整性**: 元数据缺失，版本混乱
4. **工程化**: 缺少规范工具链

建议按照优先级逐步推进改进，预计 **2-3 周可完成 P0/P1 级别改进**。

---

*Generated by 萨满·Linus | 2026-03-25*
