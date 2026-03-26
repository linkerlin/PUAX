/**
 * 方法论路由单元测试
 */

import { 
  methodologyRouter,
  Methodology,
  getMethodologyName,
  isValidMethodology
} from '../../src/core/methodology-router.js';

describe('MethodologyRouter', () => {
  beforeEach(() => {
    // 清理历史
    const sessionId = 'test-session';
    const history = methodologyRouter.getUsageHistory(sessionId);
    // 无法直接清理，但可以通过新会话测试
  });

  describe('基础路由', () => {
    it('应该为debugging任务选择华为RCA', () => {
      const result = methodologyRouter.route({
        taskType: 'debugging',
        attemptCount: 1
      });
      
      expect(result.selectedMethodology).toBe('huawei-rca');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('应该为building任务选择Musk算法', () => {
      const result = methodologyRouter.route({
        taskType: 'building',
        attemptCount: 1
      });
      
      expect(result.selectedMethodology).toBe('musk-algorithm');
    });

    it('应该为architecture任务选择Amazon逆向', () => {
      const result = methodologyRouter.route({
        taskType: 'architecture',
        attemptCount: 1
      });
      
      expect(result.selectedMethodology).toBe('amazon-backwards');
    });
  });

  describe('失败模式切换', () => {
    it('原地打转应该切换到Musk算法', () => {
      const result = methodologyRouter.route({
        taskType: 'debugging',
        failureMode: 'spinning',
        attemptCount: 3,
        previousMethodologies: ['alibaba-closed-loop']
      });
      
      expect(result.selectedMethodology).toBe('musk-algorithm');
      expect(result.switchingChain).toBeDefined();
    });

    it('放弃应该切换到Netflix Keeper', () => {
      const result = methodologyRouter.route({
        taskType: 'debugging',
        failureMode: 'giving_up',
        attemptCount: 3
      });
      
      expect(result.selectedMethodology).toBe('netflix-keeper');
    });
  });

  describe('方法论详情', () => {
    it('应该返回华为RCA详情', () => {
      const def = methodologyRouter.getMethodology('huawei-rca');
      expect(def.name).toContain('华为');
      expect(def.steps).toHaveLength(5);
    });

    it('应该返回Musk算法详情', () => {
      const def = methodologyRouter.getMethodology('musk-algorithm');
      expect(def.name).toContain('Musk');
      expect(def.flavor).toBe('musk');
    });
  });

  describe('使用历史', () => {
    it('应该记录使用方法论', () => {
      const sessionId = 'test-history';
      methodologyRouter.recordUsage(sessionId, 'huawei-rca');
      
      const history = methodologyRouter.getUsageHistory(sessionId);
      expect(history).toContain('huawei-rca');
    });
  });
});

describe('工具函数', () => {
  it('getMethodologyName应该返回正确名称', () => {
    expect(getMethodologyName('huawei-rca')).toContain('华为');
    expect(getMethodologyName('musk-algorithm')).toContain('Musk');
  });

  it('isValidMethodology应该正确验证', () => {
    expect(isValidMethodology('huawei-rca')).toBe(true);
    expect(isValidMethodology('musk-algorithm')).toBe(true);
    expect(isValidMethodology('invalid')).toBe(false);
  });
});
