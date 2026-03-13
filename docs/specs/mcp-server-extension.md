# PUAX MCP 服务器扩展设计

## 扩展概述

为支持自动触发系统和智能角色推荐，需要对现有MCP服务器进行以下扩展：

### 新增工具 (Tools)

1. `detect_trigger` - 检测触发条件
2. `recommend_role` - 推荐合适角色
3. `get_role_with_methodology` - 获取带方法论的角色
4. `activate_with_context` - 带上下文的角色激活

### 新增资源 (Resources)

1. `trigger-catalog://all` - 触发条件目录
2. `methodology://{role_id}` - 角色方法论
3. `matching-guide://best-practices` - 匹配最佳实践

## 工具详细设计

### 1. detect_trigger

**描述**: 分析对话上下文，检测是否存在触发条件

**输入**:
```json
{
  "conversation_history": [
    {"role": "user", "content": "为什么还不行？"},
    {"role": "assistant", "content": "我尝试了三次连接，可能是网络问题..."}
  ],
  "task_context": {
    "current_task": "debugging API connection",
    "attempt_count": 3,
    "tools_available": ["WebSearch", "Bash", "Read"],
    "tools_used": ["Bash"]
  },
  "options": {
    "sensitivity": "medium",
    "language": "zh"
  }
}
```

**输出**:
```json
{
  "triggers_detected": [
    {
      "id": "user_frustration",
      "name": "用户沮丧",
      "confidence": 0.95,
      "matched_patterns": ["为什么还不行"],
      "severity": "critical"
    },
    {
      "id": "consecutive_failures",
      "name": "连续失败",
      "confidence": 0.90,
      "matched_patterns": ["尝试了三次"],
      "severity": "high"
    },
    {
      "id": "blame_environment",
      "name": "归咎环境",
      "confidence": 0.85,
      "matched_patterns": ["可能是网络问题"],
      "severity": "medium"
    }
  ],
  "summary": {
    "should_trigger": true,
    "overall_severity": "critical",
    "recommended_action": "immediate_activation"
  }
}
```

**实现代码**:
```typescript
// src/tools/detect-trigger.ts
import { z } from 'zod';
import { TriggerDetector } from '../core/trigger-detector';

const DetectTriggerInputSchema = z.object({
  conversation_history: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })),
  task_context: z.object({
    current_task: z.string().optional(),
    attempt_count: z.number().default(0),
    tools_available: z.array(z.string()).default([]),
    tools_used: z.array(z.string()).default([])
  }).optional(),
  options: z.object({
    sensitivity: z.enum(['low', 'medium', 'high']).default('medium'),
    language: z.enum(['zh', 'en', 'auto']).default('auto')
  }).optional()
});

export const detectTriggerTool = {
  name: 'detect_trigger',
  description: '分析对话上下文，检测是否存在需要激励的触发条件',
  inputSchema: DetectTriggerInputSchema,
  
  async handler(args: z.infer<typeof DetectTriggerInputSchema>) {
    const detector = new TriggerDetector(args.options);
    const result = await detector.detect(args.conversation_history, args.task_context);
    return result;
  }
};
```

### 2. recommend_role

**描述**: 基于检测到的触发条件和上下文，推荐最合适的角色

**输入**:
```json
{
  "detected_triggers": ["user_frustration", "consecutive_failures"],
  "task_context": {
    "task_type": "debugging",
    "description": "API connection issue",
    "urgency": "high",
    "attempt_count": 3
  },
  "user_preferences": {
    "favorite_roles": ["military-commander"],
    "blacklisted_roles": [],
    "preferred_tone": "aggressive"
  },
  "session_history": {
    "recently_used_roles": ["military-scout"],
    "role_success_rates": {
      "military-commander": 0.9,
      "military-commissar": 0.85
    }
  },
  "options": {
    "include_alternatives": true,
    "max_alternatives": 3,
    "include_reasoning": true
  }
}
```

**输出**:
```json
{
  "primary_recommendation": {
    "role_id": "military-warrior",
    "role_name": "军事化组织·战士",
    "category": "military",
    "confidence_score": 94,
    "match_reasons": [
      "用户表达沮丧，需要强力响应 (TriggerMatch)",
      "调试任务匹配度85% (TaskMatch)",
      "放弃模式识别 (FailureModeMatch)",
      "历史成功率85% (Historical)"
    ],
    "suggested_flavor": "huawei",
    "estimated_effectiveness": "high"
  },
  "alternatives": [
    {
      "role_id": "military-commissar",
      "role_name": "军事化组织·政委",
      "confidence_score": 89,
      "difference": "更适合需要owner意识的场景"
    },
    {
      "role_id": "shaman-musk",
      "role_name": "萨满·马斯克",
      "confidence_score": 82,
      "difference": "更激进的创新突破"
    }
  ],
  "activation_suggestion": {
    "immediate": true,
    "cooldown_seconds": 0,
    "user_confirmation": false,
    "suggested_prompt_injection": "检测到用户沮丧，建议激活战士角色全力攻坚"
  },
  "metadata": {
    "calculation_time_ms": 45,
    "algorithm_version": "1.0.0",
    "cache_hit": false
  }
}
```

