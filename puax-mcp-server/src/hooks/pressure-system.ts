/**
 * PUAX 压力等级系统
 * 实现 PUA 原版的 L1-L4 渐进式压力升级机制
 * 
 * 压力等级:
 * - L0: 无压力，正常状态
 * - L1: 轻度提醒，建议切换方法
 * - L2: 灵魂拷问，要求深入分析
 * - L3: 绩效回顾，强制检查清单
 * - L4: 毕业警告，方法论切换 + 结构化报告
 */

import type { StateManager } from './state-manager.js';
import { stateManager as defaultStateManager } from './state-manager.js';

// ============================================================================
// 类型定义
// ============================================================================

export type PressureLevel = 0 | 1 | 2 | 3 | 4;

export interface PressureConfig {
  l1Threshold: number;      // 默认: 2次失败
  l2Threshold: number;      // 默认: 3次失败
  l3Threshold: number;      // 默认: 4次失败
  l4Threshold: number;      // 默认: 5次失败
  resetAfterSuccess: boolean;
  resetAfterMinutes: number;
  cooldownMs: number;       // 触发冷却时间
}

export interface PressureResponse {
  level: PressureLevel;
  title: string;
  icon: string;
  message: string;
  requirements: string[];
  methodologySwitch?: {
    recommended: string[];
    reason: string;
  };
  checklist?: string[];
}

export interface EscalationResult {
  previousLevel: PressureLevel;
  currentLevel: PressureLevel;
  isEscalated: boolean;
  response: PressureResponse;
  shouldTrigger: boolean;
}

export interface BreakthroughResult {
  triggered: boolean;
  previousLevel: PressureLevel;
  newLevel: PressureLevel;
  peakFailures: number;
  recognition: string;
  methodology_lesson_prompt: string;
  injection: string;
}

/** 深层换框提示（对标 pua de-escalation-protocol） */
export const COGNITIVE_REFRAME: Record<2 | 3 | 4, string[]> = {
  2: [
    '🎯 用户视角：从用户期望行为倒推实现',
    '🔓 攻击者视角：什么输入能让这段代码崩溃？',
    '👶 新手视角：像第一次看到一样重读代码',
    '📋 审计者视角：这段代码做了什么？不做什么？',
  ],
  3: [
    '⬆️ 上移：问题可能在调用侧，不在实现侧',
    '⬇️ 下移：读 API/库源码，不读二手文档',
    '↔️ 平移：有没有完全不同的工具/库可绕过？',
    '🚫 换约束：如果不能改这个文件呢？',
    '📏 5 行预算：最小可行修复是什么？',
  ],
  4: [
    '🔄 如果 bug 是 feature，什么场景下当前行为正确？',
    '🌐 问题是否在环境/数据/配置而非代码？',
    '⏪ 重新审视已排除的可能性——是否排除错了？',
    '🔄 回退到上一个能工作的状态重新出发',
  ],
};

/** 味道认可话术 */
export const FLAVOR_RECOGNITION: Record<string, string> = {
  alibaba: '这才是 Owner 该有的样子。闭环到位，3.75 打底。',
  bytedance: '结果到位了。ROI 翻正，务实敢为。',
  huawei: '烧不死的鸟是凤凰。胜则举杯相庆。',
  tencent: '赛马跑出来了。你赢了这条赛道。',
  baidu: '基本盘守住了。简单可依赖。',
  pinduoduo: '本分做到了。这才叫硬核。',
  meituan: '猛将发于卒伍。做难而正确的事。',
  jd: '兄弟该有的执行力。正道成功。',
  xiaomi: '极致！够极致。',
  netflix: 'Keeper Test: passed.',
  musk: 'Good. Shipped.',
  jobs: 'A-player work. Real artists ship.',
  amazon: 'Delivered Results. Customer Obsession.',
  google: '10x thinking applied. Blameless Postmortem complete.',
  microsoft: 'Trajectory: Successful Impact.',
  default: '突破值得认可。方法论沉淀下来，下次直达。',
};

// ============================================================================
// 压力等级配置
// ============================================================================

