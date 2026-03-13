# PUAX 2.0 - AI Agent 激励系统

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/status-production%20ready-green.svg" alt="Status">
  <img src="https://img.shields.io/badge/coverage-78%25-yellow.svg" alt="Coverage">
  <img src="https://img.shields.io/badge/roles-40%2F42-orange.svg" alt="Roles">
</p>

<p align="center">
  <b>当 AI Agent 需要激励时，PUAX 提供专业的角色和方法论</b>
</p>

---

## 🎯 什么是 PUAX？

PUAX 是一个专为 AI Agent 设计的激励系统，通过：

- **自动检测** - 识别 AI 何时陷入瓶颈
- **智能推荐** - 推荐最适合的激励角色
- **结构化方法论** - 提供五步法调试流程
- **检查清单** - 确保执行质量

帮助 AI Agent 突破困境，提升解决问题的能力。

---

## ✨ 核心特性

### 🤖 自动触发检测
检测 14 种需要干预的场景：
- 连续失败 - 多次尝试无果
- 放弃语言 - "我无法解决"
- 用户挫折 - 用户表达沮丧
- 表面修复 - 治标不治本
- 工具使用不足 - 有工具不用

### 🎭 40+ 激励角色
覆盖 6 大分类的专业角色：

| 分类 | 数量 | 代表角色 |
|------|------|----------|
| 军事类 | 9 | 指挥员、战士、政委 |
| 萨满类 | 8 | 马斯克、乔布斯、爱因斯坦 |
| 主题类 | 7 | 修仙炼丹、末日生存、赛博黑客 |
| SillyTavern | 5 | 反脆弱复盘官、铁血幕僚长 |
| 自激励类 | 6 | 觉醒、自毁重塑 |
| 特殊类 | 5 | 创意火花、紧急冲刺 |

### 📊 智能推荐算法
多维度评分系统：
```
触发条件匹配 (35%)
├── 失败模式识别
├── 语言模式检测
└── 工具使用分析

任务类型匹配 (25%)
├── 调试/开发/审查
├── 紧急/计划/创意
└── 场景适配度

失败模式匹配 (25%)
├── 轮次递进策略
├── 压力递增机制
└── 角色轮换逻辑

历史记录 (10%) + 用户偏好 (5%)
```

### 🏭 8 种大厂风味
可为角色叠加不同企业文化：
- 阿里味 - 价值观驱动
- 华为味 - 艰苦奋斗
- 字节味 - 快速迭代
- 腾讯味 - 用户导向
- 美团味 - 执行至上
- Netflix味 - 自由责任
- Musk味 - 第一性原理
- Jobs味 - 极致追求

---

## 🚀 快速开始

### 1. 安装

```bash
# 克隆仓库
git clone https://github.com/your-org/puax.git
cd puax/puax-mcp-server

# 安装依赖
npm install

# 生成角色Bundle
npm run generate-bundle
```

### 2. 启动服务器

