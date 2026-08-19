/**
 * v3.12 GHM 导引幻梦法注册链路测试
 * 覆盖：触发检测（triggers.yaml 四新触发）→ 角色推荐 → bundle 注册 → 策略空间 → 目录一致性
 */

import { TriggerDetector } from '../../src/core/trigger-detector.js';
import { RoleRecommender } from '../../src/core/role-recommender.js';
import { configLoader } from '../../src/core/config-loader.js';
import {
  getBundledSkillsByCategory,
  getBundledSkillById,
  getSkillCategories,
  getManifestEntryById,
} from '../../src/prompts/prompts-bundle.js';
import { ROLE_IDENTITIES } from '../../src/classical/strategy-space.js';

const DREAM_ROLE_IDS = [
  'dream-zuowang',
  'dream-butterfly',
  'dream-hundun',
  'dream-kunpeng',
  'dream-qiushui',
  'dream-paoding',
  'dream-qiwu',
  'dream-xinhuo',
];

const NEW_TRIGGERS = [
  {
    id: 'premature_convergence',
    zh: '就按这个方案做吧',
    en: 'this is the only way to solve it',
  },
  {
    id: 'creative_block',
    zh: '我没有思路，想不出来了',
    en: "I'm out of ideas",
  },
  {
    id: 'assumption_lock',
    zh: '肯定是因为缓存导致的',
    en: "it must be the network",
  },
  {
    id: 'low_novelty',
    zh: '还是这个思路，换个说法而已',
    en: 'a minor variation of the same approach',
  },
];

async function detectIds(content: string): Promise<string[]> {
  const detector = new TriggerDetector({ sensitivity: 'medium', language: 'auto' });
  const result = await detector.detect([{ role: 'assistant', content }]);
  return result.triggers_detected.map(t => t.id);
}

describe('v3.12 dream 注册链路', () => {
  describe('触发检测：四新触发（triggers.yaml 为正源）', () => {
    it.each(NEW_TRIGGERS.map(t => [t.id, t.zh] as const))(
      '中文命中 %s',
      async (id, sample) => {
        const ids = await detectIds(sample);
        expect(ids).toContain(id);
      }
    );

    it.each(NEW_TRIGGERS.map(t => [t.id, t.en] as const))(
      '英文命中 %s',
      async (id, sample) => {
        const ids = await detectIds(sample);
        expect(ids).toContain(id);
      }
    );

    it('触发目录定义完整：四触发皆在 catalog 且 severity/category 正确', () => {
      const catalog = configLoader.loadTriggerCatalog();
      for (const { id } of NEW_TRIGGERS) {
        const def = catalog.triggers[id];
        expect(def).toBeDefined();
        expect(def.category).toBe('divergence');
        expect(def.recommended_roles.primary).toMatch(/^dream-/);
        for (const alt of def.recommended_roles.alternatives) {
          expect(alt).toMatch(/^dream-/);
        }
      }
    });
  });

  describe('角色推荐：新触发应荐庄周八梦', () => {
    it.each([
      ['premature_convergence', 'planning'],
      ['creative_block', 'creative'],
      ['assumption_lock', 'analysis'],
      ['low_novelty', 'creative'],
    ] as const)('%s → 推荐 dream 角色', async (trigger, taskType) => {
      const recommender = new RoleRecommender();
      const result = await recommender.recommend({
        detected_triggers: [trigger],
        task_context: { task_type: taskType },
      });
      const candidates = [result.primary.role_id, ...result.alternatives.map(a => a.role_id)];
      expect(candidates.some(id => id.startsWith('dream-'))).toBe(true);
    });
  });

  describe('Bundle 注册：dream 类别八角色', () => {
    it('category=dream 应含 8 个角色', () => {
      const skills = getBundledSkillsByCategory('dream');
      expect(skills).toHaveLength(8);
      const ids = skills.map(s => s.id);
      for (const id of DREAM_ROLE_IDS) {
        expect(ids).toContain(id);
      }
    });

    it('类别目录应含 dream', () => {
      expect(getSkillCategories()).toContain('dream');
    });

    it('manifest 含八梦且触发条件一致', () => {
      const triggerMap: Record<string, string[]> = {
        'dream-zuowang': ['assumption_lock'],
        'dream-butterfly': ['creative_block'],
        'dream-hundun': ['low_novelty'],
        'dream-kunpeng': ['creative_block', 'premature_convergence'],
        'dream-qiushui': ['premature_convergence'],
        'dream-paoding': ['assumption_lock', 'repetitive_attempts'],
        'dream-qiwu': ['low_novelty', 'assumption_lock'],
        'dream-xinhuo': ['premature_convergence', 'low_novelty'],
      };
      for (const [id, expectedTriggers] of Object.entries(triggerMap)) {
        const entry = getManifestEntryById(id);
        expect(entry).toBeDefined();
        expect(entry!.triggerConditions).toEqual(expect.arrayContaining(expectedTriggers));
      }
    });

    it('八梦 SKILL 内容含五步法与梦境协议', () => {
      const xinhuo = getBundledSkillById('dream-xinhuo');
      expect(xinhuo).toBeDefined();
      expect(xinhuo!.content).toContain('述笥');
      expect(xinhuo!.content).toContain('传火');
      expect(xinhuo!.content).toContain('无印产物一律拒收');

      const butterfly = getBundledSkillById('dream-butterfly');
      expect(butterfly!.content).toContain('物化');
      expect(butterfly!.content).toContain('齐观');
      expect(butterfly!.content).toContain('[DREAM]');

      const zuowang = getBundledSkillById('dream-zuowang');
      expect(zuowang!.content).toContain('坐驰');
    });

    it('发散七式温度高、薪火温度低', () => {
      const butterfly = getBundledSkillById('dream-butterfly') as unknown as { metadata?: { temperature?: number } };
      const xinhuo = getBundledSkillById('dream-xinhuo') as unknown as { metadata?: { temperature?: number } };
      expect(butterfly.metadata?.temperature ?? 0.9).toBeGreaterThanOrEqual(0.8);
      expect(xinhuo.metadata?.temperature ?? 0.4).toBeLessThanOrEqual(0.4);
    });
  });

  describe('策略空间：RoleIdentity 注册', () => {
    it('ROLE_IDENTITIES 含八梦身份', () => {
      const ids = ROLE_IDENTITIES.map(r => r.id);
      for (const id of DREAM_ROLE_IDS) {
        expect(ids).toContain(id);
      }
    });

    it('八梦身份 domain 皆为 dream 且文言身份齐全', () => {
      for (const id of DREAM_ROLE_IDS) {
        const identity = ROLE_IDENTITIES.find(r => r.id === id);
        expect(identity?.domain).toBe('dream');
        expect(identity?.classicalName).toBeTruthy();
        expect(identity?.introPhrase).toBeTruthy();
      }
    });
  });

  describe('工具清单一致性', () => {
    it('category 枚举含 dream（list_skills 可按 dream 筛选）', async () => {
      const { allTools } = await import('../../src/tools/index.js');
      const listSkills = allTools.find(t => t.name === 'list_skills');
      expect(listSkills).toBeDefined();
      const handler = listSkills!.handler as unknown as (args: Record<string, unknown>) => {
        content: Array<{ text: string }>;
      };
      const result = handler({ category: 'dream', includeCapabilities: false });
      const parsed = JSON.parse(result.content[0].text) as { total: number; category: string };
      expect(parsed.category).toBe('dream');
      expect(parsed.total).toBe(8);
    });
  });
});
