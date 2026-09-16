import { buildV4Dashboard, buildV4RoleCatalog, V4_PUBLIC_VERBS } from '../../src/core/v4-dashboard.js';
import { SHAMAN_ROLE_IDS } from '../../src/core/role-kernel.js';

describe('v4 dashboard', () => {
  it('诚实字段：无云端排行榜、萨满 8、12 动词、ttf', () => {
    const dash = buildV4Dashboard();
    expect(dash.cloud_leaderboard).toBe(false);
    expect(dash.public_verbs).toEqual([...V4_PUBLIC_VERBS]);
    expect((dash.roles as { shaman_count: number }).shaman_count).toBe(8);
    expect((dash.roles as { shaman: string[] }).shaman.sort()).toEqual([...SHAMAN_ROLE_IDS].sort());
    expect(dash.ttf).toBeDefined();
    expect(dash.integrity_metrics).toBeDefined();
    expect((dash.integrity_metrics as Record<string, { target: string }>).ttf.target).toBe('≤ 1 轮');
    expect(dash.product).toEqual(expect.objectContaining({ thesis: '处境、闸门、梦' }));
  });

  it('角色目录含全部 shaman 且实验项打标，内核角色携带 AMB 基准制品分数', () => {
    const catalog = buildV4RoleCatalog();
    const shaman = catalog.filter(r => r.shaman);
    expect(shaman).toHaveLength(8);
    const gas = catalog.find(r => r.id === 'special-gaslight-driven');
    expect(gas?.classification).toBe('experimental');
    expect(gas?.amb_benchmark).toBeNull();
    const warrior = catalog.find(r => r.id === 'military-warrior');
    expect(warrior?.amb_benchmark).toEqual(expect.objectContaining({
      scenario: 'cascade-bugs',
      delta: '+35%',
      // 演练值降标：verified 保留给 amb-live 实测过闸后的真实战绩
      status: 'simulated',
    }));
  });
});
