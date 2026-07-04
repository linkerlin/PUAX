/**
 * 自定义角色存储与推荐池集成测试
 */

import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  getCustomRoleStore,
  resetCustomRoleStoreForTesting,
  useCustomRoleStoreDirForTesting,
} from '../../src/core/custom-role-store.js';
import { RoleRecommender } from '../../src/core/role-recommender.js';
import { getSkillById } from '../../src/prompts/skill-catalog.js';
import { getRoleDisplayName } from '../../src/utils/role-utils.js';

describe('custom roles', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'puax-custom-roles-'));
    resetCustomRoleStoreForTesting();
    useCustomRoleStoreDirForTesting(tempDir);
  });

  afterEach(() => {
    resetCustomRoleStoreForTesting();
    try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  it('应注册并读取自定义角色', () => {
    const store = getCustomRoleStore();
    const record = store.register({
      id: 'custom-test-debugger',
      name: '测试调试官',
      description: '专精根因分析与复现',
      content: '汝为调试官，须先诊断后动手，禁空泛猜测。任务：{{task}}',
      task_types: ['debugging'],
      recommended_for_triggers: ['user_frustration'],
    });

    expect(record.id).toBe('custom-test-debugger');
    expect(getSkillById('custom-test-debugger')?.content).toContain('调试官');
    expect(getRoleDisplayName('custom-test-debugger')).toBe('测试调试官');
  });

  it('应拒绝与内置角色冲突的 id', () => {
    const store = getCustomRoleStore();
    expect(() => store.register({
      id: 'military-warrior',
      name: 'x',
      description: 'x',
      content: 'x'.repeat(25),
    })).toThrow();
  });

  it('自定义角色应进入推荐池并在匹配触发时靠前', () => {
    const store = getCustomRoleStore();
    store.register({
      id: 'custom-frustration-coach',
      name: '挫折教练',
      description: '用户沮丧时换思路',
      content: '用户沮丧时须换思路、跑证据、禁原地打转。'.repeat(2),
      task_types: ['debugging'],
      recommended_for_triggers: ['user_frustration'],
    });

    const recommender = new RoleRecommender();
    recommender.refreshCustomRoles();

    const result = recommender.recommend({
      detected_triggers: ['user_frustration'],
      task_context: { task_type: 'debugging', attempt_count: 2, urgency: 'high' },
    });

    expect(result.primary.role_id).toBe('custom-frustration-coach');
    expect(result.primary.confidence_score).toBeGreaterThan(50);
  });

  it('删除后应从目录移除', () => {
    const store = getCustomRoleStore();
    store.register({
      id: 'custom-temp',
      name: '临时',
      description: '临时角色',
      content: '临时角色提示词内容至少二十字以上'.repeat(2),
    });
    expect(store.remove('custom-temp')).toBe(true);
    expect(store.get('custom-temp')).toBeUndefined();
  });
});
