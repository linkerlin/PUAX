# PUAX 角色匹配算法规范

## 算法概述

角色匹配算法基于**多维度决策树**，综合考虑：
1. 触发条件 (Trigger Conditions)
2. 任务类型 (Task Type)
3. 失败模式 (Failure Mode)
4. 历史表现 (Historical Performance)
5. 用户偏好 (User Preferences)

## 匹配流程

```
输入: 对话上下文
  │
  ▼
┌─────────────────────────────────────┐
│ Step 1: 触发检测                     │
│ 分析对话，识别触发条件                │
└─────────────────────────────────────┘
  │
  ▼ 发现触发?
┌─────────────────────────────────────┐
│ Step 2: 任务分类                     │
│ 识别当前任务类型                      │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ Step 3: 失败模式识别                  │
│ 判断具体的失败模式                    │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ Step 4: 角色评分                     │
│ 为每个候选角色计算匹配分数            │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ Step 5: 结果输出                     │
│ 返回最佳匹配角色及备选                │
└─────────────────────────────────────┘
```

## 评分算法

### 总分计算公式

```typescript
TotalScore = (
  TriggerMatchScore * 0.35 +
  TaskTypeMatchScore * 0.25 +
  FailureModeMatchScore * 0.25 +
  HistoricalScore * 0.10 +
  UserPreferenceScore * 0.05
)
```

### 1. 触发条件匹配分 (TriggerMatchScore)

```typescript
interface TriggerMatchScore {
  // 精确匹配: 角色被明确推荐用于此触发条件
  exactMatch: 100,
  
  // 相关匹配: 角色适用于同类触发条件
  relatedMatch: 70,
  
  // 弱匹配: 角色可能有所帮助
  weakMatch: 40,
  
  // 不匹配
  noMatch: 0
}

// 计算逻辑
function calculateTriggerScore(
  role: Role,
  detectedTriggers: Trigger[]
): number {
  let maxScore = 0;
  
  for (const trigger of detectedTriggers) {
    if (role.recommended_for.includes(trigger.id)) {
      maxScore = Math.max(maxScore, 100);
    } else if (role.suitable_for.includes(trigger.category)) {
      maxScore = Math.max(maxScore, 70);
    } else if (role.can_handle.includes(trigger.severity)) {
      maxScore = Math.max(maxScore, 40);
    }
  }
  
  return maxScore;
}
```

### 2. 任务类型匹配分 (TaskTypeMatchScore)

```typescript
const TaskTypeRoleMapping = {
  coding: {
    primary: ["military-commander", "military-technician", "shaman-linus"],
    secondary: ["theme-hacker", "military-scout"]
  },
  debugging: {
    primary: ["military-scout", "military-technician", "theme-hacker"],
    secondary: ["shaman-einstein", "military-commander"]
  },
  code_review: {
    primary: ["military-discipline", "sillytavern-antifragile", "shaman-linus"],
    secondary: ["military-commissar"]
  },
  writing: {
    primary: ["sillytavern-iterator", "shaman-davinci", "special-creative-spark"],
    secondary: ["theme-alchemy"]
  },
  creative: {
    primary: ["shaman-musk", "special-creative-spark", "theme-alchemy"],
    secondary: ["shaman-davinci", "shaman-jobs"]
  },
  analysis: {
    primary: ["shaman-einstein", "military-scout", "shaman-buffett"],
    secondary: ["shaman-sun-tzu"]
  },
  emergency: {
    primary: ["military-militia", "special-urgent-sprint", "military-warrior"],
    secondary: ["military-commander"]
  },
  planning: {
    primary: ["military-commander", "shaman-sun-tzu", "special-product-designer"],
    secondary: ["military-commissar"]
  }
};

function calculateTaskTypeScore(
  role: Role,
  taskType: string
): number {
  const mapping = TaskTypeRoleMapping[taskType];
  if (!mapping) return 50; // 默认分数
  
  if (mapping.primary.includes(role.id)) return 100;
  if (mapping.secondary.includes(role.id)) return 75;
  return 30;
}
```

### 3. 失败模式匹配分 (FailureModeMatchScore)

