/**
 * P7/P9/P10 分级角色体系
 * 实现分级角色管理和智能匹配
 */

// ============================================================================
// 类型定义
// ============================================================================

export type RoleLevel = 'p7' | 'p9' | 'p10';

export interface LevelCapability {
  scope: string;
  responsibilities: string[];
  decisionPower: 'execute' | 'coordinate' | 'strategic';
}

export interface RoleLevelDefinition {
  level: RoleLevel;
  title: string;
  subtitle: string;
  description: string;
  capabilities: LevelCapability;
  representativeRoles: string[];
  useCases: string[];
  promotionCriteria: {
    minTriggers: number;
    minL3Plus: number;
    minStreakDays: number;
  };
}

export interface UserProgress {
  userId: string;
  currentLevel: RoleLevel;
  totalTriggers: number;
  l3PlusCount: number;
  streakDays: number;
  roleUsage: Record<string, number>;
  lastActive: Date;
}

export interface LevelRecommendation {
  recommendedLevel: RoleLevel;
  reason: string;
  suitableRoles: string[];
  confidence: number;
}

// ============================================================================
// 分级定义
// ============================================================================

export const ROLE_LEVELS: Record<RoleLevel, RoleLevelDefinition> = {
  p7: {
    level: 'p7',
    title: 'P7 骨干工程师',
    subtitle: '执行 + 单点攻坚',
    description: '专注于解决具体技术难题，具备强大的单点突破能力。适合个人任务和技术攻坚场景。',
    capabilities: {
      scope: '个人任务 + 技术攻坚',
      responsibilities: [
        '解决具体技术难题',
        '执行分配的任务',
        '单点突破和攻坚',
        '代码实现和调试',
        '技术方案落地'
      ],
      decisionPower: 'execute'
    },
    representativeRoles: [
      'military-warrior',
      'shaman-davinci',
      'theme-hacker',
      'special-challenge-solver',
      'self-motivation-bootstrap-pua'
    ],
    useCases: [
      '个人开发任务',
      'Bug 修复',
      '技术难题攻克',
      '代码重构',
      '算法实现'
    ],
    promotionCriteria: {
      minTriggers: 20,
      minL3Plus: 2,
      minStreakDays: 7
    }
  },

  p9: {
    level: 'p9',
    title: 'P9 Tech Lead',
    subtitle: '团队协调 + 任务分配',
    description: '具备团队管理能力，能够协调多个角色完成任务。适合团队协作和项目管理场景。',
    capabilities: {
      scope: '团队协作 + 项目管理',
      responsibilities: [
        '制定技术方案',
        '分配和协调任务',
        '团队成员管理',
        '进度跟踪和把控',
        '技术决策建议'
      ],
      decisionPower: 'coordinate'
    },
    representativeRoles: [
      'military-commander',
      'sillytavern-chief',
      'shaman-sun-tzu',
      'military-commissar',
      'self-motivation-awakening'
    ],
    useCases: [
      '团队项目管理',
      '多任务协调',
      '技术方案设计',
      'Code Review',
      '团队协作开发'
    ],
    promotionCriteria: {
      minTriggers: 100,
      minL3Plus: 30,
      minStreakDays: 14
    }
  },

  p10: {
    level: 'p10',
    title: 'P10 首席架构师',
    subtitle: '战略规划 + 架构决策',
    description: '具备系统性思维和战略眼光，负责长期规划和技术方向决策。适合架构设计和战略规划场景。',
    capabilities: {
      scope: '战略规划 + 架构决策',
      responsibilities: [
        '技术战略规划',
        '架构设计和决策',
        '长期规划制定',
        '技术选型评估',
        '团队方向把控',
        '风险识别和规避'
      ],
      decisionPower: 'strategic'
    },
    representativeRoles: [
      'strategic-architect',  // 新增角色
      'shaman-musk',
      'shaman-jobs',
      'shaman-buffett',
      'self-motivation-destruction'
    ],
    useCases: [
      '系统架构设计',
      '技术战略制定',
      '长期规划',
      '技术选型',
      '架构评审'
    ],
    promotionCriteria: {
      minTriggers: 200,
      minL3Plus: 40,
      minStreakDays: 30
    }
  }
};

