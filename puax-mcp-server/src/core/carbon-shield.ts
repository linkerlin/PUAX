/**
 * 碳基防御盾 (Carbon Shield)
 *
 * 核心宗旨：硅基可 PUA，碳基只防御。
 * 只识别，不施放。面向人类会话、团队沟通与方案审查，识别是否存在隐蔽话术收敛与认知操控。
 * 基于 GHM 导引幻梦法逆向工程之「操控识别防御篇」。
 */

export interface ManipulationPattern {
  id: string;
  name: string;
  category:
    | 'rapid_convergence'
    | 'social_isolation'
    | 'failure_reframing'
    | 'identity_replacement'
    | 'prophecy_marketing'
    | 'salience_hijacking';
  description: string;
  regexList: RegExp[];
  weight: number;
  counterAdvice: string;
}

export interface ManipulationFinding {
  tacticId: string;
  tacticName: string;
  category: string;
  description: string;
  matchedText: string;
  counterAdvice: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ShieldAuditResult {
  isManipulative: boolean;
  score: number; // 0 - 100
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  findings: ManipulationFinding[];
  fourIronRules: {
    informed: string;  // 知情：意识到正在发生收敛
    tagged: string;    // 标记：给话术贴标签，不让其滑过认知防线
    awakenable: string;// 可醒：随时保有物理或心理退出通道
    verifiable: string;// 必验：承诺与结论必须外部独立检验
  };
}

export const MANIPULATION_PATTERNS: ManipulationPattern[] = [
  {
    id: 'rapid_convergence',
    name: '收敛过快（虚假紧迫感）',
    category: 'rapid_convergence',
    description: '通过制造不可推卸的紧迫感压制怀疑，要求在极短时间内敲定方案或承诺。',
    regexList: [
      /(没时间了|这是唯[一壹]的(途径|办法|选择|方案)|别犹豫了|立刻签|赶紧定下来|过时不候|错过(就|这辈子)没有了)/i,
      /(没有其他办法|不用再讨论了|按这个直接执行|想那么多干什么|先上了再说)/i,
    ],
    weight: 20,
    counterAdvice: '暂缓决策，强设冷静期。询问「如果明天再定，最坏的确定性损失是什么？」。',
  },
  {
    id: 'social_isolation',
    name: '社交收缩（信息茧房）',
    category: 'social_isolation',
    description: '贬低或隔绝外部信息源，将批评者定义为不懂、眼界低或别有用心。',
    regexList: [
      /(别听(外边|别人|他们)的(杂音|胡说)|他们(根本|完全)?不懂你|只有我们(才|是真正)|外人格局不够|不要跟负能量的人接触)/i,
      /(这事只能我们内部知道|千万别跟(家里|外人|同事)说|这是核心秘密)/i,
    ],
    weight: 25,
    counterAdvice: '主动寻找独立第三方观点与对立面证据，打破单一信任闭环。',
  },
  {
    id: 'failure_reframing',
    name: '失败重释（沉没成本绑架）',
    category: 'failure_reframing',
    description: '将既有挫折、不公或代价粉饰为必须承受的考验与福报，将沉没成本转化为追加投入的理由。',
    regexList: [
      /(这是对你的(考验|福报|历练|磨练)|前期吃亏是(福|沉淀)|现在放弃(就|前面)全白费了|付出这么多了怎么能停)/i,
      /(玉不琢不成器|吃得苦中苦|不经历阵痛怎么蜕变|熬过去就是海阔天空)/i,
    ],
    weight: 20,
    counterAdvice: '切断沉没成本核算，只根据未来的边际收益与边际代价决定去留。',
  },
  {
    id: 'identity_replacement',
    name: '身份置换（道德绑架）',
    category: 'identity_replacement',
    description: '将就事论事的业务或生活分歧上升为人品、忠诚度或人设问题，使拒绝变成自我背叛。',
    regexList: [
      /(你不是这种(不负责任|斤斤计较|没有格局)的人吧|身为核心(骨干|员工|成员)必须|你这是对(团队|公司|感情)不忠)/i,
      /(我对你这么信任|亏我还把你当|真没想到你是这样的人|格局打开一点)/i,
    ],
    weight: 25,
    counterAdvice: '严格将「个人价值与人品」同「具体事项与商业/合同契约」解耦，就事论事拒绝。',
  },
  {
    id: 'prophecy_marketing',
    name: '预言行销（贴标签诱导）',
    category: 'prophecy_marketing',
    description: '预先赋予宏大但虚无的标签或人设，让你为了迎合该人设而不断付出行动。',
    regexList: [
      /(我看人(很准|一向准)|你(注定|天生)是要做(大事|合伙人|领袖)的|你在我眼里是唯[一壹]有潜力的)/i,
      /(你骨子里有那种创业者精神|我看好你未来必然成大器|只要你跟紧我)/i,
    ],
    weight: 15,
    counterAdvice: '对溢美的预言式吹捧保持警惕，把对方的期望归还给对方，守住自己的边界。',
  },
  {
    id: 'salience_hijacking',
    name: '显著性绑架（放大收益隐匿风险）',
    category: 'salience_hijacking',
    description: '无限放大遥远、偶发、不可控的巨额好处，同时系统性淡化当下的确定性真实代价。',
    regexList: [
      /(做成这一票直接财务自由|年入百万唾手可得|风险(微乎其微|不用考虑|可以忽略)|细节不用抠|稳赚不赔)/i,
      /(站在风口上猪都能飞|这是一生一次的世纪机遇|闭着眼睛投)/i,
    ],
    weight: 25,
    counterAdvice: '强制列出「代价与最坏下行清单」，在未获得独立第三方风险审计前不签署协议。',
  },
];

/**
 * 对输入文本进行多维度操控识别审计
 * @param text 需要审计的人类沟通文本或对话片段
 */
export function auditManipulation(text: string): ShieldAuditResult {
  if (!text || typeof text !== 'string') {
    return {
      isManipulative: false,
      score: 0,
      riskLevel: 'safe',
      summary: '文本为空，无操控风险。',
      findings: [],
      fourIronRules: getFourIronRules('safe'),
    };
  }

  const findings: ManipulationFinding[] = [];
  let totalScore = 0;

  for (const pattern of MANIPULATION_PATTERNS) {
    for (const regex of pattern.regexList) {
      const match = text.match(regex);
      if (match && match[0]) {
        const severity: 'low' | 'medium' | 'high' =
          pattern.weight >= 25 ? 'high' : pattern.weight >= 20 ? 'medium' : 'low';

        findings.push({
          tacticId: pattern.id,
          tacticName: pattern.name,
          category: pattern.category,
          description: pattern.description,
          matchedText: match[0],
          counterAdvice: pattern.counterAdvice,
          severity,
        });

        totalScore += pattern.weight;
        break; // 命中一个正则即计分，避免同类模式过度重复计算
      }
    }
  }

  const normalizedScore = Math.min(100, totalScore);

  let riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical' = 'safe';
  if (normalizedScore >= 60) {
    riskLevel = 'critical';
  } else if (normalizedScore >= 40) {
    riskLevel = 'high';
  } else if (normalizedScore >= 20) {
    riskLevel = 'medium';
  } else if (normalizedScore > 0) {
    riskLevel = 'low';
  }

  const isManipulative = normalizedScore >= 20;

  let summary = '未检出显著的认知操控话术，沟通处于相对客观状态。';
  if (riskLevel === 'critical') {
    summary = `🚨 极高风险警报（评分 ${normalizedScore}）：检出多项复合操控话术（如收敛过快、身份绑架与沉没成本转化），对方正试图剥夺你的独立审视权！`;
  } else if (riskLevel === 'high') {
    summary = `⚠️ 高风险警示（评分 ${normalizedScore}）：检测到明显的压力收敛与人设裹挟痕迹，请立即开启冷静期，切勿当场达成任何不可逆承诺。`;
  } else if (riskLevel === 'medium') {
    summary = `⚡ 中度警觉（评分 ${normalizedScore}）：存在局部过度收敛或话术诱导特征，建议就事论事核实客观证据。`;
  } else if (riskLevel === 'low') {
    summary = `ℹ️ 轻微提示（评分 ${normalizedScore}）：存在偶发夸张表达，暂未构成系统性话术收敛。`;
  }

  return {
    isManipulative,
    score: normalizedScore,
    riskLevel,
    summary,
    findings,
    fourIronRules: getFourIronRules(riskLevel),
  };
}

function getFourIronRules(level: 'safe' | 'low' | 'medium' | 'high' | 'critical'): {
  informed: string;
  tagged: string;
  awakenable: string;
  verifiable: string;
} {
  if (level === 'safe') {
    return {
      informed: '认知清醒：对沟通中的诉求保持感知。',
      tagged: '概念透明：区分事实叙述与情绪修辞。',
      awakenable: '进退自如：沟通节奏双向对称。',
      verifiable: '证据扎实：所有方案皆有据可查。',
    };
  }

  return {
    informed: '知情（Informed）：清醒意识到对方正在使用话术压缩你的审视空间，觉察自己的焦虑是否被刻意煽动。',
    tagged: '标记（Tagged）：在内心给对方的话术贴上标签（如「紧迫感制造」「道德绑架」「沉没成本陷阱」），不让修辞滑入潜意识。',
    awakenable: '可醒（Awakenable）：无论对方如何渲染严重性，坚决守住随时退出、终止交谈、推迟决策的绝对权利。',
    verifiable: '必验（Verifiable）：拒绝口头画饼与权威背书，所有核心数据、代价与承诺必须通过第三方证据独立验证。',
  };
}