```typescript
const FailureModeRoleProgression = {
  stuck_spinning: {
    rounds: [
      { round: 1, roles: ["shaman-jobs", "military-commander"] },
      { round: 2, roles: ["shaman-musk", "shaman-einstein"] },
      { round: 3, roles: ["theme-hacker", "military-warrior"] }
    ]
  },
  giving_up: {
    rounds: [
      { round: 1, roles: ["military-commissar", "self-motivation-awakening"] },
      { round: 2, roles: ["military-warrior", "shaman-musk"] },
      { round: 3, roles: ["military-discipline", "shaman-jobs"] }
    ]
  },
  low_quality: {
    rounds: [
      { round: 1, roles: ["military-discipline", "sillytavern-antifragile"] },
      { round: 2, roles: ["shaman-jobs", "military-commissar"] },
      { round: 3, roles: ["shaman-musk", "shaman-davinci"] }
    ]
  },
  no_search: {
    rounds: [
      { round: 1, roles: ["military-scout", "theme-hacker"] },
      { round: 2, roles: ["shaman-einstein", "shaman-sun-tzu"] },
      { round: 3, roles: ["military-technician", "theme-sect-discipline"] }
    ]
  },
  passive_wait: {
    rounds: [
      { round: 1, roles: ["self-motivation-awakening", "military-commander"] },
      { round: 2, roles: ["shaman-musk", "military-warrior"] },
      { round: 3, roles: ["military-militia", "special-urgent-sprint"] }
    ]
  }
};

function calculateFailureModeScore(
  role: Role,
  failureMode: string,
  attemptCount: number
): number {
  const progression = FailureModeRoleProgression[failureMode];
  if (!progression) return 50;
  
  // 根据尝试次数确定当前轮次
  const round = Math.min(Math.floor(attemptCount / 2) + 1, 3);
  const roundData = progression.rounds.find(r => r.round === round);
  
  if (roundData?.roles.includes(role.id)) return 100;
  
  // 检查是否是其他轮次的推荐角色
  for (const r of progression.rounds) {
    if (r.roles.includes(role.id)) return 70;
  }
  
  return 30;
}
```

### 4. 历史表现分 (HistoricalScore)

```typescript
interface HistoricalData {
  roleUsageCount: Map<RoleId, number>;
  roleSuccessRate: Map<RoleId, number>; // 0-1
  userPreferredRoles: RoleId[];
  recentlyUsedRoles: RoleId[]; // 最近5次
}

function calculateHistoricalScore(
  role: Role,
  history: HistoricalData
): number {
  let score = 50; // 基础分
  
  // 成功率加成
  const successRate = history.roleSuccessRate.get(role.id) || 0.5;
  score += successRate * 30;
  
  // 使用频率减分（避免过度使用同一角色）
  const usageCount = history.roleUsageCount.get(role.id) || 0;
  const usagePenalty = Math.min(usageCount * 2, 20);
  score -= usagePenalty;
  
  // 最近使用惩罚（避免连续使用）
  if (history.recentlyUsedRoles.includes(role.id)) {
    score -= 15;
  }
  
  return Math.max(0, Math.min(100, score));
}
```

### 5. 用户偏好分 (UserPreferenceScore)

```typescript
interface UserPreferences {
  favoriteRoles: RoleId[];
  blacklistedRoles: RoleId[];
  preferredCategories: Category[];
  preferredTone: 'aggressive' | 'supportive' | 'analytical' | 'creative';
}

function calculateUserPreferenceScore(
  role: Role,
  preferences: UserPreferences
): number {
  // 黑名单检查
  if (preferences.blacklistedRoles.includes(role.id)) {
    return 0;
  }
  
  let score = 50;
  
  // 收藏角色加成
  if (preferences.favoriteRoles.includes(role.id)) {
    score += 30;
  }
  
  // 偏好类别加成
  if (preferences.preferredCategories.includes(role.category)) {
    score += 15;
  }
  
  // 语调匹配
  const toneMatch = getToneMatchScore(role, preferences.preferredTone);
  score += toneMatch;
  
  return Math.min(100, score);
}
```

## 决策树优化

### 快速路径 (Fast Path)

对于明确的触发条件，使用预定义规则直接匹配：

```typescript
const FastPathRules = [
  {
    condition: (ctx: Context) => 
      ctx.triggers.includes('user_frustration') &&
      ctx.attemptCount >= 3,
    action: () => ({
      primary: 'military-warrior',
      alternatives: ['military-commander', 'shaman-musk'],
      confidence: 0.95
    })
  },
  {
    condition: (ctx: Context) =>
      ctx.triggers.includes('giving_up_language'),
    action: () => ({
      primary: 'military-commissar',
      alternatives: ['self-motivation-awakening'],
      confidence: 0.90
    })
  },
  {
    condition: (ctx: Context) =>
      ctx.taskType === 'emergency',
    action: () => ({
      primary: 'military-militia',
      alternatives: ['special-urgent-sprint'],
      confidence: 0.92
    })
  }
];
```

## 输出格式

### 推荐结果结构