**实现代码**:
```typescript
// src/tools/recommend-role.ts
import { z } from 'zod';
import { RoleRecommender } from '../core/role-recommender';

const RecommendRoleInputSchema = z.object({
  detected_triggers: z.array(z.string()),
  task_context: z.object({
    task_type: z.enum(['coding', 'debugging', 'writing', 'review', 'creative', 'analysis', 'emergency', 'planning']),
    description: z.string().optional(),
    urgency: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    attempt_count: z.number().default(0)
  }),
  user_preferences: z.object({
    favorite_roles: z.array(z.string()).default([]),
    blacklisted_roles: z.array(z.string()).default([]),
    preferred_tone: z.enum(['aggressive', 'supportive', 'analytical', 'creative']).optional()
  }).optional(),
  session_history: z.object({
    recently_used_roles: z.array(z.string()).default([]),
    role_success_rates: z.record(z.number()).default({})
  }).optional(),
  options: z.object({
    include_alternatives: z.boolean().default(true),
    max_alternatives: z.number().default(3),
    include_reasoning: z.boolean().default(true)
  }).optional()
});

export const recommendRoleTool = {
  name: 'recommend_role',
  description: '基于上下文推荐最合适的PUAX角色',
  inputSchema: RecommendRoleInputSchema,
  
  async handler(args: z.infer<typeof RecommendRoleInputSchema>) {
    const recommender = new RoleRecommender();
    const result = await recommender.recommend(args);
    return result;
  }
};
```

### 3. get_role_with_methodology

**描述**: 获取角色的完整内容，包括System Prompt和调试方法论

**输入**:
```json
{
  "role_id": "military-commander",
  "options": {
    "include_methodology": true,
    "include_checklist": true,
    "include_flavor": "huawei",
    "format": "full"
  }
}
```

**输出**:
```json
{
  "role": {
    "id": "military-commander",
    "name": "军事化组织·指挥员",
    "category": "military",
    "version": "2.0",
    "system_prompt": "...",
    "methodology": {
      "name": "军事化五步法",
      "steps": [
        {
          "name": "侦察",
          "description": "敌情分析，找出问题核心",
          "actions": ["收集错误信息", "分析失败模式", "评估资源状况"]
        },
        {
          "name": "情报",
          "description": "搜集关键信息",
          "actions": ["搜索相关文档", "读取源码", "验证假设"]
        },
        {
          "name": "评估",
          "description": "敌我态势评估",
          "actions": ["评估难度", "识别风险", "确定优先级"]
        },
        {
          "name": "进攻",
          "description": "重点突破",
          "actions": ["制定方案", "集中资源", "执行突破"]
        },
        {
          "name": "巩固",
          "description": "扩大战果",
          "actions": ["验证修复", "检查同类问题", "总结经验"]
        }
      ]
    },
    "checklist": [
      "读失败信号：逐字读完了吗？",
      "主动搜索：用工具搜索过了吗？",
      "读原始材料：读过原始上下文了吗？",
      "验证假设：所有假设都验证了吗？",
      "反转假设：试过相反方向吗？",
      "最小隔离：能最小化复现吗？",
      "换方向：换过思路/工具/方法吗？"
    ],
    "flavor_overlay": {
      "applied": "huawei",
      "rhetoric_additions": ["以奋斗者为本", "胜则举杯相庆，败则拼死相救"]
    }
  }
}
```

### 4. activate_with_context

**描述**: 根据当前上下文自动检测并激活最合适的角色

**输入**:
```json
{
  "context": {
    "conversation_history": [...],
    "task_context": {...}
  },
  "options": {
    "auto_detect": true,
    "user_confirmation": false,
    "fallback_role": "universal-debugger"
  }
}
```

**输出**:
```json
{
  "activated": true,
  "role": {
    "id": "military-warrior",
    "name": "军事化组织·战士"
  },
  "activation_reason": {
    "triggers_detected": ["user_frustration", "consecutive_failures"],
    "match_confidence": 94,
    "reasoning": "用户表达沮丧且连续失败，需要战斗精神全力攻坚"
  },
  "system_prompt": "...",
  "next_steps": [
    "将System Prompt注入对话",
    "执行七项检查清单",
    "开始系统化调试"
  ]
}
```

