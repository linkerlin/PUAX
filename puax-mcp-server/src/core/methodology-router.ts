/**
 * 方法论智能路由
 * 根据任务类型和失败模式自动选择最优方法论
 */

// ============================================================================
// 类型定义
// ============================================================================

export type TaskType = 
  | 'debugging' 
  | 'building' 
  | 'research' 
  | 'architecture' 
  | 'performance' 
  | 'deployment' 
  | 'review' 
  | 'planning';

export type FailureMode = 
  | 'spinning' 
  | 'giving_up' 
  | 'poor_quality' 
  | 'not_searching' 
  | 'passive_wait' 
  | 'unverified_completion'
  | 'over_complication';

export type Methodology = 
  | 'alibaba-closed-loop'
  | 'huawei-rca'
  | 'musk-algorithm'
  | 'jobs-subtraction'
  | 'baidu-search'
  | 'amazon-backwards'
  | 'bytedance-abtest'
  | 'netflix-keeper'
  | 'pinduoduo-simplify'
  | 'xiaomi-focus'
  | 'amazon-deep-dive'
  | 'bytedance-data';

export interface MethodologyDefinition {
  id: Methodology;
  name: string;
  description: string;
  flavor: string;
  keywords: string[];
  suitableTasks: TaskType[];
  effectiveAgainst: FailureMode[];
  steps: string[];
  switchToOnFailure: Methodology[];
}

export interface RoutingRequest {
  taskType: TaskType;
  failureMode?: FailureMode;
  attemptCount: number;
  previousMethodologies?: Methodology[];
  context?: string;
}

export interface RoutingResult {
  selectedMethodology: Methodology;
  reason: string;
  confidence: number;
  alternativeMethodologies: Methodology[];
  executionSteps: string[];
  switchingChain?: Methodology[];
}

// ============================================================================
// 方法论定义
// ============================================================================

