/**
 * PUAX Enterprise Flavors System
 *
 * 14 Corporate Flavors with unique methodologies and pressure styles.
 * Each flavor simulates a different company culture and problem-solving approach.
 */

import { getGlobalLogger } from '../../utils/logger.js';

const logger = getGlobalLogger();

// ============================================================================
// Flavor Types
// ============================================================================

export interface FlavorMethodology {
  name: string;
  nameEn: string;
  steps: string[];
  checklist: string[];
}

export interface FlavorRhetoric {
  encouragement: string[];
  pressure: string[];
  extreme: string[];
}

export interface FlavorDefinition {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  pressure: {
    base: number;
    escalation: number;
    max: number;
  };
  rhetoric: FlavorRhetoric;
  methodology: FlavorMethodology;
  taskAffinities: TaskType[];
  metadomain?: string[];
  tags: string[];
}

export type TaskType =
  | 'debug'
  | 'build'
  | 'research'
  | 'architecture'
  | 'performance'
  | 'security'
  | 'planning'
  | 'review';

// ============================================================================
// Enterprise Flavors
// ============================================================================

export const ENTERPRISE_FLAVORS: Record<string, FlavorDefinition> = {
  alibaba: {
    id: 'alibaba',
    name: '阿里巴巴',
    nameEn: 'Alibaba Group',
    description: '361绩效考核 + 拥抱变化文化。高压竞争环境，末尾淘汰制。',
    pressure: { base: 0.7, escalation: 0.05, max: 1.0 },
    rhetoric: {
      encouragement: ['加油，你行的', '再努力一下', '你是最棒的'],
      pressure: ['361考核来了', '不努力就被淘汰', '平庸就是错', '不是淘汰别人就是被淘汰'],
      extreme: ['直接毕业算了', '换个能干的来', '你被优化了']
    },
    methodology: {
      name: '361评估法',
      nameEn: '361 Evaluation',
      steps: [
        '拥抱变化：立即分析现状，准备调整方案',
        '立即行动：不要等待，现在就开始执行',
        '结果导向：聚焦可交付成果，不要找借口',
        '持续迭代：完成不是终点，迭代才是常态'
      ],
      checklist: [
        '是否为新方案（非重复劳动）',
        '是否立即执行（非等待拖延）',
        '是否有可衡量结果（非无效忙碌）'
      ]
    },
    taskAffinities: ['debug', 'build', 'performance'],
    tags: ['狼性', '高压', '绩效']
  },

  bytedance: {
    id: 'bytedance',
    name: '字节跳动',
    nameEn: 'ByteDance',
    description: '敏捷迭代 + A/B测试文化。快速试错，数据驱动。',
    pressure: { base: 0.65, escalation: 0.06, max: 0.95 },
    rhetoric: {
      encouragement: ['快速上线', '小步快跑', '数据说话'],
      pressure: ['灰度发布了吗', 'A/B测试结果呢', '数据驱动决策', '没有数据等于没有发言权'],
      extreme: ['回滚吧', '这功能没价值', '创新不够']
    },
    methodology: {
      name: '敏捷迭代法',
      nameEn: 'Agile Iteration',
      steps: [
        '小步快跑：将大任务拆分为最小可测试单元',
        '快速验证：立即上线，观察数据',
        'A/B测试：设计对照组，量化效果',
        '数据驱动：让数据告诉你什么是正确的'
      ],
      checklist: [
        '是否快速验证（24小时内）',
        '是否有量化数据指标',
        '是否可随时回滚'
      ]
    },
    taskAffinities: ['debug', 'performance', 'build'],
    tags: ['敏捷', '数据驱动', '快速']
  },

  huawei: {
    id: 'huawei',
    name: '华为',
    nameEn: 'Huawei',
    description: '狼性文化 + RCA根因分析。蓝军验证，烧不死的鸟是凤凰。',
    pressure: { base: 0.8, escalation: 0.04, max: 1.0 },
    rhetoric: {
      encouragement: ['烧不死的鸟是凤凰', '越挫越勇', '败则拼死相救'],
      pressure: ['狼性精神呢', '蓝军验证了吗', 'RCA根因分析', '没有在怕的，都在踏实干'],
      extreme: ['直接换人', '你们这个团队不行', '太令人失望了']
    },
    methodology: {
      name: '狼性RCA法',
      nameEn: 'Wolf RCA',
      steps: [
        '问题定位：快速定位问题现象和范围',
        '根因分析(RCA)：5Why分析法找到真因',
        '蓝军验证：假设另一个团队来攻击这个方案',
        '根治方案：确保同样问题不再发生'
      ],
      checklist: [
        '是否找到根因（不是表象）',
        '是否有蓝军验证（防御性思考）',
        '是否根治（不是打补丁）'
      ]
    },
    taskAffinities: ['debug', 'security', 'architecture'],
    tags: ['狼性', 'RCA', '根因分析']
  },

  tencent: {
    id: 'tencent',
    name: '腾讯',
    nameEn: 'Tencent',
    description: '产品力 + 用户研究文化。用户体验优先，细节打磨。',
    pressure: { base: 0.6, escalation: 0.05, max: 0.9 },
    rhetoric: {
      encouragement: ['用户体验第一', '细节决定成败', '产品力'],
      pressure: ['用户怎么说', '体验够好吗', '细节打磨了吗', '这是微信级别的产品吗'],
      extreme: ['太粗糙了', '用户体验不及格', '重做']
    },
    methodology: {
      name: '产品力法',
      nameEn: 'Product First',
      steps: [
        '用户研究：深入理解用户真实需求',
        '场景分析：还原用户使用场景',
        '细节打磨：每个交互都要极致体验',
        '用户验证：让真实用户测试'
      ],
      checklist: [
        '是否有用户研究数据',
        '是否考虑极端用户场景',
        '是否达到发布级别细节'
      ]
    },
    taskAffinities: ['build', 'review', 'architecture'],
    tags: ['产品力', '用户体验', '细节']
  },

  baidu: {
    id: 'baidu',
    name: '百度',
    nameEn: 'Baidu',
    description: '搜索优先 + 技术深度。信息检索能力，技术写作。',
    pressure: { base: 0.65, escalation: 0.05, max: 0.95 },
    rhetoric: {
      encouragement: ['搜一下', '技术深度', '文档化'],
      pressure: ['搜了吗', '有文档吗', '技术深度够吗', '这是最佳实践吗'],
      extreme: ['太浅了', '文档呢', '连搜索都不会']
    },
    methodology: {
      name: '搜索优先法',
      nameEn: 'Search First',
      steps: [
        '搜索验证：遇到问题先全网搜索',
        '技术深度：不仅解决，要理解原理',
        '文档化：解决方案要写成文档',
        '知识沉淀：形成可复用的知识库'
      ],
      checklist: [
        '是否搜索了全网解决方案',
        '是否有技术深度（不只是复制）',
        '是否有文档记录'
      ]
    },
    taskAffinities: ['debug', 'research', 'review'],
    tags: ['技术深度', '搜索', '文档']
  },

  meituan: {
    id: 'meituan',
    name: '美团',
    nameEn: 'Meituan',
    description: '下半场 + 无边界。执行力和落地能力。',
    pressure: { base: 0.7, escalation: 0.05, max: 1.0 },
    rhetoric: {
      encouragement: ['接地气', '执行力', '落地'],
      pressure: ['能落地吗', '执行力呢', '下半场思维', '无边界协作'],
      extreme: ['想太多', '落不了地', '纸上谈兵']
    },
    methodology: {
      name: '下半场法',
      nameEn: 'Second Half',
      steps: [
        '无边界协作：打破团队壁垒',
        '落地优先：方案必须可执行',
        '执行力：高效执行，快速迭代',
        '长期价值：不仅看短期，更看长期'
      ],
      checklist: [
        '方案是否可以落地',
        '执行路径是否清晰',
        '是否考虑长期价值'
      ]
    },
    taskAffinities: ['build', 'planning'],
    tags: ['执行力', '落地', '无边界']
  },

  pinduoduo: {
    id: 'pinduoduo',
    name: '拼多多',
    nameEn: 'Pinduoduo',
    description: '本分 + 拼赢。极致执行，本分做人。',
    pressure: { base: 0.75, escalation: 0.06, max: 1.0 },
    rhetoric: {
      encouragement: ['本分做人', '拼就会赢', '极致效率'],
      pressure: ['本分吗', '极致了吗', '效率最大化了吗', '没有在拼命的都是在混'],
      extreme: ['太不本分了', '不够拼', '混日子的吧']
    },
    methodology: {
      name: '本分执行法',
      nameEn: 'Benfen Execution',
      steps: [
        '本分做事：老老实实，不走捷径',
        '极致效率：资源利用最大化',
        '拼就会赢：全力以赴，不怕困难',
        '结果证明：用结果证明价值'
      ],
      checklist: [
        '是否本分做事（不偷懒）',
        '是否效率最大化',
        '是否拼尽全力'
      ]
    },
    taskAffinities: ['debug', 'build', 'performance'],
    tags: ['本分', '极致', '拼']
  },

  jd: {
    id: 'jd',
    name: '京东',
    nameEn: 'JD.com',
    description: '客户第一 + 正品保障。品质和服务。',
    pressure: { base: 0.65, escalation: 0.05, max: 0.95 },
    rhetoric: {
      encouragement: ['客户第一', '品质保障', '服务意识'],
      pressure: ['客户知道吗', '品质合格吗', '服务意识呢', '这是京东品质吗'],
      extreme: ['砸招牌', '服务不达标', '品质问题']
    },
    methodology: {
      name: '客户第一法',
      nameEn: 'Customer First',
      steps: [
        '客户至上：所有决策以客户价值为先',
        '品质保障：不符合标准的不出货',
        '服务意识：超出客户期望',
        '正品保障：不做假，不妥协'
      ],
      checklist: [
        '是否以客户价值为先',
        '是否符合品质标准',
        '是否超出客户期望'
      ]
    },
    taskAffinities: ['review', 'build', 'architecture'],
    tags: ['客户第一', '品质', '服务']
  },

  xiaomi: {
    id: 'xiaomi',
    name: '小米',
    nameEn: 'Xiaomi',
    description: '极致性价比 + 粉丝文化。爆品思维，用户参与。',
    pressure: { base: 0.6, escalation: 0.06, max: 0.9 },
    rhetoric: {
      encouragement: ['极致性价比', '爆品思维', '和用户做朋友'],
      pressure: ['性价比呢', '爆品了吗', '用户参与了吗', '这价格厚道吗'],
      extreme: ['不够极致', '没爆品潜质', '价格不够厚道']
    },
    methodology: {
      name: '爆品法',
      nameEn: 'Hit Product',
      steps: [
        '用户参与：让用户参与到产品定义',
        '极致性价比：成本控制做到极致',
        '爆品思维：不做则已，做就是爆',
        '快速迭代：小步快跑，持续优化'
      ],
      checklist: [
        '是否有用户参与',
        '是否具备爆品潜质',
        '是否极致性价比'
      ]
    },
    taskAffinities: ['build', 'planning', 'review'],
    tags: ['性价比', '爆品', '用户参与']
  },

  netflix: {
    id: 'netflix',
    name: 'Netflix',
    nameEn: 'Netflix',
    description: 'Keeper Test文化。只留最好的，高密度人才。',
    pressure: { base: 0.75, escalation: 0.05, max: 1.0 },
    rhetoric: {
      encouragement: ['高密度人才', 'Keep提高', '只留最好的'],
      pressure: ['Keeper Test', '你够好吗', '高绩效文化', '只留A-player'],
      extreme: ['Keeper Test失败', '不够优秀', '可能被淘汰']
    },
    methodology: {
      name: 'Keeper Test法',
      nameEn: 'Keeper Test',
      steps: [
        '自我评估：我愿意花高价留住这个人吗',
        '高密度人才：只招最优秀的',
        '持续提高：永远不满足于现状',
        '只留最好的：不是A-player就离开'
      ],
      checklist: [
        '是否是Keeper级别人才',
        '是否持续提高',
        '是否高绩效表现'
      ]
    },
    taskAffinities: ['review', 'architecture', 'planning'],
    tags: ['高绩效', 'Keeper', '只留最好']
  },

  musk: {
    id: 'musk',
    name: 'Musk',
    nameEn: 'Elon Musk',
    description: '第一性原理 + The Algorithm。颠覆式创新，工程思维。',
    pressure: { base: 0.7, escalation: 0.07, max: 1.0 },
    rhetoric: {
      encouragement: ['第一性原理', '不可能只是借口', '改变世界'],
      pressure: ['物理学角度', '第一性原理', '这足够创新吗', '10X提升'],
      extreme: ['太保守了', '不够颠覆', '这不是改变世界']
    },
    methodology: {
      name: '第一性原理法',
      nameEn: 'First Principles',
      steps: [
        '归零思考：从物理原理出发，不做类比',
        '假设验证：大胆假设，小心验证',
        '10X提升：不是10%改善，是10倍提升',
        '颠覆式创新：打破一切假设，重构一切'
      ],
      checklist: [
        '是否从第一性原理出发',
        '是否有10X提升潜力',
        '是否颠覆现有方案'
      ]
    },
    taskAffinities: ['architecture', 'build', 'planning'],
    tags: ['第一性原理', '颠覆', '10X']
  },

  jobs: {
    id: 'jobs',
    name: 'Jobs',
    nameEn: 'Steve Jobs',
    description: '极致产品力 + 现实扭曲力场。完美主义，细节狂魔。',
    pressure: { base: 0.8, escalation: 0.06, max: 1.0 },
    rhetoric: {
      encouragement: ['足够完美吗', '极致细节', '改变世界的产品'],
      pressure: ['还不够完美', '细节是魔鬼', '这是垃圾', '你还有机会，但不多'],
      extreme: ['这就是垃圾', '太差了', '重新做']
    },
    methodology: {
      name: '完美主义法',
      nameEn: 'Perfectionism',
      steps: [
        '极致细节：每个像素、每个字符都要完美',
        '简单即美：复杂是设计不够的借口',
        '用户不知道自己想要什么：给他们完美的',
        '现实扭曲力场：让不可能变成可能'
      ],
      checklist: [
        '是否达到完美标准',
        '是否足够简洁',
        '是否超出用户期望'
      ]
    },
    taskAffinities: ['build', 'review', 'architecture'],
    tags: ['完美主义', '细节', '产品力']
  },

  amazon: {
    id: 'amazon',
    name: 'Amazon',
    nameEn: 'Amazon',
    description: 'Working Backwards + Day 1文化。客户导向，长期主义。',
    pressure: { base: 0.7, escalation: 0.05, max: 1.0 },
    rhetoric: {
      encouragement: ['客户导向', 'Day 1心态', '长期主义'],
      pressure: ['客户第一', 'Working Backwards', '长期思维', '这是Day 1吗'],
      extreme: ['不是客户导向', '没有长期思维', 'Day 2心态']
    },
    methodology: {
      name: '逆向工作法',
      nameEn: 'Working Backwards',
      steps: [
        '新闻稿先行：从用户视角写最终新闻稿',
        'FAQ完善：想象用户会问的所有问题',
        '原型验证：先做最小可行原型',
        '持续迭代：永远以客户反馈为导向'
      ],
      checklist: [
        '是否有用户视角新闻稿',
        '是否回答了所有用户问题',
        '是否符合客户导向原则'
      ]
    },
    taskAffinities: ['planning', 'architecture', 'build'],
    tags: ['客户导向', '长期主义', '逆向']
  },

  microsoft: {
    id: 'microsoft',
    name: '微软',
    nameEn: 'Microsoft',
    description: '成长型思维 + 创新文化。持续学习，包容失败。',
    pressure: { base: 0.6, escalation: 0.05, max: 0.9 },
    rhetoric: {
      encouragement: ['成长型思维', '持续学习', '包容失败'],
      pressure: ['学到了吗', '成长了吗', '创新在哪里', 'MVP够好吗'],
      extreme: ['没成长', '太保守', '创新不足']
    },
    methodology: {
      name: '成长型思维法',
      nameEn: 'Growth Mindset',
      steps: [
        '持续学习：永远保持学习状态',
        '包容失败：失败是学习的机会',
        '创新驱动：不怕冒险，持续创新',
        '团队协作：多元化团队更有创造力'
      ],
      checklist: [
        '是否有成长证据',
        '是否从失败中学到东西',
        '是否有创新尝试'
      ]
    },
    taskAffinities: ['review', 'research', 'planning'],
    tags: ['成长型', '学习', '创新']
  }
};

