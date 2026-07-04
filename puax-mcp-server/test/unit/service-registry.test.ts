/**
 * 核心服务注册表单元测试
 */

import {
  getCoreServices,
  getTriggerDetector,
  getRoleRecommender,
  setCoreServicesForTesting,
  resetTriggerDetectorCache,
} from '../../src/core/service-registry.js';
import { RoleRecommender } from '../../src/core/role-recommender.js';

describe('service-registry', () => {
  afterEach(() => {
    setCoreServicesForTesting(null);
    resetTriggerDetectorCache();
  });

  it('应返回同一推荐器单例', () => {
    const a = getRoleRecommender();
    const b = getCoreServices().roleRecommender;
    expect(a).toBe(b);
  });

  it('跨调用应命中推荐缓存', () => {
    const recommender = getRoleRecommender();
    const request = {
      detected_triggers: ['user_frustration'],
      task_context: { task_type: 'debugging' },
    };
    const first = recommender.recommend(request);
    const second = recommender.recommend(request);
    expect(first.metadata.cache_hit).toBe(false);
    expect(second.metadata.cache_hit).toBe(true);
  });

  it('无选项时应复用默认触发检测器', () => {
    const a = getTriggerDetector();
    const b = getCoreServices().triggerDetector;
    expect(a).toBe(b);
  });

  it('相同选项应复用检测器实例', () => {
    const a = getTriggerDetector({ sensitivity: 'high', language: 'zh' });
    const b = getTriggerDetector({ sensitivity: 'high', language: 'zh' });
    expect(a).toBe(b);
  });

  it('测试注入应覆盖默认服务', () => {
    const mock = { recommend: jest.fn() } as unknown as RoleRecommender;
    setCoreServicesForTesting({ roleRecommender: mock });
    expect(getRoleRecommender()).toBe(mock);
  });
});