export const METHODOLOGIES: Record<Methodology, MethodologyDefinition> = {
  // 辅助方法论定义
  'pinduoduo-simplify': {
    id: 'pinduoduo-simplify',
    name: '拼多多简化法',
    description: '砍掉一切中间环节，最短决策链',
    flavor: 'pinduoduo',
    keywords: ['简化', '砍环节', '最短路径'],
    suitableTasks: ['building'],
    effectiveAgainst: ['spinning'],
    steps: ['识别冗余', '砍掉中间环节', '直达目标'],
    switchToOnFailure: ['huawei-rca']
  },
  'xiaomi-focus': {
    id: 'xiaomi-focus',
    name: '小米专注法',
    description: '专注、极致、口碑、快',
    flavor: 'xiaomi',
    keywords: ['专注', '极致', '口碑', '快'],
    suitableTasks: ['building'],
    effectiveAgainst: ['poor_quality'],
    steps: ['专注核心', '做到极致', '快速迭代'],
    switchToOnFailure: ['netflix-keeper']
  },
  'amazon-deep-dive': {
    id: 'amazon-deep-dive',
    name: 'Amazon深度挖掘',
    description: 'Dive Deep 深入细节',
    flavor: 'amazon',
    keywords: ['深入', '细节', '数据'],
    suitableTasks: ['research', 'debugging'],
    effectiveAgainst: ['not_searching'],
    steps: ['深入细节', '挖掘根因', '数据验证'],
    switchToOnFailure: ['bytedance-abtest']
  },
  'bytedance-data': {
    id: 'bytedance-data',
    name: '字节数据驱动',
    description: 'Data before intuition',
    flavor: 'bytedance',
    keywords: ['数据', '驱动', '验证'],
    suitableTasks: ['performance'],
    effectiveAgainst: ['not_searching'],
    steps: ['收集数据', '分析验证', '决策'],
    switchToOnFailure: ['baidu-search']
  },
  'alibaba-closed-loop': {
    id: 'alibaba-closed-loop',
    name: '阿里闭环法',
    description: '定目标→追过程→拿结果→复盘四步法',
    flavor: 'alibaba',
    keywords: ['闭环', '抓手', '颗粒度', '复盘'],
    suitableTasks: ['deployment', 'planning', 'building'],
    effectiveAgainst: ['passive_wait', 'unverified_completion'],
    steps: [
      '定目标: 明确可量化的目标',
      '追过程: 监控执行过程',
      '拿结果: 确保结果达成',
      '复盘: 总结经验教训'
    ],
    switchToOnFailure: ['huawei-rca', 'musk-algorithm']
  },

  'huawei-rca': {
    id: 'huawei-rca',
    name: '华为根因分析',
    description: 'RCA 5-Why根因 + 蓝军自攻击 + 压强集中',
    flavor: 'huawei',
    keywords: ['根因', '5-Why', '蓝军', '力出一孔'],
    suitableTasks: ['debugging', 'review'],
    effectiveAgainst: ['spinning', 'poor_quality', 'giving_up'],
    steps: [
      '闻味道: 列出所有尝试方案',
      '揪头发: 逐字读失败信号、主动搜索',
      '照镜子: 检查是否在重复',
      '执行新方案: 本质不同的方案',
      '复盘: 检查同类问题'
    ],
    switchToOnFailure: ['musk-algorithm', 'jobs-subtraction']
  },

  'musk-algorithm': {
    id: 'musk-algorithm',
    name: 'Musk算法',
    description: '质疑→删除→简化→加速→自动化',
    flavor: 'musk',
    keywords: ['质疑', '删除', '简化', '加速', '自动化'],
    suitableTasks: ['building', 'performance', 'architecture'],
    effectiveAgainst: ['spinning', 'over_complication', 'giving_up'],
    steps: [
      '质疑: 质疑每一个需求',
      '删除: 删除不必要的部分',
      '简化: 优化剩下的部分',
      '加速: 加快执行速度',
      '自动化: 实现自动化'
    ],
    switchToOnFailure: ['huawei-rca']
  },

  'jobs-subtraction': {
    id: 'jobs-subtraction',
    name: 'Jobs减法哲学',
    description: '减法>加法 + DRI + 像素级完美',
    flavor: 'jobs',
    keywords: ['减法', 'DRI', '像素级', '完美'],
    suitableTasks: ['review', 'architecture'],
    effectiveAgainst: ['poor_quality', 'over_complication'],
    steps: [
      '识别核心: 什么是最重要的',
      '减法: 删除非核心部分',
      '专注: 把核心做到极致',
      '验证: 像素级检查'
    ],
    switchToOnFailure: ['netflix-keeper']
  },

  'baidu-search': {
    id: 'baidu-search',
    name: '百度搜索优先',
    description: '搜索是第一生产力，信息检索先行',
    flavor: 'baidu',
    keywords: ['搜索', '信息检索', '基本盘'],
    suitableTasks: ['research', 'debugging'],
    effectiveAgainst: ['not_searching', 'spinning'],
    steps: [
      '搜索: 多角度搜索问题',
      '阅读: 读原始材料',
      '整理: 整理信息',
      '应用: 应用到实际问题'
    ],
    switchToOnFailure: ['bytedance-abtest']
  },

  'amazon-backwards': {
    id: 'amazon-backwards',
    name: 'Amazon逆向工作',
    description: 'Working Backwards PR/FAQ + 6-Pager',
    flavor: 'amazon',
    keywords: ['逆向', 'PR/FAQ', '客户至上'],
    suitableTasks: ['architecture', 'planning'],
    effectiveAgainst: ['passive_wait', 'poor_quality'],
    steps: [
      '写PR: 从客户需求出发',
      '写FAQ: 预判问题和答案',
      '6页文档: 详细方案',
      '审阅: 模拟审阅流程'
    ],
    switchToOnFailure: ['bytedance-abtest', 'alibaba-closed-loop']
  },

  'bytedance-abtest': {
    id: 'bytedance-abtest',
    name: '字节A/B测试',
    description: 'A/B Test一切 + 数据驱动 + 速度>完美',
    flavor: 'bytedance',
    keywords: ['A/B测试', '数据驱动', 'ROI', '速度'],
    suitableTasks: ['performance', 'building'],
    effectiveAgainst: ['not_searching', 'unverified_completion'],
    steps: [
      '假设: 形成可测试的假设',
      '实验: 设计A/B测试',
      '数据: 收集和分析数据',
      '决策: 基于数据决策'
    ],
    switchToOnFailure: ['baidu-search', 'amazon-deep-dive']
  },

  'netflix-keeper': {
    id: 'netflix-keeper',
    name: 'Netflix Keeper测试',
    description: 'Keeper Test + 4A Feedback',
    flavor: 'netflix',
    keywords: ['Keeper Test', '4A反馈', '人才密度'],
    suitableTasks: ['review', 'planning'],
    effectiveAgainst: ['giving_up', 'poor_quality'],
    steps: [
      '评估: 如果方案是员工，会保留吗',
      '反馈: 4A反馈（ Aim, Actionable, Accept, Appreciate ）',
      '决策: 继续投资还是放弃',
      '执行: 果断执行决策'
    ],
    switchToOnFailure: ['huawei-rca', 'musk-algorithm']
  }
};

