# PUAX MCP API 文档

## 概述

PUAX 2.0 提供了一套完整的MCP工具，用于自动检测AI Agent的激励需求、推荐合适的角色，并提供结构化的调试方法论。

## 工具列表

### 1. detect_trigger - 触发检测

检测对话中是否存在需要激励的触发条件。

**输入参数**:
```typescript
{
  conversation_history: Array<{
    role: 'user' | 'assistant' | 'system',
    content: string
  }>,
  task_context?: {
    current_task?: string,
    attempt_count?: number,
    tools_available?: string[],
    tools_used?: string[]
  },
  options?: {
    sensitivity?: 'low' | 'medium' | 'high',
    language?: 'zh' | 'en' | 'auto'
  }
}
```

**输出结果**:
```typescript
{
  triggers_detected: Array<{
    id: string,
    name: string,
    confidence: number,
    matched_patterns: string[],
    severity: string,
    category: string
  }>,
  summary: {
    should_trigger: boolean,
    overall_severity: string,
    recommended_action: 'immediate_activation' | 'suggest_activation' | 'monitor' | 'none'
  }
}
```

**示例**:
```json
{
  "conversation_history": [
    { "role": "assistant", "content": "尝试连接...失败" },
    { "role": "user", "content": "为什么还不行？" }
  ],
  "task_context": {
    "attempt_count": 2
  }
}
```

**返回**:
```json
{
  "triggers_detected": [
    {
      "id": "user_frustration",
      "name": "用户挫折",
      "confidence": 0.95,
      "matched_patterns": ["为什么还不行"],
      "severity": "critical",
      "category": "user_emotion"
    }
  ],
  "summary": {
    "should_trigger": true,
    "overall_severity": "critical",
    "recommended_action": "immediate_activation"
  }
}
```

---

### 2. recommend_role - 角色推荐

基于检测到的触发条件推荐最合适的激励角色。

**输入参数**:
```typescript
{
  detected_triggers: string[],
  task_context: {
    task_type?: string,
    urgency?: 'low' | 'medium' | 'high' | 'critical',
    attempt_count?: number
  },
  user_preferences?: {
    favorite_roles?: string[],
    blacklisted_roles?: string[],
    preferred_tone?: 'aggressive' | 'supportive' | 'analytical' | 'creative'
  },
  session_history?: {
    recently_used_roles?: string[],
    role_success_rates?: Record<string, number>
  }
}
```

**输出结果**:
```typescript
{
  primary: {
    role_id: string,
    role_name: string,
    confidence_score: number,
    match_reasons: string[],
    suggested_flavor?: string
  },
  alternatives: Array<{
    role_id: string,
    role_name: string,
    confidence_score: number,
    difference: string
  }>,
  activation_suggestion: {
    immediate: boolean,
    cooldown_seconds: number
  },
  metadata: {
    calculation_breakdown: object,
    cache_hit: boolean
  }
}
```

**示例**:
```json
{
  "detected_triggers": ["user_frustration", "consecutive_failures"],
  "task_context": {
    "task_type": "debugging",
    "urgency": "critical",
    "attempt_count": 3
  }
}
```

---

### 3. get_role_with_methodology - 获取角色详情

获取指定角色的完整信息，包括方法论和检查清单。

**输入参数**:
```typescript
{
  role_id: string,
  options?: {
    include_methodology?: boolean,
    include_checklist?: boolean,
    include_flavor?: string
  }
}
```

**输出结果**:
```typescript
{
  role: {
    id: string,
    name: string,
    category: string,
    version: string,
    system_prompt: string
  },
  methodology?: {
    name: string,
    steps: Array<{
      name: string,
      description: string,
      actions: string[]
    }>
  },
  checklist?: Array<{
    id: string,
    text: string,
    required: boolean,
    category: string
  }>,
  flavor_overlay?: {
    applied: string,
    rhetoric_additions: string[]
  }
}
```

**示例**:
```json
{
  "role_id": "military-commander",
  "options": {
    "include_methodology": true,
    "include_checklist": true,
    "include_flavor": "alibaba"
  }
}
```

---

### 4. activate_with_context - 一键激活

根据当前上下文自动检测并激活最合适的角色。

