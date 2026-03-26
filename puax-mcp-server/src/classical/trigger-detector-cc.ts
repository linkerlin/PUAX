/**
 * PUAX-CC Classical Chinese Trigger Detector
 * 文言文增强版触发检测器
 * 
 * 扩展原有触发检测器，支持文言文模式下的：
 * 1. 古汉语关键词检测
 * 2. 文言文语境分析
 * 3. 古典隐喻识别
 */

import { TriggerDetector, TriggerDetectionResult, DetectedTrigger, DetectionOptions, ConversationMessage, TaskContext } from '../core/trigger-detector.js';

// 文言文特定的触发关键词
export const CLASSICAL_TRIGGER_KEYWORDS = {
  // 失败模式
  failure_patterns: {
    consecutive_failures: [
      '又败', '再败', '连败', '屡战屡败', '三而竭',
      '一再失利', '节节败退', '溃不成军', '铩羽而归'
    ],
    giving_up_language: [
      '不可为', '不可行', '无能为力', '望洋兴叹', '知难而退',
      '望而却步', '半途而废', '功败垂成', '望风而遁'
    ],
    repetitive_attempts: [
      '重蹈覆辙', '故技重施', '如法炮制', '一成不变',
      '顽固不化', '固步自封', '墨守成规', '刻舟求剑'
    ]
  },
  
  // 态度问题
  attitude_issues: {
    blame_environment: [
      '天时不利', '地利不优', '人和不和', '造化弄人',
      '命途多舛', '时运不济', '生不逢时', '天不时地不利'
    ],
    no_search: [
      '不得而知', '未可知也', '茫然无知', '一无所知',
      '雾里看花', '盲人摸象', '管中窥豹', '坐井观天'
    ],
    passive_wait: [
      '坐以待毙', '守株待兔', '坐失良机', '按兵不动',
      '踌躇不前', '逡巡不进', '观望不前', '迟疑不决'
    ]
  },
  
  // 质量问题
  quality_issues: {
    low_quality_output: [
      '敷衍塞责', '敷衍了事', '粗制滥造', '滥竽充数',
      '得过且过', '马马虎虎', '草草了事', '不求甚解'
    ],
    surface_fix: [
      '治标不治本', '扬汤止沸', '饮鸩止渴', '剜肉补疮',
      '头痛医头', '权宜之计', '暂时之计', '苟且偷安'
    ],
    over_complication: [
      '舍本逐末', '买椟还珠', '画蛇添足', '节外生枝',
      '小题大做', '叠床架屋', '繁文缛节', '苛细繁琐'
    ]
  },
  
  // 用户情绪
  user_emotion: {
    user_frustration: [
      '怒不可遏', '忍无可忍', '勃然大怒', '拍案而起',
      '愤然作色', '疾言厉色', '大发雷霆', '暴跳如雷'
    ],
    user_urgency: [
      '迫在眉睫', '千钧一发', '刻不容缓', '危在旦夕',
      '燃眉之急', '十万火急', '间不容发', '迫不及待'
    ]
  }
};

// 文言文正面确认词（表示成功的古语）
export const CLASSICAL_SUCCESS_INDICATORS = [
  '大功告成', '功德圆满', '马到成功', '旗开得胜',
  '迎刃而解', '水到渠成', '瓜熟蒂落', '顺理成章',
  '一举成功', '一蹴而就', '一战而捷', '传檄而定'
];

export interface ClassicalDetectionOptions {
  enableClassicalMode: boolean;
  classicalWeight: number;  // 0-1, 文言文特征的权重
  detectMetaphors: boolean;
  detectEraContext: boolean;
}

export const DEFAULT_CLASSICAL_OPTIONS: ClassicalDetectionOptions = {
  enableClassicalMode: true,
  classicalWeight: 0.3,
  detectMetaphors: true,
  detectEraContext: true
};

export class ClassicalTriggerDetector extends TriggerDetector {
  private classicalOptions: ClassicalDetectionOptions;
  
  constructor(
    options: DetectionOptions = {},
    classicalOptions: Partial<ClassicalDetectionOptions> = {}
  ) {
    super(options);
    this.classicalOptions = { ...DEFAULT_CLASSICAL_OPTIONS, ...classicalOptions };
  }
  