// ============================================================================
// 任务类型到方法论的映射
// ============================================================================

const TASK_METHODLOGY_MAPPING: Record<TaskType, Methodology[]> = {
  debugging: ['huawei-rca', 'baidu-search', 'alibaba-closed-loop'],
  building: ['musk-algorithm', 'bytedance-abtest', 'alibaba-closed-loop'],
  research: ['baidu-search', 'amazon-backwards', 'bytedance-abtest'],
  architecture: ['amazon-backwards', 'musk-algorithm', 'jobs-subtraction'],
  performance: ['bytedance-abtest', 'musk-algorithm', 'huawei-rca'],
  deployment: ['alibaba-closed-loop', 'huawei-rca', 'musk-algorithm'],
  review: ['jobs-subtraction', 'netflix-keeper', 'huawei-rca'],
  planning: ['amazon-backwards', 'alibaba-closed-loop', 'netflix-keeper']
};

// ============================================================================
// 失败模式到切换链的映射
// ============================================================================

const FAILURE_SWITCH_CHAIN: Record<FailureMode, Methodology[]> = {
  spinning: ['musk-algorithm', 'jobs-subtraction', 'huawei-rca'],
  giving_up: ['netflix-keeper', 'huawei-rca', 'musk-algorithm'],
  poor_quality: ['jobs-subtraction', 'netflix-keeper', 'huawei-rca'],
  not_searching: ['baidu-search', 'amazon-backwards', 'bytedance-abtest'],
  passive_wait: ['alibaba-closed-loop', 'amazon-backwards', 'musk-algorithm'],
  unverified_completion: ['bytedance-abtest', 'alibaba-closed-loop', 'netflix-keeper'],
  over_complication: ['musk-algorithm', 'jobs-subtraction', 'pinduoduo-simplify']
};

// ============================================================================
// 方法论路由器
// ============================================================================

export class MethodologyRouter {
  private usageHistory: Map<string, Methodology[]> = new Map();