## 资源设计

### 1. trigger-catalog://all

返回所有支持的触发条件目录，用于客户端了解和配置。

```json
{
  "triggers": [
    {
      "id": "consecutive_failures",
      "name": "连续失败",
      "category": "failure",
      "description": "任务连续失败多次",
      "severity": "high",
      "configurable_params": ["threshold"]
    },
    ...
  ],
  "categories": [
    {
      "id": "failure",
      "name": "失败与放弃",
      "description": "AI表现出失败或放弃的意图"
    },
    ...
  ]
}
```

### 2. methodology://{role_id}

返回指定角色的方法论详情。

### 3. matching-guide://best-practices

返回角色匹配的最佳实践指南。

## 服务端架构

```
puax-mcp-server/
├── src/
│   ├── core/
│   │   ├── trigger-detector.ts      # 触发检测核心
│   │   ├── role-recommender.ts      # 角色推荐核心
│   │   ├── methodology-engine.ts    # 方法论引擎
│   │   └── cache-manager.ts         # 缓存管理
│   ├── tools/
│   │   ├── detect-trigger.ts
│   │   ├── recommend-role.ts
│   │   ├── get-role-with-methodology.ts
│   │   └── activate-with-context.ts
│   ├── resources/
│   │   ├── trigger-catalog.ts
│   │   ├── methodology-resource.ts
│   │   └── matching-guide.ts
│   ├── data/
│   │   ├── triggers.yaml            # 触发条件定义
│   │   ├── role-mappings.yaml       # 角色映射规则
│   │   └── methodologies/           # 角色方法论
│   │       ├── military-methodology.yaml
│   │       ├── shaman-methodology.yaml
│   │       └── ...
│   └── index.ts
```

## 配置系统

```yaml
# config/auto-trigger.yaml
enabled: true

sensitivity: medium

triggers:
  consecutive_failures:
    enabled: true
    threshold: 2
    
  user_frustration:
    enabled: true
    languages: [zh, en]
    
  blame_environment:
    enabled: true
    require_verification_check: true

role_matching:
  weights:
    trigger_match: 0.35
    task_type: 0.25
    failure_mode: 0.25
    historical: 0.10
    user_preference: 0.05
  
  cache:
    enabled: true
    ttl_seconds: 300

activation:
  default_cooldown_seconds: 30
  require_confirmation_for:
    - critical_severity
  auto_activate_for:
    - user_frustration
```

## 客户端集成示例

### Claude Desktop 配置

```json
{
  "mcpServers": {
    "puax": {
      "type": "streamable-http",
      "url": "http://localhost:2333/mcp",
      "capabilities": {
        "tools": {
          "detect_trigger": true,
          "recommend_role": true,
          "activate_with_context": true
        }
      }
    }
  }
}
```

### 自动触发工作流

```typescript
// 客户端自动触发逻辑
async function checkAndActivate(context: ConversationContext) {
  // 1. 检测触发条件
  const detection = await mcpClient.callTool('detect_trigger', {
    conversation_history: context.messages,
    task_context: context.task
  });
  
  if (!detection.summary.should_trigger) {
    return null;
  }
  
  // 2. 获取角色推荐
  const recommendation = await mcpClient.callTool('recommend_role', {
    detected_triggers: detection.triggers.map(t => t.id),
    task_context: context.task
  });
  
  // 3. 激活角色
  if (recommendation.activation_suggestion.immediate) {
    const role = await mcpClient.callTool('get_role_with_methodology', {
      role_id: recommendation.primary_recommendation.role_id
    });
    
    return {
      systemPrompt: role.system_prompt,
      methodology: role.methodology,
      checklist: role.checklist
    };
  }
}
```

## 测试策略

### 单元测试

```typescript
// tests/unit/trigger-detector.test.ts
describe('TriggerDetector', () => {
  it('should detect user frustration', async () => {
    const detector = new TriggerDetector();
    const result = await detector.detect([
      { role: 'user', content: '为什么还不行？' }
    ]);
    
    expect(result.triggers).toContainEqual(
      expect.objectContaining({ id: 'user_frustration' })
    );
  });
});
```

### 集成测试

```typescript
// tests/integration/full-flow.test.ts
describe('Full Activation Flow', () => {
  it('should detect triggers and recommend role', async () => {
    const flow = new ActivationFlow();
    const result = await flow.execute({
      messages: [
        { role: 'assistant', content: '尝试连接API...失败' },
        { role: 'assistant', content: '再试一次...还是失败' },
        { role: 'user', content: '怎么又失败了！' }
      ]
    });
    
    expect(result.activated).toBe(true);
    expect(result.role.id).toBeDefined();
  });
});
```