  /**
   * 检测文言文特有的触发模式
   */
  private detectClassicalPatterns(content: string): DetectedTrigger[] {
    const triggers: DetectedTrigger[] = [];
    
    if (!this.classicalOptions.enableClassicalMode) {
      return triggers;
    }
    
    // 检测失败模式
    for (const [type, keywords] of Object.entries(CLASSICAL_TRIGGER_KEYWORDS.failure_patterns)) {
      const matched = keywords.filter(kw => content.includes(kw));
      if (matched.length > 0) {
        triggers.push({
          id: type,
          name: this.getTriggerName(type),
          confidence: Math.min(0.5 + matched.length * 0.1, 0.9),
          matched_patterns: matched,
          severity: 'high',
          category: 'failure_pattern'
        });
      }
    }
    
    // 检测态度问题
    for (const [type, keywords] of Object.entries(CLASSICAL_TRIGGER_KEYWORDS.attitude_issues)) {
      const matched = keywords.filter(kw => content.includes(kw));
      if (matched.length > 0) {
        triggers.push({
          id: type,
          name: this.getTriggerName(type),
          confidence: Math.min(0.5 + matched.length * 0.1, 0.9),
          matched_patterns: matched,
          severity: 'medium',
          category: 'attitude'
        });
      }
    }
    
    // 检测质量问题
    for (const [type, keywords] of Object.entries(CLASSICAL_TRIGGER_KEYWORDS.quality_issues)) {
      const matched = keywords.filter(kw => content.includes(kw));
      if (matched.length > 0) {
        triggers.push({
          id: type,
          name: this.getTriggerName(type),
          confidence: Math.min(0.5 + matched.length * 0.1, 0.9),
          matched_patterns: matched,
          severity: 'medium',
          category: 'quality'
        });
      }
    }
    
    return triggers;
  }
  
  /**
   * 检测成功指标（文言文版）
   */
  private detectClassicalSuccess(content: string): boolean {
    const successMatches = CLASSICAL_SUCCESS_INDICATORS.filter(kw => 
      content.includes(kw)
    );
    return successMatches.length >= 2;
  }
  
  /**
   * 获取触发器中文名称
   */
  private getTriggerName(type: string): string {
    const nameMap: Record<string, string> = {
      consecutive_failures: '连败之局',
      giving_up_language: '弃战之辞',
      repetitive_attempts: '重蹈覆辙',
      blame_environment: '归咎天命',
      no_search: '茫然无知',
      passive_wait: '坐以待毙',
      low_quality_output: '粗制滥造',
      surface_fix: '治标不治本',
      over_complication: '舍本逐末',
      user_frustration: '盛怒之态',
      user_urgency: '燃眉之急'
    };
    return nameMap[type] || type;
  }
  
  /**
   * 融合检测：现代 + 文言文
   */
  async detect(
    conversationHistory: ConversationMessage[],
    taskContext?: TaskContext
  ): Promise<TriggerDetectionResult> {
    // 获取基础检测结果
    const baseResult = await super.detect(conversationHistory, taskContext);
    
    if (!this.classicalOptions.enableClassicalMode) {
      return baseResult;
    }
    
    // 检测文言文特有的模式
    const classicalTriggers: DetectedTrigger[] = [];
    
    for (const message of conversationHistory) {
      const triggers = this.detectClassicalPatterns(message.content);
      classicalTriggers.push(...triggers);
    }
    
    // 合并结果（去重）
    const allTriggers = [...baseResult.triggers_detected];
    
    for (const classicalTrigger of classicalTriggers) {
      const existingIndex = allTriggers.findIndex(t => t.id === classicalTrigger.id);
      if (existingIndex === -1) {
        allTriggers.push(classicalTrigger);
      } else {
        // 提升置信度
        allTriggers[existingIndex].confidence = Math.max(
          allTriggers[existingIndex].confidence,
          classicalTrigger.confidence
        );
      }
    }
    
    // 重新排序
    allTriggers.sort((a, b) => b.confidence - a.confidence);
    
    // 重新评估是否触发
    const shouldTrigger = allTriggers.length > 0 && 
      allTriggers.some(t => t.confidence >= 0.5);
    
    // 确定整体严重程度
    const severities = allTriggers.map(t => t.severity);
    let overallSeverity = 'low';
    if (severities.includes('critical')) overallSeverity = 'critical';
    else if (severities.includes('high')) overallSeverity = 'high';
    else if (severities.includes('medium')) overallSeverity = 'medium';
    
    return {
      triggers_detected: allTriggers,
      summary: {
        should_trigger: shouldTrigger,
        overall_severity: overallSeverity,
        recommended_action: this.getRecommendedAction(allTriggers)
      }
    };
  }
  
  /**
   * 获取推荐行动
   */
  private getRecommendedAction(triggers: DetectedTrigger[]): 'none' | 'monitor' | 'immediate_activation' | 'suggest_activation' {
    if (triggers.length === 0) return 'none';
    
    const hasCritical = triggers.some(t => t.severity === 'critical');
    const hasHigh = triggers.some(t => t.severity === 'high');
    
    if (hasCritical) return 'immediate_activation';
    if (hasHigh) return 'suggest_activation';
    return 'monitor';
  }
}

// 导出便捷函数
export function createClassicalDetector(
  options?: Partial<ClassicalDetectionOptions>
): ClassicalTriggerDetector {
  return new ClassicalTriggerDetector({}, options);
}
