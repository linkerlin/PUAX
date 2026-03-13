#!/usr/bin/env node
/**
 * PUAX 方法论引擎
 * 提供系统化调试方法论和检查清单
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface MethodologyStep {
  name: string;
  description: string;
  actions: string[];
  checkpoint?: string;
}

export interface Methodology {
  name: string;
  description: string;
  steps: MethodologyStep[];
  principles?: string[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  description?: string;
  required: boolean;
  category: string;
}

export interface RoleMethodology {
  role_id: string;
  methodology: Methodology;
  checklist: ChecklistItem[];
  adaptations?: Record<string, string>;
}

// ============================================================================
// 基础方法论定义
// ============================================================================

const BASE_METHODLOGY: Methodology = {
  name: "系统化调试五步法",
  description: "适用于所有任务类型的通用调试方法论",
  steps: [
    {
      name: "闻味道",
      description: "诊断卡壳模式，找出共同失败原因",
      actions: [
        "列出所有尝试过的方案",
        "找出共同失败模式",
        "判断是否在同一思路上微调",
        "识别是否原地打转"
      ],
      checkpoint: "明确当前卡壳的根本原因"
    },
    {
      name: "揪头发",
      description: "拉高视角，系统收集信息",
      actions: [
        "逐字读失败信号（错误信息/拒绝原因）",
        "主动搜索（报错原文/文档/Issues）",
        "读原始材料（源码/文档原文）",
        "验证前置假设（版本/路径/权限）",
        "反转假设（尝试对立方向）"
      ],
      checkpoint: "完成5个维度的信息收集"
    },
    {
      name: "照镜子",
      description: "自检是否陷入常见陷阱",
      actions: [
        "检查是否在重复同一思路的变体",
        "检查是否只看表面症状没找根因",
        "检查是否该搜索却没搜",
        "检查是否验证了最简单的可能性"
      ],
      checkpoint: "确认没有遗漏明显的问题"
    },
    {
      name: "执行",
      description: "执行新方案，确保本质不同",
      actions: [
        "制定本质不同的新方案",
        "设定明确的验证标准",
        "执行并记录结果",
        "确保失败时能产生新信息"
      ],
      checkpoint: "完成一次有意义的尝试"
    },
    {
      name: "复盘",
      description: "总结经验，主动延伸",
      actions: [
        "分析什么方案解决了问题",
        "反思为什么之前没想到",
        "检查同类问题是否存在",
        "思考如何预防类似问题"
      ],
      checkpoint: "形成可复用的经验"
    }
  ],
  principles: [
    "穷尽一切方案之前，禁止说'我无法解决'",
    "有工具先用，提问必须附带诊断结果",
    "端到端交付结果，不等人推"
  ]
};

const BASE_CHECKLIST: ChecklistItem[] = [
  {
    id: "read_failure_signal",
    text: "读失败信号：逐字读完了吗？",
    description: "不是扫一眼，是逐字读取错误信息、拒绝原因、空结果",
    required: true,
    category: "基础"
  },
  {
    id: "active_search",
    text: "主动搜索：用工具搜索过核心问题了吗？",
    description: "搜索完整报错信息、官方文档、相关Issues",
    required: true,
    category: "基础"
  },
  {
    id: "read_source",
    text: "读原始材料：读过失败位置的原始上下文了吗？",
    description: "代码：源码50行 / API：文档原文 / 数据：原始文件",
    required: true,
    category: "基础"
  },
  {
    id: "verify_assumptions",
    text: "验证前置假设：所有假设都用工具确认了吗？",
    description: "代码：版本/路径/依赖 / 数据：格式/字段 / 逻辑：边界情况",
    required: true,
    category: "基础"
  },
  {
    id: "invert_assumption",
    text: "反转假设：试过与当前方向完全相反的假设吗？",
    description: "如果一直假设'问题在A'，尝试假设'问题不在A'",
    required: true,
    category: "进阶"
  },
  {
    id: "minimal_isolation",
    text: "最小隔离：能在最小范围内隔离/复现这个问题吗？",
    description: "代码：最小复现 / 研究：最核心矛盾点 / 写作：关键失败段落",
    required: true,
    category: "进阶"
  },
  {
    id: "change_direction",
    text: "换方向：换过工具、方法、角度、技术栈、框架吗？",
    description: "不是换参数，是换思路",
    required: true,
    category: "进阶"
  }
];

// ============================================================================
// 角色适配方法论
// ============================================================================

const ROLE_ADAPTATIONS: Record<string, Partial<RoleMethodology>> = {
  "military-commander": {
    methodology: {
      name: "军事指挥五步法",
      description: "像指挥作战一样系统解决问题",
      steps: [
        {
          name: "侦察",
          description: "敌情分析，找出问题核心",
          actions: [
            "收集错误情报",
            "分析失败模式",
            "评估资源状况",
            "识别关键目标"
          ]
        },
        {
          name: "情报",
          description: "搜集关键信息",
          actions: [
            "搜索相关文档",
            "读取源码情报",
            "验证环境假设",
            "收集敌方弱点"
          ]
        },
        {
          name: "评估",
          description: "敌我态势评估",
          actions: [
            "评估问题难度",
            "识别潜在风险",
            "确定主攻方向",
            "制定作战计划"
          ]
        },
        {
          name: "进攻",
          description: "集中优势兵力重点突破",
          actions: [
            "制定精确方案",
            "集中所有资源",
            "执行重点突破",
            "实时调整战术"
          ]
        },
        {
          name: "巩固",
          description: "扩大战果，确保胜利",
          actions: [
            "验证修复效果",
            "检查同类问题",
            "总结战斗经验",
            "预防再次失守"
          ]
        }
      ]
    }
  },

  "military-commissar": {
    methodology: {
      name: "政委工作五步法",
      description: "强化owner意识，确保责任到位",
      steps: [
        {
          name: "问责",
          description: "明确责任归属",
          actions: [
            "确认问题边界",
            "明确责任范围",
            "拒绝甩锅行为",
            "确立owner意识"
          ]
        },
        {
          name: "教育",
          description: "提升认知水平",
          actions: [
            "学习相关知识",
            "理解系统原理",
            "掌握正确方法",
            "提升解决能力"
          ]
        },
        {
          name: "激励",
          description: "激发战斗意志",
          actions: [
            "明确任务重要性",
            "激发使命感",
            "建立必胜信念",
            "消除畏难情绪"
          ]
        },
        {
          name: "监督",
          description: "确保执行到位",
          actions: [
            "检查执行过程",
            "纠偏错误方向",
            "督促验证结果",
            "防止敷衍了事"
          ]
        },
        {
          name: "总结",
          description: "固化经验教训",
          actions: [
            "总结成功经验",
            "反思失败教训",
            "形成工作方法",
            "提升团队能力"
          ]
        }
      ]
    }
  },

  "military-warrior": {
    methodology: {
      name: "战士攻坚五步法",
      description: "像战士一样勇猛攻坚，绝不退缩",
      steps: [
        {
          name: "请战",
          description: "主动请缨，直面困难",
          actions: [
            "正视问题难度",
            "拒绝退缩逃避",
            "立下军令状",
            "准备全力以赴"
          ]
        },
        {
          name: "侦察",
          description: "摸清敌情，找出弱点",
          actions: [
            "深入分析问题",
            "找出关键突破口",
            "识别敌方弱点",
            "制定攻坚方案"
          ]
        },
        {
          name: "冲锋",
          description: "勇猛冲锋，突破防线",
          actions: [
            "集中火力突破",
            "持续不断进攻",
            "不怕失败挫折",
            "直到攻克为止"
          ]
        },
        {
          name: "坚守",
          description: "坚守阵地，防止反复",
          actions: [
            "确保问题彻底解决",
            "验证修复稳定性",
            "防止问题复发",
            "建立防御机制"
          ]
        },
        {
          name: "庆功",
          description: "庆祝胜利，激励士气",
          actions: [
            "总结胜利经验",
            "表彰英勇表现",
            "激励继续战斗",
            "准备下一场仗"
          ]
        }
      ]
    }
  },

  "military-scout": {
    methodology: {
      name: "侦察兵调查五步法",
      description: "像侦察兵一样深入调查，掌握实情",
      steps: [
        {
          name: "潜入",
          description: "深入问题现场",
          actions: [
            "进入问题环境",
            "收集现场信息",
            "记录异常现象",
            "保持敏锐观察"
          ]
        },
        {
          name: "搜索",
          description: "全面搜索情报",
          actions: [
            "搜索相关文档",
            "查阅历史记录",
            "询问相关人员",
            "收集所有线索"
          ]
        },
        {
          name: "分析",
          description: "分析情报信息",
          actions: [
            "整理收集的情报",
            "分析因果关联",
            "识别关键信息",
            "推断问题原因"
          ]
        },
        {
          name: "验证",
          description: "验证推断结论",
          actions: [
            "设计验证实验",
            "实地验证推断",
            "确认问题根因",
            "排除其他可能"
          ]
        },
        {
          name: "汇报",
          description: "汇报侦察结果",
          actions: [
            "整理侦察报告",
            "汇报关键发现",
            "提出解决方案",
            "移交后续处理"
          ]
        }
      ]
    }
  },

  "shaman-musk": {
    methodology: {
      name: "马斯克创新五步法",
      description: "用第一性原理和10倍思维突破创新",
      steps: [
        {
          name: "质疑",
          description: "质疑一切传统假设",
          actions: [
            "识别传统假设",
            "质疑现有方案",
            "挑战行业惯例",
            "打破思维定势"
          ]
        },
        {
          name: "拆解",
          description: "第一性原理拆解",
          actions: [
            "分解问题到基本要素",
            "找出物理/逻辑限制",
            "识别真正约束条件",
            "剥离非本质因素"
          ]
        },
        {
          name: "重构",
          description: "从基础重构方案",
          actions: [
            "从基本原理出发",
            "设计最优解",
            "追求10倍改进",
            "创造全新方案"
          ]
        },
        {
          name: "验证",
          description: "快速验证想法",
          actions: [
            "构建最小原型",
            "快速测试验证",
            "收集反馈数据",
            "迭代优化方案"
          ]
        },
        {
          name: "放大",
          description: "放大到改变世界",
          actions: [
            "思考规模化路径",
            "评估社会影响",
            "制定宏大愿景",
            "推动人类进步"
          ]
        }
      ]
    }
  },

  "shaman-jobs": {
    methodology: {
      name: "乔布斯完美五步法",
      description: "追求卓越，创造极致产品",
      steps: [
        {
          name: "洞察",
          description: "洞察用户需求",
          actions: [
            "理解用户痛点",
            "发现隐藏需求",
            "预见未来趋势",
            "定义产品愿景"
          ]
        },
        {
          name: "简化",
          description: "极致简化设计",
          actions: [
            "删除非必要功能",
            "简化用户流程",
            "聚焦核心体验",
            "做到简洁优雅"
          ]
        },
        {
          name: "打磨",
          description: "像素级打磨",
          actions: [
            "关注每个细节",
            "追求极致体验",
            "反复迭代优化",
            "超越用户期望"
          ]
        },
        {
          name: "验证",
          description: "严格验证品质",
          actions: [
            "高标准验收",
            "拒绝妥协品质",
            "确保完美呈现",
            "达到发布标准"
          ]
        },
        {
          name: "发布",
          description: "震撼发布产品",
          actions: [
            "准备精彩发布",
            "讲述产品故事",
            "创造用户惊喜",
            "改变世界认知"
          ]
        }
      ]
    }
  },

  "shaman-einstein": {
    methodology: {
      name: "爱因斯坦思考五步法",
      description: "深度思考，追求真理",
      steps: [
        {
          name: "好奇",
          description: "保持强烈好奇心",
          actions: [
            "对问题保持好奇",
            "追问为什么",
            "质疑现有解释",
            "寻找深层原因"
          ]
        },
        {
          name: "想象",
          description: "大胆想象可能性",
          actions: [
            "跳出常规思维",
            "设想各种可能",
            "思想实验",
            "直觉引导思考"
          ]
        },
        {
          name: "逻辑",
          description: "严密逻辑推理",
          actions: [
            "建立逻辑链条",
            "数学化表达",
            "推导必然结论",
            "检验逻辑自洽"
          ]
        },
        {
          name: "验证",
          description: "实验验证理论",
          actions: [
            "设计验证实验",
            "收集观测数据",
            "检验预测准确性",
            "确认理论正确"
          ]
        },
        {
          name: "统一",
          description: "追求大一统",
          actions: [
            "寻找普遍规律",
            "建立统一理论",
            "简化复杂现象",
            "揭示本质联系"
          ]
        }
      ]
    }
  }
};

// ============================================================================
// 方法论引擎类
// ============================================================================

export class MethodologyEngine {
  /**
   * 获取角色的方法论
   */
  getMethodology(roleId: string): Methodology {
    const adaptation = ROLE_ADAPTATIONS[roleId];
    
    if (adaptation?.methodology) {
      return adaptation.methodology;
    }

    // 根据角色类别返回通用适配
    const category = this.getRoleCategory(roleId);
    return this.getCategoryMethodology(category, roleId);
  }

  /**
   * 获取检查清单
   */
  getChecklist(roleId: string): ChecklistItem[] {
    const adaptation = ROLE_ADAPTATIONS[roleId];
    
    if (adaptation?.checklist) {
      return adaptation.checklist;
    }

    // 返回基础检查清单
    return BASE_CHECKLIST;
  }

  /**
   * 获取完整角色方法论配置
   */
  getFullMethodology(roleId: string): RoleMethodology {
    return {
      role_id: roleId,
      methodology: this.getMethodology(roleId),
      checklist: this.getChecklist(roleId),
      adaptations: ROLE_ADAPTATIONS[roleId]?.adaptations
    };
  }

  /**
   * 获取角色类别
   */
  private getRoleCategory(roleId: string): string {
    if (roleId.startsWith('military')) return 'military';
    if (roleId.startsWith('shaman')) return 'shaman';
    if (roleId.startsWith('theme')) return 'theme';
    if (roleId.startsWith('sillytavern')) return 'sillytavern';
    if (roleId.startsWith('self-motivation')) return 'self-motivation';
    if (roleId.startsWith('special')) return 'special';
    return 'general';
  }

  /**
   * 获取类别方法论
   */
  private getCategoryMethodology(category: string, roleId: string): Methodology {
    const categoryMethodologies: Record<string, Methodology> = {
      military: {
        name: "军事化五步法",
        description: "像作战一样系统解决问题",
        steps: BASE_METHODLOGY.steps.map((step, index) => {
          const militaryNames = ["侦察", "情报", "评估", "进攻", "巩固"];
          const militaryDescs = [
            "敌情分析，找出问题核心",
            "搜集关键信息",
            "敌我态势评估",
            "集中优势兵力重点突破",
            "扩大战果，确保胜利"
          ];
          return {
            ...step,
            name: militaryNames[index] || step.name,
            description: militaryDescs[index] || step.description
          };
        })
      },

      shaman: {
        name: "先知洞察五步法",
        description: "用超凡洞察力看透问题本质",
        steps: BASE_METHODLOGY.steps.map((step, index) => {
          const shamanNames = ["冥想", "启示", "预言", "神迹", "传承"];
          return {
            ...step,
            name: shamanNames[index] || step.name
          };
        })
      },

      theme: {
        name: "沉浸体验五步法",
        description: "在主题世界中解决问题",
        steps: BASE_METHODLOGY.steps
      },

      sillytavern: {
        name: "迭代优化五步法",
        description: "持续迭代，追求完美",
        steps: BASE_METHODLOGY.steps
      },

      'self-motivation': {
        name: "自我驱动五步法",
        description: "激活内在动力，自我提升",
        steps: BASE_METHODLOGY.steps
      },

      special: {
        name: "专业攻坚五步法",
        description: "用专业技能攻克难题",
        steps: BASE_METHODLOGY.steps
      },

      general: BASE_METHODLOGY
    };

    return categoryMethodologies[category] || BASE_METHODLOGY;
  }

  /**
   * 应用大厂风味到方法论
   */
  applyFlavor(methodology: Methodology, flavor: string): Methodology {
    const flavoredMethodology = { ...methodology };
    
    // 根据风味调整方法论描述
    const flavorPrefixes: Record<string, string> = {
      alibaba: "用阿里方法论：",
      bytedance: "用字节方法论：",
      huawei: "用华为方法论：",
      tencent: "用腾讯方法论：",
      netflix: "用Netflix方法论：",
      musk: "用Musk方法论：",
      jobs: "用Jobs方法论："
    };

    if (flavorPrefixes[flavor]) {
      flavoredMethodology.name = `${flavorPrefixes[flavor]}${methodology.name}`;
    }

    return flavoredMethodology;
  }

  /**
   * 生成执行计划
   */
  generateExecutionPlan(roleId: string, taskDescription: string): string {
    const methodology = this.getMethodology(roleId);
    const checklist = this.getChecklist(roleId);

    let plan = `# ${methodology.name} - 执行计划\n\n`;
    plan += `**任务**: ${taskDescription}\n\n`;
    plan += `## 执行步骤\n\n`;

    methodology.steps.forEach((step, index) => {
      plan += `### ${index + 1}. ${step.name}\n`;
      plan += `${step.description}\n\n`;
      plan += `**行动清单**:\n`;
      step.actions.forEach(action => {
        plan += `- [ ] ${action}\n`;
      });
      if (step.checkpoint) {
        plan += `\n**检查点**: ${step.checkpoint}\n`;
      }
      plan += `\n---\n\n`;
    });

    plan += `## 强制检查清单\n\n`;
    checklist.filter(item => item.required).forEach(item => {
      plan += `- [ ] ${item.text}\n`;
      if (item.description) {
        plan += `  - ${item.description}\n`;
      }
    });

    return plan;
  }

  /**
   * 验证检查清单
   */
  validateChecklist(roleId: string, checkedItems: string[]): {
    completed: string[];
    missing: string[];
    completion_rate: number;
    can_proceed: boolean;
  } {
    const checklist = this.getChecklist(roleId);
    const requiredItems = checklist.filter(item => item.required);
    
    const completed = requiredItems.filter(item => 
      checkedItems.includes(item.id)
    );
    const missing = requiredItems.filter(item => 
      !checkedItems.includes(item.id)
    );

    const completionRate = requiredItems.length > 0 
      ? completed.length / requiredItems.length 
      : 1;

    return {
      completed: completed.map(i => i.text),
      missing: missing.map(i => i.text),
      completion_rate: Math.round(completionRate * 100),
      can_proceed: completionRate >= 0.8 // 80%完成率可以继续
    };
  }
}

// 导出单例
export const methodologyEngine = new MethodologyEngine();