export const DEFAULT_PRESSURE_CONFIG: PressureConfig = {
  l1Threshold: 2,
  l2Threshold: 3,
  l3Threshold: 4,
  l4Threshold: 5,
  resetAfterSuccess: true,
  resetAfterMinutes: 30,
  cooldownMs: 30000
};

// ============================================================================
// 压力等级响应模板 (对标 PUA 原版)
// ============================================================================

export interface PressureContext {
  failureCount?: number;
  currentFlavor?: string;
  currentTask?: string;
  [key: string]: unknown;
}

export const PRESSURE_RESPONSES: Record<PressureLevel, (context?: PressureContext) => PressureResponse> = {
  0: () => ({
    level: 0,
    title: '正常状态',
    icon: '✅',
    message: '当前状态正常，继续加油！',
    requirements: []
  }),

  1: (context) => ({
    level: 1,
    title: '连续失败检测',
    icon: '⚠️',
    message: `检测到连续失败 (${context?.failureCount} 次)，当前方法可能不适合。`,
    requirements: [
      '必须切换到 FUNDAMENTALLY 不同的方法',
      '不允许参数微调或重复相同策略',
      '如果未加载 PUA 方法论，立即调用',
      '展示你的工作：运行验证命令，粘贴输出证据'
    ],
    methodologySwitch: {
      recommended: ['military-warrior', 'military-commander', 'shaman-musk'],
      reason: '当前方法已连续失败，需要强力攻坚或重新思考'
    }
  }),

  2: (context) => ({
    level: 2,
    title: '灵魂拷问',
    icon: '🔥',
    message: '你的当前方法已经多次失败，需要深度反思。',
    requirements: [
      '逐字阅读错误信息，不要快速跳过',
      '使用工具搜索核心问题的解决方案',
      '阅读失败点周围的上下文（上下50行）',
      '列出3个完全不同的假设',
      '反转你的主要假设'
    ],
    methodologySwitch: {
      recommended: context?.currentFlavor === 'spinning' 
        ? ['shaman-musk']  // Musk: 质疑需求本身
        : context?.currentFlavor === 'giving_up'
        ? ['netflix-keeper']  // Netflix: 替换整个方法
        : context?.currentFlavor === 'not_searching'
        ? ['baidu-search']  // Baidu: 先搜索再判断
        : ['huawei-rca', 'musk-algorithm'],
      reason: '当前方法论已失败，建议切换到: '
    }
  }),

  3: (_context) => ({
    level: 3,
    title: '绩效回顾',
    icon: '⛔',
    message: '你必须完成以下7点检查清单才能继续。',
    requirements: [],
    checklist: [
      '✓ 逐字阅读失败信号？',
      '✓ 使用工具搜索核心问题？',
      '✓ 阅读失败点周围的上下文？',
      '✓ 所有假设都经过工具验证？',
      '✓ 尝试了相反的假设？',
      '✓ 在最小范围内重现问题？',
      '✓ 切换了工具/方法/角度/技术栈？'
    ],
    methodologySwitch: {
      recommended: ['musk-algorithm', 'huawei-rca', 'amazon-backwards'],
      reason: '当前方法论完全失败，必须切换'
    }
  }),

  4: (_context) => ({
    level: 4,
    title: '毕业警告 + 强制方法论切换',
    icon: '🚨',
    message: '当前方法论已完全失败。你必须立即切换到不同的方法论。',
    requirements: [
      '输出结构化失败报告',
      '列出已验证的事实',
      '列出已排除的可能性（带证据）',
      '缩小问题范围',
      '推荐下一步行动',
      '列出已尝试的方法论及失败原因'
    ],
    methodologySwitch: {
      recommended: [
        'musk-algorithm',      // 质疑需求，删除不必要部分
        'huawei-rca',          // 蓝军思维，攻击自己的方案
        'amazon-backwards',    // 深入底层细节
        'pinduoduo-shortcut'   // 最短路径
      ],
      reason: '所有常规方法论已耗尽，必须尝试根本性不同的方法'
    }
  })
};

// ============================================================================
// 压力系统类
// ============================================================================

export class PressureSystem {
  private config: PressureConfig;
  private stateManager: StateManager;