// ============================================================================
// 分级管理器
// ============================================================================

export class RoleLevelManager {
  private userProgress: Map<string, UserProgress> = new Map();

  /**
   * 获取分级定义
   */
  getLevelDefinition(level: RoleLevel): RoleLevelDefinition {
    return ROLE_LEVELS[level];
  }

  /**
   * 获取所有分级定义
   */
  getAllLevels(): RoleLevelDefinition[] {
    return Object.values(ROLE_LEVELS);
  }

  /**
   * 初始化用户进度
   */
  initUserProgress(userId: string): UserProgress {
    const progress: UserProgress = {
      userId,
      currentLevel: 'p7',
      totalTriggers: 0,
      l3PlusCount: 0,
      streakDays: 0,
      roleUsage: {},
      lastActive: new Date()
    };
    this.userProgress.set(userId, progress);
    return progress;
  }

  /**
   * 获取用户进度
   */
  getUserProgress(userId: string): UserProgress | undefined {
    return this.userProgress.get(userId);
  }

  /**
   * 更新用户进度
   */
  updateProgress(
    userId: string, 
    updates: Partial<Omit<UserProgress, 'userId'>>
  ): UserProgress {
    let progress = this.userProgress.get(userId);
    if (!progress) {
      progress = this.initUserProgress(userId);
    }

    Object.assign(progress, updates);
    progress.lastActive = new Date();

    // 自动检查是否可以升级
    this.checkPromotion(userId);

    return progress;
  }

  /**
   * 记录角色使用
   */
  recordRoleUsage(userId: string, roleId: string, triggerLevel?: number): void {
    const progress = this.getUserProgress(userId) || this.initUserProgress(userId);
    
    progress.roleUsage[roleId] = (progress.roleUsage[roleId] || 0) + 1;
    progress.totalTriggers++;
    
    if (triggerLevel && triggerLevel >= 3) {
      progress.l3PlusCount++;
    }

    this.userProgress.set(userId, progress);
    this.checkPromotion(userId);
  }

  /**
   * 检查是否可以升级
   */
  checkPromotion(userId: string): { canPromote: boolean; toLevel?: RoleLevel; reason?: string } {
    const progress = this.userProgress.get(userId);
    if (!progress) {
      return { canPromote: false };
    }

    const currentLevelIndex = ['p7', 'p9', 'p10'].indexOf(progress.currentLevel);
    
    // 检查是否可以升级到下一级
    if (currentLevelIndex < 2) {
      const nextLevel = ['p7', 'p9', 'p10'][currentLevelIndex + 1] as RoleLevel;
      const criteria = ROLE_LEVELS[nextLevel].promotionCriteria;

      if (
        progress.totalTriggers >= criteria.minTriggers &&
        progress.l3PlusCount >= criteria.minL3Plus &&
        progress.streakDays >= criteria.minStreakDays
      ) {
        return {
          canPromote: true,
          toLevel: nextLevel,
          reason: `满足 ${nextLevel.toUpperCase()} 晋升条件：触发次数 ${progress.totalTriggers}/${criteria.minTriggers}，L3+ ${progress.l3PlusCount}/${criteria.minL3Plus}，连续 ${progress.streakDays}/${criteria.minStreakDays} 天`
        };
      }
    }

    return { canPromote: false };
  }

  /**
   * 执行升级
   */
  promote(userId: string, toLevel: RoleLevel): UserProgress {
    const progress = this.userProgress.get(userId);
    if (!progress) {
      throw new Error('User progress not found');
    }

    const currentLevelIndex = ['p7', 'p9', 'p10'].indexOf(progress.currentLevel);
    const targetLevelIndex = ['p7', 'p9', 'p10'].indexOf(toLevel);

    if (targetLevelIndex <= currentLevelIndex) {
      throw new Error('Cannot promote to same or lower level');
    }

    progress.currentLevel = toLevel;
    this.userProgress.set(userId, progress);

    return progress;
  }