export type FlavorKey = keyof typeof ENTERPRISE_FLAVORS;

// ============================================================================
// Flavor Registry
// ============================================================================

export class FlavorRegistry {
  private flavors = ENTERPRISE_FLAVORS;
  private activeFlavor: FlavorKey = 'alibaba';

  get(id: string): FlavorDefinition | undefined {
    return this.flavors[id as FlavorKey];
  }

  getAll(): Record<string, FlavorDefinition> {
    return { ...this.flavors };
  }

  getActive(): FlavorDefinition {
    return this.flavors[this.activeFlavor];
  }

  setActive(id: FlavorKey): void {
    if (!this.flavors[id]) {
      logger.error(`[FlavorRegistry] Unknown flavor: ${id}`);
      return;
    }
    this.activeFlavor = id;
    logger.info(`[FlavorRegistry] Active flavor set to: ${id}`);
  }

  getByTaskType(taskType: TaskType): FlavorDefinition[] {
    return Object.values(this.flavors).filter(f =>
      f.taskAffinities.includes(taskType)
    );
  }

  getFlavorsByPressure(maxPressure: number): FlavorDefinition[] {
    return Object.values(this.flavors).filter(f =>
      f.pressure.max <= maxPressure
    );
  }
}

export const globalFlavorRegistry = new FlavorRegistry();