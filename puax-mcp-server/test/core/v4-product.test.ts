/**
 * v4 真正的产品：心跳、处境、闸门薄注入、自进化、萨满全留
 */

import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { SHAMAN_ROLE_IDS, isShamanRole, isExperimentalRole, isDefaultRecommendable } from '../../src/core/role-kernel.js';
import { SKILL_MANIFEST } from '../../src/prompts/skill-manifest.js';
import { ArenaStore } from '../../src/core/arena.js';
import { MemoryGraph } from '../../src/core/memory-graph.js';
import { NamedAgentStore } from '../../src/core/named-agent.js';
import { OutcomeStore } from '../../src/core/outcome-store.js';
import { compileThinPrompt } from '../../src/core/thin-prompt.js';
import { runEvolveCycle, normalizeTriggerId } from '../../src/core/evolve-cycle.js';
import { RoleRecommender } from '../../src/core/role-recommender.js';
import { allTools } from '../../src/tools/index.js';

describe('v4 product', () => {
  beforeEach(() => {
    new ArenaStore().clear();
  });

  const shamanInManifest = SKILL_MANIFEST.filter(s => s.id.startsWith('shaman-')).map(s => s.id);

  it('shaman- 系列全部保留在目录中', () => {
    expect(shamanInManifest.sort()).toEqual([...SHAMAN_ROLE_IDS].sort());
    expect(shamanInManifest).toHaveLength(8);
    for (const id of SHAMAN_ROLE_IDS) {
      expect(isShamanRole(id)).toBe(true);
      expect(isDefaultRecommendable(id)).toBe(true);
      expect(isExperimentalRole(id)).toBe(false);
    }
  });

  it('实验角色不进默认推荐，萨满不受牵连', () => {
    expect(isExperimentalRole('special-gaslight-driven')).toBe(true);
    expect(isDefaultRecommendable('special-gaslight-driven')).toBe(false);
    const rec = new RoleRecommender();
    const result = rec.recommend({
      detected_triggers: ['user_frustration'],
      task_context: { task_type: 'debugging', attempt_count: 2 },
    });
    expect(result.primary.role_id.startsWith('special-cute')).toBe(false);
    expect(result.primary.role_id.startsWith('special-gaslight')).toBe(false);
  });

  it('薄注入短于全文赋且含闸门', () => {
    const thin = compileThinPrompt({ role_id: 'military-warrior', include_arena: false });
    expect(thin.voice_chars).toBeLessThan(3000);
    expect(thin.prompt.length).toBeLessThan(8000);
    expect(thin.prompt).toContain('[PUAX-RUNTIME]');
    expect(thin.prompt).toContain('[PUAX-DIAGNOSIS]');
    expect(thin.protocol_steps.length).toBeGreaterThan(0);
  });

  it('处境原语写入并可编译注入', () => {
    const dir = mkdtempSync(join(tmpdir(), 'puax-arena-'));
    const store = new ArenaStore(dir);
    const cfg = store.set({ rival: 'Claude 已快 20%' });
    expect(cfg.rival).toContain('20%');
    const inj = store.compileInjection(cfg);
    expect(inj).toContain('[PUAX-ARENA]');
    expect(inj).toContain('Claude');
    store.clear();
    expect(store.get()).toBeNull();
    rmSync(dir, { recursive: true, force: true });
  });

  it('记忆图与命名 Agent 可固化一拍', () => {
    const dir = mkdtempSync(join(tmpdir(), 'puax-mem-'));
    const graph = new MemoryGraph(dir);
    graph.append({ type: 'hypothesis', role_id: 'shaman-musk', signals: ['creative_block'] });
    graph.append({ type: 'outcome', role_id: 'shaman-musk', success: true });
    expect(graph.readRecent(5)).toHaveLength(2);
    const agents = new NamedAgentStore(dir);
    const id = agents.recordCycle('main', true, undefined, '战士');
    expect(id.stats.wins).toBe(1);
    expect(id.rank).toBe('战士');
    rmSync(dir, { recursive: true, force: true });
  });

  it('结局权重回写成功率', () => {
    const dir = mkdtempSync(join(tmpdir(), 'puax-out-'));
    const store = new OutcomeStore(dir);
    store.record('shaman-jobs', true);
    store.record('shaman-jobs', true);
    store.record('shaman-jobs', false);
    expect(store.successRate('shaman-jobs')).toBeCloseTo(2 / 3);
    const hist = store.asSessionHistory();
    expect(hist.role_usage_count['shaman-jobs']).toBe(3);
    rmSync(dir, { recursive: true, force: true });
  });

  it('Hook 驼峰触发名归一成 YAML id', () => {
    expect(normalizeTriggerId('userFrustration')).toBe('user_frustration');
    expect(normalizeTriggerId('givingUp')).toBe('giving_up_language');
    const tick = runEvolveCycle({
      session_id: `camel-${Date.now()}`,
      event: 'UserPromptSubmit',
      skip_detect: true,
      detected_triggers: ['userFrustration'],
      force: true,
    });
    expect(tick.happened).toBe(true);
  });

  it('静默拍不占用冷却，另一会话可立即发生', () => {
    const a = runEvolveCycle({
      session_id: `cd-a-${Date.now()}`,
      event: 'SessionStart',
      skip_detect: true,
      force: false,
    });
    expect(a.happened).toBe(false);
    const b = runEvolveCycle({
      session_id: `cd-b-${Date.now()}`,
      event: 'UserPromptSubmit',
      message: '为什么还不行',
      skip_detect: true,
      detected_triggers: ['user_frustration'],
      force: false,
    });
    expect(b.abort).not.toBe('cooldown');
    expect(b.happened).toBe(true);
  });

  it('心跳在失败信号下发生且不静默', () => {
    const result = runEvolveCycle({
      session_id: `tick-test-${Date.now()}`,
      event: 'UserPromptSubmit',
      message: '为什么还不行？我要放弃了',
      force: true,
      skip_detect: true,
      detected_triggers: ['user_frustration', 'giving_up_language'],
    });
    expect(result.abort).toBeUndefined();
    expect(result.happened).toBe(true);
    expect(result.selected_role).toBeTruthy();
    expect(result.injection).toContain('[PUAX-RUNTIME:COMPACT]');
  });

  it('v4 三个动词已注册', () => {
    const names = allTools.map(t => t.name);
    expect(names).toContain('puax_tick');
    expect(names).toContain('puax_set_arena');
    expect(names).toContain('puax_evolve');
  });
});
