# PUAX 2.0 使用指南

## 快速开始

### 1. 安装和启动

```bash
cd puax-mcp-server
npm install
npm run generate-bundle
npm start
```

### 2. 配置MCP客户端

在Cursor/Cline中配置MCP服务器：

```json
{
  "mcpServers": {
    "puax": {
      "url": "http://localhost:2333/mcp"
    }
  }
}
```

---

## 核心概念

### 触发条件 (Trigger Conditions)

当AI Agent出现以下行为时，PUAX会自动检测并建议激活激励角色：

1. **连续失败** - 多次尝试同一任务失败
2. **放弃语言** - 表达"我无法解决"等放弃意图
3. **归咎环境** - 将问题归咎于外部因素
4. **用户挫折** - 用户表现出沮丧情绪
5. **表面修复** - 只解决表面症状而非根本原因

### 角色分类

| 分类 | 特点 | 适用场景 |
|------|------|----------|
| 军事类 | 严格、执行力强 | 紧急调试、需要强力推动 |
| 萨满类 | 洞察、创新 | 需要突破思维定式 |
| 主题类 | 创意、有趣 | 日常开发、降低压力 |
| SillyTavern | 社区流行 | 特定场景深度优化 |

### 五步法方法论

每个v2.0角色都包含五步法：

1. **准备/侦察** - 收集信息，了解情况
2. **分析/诊断** - 深入分析，找出根本原因
3. **执行/突破** - 采取行动，解决问题
4. **验证/巩固** - 验证结果，确保稳定
5. **总结/提升** - 总结经验，持续改进

### 七项检查清单

L3+级别角色强制执行：

基础检查 (必须):
- [ ] **读失败信号** - 逐字读完了吗？
- [ ] **主动搜索** - 用工具搜索过核心问题了吗？
- [ ] **读原始材料** - 读过失败位置的原始上下文了吗？

进阶检查 (必须):
- [ ] **验证前置假设** - 所有假设都用工具确认了吗？
- [ ] **反转假设** - 试过与当前方向完全相反的假设吗？
- [ ] **最小隔离** - 能在最小范围内隔离/复现这个问题吗？
- [ ] **换方向** - 换过工具、方法、角度、技术栈、框架吗？

---

## 使用场景

### 场景1：AI反复失败

当AI多次尝试失败时，自动激活军事类角色：

```
[对话历史]
AI: 尝试连接数据库...失败
AI: 再试一次...还是失败
AI: 可能是网络问题？再试...失败

[触发检测]
→ 检测到: consecutive_failures, user_frustration
→ 推荐角色: military-warrior (战士)
→ 方法论: 请战→侦察→冲锋→坚守→庆功
```

### 场景2：AI要放弃

当AI表达放弃意图时：

```
[对话历史]
AI: 我无法解决这个问题
AI: 这超出了我的能力范围

[触发检测]
→ 检测到: giving_up_language
→ 推荐角色: military-commissar (政委)
→ 方法论: 问责→教育→激励→监督→总结
```

### 场景3：需要创意

当需要突破常规思维：

```
[对话历史]
User: 这些方案太普通了，需要更有创意的

[触发检测]
→ 推荐角色: shaman-musk (马斯克)
→ 方法论: 质疑→想象→验证→放大→实现
```

---

## 高级用法

### 使用大厂风味

可以为角色叠加不同公司的风格：

```typescript
// 阿里风味 - 强调价值观和执行力
get_role_with_methodology({
  role_id: "military-commander",
  options: { include_flavor: "alibaba" }
})

// 华为风味 - 强调艰苦奋斗
get_role_with_methodology({
  role_id: "military-warrior",
  options: { include_flavor: "huawei" }
})

// 马斯克风味 - 强调第一性原理
get_role_with_methodology({
  role_id: "shaman-musk",
  options: { include_flavor: "musk" }
})
```

### 自定义偏好

```typescript
recommend_role({
  detected_triggers: ["consecutive_failures"],
  task_context: { task_type: "debugging" },
  user_preferences: {
    favorite_roles: ["military-commander"],
    blacklisted_roles: ["military-warrior"],
    preferred_tone: "analytical"
  }
})
```

---

## 故障排除

### 问题1：触发检测不敏感

**解决方案**: 提高灵敏度设置
```typescript
detect_trigger({
  options: { sensitivity: "high" }
})
```

### 问题2：推荐的角色不合适

**解决方案**: 
1. 检查任务类型是否正确指定
2. 提供用户偏好设置
3. 查看备选角色列表

### 问题3：方法论步骤不完整

**解决方案**: 确认角色已升级到v2.0
```bash
grep -c 'version: "2.0.0"' puax-mcp-server/src/prompts/prompts-bundle.ts
```

---

## 最佳实践

### 1. 及时激活

当检测到以下情况时立即激活角色：
- 用户表现出挫折情绪
- AI连续失败3次以上
- AI表达放弃意图

### 2. 合理使用风味

- **紧急任务** - 使用华为/军事风味，强调执行
- **创新任务** - 使用马斯克/乔布斯风味，强调突破
- **日常任务** - 使用主题类角色，降低压力

### 3. 检查清单验证

激活角色后，确保AI完成检查清单：
- 基础3项必须全部完成
- 进阶4项至少完成80%

### 4. 轮换角色

避免重复使用同一角色，使用`session_history`记录已使用角色：
```typescript
recommend_role({
  session_history: {
    recently_used_roles: ["military-commander"]
  }
})
```

---

## 角色速查表

| 场景 | 推荐角色 | 理由 |
|------|----------|------|
| 紧急调试 | military-warrior | 强力攻坚 |
| 多次失败 | military-commissar | 问责激励 |
| 需要创意 | shaman-musk | 第一性原理 |
| 代码审查 | theme-sect-discipline | 严格执行 |
| 快速迭代 | sillytavern-iterator | 极限迭代 |
| 用户沮丧 | military-commander | 统筹解决 |
| 环境配置 | military-technician | 技术攻坚 |
| 性能优化 | shaman-einstein | 深度思考 |

---

## 更新日志

### v2.0.0
- ✅ 40个角色升级到v2.0
- ✅ 14种触发条件
- ✅ 4个MCP工具
- ✅ 五步法方法论
- ✅ 七项检查清单
- ✅ 8种大厂风味支持