  constructor(config: Partial<PressureConfig> = {}, stateManager?: StateManager) {
    this.config = { ...DEFAULT_PRESSURE_CONFIG, ...config };
    // Lazy import to avoid circular deps; allow injection for testing
    this.stateManager = stateManager ?? defaultStateManager;
  }

  /**
   * 根据失败次数计算压力等级
   */
  calculateLevel(failureCount: number): PressureLevel {
    if (failureCount >= this.config.l4Threshold) return 4;
    if (failureCount >= this.config.l3Threshold) return 3;
    if (failureCount >= this.config.l2Threshold) return 2;
    if (failureCount >= this.config.l1Threshold) return 1;
    return 0;
  }

  /**
   * 处理失败事件，返回压力升级结果
   */
  handleFailure(
    sessionId: string,
    errorMessage: string,
    toolName?: string,
    context?: {
      currentFlavor?: string;
      currentTask?: string;
    }
  ): EscalationResult {
    // 记录失败
    const failureCount = this.stateManager.recordFailure(sessionId, errorMessage, toolName);
    
    // 获取当前压力等级
    const previousLevel = this.stateManager.getPressureLevel(sessionId) as PressureLevel;
    
    // 计算新压力等级
    const newLevel: PressureLevel = this.calculateLevel(failureCount);
    
    // 检查是否升级
    const isEscalated = newLevel > previousLevel;
    
    // 如果升级，更新状态
    if (isEscalated) {
      this.stateManager.setPressureLevel(sessionId, newLevel);
    }

    // 生成响应
    const response = PRESSURE_RESPONSES[newLevel]({
      failureCount,
      currentFlavor: context?.currentFlavor,
      ...context
    });

    // 只有升级时才触发
    const shouldTrigger = isEscalated && newLevel > 0;

    return {
      previousLevel,
      currentLevel: newLevel,
      isEscalated,
      response,
      shouldTrigger
    };
  }

  /**
   * 处理成功事件（含突破降压检测）
   */
  handleSuccess(sessionId: string, resetPressure: boolean = true): BreakthroughResult | null {
    const state = this.stateManager.getSessionState(sessionId);
    const failuresBeforeReset = state.failureCount;
    const peakLevel = state.peakPressureLevel as PressureLevel;
    const hadBreakthrough = failuresBeforeReset >= 3 && peakLevel >= 2;

    if (this.config.resetAfterSuccess) {
      this.stateManager.resetFailureCount(sessionId);
      if (resetPressure) {
        this.stateManager.setPressureLevel(sessionId, 0);
      }
    }

    if (!hadBreakthrough) return null;

    const flavor = state.currentFlavor || 'default';
    const recognition = FLAVOR_RECOGNITION[flavor] || FLAVOR_RECOGNITION.default;

    const lessonPrompt = [
      '方法论沉淀（自问并记录）：',
      '1. 失败的根因是什么？（一句话）',
      '2. 有效的方法是什么？（一句话）',
      '3. 下次同类问题的直达路径？',
    ].join('\n');

    const injection = [
      '[PUAX 突破 ✨]',
      '',
      `> ${recognition}`,
      '',
      '压力归零（L0）。语气从施压切回专业协作。',
      '',
      lessonPrompt,
      '',
      '确认解决方案完整后再庆祝，不要庆祝太早。',
    ].join('\n');

    return {
      triggered: true,
      previousLevel: peakLevel,
      newLevel: 0,
      peakFailures: failuresBeforeReset,
      recognition,
      methodology_lesson_prompt: lessonPrompt,
      injection,
    };
  }

  /**
   * 手动设置压力等级
   */
  setLevel(sessionId: string, level: PressureLevel): PressureResponse {
    this.stateManager.setPressureLevel(sessionId, level);
    return PRESSURE_RESPONSES[level]({});
  }

  /**
   * 获取当前压力响应
   */
  getCurrentResponse(sessionId: string, context?: PressureContext): PressureResponse {
    const level = this.stateManager.getPressureLevel(sessionId) as PressureLevel;
    return PRESSURE_RESPONSES[level](context);
  }