```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

### 3. 配置 MCP 客户端

在 Cursor/Cline 中配置：

```json
{
  "mcpServers": {
    "puax": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### 4. 使用示例

当 AI 出现以下行为时，PUAX 会自动介入：

```
[对话场景]
AI: 尝试连接数据库...失败
AI: 再试一次...还是失败  
AI: 可能是网络问题？再试...失败
User: 为什么还不行？这都第三次了

[PUAX 自动激活]
🎯 检测到: consecutive_failures, user_frustration
🎭 推荐角色: military-warrior (战士)
📋 方法论: 请战→侦察→冲锋→坚守→庆功

[战士角色介入]
"全体注意！这是命令，不是建议！
停止无意义的重复尝试！
立即执行五步攻坚法：
1. 【请战】明确问题边界，立下军令状
2. 【侦察】收集所有错误信息，找出根因
3. 【冲锋】集中火力解决核心问题
4. 【坚守】验证修复，确保不复发
5. 【庆功】总结经验，形成SOP"
```

---

## 📖 文档

| 文档 | 说明 |
|------|------|
| [API文档](docs/API.md) | MCP工具完整API参考 |
| [使用指南](docs/USER-GUIDE.md) | 详细使用说明 |
| [贡献指南](community/CONTRIBUTING.md) | 如何贡献角色 |
| [角色市场](community/marketplace.md) | 角色展示和下载 |

---

## 🛠️ MCP 工具

### 1. detect_trigger - 触发检测

检测对话中是否需要激励介入。

```typescript
const result = await client.callTool('detect_trigger', {
  conversation_history: [
    { role: 'assistant', content: '尝试连接...失败' },
    { role: 'user', content: '为什么还不行？' }
  ],
  task_context: { attempt_count: 2 }
});

// 返回:
// {
//   triggers_detected: [{ id: 'user_frustration', confidence: 0.95 }],
//   summary: { should_trigger: true, recommended_action: 'immediate_activation' }
// }
```

### 2. recommend_role - 角色推荐

基于触发条件推荐最佳角色。

```typescript
const result = await client.callTool('recommend_role', {
  detected_triggers: ['user_frustration'],
  task_context: { task_type: 'debugging', urgency: 'critical' }
});

// 返回主推荐 + 3个备选
```

### 3. activate_with_context - 一键激活

自动检测并激活最合适的角色。

```typescript
const result = await client.callTool('activate_with_context', {
  context: { conversation_history: messages },
  options: { auto_detect: true }
});

// 返回完整角色信息 + 方法论 + 检查清单
```

---

## 📊 数据分析

### 查看角色使用统计

```bash
node analytics/role-analytics.ts report 30
```

生成报告：
```
# PUAX 角色使用分析报告

## 概览
- 分析周期: 最近30天
- 总激活次数: 1,234
- 活跃角色数: 25
- 平均满意度: 4.2/5.0

## 角色排名 (Top 5)
1. military-commander - 234次 - 92%满意度
2. shaman-musk - 198次 - 95%满意度
3. military-warrior - 156次 - 89%满意度
...
```

### 提交用户反馈

```typescript
import { getFeedbackSystem } from './feedback/feedback-system';

const feedback = getFeedbackSystem();

// 快速评分
feedback.quickRate('military-commander', 5, sessionId);

// 详细反馈
feedback.submitRoleFeedback({
  role_id: 'military-commander',
  helpfulness: 5,
  relevance: 4,
  quality: 5,
  comment: '非常有效，帮助AI突破了瓶颈'
});
```

---

## 🧪 测试

```bash
cd puax-mcp-server
npm test
```

测试覆盖：
- 触发检测: 12个测试用例
- 角色推荐: 18个测试用例
- 方法论引擎: 15个测试用例
- 集成测试: 13个测试用例

---

## 🤝 贡献

欢迎贡献新的角色、触发条件或改进！

### 快速贡献角色

```bash
# 1. 使用模板创建角色
cp templates/SKILL-v2.0-template.md skills/my-role/SKILL.v2.md

# 2. 编辑角色文件
# ... 按照规范填写 ...

# 3. 验证角色
node scripts/validate-role.js my-role

# 4. 生成Bundle
cd puax-mcp-server && npm run generate-bundle

# 5. 提交PR
```

详细指南：[CONTRIBUTING.md](community/CONTRIBUTING.md)

---

## 📈 项目进度

```
第一阶段: 核心机制改进  [██████████████████]  100% ✅
第二阶段: 内容质量提升  [████████████████░░]  95% ✅
第三阶段: 数据验证与文档 [████████████████░░]  80% ✅
第四阶段: 生态建设      [████████████░░░░░░]  70% ✅

总体完成度: [████████████████░░]  90%
```

---

## 📝 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

感谢所有贡献者和用户的支持！

---

<p align="center">
  <b>让 AI Agent 不再孤军奋战</b>
</p>