```typescript
interface RoleRecommendation {
  primary: {
    roleId: string;
    roleName: string;
    confidenceScore: number; // 0-100
    matchReasons: string[];
    suggestedFlavor?: string;
  };
  alternatives: Array<{
    roleId: string;
    roleName: string;
    confidenceScore: number;
    differenceFromPrimary: string;
  }>;
  metadata: {
    detectedTriggers: string[];
    identifiedTaskType: string;
    identifiedFailureMode: string;
    calculationBreakdown: Record<string, number>;
  };
  suggestedActivation: {
    immediate: boolean;
    cooldownSeconds: number;
    userConfirmationRequired: boolean;
  };
}
```

### 示例输出

```json
{
  "primary": {
    "roleId": "military-commissar",
    "roleName": "军事化组织·政委",
    "confidenceScore": 92,
    "matchReasons": [
      "检测到连续失败3次 (TriggerMatchScore: 100)",
      "检测到归咎环境未验证 (TriggerMatchScore: 70)",
      "调试任务类型匹配 (TaskTypeMatchScore: 80)",
      "放弃模式识别 (FailureModeMatchScore: 95)"
    ],
    "suggestedFlavor": "huawei"
  },
  "alternatives": [
    {
      "roleId": "military-warrior",
      "roleName": "军事化组织·战士",
      "confidenceScore": 85,
      "differenceFromPrimary": "更强调战斗精神，适合用户已表达沮丧的场景"
    },
    {
      "roleId": "shaman-musk",
      "roleName": "萨满·马斯克",
      "confidenceScore": 78,
      "differenceFromPrimary": "更激进的创新思维，适合需要跳出框架的场景"
    }
  ],
  "metadata": {
    "detectedTriggers": ["consecutive_failures", "blame_environment"],
    "identifiedTaskType": "debugging",
    "identifiedFailureMode": "giving_up",
    "calculationBreakdown": {
      "TriggerMatchScore": 85,
      "TaskTypeMatchScore": 80,
      "FailureModeMatchScore": 95,
      "HistoricalScore": 65,
      "UserPreferenceScore": 75
    }
  },
  "suggestedActivation": {
    "immediate": true,
    "cooldownSeconds": 0,
    "userConfirmationRequired": false
  }
}
```

## 性能优化

### 缓存策略

```typescript
class RoleMatchingCache {
  private cache: Map<string, CachedResult>;
  private ttlMs: number = 5 * 60 * 1000; // 5分钟

  getKey(context: MatchingContext): string {
    // 基于触发条件+任务类型+失败模式生成缓存键
    return hash({
      triggers: context.triggers.sort(),
      taskType: context.taskType,
      failureMode: context.failureMode
    });
  }

  get(context: MatchingContext): RoleRecommendation | null {
    const key = this.getKey(context);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttlMs) {
      return cached.result;
    }
    
    return null;
  }
}
```

### 预处理索引

```typescript
// 构建角色索引以加速查询
class RoleIndex {
  byTrigger: Map<TriggerId, RoleId[]>;
  byTaskType: Map<TaskType, RoleId[]>;
  byFailureMode: Map<FailureMode, RoleId[]>;
  byCategory: Map<Category, RoleId[]>;

  buildIndex(roles: Role[]): void {
    for (const role of roles) {
      // 索引触发条件
      for (const trigger of role.recommended_for) {
        this.addToIndex(this.byTrigger, trigger, role.id);
      }
      
      // 索引任务类型
      for (const taskType of role.suitable_task_types) {
        this.addToIndex(this.byTaskType, taskType, role.id);
      }
      
      // ... 其他索引
    }
  }
}
```

## A/B测试支持

```typescript
interface ABTestConfig {
  experimentId: string;
  variants: Array<{
    name: string;
    weight: number;
    algorithmVersion: string;
    scoringWeights: Record<string, number>;
  }>;
}

function selectVariant(config: ABTestConfig, userId: string): Variant {
  const hash = hashUserId(userId, config.experimentId);
  const totalWeight = config.variants.reduce((sum, v) => sum + v.weight, 0);
  let cumulativeWeight = 0;
  
  for (const variant of config.variants) {
    cumulativeWeight += variant.weight / totalWeight;
    if (hash <= cumulativeWeight) {
      return variant;
    }
  }
  
  return config.variants[0];
}
```

## 监控指标

```typescript
interface MatchingMetrics {
  // 匹配质量
  averageConfidenceScore: number;
  top1Accuracy: number; // 首选角色被接受的比例
  top3Accuracy: number; // 前三角色被接受的比例
  
  // 性能
  averageMatchingTimeMs: number;
  cacheHitRate: number;
  
  // 业务
  roleDistribution: Map<RoleId, number>;
  triggerDistribution: Map<TriggerId, number>;
  userSatisfactionScore: number;
}
```
