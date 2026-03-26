/**
 * 分级角色体系单元测试
 */

import { 
  roleLevelManager, 
  RoleLevel,
  getLevelName,
  isValidLevel 
} from '../../src/role-levels/index.js';

describe('RoleLevelManager', () => {
  beforeEach(() => {
    // 清理测试用户数据
    const testUserId = 'test-user';
    const progress = roleLevelManager.getUserProgress(testUserId);
    if (progress) {
      // 重置
    }
  });

  describe('分级定义', () => {
    it('应该返回P7定义', () => {
      const def = roleLevelManager.getLevelDefinition('p7');
      expect(def.level).toBe('p7');
      expect(def.title).toContain('骨干');
    });

    it('应该返回P9定义', () => {
      const def = roleLevelManager.getLevelDefinition('p9');
      expect(def.level).toBe('p9');
      expect(def.title).toContain('Tech Lead');
    });

    it('应该返回P10定义', () => {
      const def = roleLevelManager.getLevelDefinition('p10');
      expect(def.level).toBe('p10');
      expect(def.title).toContain('架构师');
    });
  });

  describe('用户进度管理', () => {
    it('应该初始化用户进度', () => {
      const userId = 'test-init';
      const progress = roleLevelManager.initUserProgress(userId);
      
      expect(progress.userId).toBe(userId);
      expect(progress.currentLevel).toBe('p7');
      expect(progress.totalTriggers).toBe(0);
    });

    it('应该更新用户进度', () => {
      const userId = 'test-update';
      roleLevelManager.initUserProgress(userId);
      
      const updated = roleLevelManager.updateProgress(userId, {
        totalTriggers: 10,
        l3PlusCount: 2
      });
      
      expect(updated.totalTriggers).toBe(10);
      expect(updated.l3PlusCount).toBe(2);
    });

    it('应该记录角色使用', () => {
      const userId = 'test-usage';
      roleLevelManager.initUserProgress(userId);
      
      roleLevelManager.recordRoleUsage(userId, 'military-warrior', 3);
      
      const progress = roleLevelManager.getUserProgress(userId);
      expect(progress?.roleUsage['military-warrior']).toBe(1);
      expect(progress?.totalTriggers).toBe(1);
    });
  });

  describe('晋升检查', () => {
    it('P7应该能晋升到P9', () => {
      const userId = 'test-promote-p9';
      roleLevelManager.initUserProgress(userId);
      
      // 设置满足P9条件
      roleLevelManager.updateProgress(userId, {
        totalTriggers: 100,
        l3PlusCount: 30,
        streakDays: 14
      });
      
      const check = roleLevelManager.checkPromotion(userId);
      expect(check.canPromote).toBe(true);
      expect(check.toLevel).toBe('p9');
    });

    it('P9应该能晋升到P10', () => {
      const userId = 'test-promote-p10';
      roleLevelManager.initUserProgress(userId);
      
      // 先设置为P9
      roleLevelManager.updateProgress(userId, {
        currentLevel: 'p9',
        totalTriggers: 200,
        l3PlusCount: 40,
        streakDays: 30
      });
      
      const check = roleLevelManager.checkPromotion(userId);
      expect(check.canPromote).toBe(true);
      expect(check.toLevel).toBe('p10');
    });
  });

  describe('分级推荐', () => {
    it('应该推荐P7给简单个人任务', () => {
      const rec = roleLevelManager.recommendLevel('simple', 1, 'personal');
      expect(rec.recommendedLevel).toBe('p7');
      expect(rec.confidence).toBeGreaterThan(0.9);
    });

    it('应该推荐P9给团队任务', () => {
      const rec = roleLevelManager.recommendLevel('medium', 5, 'team');
      expect(rec.recommendedLevel).toBe('p9');
    });

    it('应该推荐P10给复杂组织任务', () => {
      const rec = roleLevelManager.recommendLevel('complex', 10, 'organization');
      expect(rec.recommendedLevel).toBe('p10');
    });
  });
});

describe('工具函数', () => {
  it('getLevelName应该返回正确名称', () => {
    expect(getLevelName('p7')).toContain('骨干');
    expect(getLevelName('p9')).toContain('Tech Lead');
    expect(getLevelName('p10')).toContain('架构师');
  });

  it('isValidLevel应该正确验证', () => {
    expect(isValidLevel('p7')).toBe(true);
    expect(isValidLevel('p9')).toBe(true);
    expect(isValidLevel('p10')).toBe(true);
    expect(isValidLevel('p8')).toBe(false);
    expect(isValidLevel('invalid')).toBe(false);
  });
});