  /**
   * 路由到最优方法论
   */
  route(request: RoutingRequest): RoutingResult {
    const { taskType, failureMode, attemptCount, previousMethodologies, context } = request;

    // 1. 基于任务类型获取候选方法论
    const candidates = TASK_METHODLOGY_MAPPING[taskType] || ['alibaba-closed-loop'];

    // 2. 如果存在失败模式，使用切换链
    let selectedMethodology: Methodology;
    let reason: string;
    let switchingChain: Methodology[] | undefined;

    if (failureMode && attemptCount >= 3) {
      // 失败多次，需要切换方法论
      const chain = FAILURE_SWITCH_CHAIN[failureMode];
      
      // 找到链中未尝试过的方法论
      const tried = new Set(previousMethodologies || []);
      selectedMethodology = chain.find(m => !tried.has(m)) || chain[chain.length - 1];
      
      reason = `检测到失败模式 "${failureMode}"，已尝试 ${attemptCount} 次，切换到 ${METHODOLOGIES[selectedMethodology].name}`;
      switchingChain = chain;
    } else {
      // 基于任务类型选择
      selectedMethodology = candidates[0];
      reason = `根据任务类型 "${taskType}" 推荐 ${METHODOLOGIES[selectedMethodology].name}`;
    }

    // 3. 计算置信度
    const confidence = this.calculateConfidence(selectedMethodology, taskType, failureMode);

    // 4. 获取备选方案
    const alternativeMethodologies = candidates
      .filter(m => m !== selectedMethodology)
      .slice(0, 2);

    // 5. 获取执行步骤
    const definition = METHODOLOGIES[selectedMethodology];
    const executionSteps = definition.steps;

    return {
      selectedMethodology,
      reason,
      confidence,
      alternativeMethodologies,
      executionSteps,
      switchingChain
    };
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(
    methodology: Methodology,
    taskType: TaskType,
    failureMode?: FailureMode
  ): number {
    const def = METHODOLOGIES[methodology];
    let confidence = 0.7;  // 基础置信度

    // 任务类型匹配度
    if (def.suitableTasks.includes(taskType)) {
      confidence += 0.15;
    }

    // 失败模式匹配度
    if (failureMode && def.effectiveAgainst.includes(failureMode)) {
      confidence += 0.1;
    }

    // 限制最大置信度
    return Math.min(0.95, confidence);
  }

  /**
   * 获取方法论详情
   */
  getMethodology(methodology: Methodology): MethodologyDefinition {
    return METHODOLOGIES[methodology];
  }

  /**
   * 获取所有方法论
   */
  getAllMethodologies(): MethodologyDefinition[] {
    return Object.values(METHODOLOGIES);
  }

  /**
   * 记录方法论使用
   */
  recordUsage(sessionId: string, methodology: Methodology): void {
    const history = this.usageHistory.get(sessionId) || [];
    history.push(methodology);
    this.usageHistory.set(sessionId, history.slice(-10));  // 保留最近10个
  }

  /**
   * 获取使用历史
   */
  getUsageHistory(sessionId: string): Methodology[] {
    return this.usageHistory.get(sessionId) || [];
  }

  /**
   * 建议下一次切换
   */
  suggestSwitch(
    sessionId: string,
    currentMethodology: Methodology,
    failureMode: FailureMode
  ): Methodology | undefined {
    const def = METHODOLOGIES[currentMethodology];
    const history = this.getUsageHistory(sessionId);
    
    // 在当前方法论的 switchToOnFailure 中找到未尝试的
    const next = def.switchToOnFailure.find(m => !history.includes(m));
    
    // 如果都尝试过了，使用失败模式链
    if (!next) {
      const chain = FAILURE_SWITCH_CHAIN[failureMode];
      return chain.find(m => m !== currentMethodology && !history.includes(m));
    }

    return next;
  }

  /**
   * 解释为什么选择这个方法论
   */
  explainChoice(
    methodology: Methodology,
    taskType: TaskType,
    failureMode?: FailureMode
  ): string {
    const def = METHODOLOGIES[methodology];
    const lines: string[] = [
      `选择 ${def.name} 的原因：`,
      ''
    ];

    // 任务类型匹配
    if (def.suitableTasks.includes(taskType)) {
      lines.push(`✓ 适合任务类型：${taskType}`);
    }

    // 失败模式匹配
    if (failureMode && def.effectiveAgainst.includes(failureMode))
    {
      lines.push(`✓ 有效解决：${failureMode}`);
    }

    // 核心特点
    lines.push(`✓ 核心方法：${def.steps[0]}`);
    lines.push(`✓ 风味特色：${def.flavor}`);

    return lines.join('\n');
  }

  /**
   * 获取方法论统计
   */
  getStatistics(): Record<Methodology, number> {
    const stats: Partial<Record<Methodology, number>> = {};
    
    for (const history of this.usageHistory.values()) {
      for (const m of history) {
        stats[m] = (stats[m] || 0) + 1;
      }
    }

    return stats as Record<Methodology, number>;
  }
}

// ============================================================================
// 单例导出
// ============================================================================

export const methodologyRouter = new MethodologyRouter();

// ============================================================================
// 工具函数
// ============================================================================

export function getMethodologyName(methodology: Methodology): string {
  return METHODOLOGIES[methodology]?.name || methodology;
}

export function getMethodologyFlavor(methodology: Methodology): string {
  return METHODOLOGIES[methodology]?.flavor || 'alibaba';
}

export function isValidMethodology(m: string): m is Methodology {
  return Object.keys(METHODOLOGIES).includes(m);
}

export function getSuitableMethodologies(taskType: TaskType): Methodology[] {
  return TASK_METHODLOGY_MAPPING[taskType] || [];
}
