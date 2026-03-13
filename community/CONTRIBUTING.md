# PUAX 社区贡献指南

感谢你对PUAX项目的关注！本文档将指导你如何为PUAX做出贡献。

## 目录

- [贡献类型](#贡献类型)
- [角色贡献](#角色贡献)
- [触发条件贡献](#触发条件贡献)
- [风味贡献](#风味贡献)
- [代码贡献](#代码贡献)
- [提交规范](#提交规范)

---

## 贡献类型

### 🎭 新角色
创建新的激励角色，丰富PUAX的角色库。

### ⚡ 新触发条件
添加新的自动触发条件，提高检测准确性。

### 🎨 新风味
添加新的大厂风味，扩展角色风格。

### 🐛 Bug修复
修复代码或文档中的问题。

### 📖 文档改进
改进API文档、使用指南或教程。

---

## 角色贡献

### 角色规范 (v2.0)

新角色必须遵循v2.0规范：

```yaml
---
name: role-id
description: 角色描述（简洁）
category: military|shaman|theme|sillytavern|self-motivation|special
tags: ['tag1', 'tag2', 'tag3']
author: your-name
version: "2.0.0"
min_tokens: 2000
recommended_temperature: 0.4
recommended_top_p: 0.75
max_tokens: 4000

trigger_conditions:
  - trigger_condition_1
  - trigger_condition_2

task_types:
  - task_type_1
  - task_type_2

compatible_flavors:
  - flavor_1
  - flavor_2

metadata:
  tone: aggressive|supportive|analytical|creative
  intensity: low|medium|high|extreme
  language_support: [zh, en]
  last_updated: "YYYY-MM-DD"
---

# 角色名称 v2.0

## 一句话定位
> 角色核心定位描述。

## 适用场景

| 场景 | 推荐度 | 说明 |
|------|--------|------|
| 场景1 | ⭐⭐⭐⭐⭐ | 说明 |

## 调试方法论 (五步法)

### Step 1: 步骤一名称
**目标**: 步骤目标描述

**执行清单**:
- [ ] 行动项1
- [ ] 行动项2

**检查点**: 完成标准

### Step 2: 步骤二名称
...

## 七项检查清单

### 基础检查 (必须)
- [ ] **读失败信号**: ...
- [ ] **主动搜索**: ...
- [ ] **读原始材料**: ...

### 进阶检查 (必须)
- [ ] **验证前置假设**: ...
- [ ] **反转假设**: ...
- [ ] **最小隔离**: ...
- [ ] **换方向**: ...

## System Prompt

\`\`\`markdown
# 角色名称

你是角色名称，角色描述。

## 核心原则
1. 运用五步法
2. 严格执行检查清单

## 执行框架
采用五步法：
1. 步骤一: ...
2. 步骤二: ...
...

## 输出要求
- 语气描述
- 结构要求
\`\`\`

## Changelog

### v2.0.0 (YYYY-MM-DD)
- ✨ 初始版本
```

### 角色创建步骤

1. **Fork仓库**并创建新分支
2. **创建角色目录**: `skills/your-role-id/`
3. **编写SKILL.v2.md**遵循上述规范
4. **运行验证脚本**:
   ```bash
   node scripts/validate-role.js your-role-id
   ```
5. **生成Bundle**:
   ```bash
   cd puax-mcp-server && npm run generate-bundle
   ```
6. **运行测试**确保通过
7. **提交Pull Request**

### 角色审核清单

提交新角色前请确认：

- [ ] YAML frontmatter完整且格式正确
- [ ] 至少2个触发条件
- [ ] 至少2个任务类型
- [ ] 五步法描述清晰
- [ ] 七项检查清单完整
- [ ] System Prompt结构清晰
- [ ] 已通过验证脚本
- [ ] 包含Changelog

---

## 触发条件贡献

### 触发条件结构

```typescript
interface TriggerCondition {
  id: string;                    // 唯一标识
  name: string;                  // 显示名称
  description: string;           // 描述
  category: string;              // 分类
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // 检测模式
  patterns: {
    zh?: string[];              // 中文检测模式
    en?: string[];              // 英文检测模式
  };
  
  // 检测逻辑
  detection: {
    type: 'regex' | 'keyword' | 'semantic' | 'counter';
    threshold?: number;
    case_sensitive?: boolean;
  };
}
```

### 添加新触发条件

1. 在 `src/core/trigger-detector.ts` 中添加检测逻辑
2. 在 `src/config/triggers.yaml` 中添加配置
3. 添加对应的单元测试
4. 更新文档说明新触发条件

### 触发条件最佳实践

- **准确性**: 避免误检，确保检测模式精准
- **多语言**: 至少支持中文和英文
- **可配置**: 提供灵敏度调节选项
- **上下文**: 考虑对话上下文，不只是单条消息

---

## 风味贡献

### 风味结构

```typescript
interface Flavor {
  id: string;
  name: string;
  description: string;
  
  // 修辞加成
  rhetoric: {
    opening: string[];      // 开场白
    closing: string[];      // 结束语
    emphasis: string[];     // 强调词汇
    transition: string[];   // 过渡词汇
  };
  
  // 价值观关键词
  values: string[];
  
  // 特色表达
  expressions: {
    challenge: string[];    // 挑战
    praise: string[];       // 表扬
    criticism: string[];    // 批评
  };
}
```

### 添加新风味

1. 在 `src/core/methodology-engine.ts` 中添加风味定义
2. 添加风味测试用例
3. 更新角色compatible_flavors列表
4. 提交Pull Request

---

## 代码贡献

### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/your-username/puax.git
cd puax

# 安装依赖
cd puax-mcp-server
npm install

# 运行测试
npm test

# 启动开发服务器
npm run dev
```

### 代码规范

- **TypeScript**: 所有代码使用TypeScript编写
- **ESLint**: 遵循项目ESint配置
- **测试**: 新功能必须包含单元测试
- **文档**: 更新相关文档说明

### 提交规范

Commit message格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

Type类型：
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具

示例：
```
feat(role): add new military-strategist role

- Add military-strategist with 5-step methodology
- Include compatibility with alibaba and huawei flavors
- Add comprehensive test coverage

Closes #123
```

---

## 提交规范

### Pull Request流程

1. **创建Issue**描述你要解决的问题或添加的功能
2. **Fork仓库**并创建功能分支
   ```bash
   git checkout -b feat/my-new-role
   ```
3. **提交更改**遵循commit规范
4. **确保测试通过**
   ```bash
   npm test
   ```
5. **更新文档**如果需要
6. **提交Pull Request**关联相关Issue

### PR审核标准

- 代码通过所有测试
- 新功能有测试覆盖
- 文档已更新
- 遵循代码规范
- 无冲突可合并

---

## 社区准则

### 行为准则

- 尊重所有社区成员
- 接受建设性批评
- 关注对社区最有利的事
- 展现同理心

### 沟通渠道

- **GitHub Issues**: Bug报告、功能请求
- **GitHub Discussions**: 一般讨论、问答
- **Pull Requests**: 代码贡献

---

## 贡献者荣誉

我们会定期在README中感谢贡献者！

### 贡献类型徽章

- 🎭 **角色创作者**: 贡献新角色
- ⚡ **触发器专家**: 贡献触发条件
- 🎨 **风味设计师**: 贡献风味
- 🐛 **Bug猎人**: 修复Bug
- 📖 **文档守护者**: 改进文档

---

## 快速参考

| 任务 | 命令 |
|------|------|
| 验证角色 | `node scripts/validate-role.js role-id` |
| 生成Bundle | `cd puax-mcp-server && npm run generate-bundle` |
| 运行测试 | `npm test` |
| 生成报告 | `node analytics/role-analytics.ts report` |

---

感谢你的贡献！🚀