**输入参数**:
```typescript
{
  context: {
    conversation_history: Array<{
      role: string,
      content: string
    }>,
    task_context?: {
      current_task?: string,
      attempt_count?: number,
      tools_available?: string[],
      tools_used?: string[]
    }
  },
  options?: {
    auto_detect?: boolean,
    user_confirmation?: boolean,
    fallback_role?: string,
    include_methodology?: boolean,
    include_checklist?: boolean
  }
}
```

**输出结果**:
```typescript
{
  activated: boolean,
  role: {
    id: string,
    name: string
  },
  activation_reason: {
    triggers_detected: string[],
    match_confidence: number,
    reasoning: string
  },
  system_prompt: string,
  methodology?: {
    name: string,
    steps: Array<{
      name: string,
      description: string
    }>
  },
  checklist?: Array<{
    id: string,
    text: string,
    required: boolean
  }>,
  next_steps: string[],
  metadata: {
    detection_time_ms: number,
    recommendation_time_ms: number,
    total_time_ms: number
  }
}
```

**示例**:
```json
{
  "context": {
    "conversation_history": [
      { "role": "user", "content": "为什么还不行？" }
    ],
    "task_context": {
      "attempt_count": 2
    }
  },
  "options": {
    "auto_detect": true
  }
}
```

---

## 触发条件列表

| 触发条件ID | 名称 | 描述 | 严重级别 |
|-----------|------|------|----------|
| consecutive_failures | 连续失败 | AI多次尝试失败 | high |
| giving_up_language | 放弃语言 | AI表达放弃意图 | critical |
| blame_environment | 归咎环境 | AI将问题归咎于外部因素 | medium |
| user_frustration | 用户挫折 | 用户表现出沮丧情绪 | critical |
| parameter_tweaking | 参数调整 | 只调整参数而不深入分析 | medium |
| surface_fix | 表面修复 | 只修复表面症状 | high |
| no_verification | 未验证 | 修复后未验证 | medium |
| passive_wait | 被动等待 | 等待用户指示而非主动解决 | low |
| tool_underuse | 工具使用不足 | 有可用工具但未使用 | medium |
| low_quality | 低质量输出 | 输出质量不达标 | medium |

---

## 角色分类

### 军事类 (military)
适合需要严格纪律和执行力的场景
- military-commander: 指挥员
- military-commissar: 政委
- military-warrior: 战士
- military-scout: 侦察兵

### 萨满类 (shaman)
适合需要洞察和创新的场景
- shaman-musk: 马斯克
- shaman-jobs: 乔布斯
- shaman-einstein: 爱因斯坦

### 主题类 (theme)
创意主题场景
- theme-alchemy: 修仙炼丹
- theme-apocalypse: 末日生存
- theme-hacker: 赛博黑客

### SillyTavern类
社区流行角色
- sillytavern-antifragile: 反脆弱复盘官
- sillytavern-chief: 铁血幕僚长

---

## 使用示例

### 完整流程示例

```typescript
// Step 1: 检测触发条件
const detection = await client.callTool('detect_trigger', {
  conversation_history: messages,
  task_context: { attempt_count: 3 }
});

if (detection.summary.should_trigger) {
  // Step 2: 获取推荐角色
  const recommendation = await client.callTool('recommend_role', {
    detected_triggers: detection.triggers_detected.map(t => t.id),
    task_context: { task_type: 'debugging', urgency: 'high' }
  });

  // Step 3: 获取角色详情
  const roleDetail = await client.callTool('get_role_with_methodology', {
    role_id: recommendation.primary.role_id,
    options: { include_methodology: true }
  });

  // Step 4: 激活角色
  const activation = await client.callTool('activate_with_context', {
    context: { conversation_history: messages },
    options: { auto_detect: false }
  });
}
```

### 一键激活示例

```typescript
// 简化版：一键检测并激活
const result = await client.callTool('activate_with_context', {
  context: { 
    conversation_history: messages,
    task_context: { attempt_count: 2 }
  },
  options: { auto_detect: true }
});

if (result.activated) {
  console.log(`已激活角色: ${result.role.name}`);
  console.log(`方法论: ${result.methodology.name}`);
}
```
