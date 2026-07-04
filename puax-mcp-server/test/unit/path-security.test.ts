/**
 * 路径安全 + 得分透明化测试
 */

import { assertSafeOutputPath, PathTraversalError } from '../../src/utils/path-security.js';
import { RoleRecommender } from '../../src/core/role-recommender.js';

describe('path-security', () => {
  it('应拒绝 .. 遍历', () => {
    expect(() => assertSafeOutputPath('../outside')).toThrow(PathTraversalError);
  });

  it('应接受正常路径', () => {
    const p = assertSafeOutputPath('./puax-export');
    expect(p).toContain('puax-export');
  });
});

describe('score explanation', () => {
  it('维度加权之和应接近总分', () => {
    const r = new RoleRecommender();
    const result = r.recommend({
      detected_triggers: ['consecutive_failures'],
      task_context: { task_type: 'debugging', attempt_count: 2 },
    });
    const exp = result.metadata.score_explanation!;
    const sum = exp.dimensions.reduce((a, d) => a + d.weighted_points, 0);
    expect(Math.abs(sum - exp.total_score)).toBeLessThan(2);
  });
});