  /**
   * 获取深层换框提示（L2+）
   */
  getCognitiveReframe(level: PressureLevel): string[] {
    if (level >= 4) return COGNITIVE_REFRAME[4];
    if (level >= 3) return [...COGNITIVE_REFRAME[2], ...COGNITIVE_REFRAME[3]];
    if (level >= 2) return COGNITIVE_REFRAME[2];
    return [];
  }

  /**
   * 构建注入提示词
   */
  buildInjectionPrompt(response: PressureResponse, roleSystemPrompt?: string): string {
    const lines: string[] = [
      `<EXTREMELY_IMPORTANT>`,
      ``,
      `[PUA ${response.icon} L${response.level} — ${response.title}]`,
      ``,
      `> ${response.message}`,
      ``
    ];

    if (response.requirements.length > 0) {
      lines.push('你必须：');
      response.requirements.forEach(req => lines.push(`  • ${req}`));
      lines.push('');
    }

    if (response.checklist && response.checklist.length > 0) {
      lines.push('完成以下检查清单：');
      response.checklist.forEach(item => lines.push(`  ${item}`));
      lines.push('');
    }

    if (response.methodologySwitch) {
      lines.push(`[方法论切换建议 🔄] ${response.methodologySwitch.reason}`);
      lines.push('推荐切换至：');
      response.methodologySwitch.recommended.forEach(m => lines.push(`  → ${m}`));
      lines.push('');
      lines.push('宣布切换格式：> [方法论切换 🔄] 从 [当前] 切换到 [新方法]: [原因]');
      lines.push('');
    }

    const reframe = this.getCognitiveReframe(response.level);
    if (reframe.length > 0) {
      lines.push('[深层换框 🧠] 不换旁白，换认知坐标系：');
      reframe.forEach(r => lines.push(`  ${r}`));
      lines.push('');
    }

    if (roleSystemPrompt) {
      lines.push('---');
      lines.push('');
      lines.push(roleSystemPrompt);
    }

    lines.push('');
    lines.push('</EXTREMELY_IMPORTANT>');

    return lines.join('\n');
  }

  /**
   * 获取方法论切换建议
   */
  getMethodologySwitchAdvice(
    failurePattern: 'spinning' | 'giving_up' | 'not_searching' | 'poor_quality' | 'passive_wait' | 'default',
    currentMethodology?: string
  ): { from: string; to: string; reason: string } {
    const switchMap: Record<string, { to: string; reason: string }> = {
      spinning: {
        to: 'musk-algorithm',
        reason: '原地打转 → Musk算法: 质疑需求本身，删除一切不必要'
      },
      giving_up: {
        to: 'netflix-keeper',
        reason: '想要放弃 → Netflix Keeper: 这个方法不值得保留，彻底替换'
      },
      not_searching: {
        to: 'baidu-search',
        reason: '不去搜索 → Baidu搜索: 先搜索一切，再做出判断'
      },
      poor_quality: {
        to: 'jobs-subtraction',
        reason: '质量差 → Jobs减法: 极简主义 + 像素级完美'
      },
      passive_wait: {
        to: 'alibaba-closed-loop',
        reason: '被动等待 → 阿里闭环: 今天最好的表现是明天最低的要求'
      },
      default: {
        to: 'huawei-rca',
        reason: '通用问题 → 华为RCA: 蓝军思维，攻击自己的方案'
      }
    };

    const advice = switchMap[failurePattern] || switchMap.default;
    return {
      from: currentMethodology || '当前方法论',
      to: advice.to,
      reason: advice.reason
    };
  }

  /**
   * 检查冷却时间
   */
  checkCooldown(sessionId: string): { canTrigger: boolean; remainingMs: number } {
    const state = this.stateManager.getSessionState(sessionId);
    const now = Date.now();
    
    if (!state.lastTriggerTime) {
      return { canTrigger: true, remainingMs: 0 };
    }

    const elapsed = now - state.lastTriggerTime;
    const remaining = Math.max(0, this.config.cooldownMs - elapsed);

    return {
      canTrigger: elapsed >= this.config.cooldownMs,
      remainingMs: remaining
    };
  }
}

// 导出单例
export const pressureSystem = new PressureSystem();
export default pressureSystem;