  /**
   * 推荐适合的分级角色
   */
  recommendLevel(
    taskComplexity: 'simple' | 'medium' | 'complex',
    teamSize: number,
    scope: 'personal' | 'team' | 'organization'
  ): LevelRecommendation {
    let recommendedLevel: RoleLevel = 'p7';
    let reason = '';
    let confidence = 0;

    // 基于任务复杂度推荐
    if (taskComplexity === 'complex' && scope === 'organization') {
      recommendedLevel = 'p10';
      reason = '复杂任务 + 组织级范围，需要战略规划能力';
      confidence = 0.9;
    } else if (taskComplexity === 'medium' && teamSize > 1) {
      recommendedLevel = 'p9';
      reason = '中等复杂度 + 团队协作，需要 Tech Lead 能力';
      confidence = 0.85;
    } else {
      recommendedLevel = 'p7';
      reason = '个人任务或简单任务，执行层能力足够';
      confidence = 0.95;
    }

    const levelDef = ROLE_LEVELS[recommendedLevel];

    return {
      recommendedLevel,
      reason,
      suitableRoles: levelDef.representativeRoles,
      confidence
    };
  }

  /**
   * 获取用户在当前分级的进度
   */
  getProgressToNextLevel(userId: string): {
    current: RoleLevel;
    next?: RoleLevel;
    progress: number;
    requirements: Record<string, { current: number; required: number }>;
  } {
    const progress = this.userProgress.get(userId);
    if (!progress) {
      return {
        current: 'p7',
        progress: 0,
        requirements: {}
      };
    }

    const currentLevelIndex = ['p7', 'p9', 'p10'].indexOf(progress.currentLevel);
    
    if (currentLevelIndex >= 2) {
      // 已经是最高级
      return {
        current: 'p10',
        progress: 100,
        requirements: {}
      };
    }

    const nextLevel = ['p7', 'p9', 'p10'][currentLevelIndex + 1] as RoleLevel;
    const criteria = ROLE_LEVELS[nextLevel].promotionCriteria;

    const triggersProgress = Math.min(100, (progress.totalTriggers / criteria.minTriggers) * 100);
    const l3Progress = Math.min(100, (progress.l3PlusCount / criteria.minL3Plus) * 100);
    const streakProgress = Math.min(100, (progress.streakDays / criteria.minStreakDays) * 100);

    const overallProgress = Math.min(100, (triggersProgress + l3Progress + streakProgress) / 3);

    return {
      current: progress.currentLevel,
      next: nextLevel,
      progress: overallProgress,
      requirements: {
        triggers: { current: progress.totalTriggers, required: criteria.minTriggers },
        l3Plus: { current: progress.l3PlusCount, required: criteria.minL3Plus },
        streak: { current: progress.streakDays, required: criteria.minStreakDays }
      }
    };
  }

  /**
   * 获取排行榜数据
   */
  getLeaderboard(limit: number = 10): Array<{
    userId: string;
    level: RoleLevel;
    totalTriggers: number;
    l3PlusCount: number;
    streakDays: number;
  }> {
    const entries = Array.from(this.userProgress.values())
      .map(p => ({
        userId: p.userId,
        level: p.currentLevel,
        totalTriggers: p.totalTriggers,
        l3PlusCount: p.l3PlusCount,
        streakDays: p.streakDays
      }))
      .sort((a, b) => {
        // 先按级别排序，再按触发次数
        const levelOrder = { p10: 3, p9: 2, p7: 1 };
        if (levelOrder[a.level] !== levelOrder[b.level]) {
          return levelOrder[b.level] - levelOrder[a.level];
        }
        return b.totalTriggers - a.totalTriggers;
      })
      .slice(0, limit);

    return entries;
  }
}

// ============================================================================
// 单例导出
// ============================================================================

export const roleLevelManager = new RoleLevelManager();

// ============================================================================
// 工具函数
// ============================================================================

export function getLevelName(level: RoleLevel): string {
  return ROLE_LEVELS[level].title;
}

export function getLevelSubtitle(level: RoleLevel): string {
  return ROLE_LEVELS[level].subtitle;
}

export function isValidLevel(level: string): level is RoleLevel {
  return ['p7', 'p9', 'p10'].includes(level);
}

export function getNextLevel(currentLevel: RoleLevel): RoleLevel | undefined {
  const levels: RoleLevel[] = ['p7', 'p9', 'p10'];
  const index = levels.indexOf(currentLevel);
  return index < levels.length - 1 ? levels[index + 1] : undefined;
}
