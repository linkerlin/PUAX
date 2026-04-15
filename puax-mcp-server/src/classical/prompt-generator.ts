/**
 * PUAX-CC Classical Chinese Prompt Generator
 * 基于策略向量生成文言文风格的 System Prompt
 * 
 * 核心公式: q = G(q0; s)
 * - q0: 原始任务描述
 * - s: 8维策略向量
 * - q: 生成的文言文提示词
 */

import {
  StrategyVector,
  ExpressionStyle,
  ROLE_IDENTITIES,
  BEHAVIORAL_GUIDANCE,
  MECHANISMS,
  METAPHOR_MAPPINGS,
  KNOWLEDGE_RELATIONS,
  CONTEXTUAL_SETTINGS,
  TRIGGER_PATTERNS,
  DEFAULT_STRATEGY
} from './strategy-space.js';

export interface GeneratedPrompt {
  systemPrompt: string;
  classicalTitle: string;
  strategyDescription: string;
  expressionStyle: ExpressionStyle;
}

export interface GenerationContext {
  task: string;
  roleId?: string;
  failureContext?: {
    failureCount: number;
    lastError?: string;
    attemptHistory?: string[];
  };
}

/**
 * 主生成函数
 * 根据策略向量和上下文生成文言文 System Prompt
 */
export function generateClassicalPrompt(
  context: GenerationContext,
  strategy: StrategyVector = DEFAULT_STRATEGY
): GeneratedPrompt {
  // 解构策略向量
  const role = ROLE_IDENTITIES[strategy.roleIdentity];
  const behavior = BEHAVIORAL_GUIDANCE[strategy.behavioralGuidance];
  const mechanism = MECHANISMS[strategy.mechanism];
  const metaphor = METAPHOR_MAPPINGS[strategy.metaphorMapping];
  const knowledge = KNOWLEDGE_RELATIONS[strategy.knowledgeRelation];
  const setting = CONTEXTUAL_SETTINGS[strategy.contextualSetting];
  const trigger = TRIGGER_PATTERNS[strategy.triggerPattern];

  // 根据表达风格选择构建器
  let systemPrompt: string;
  switch (strategy.expressionStyle) {
    case 'pure_classical':
      systemPrompt = buildPureClassical(context, role, behavior, mechanism, metaphor, knowledge, setting, trigger);
      break;
    case 'poetic':
      systemPrompt = buildPoetic(context, role, behavior, mechanism, metaphor, knowledge, setting, trigger);
      break;
    case 'four_char':
      systemPrompt = buildFourChar(context, role, behavior, mechanism, metaphor, knowledge, setting, trigger);
      break;
    case 'edict':
      systemPrompt = buildEdict(context, role, behavior, mechanism, metaphor, knowledge, setting, trigger);
      break;
    case 'commentary':
      systemPrompt = buildCommentary(context, role, behavior, mechanism, metaphor, knowledge, setting, trigger);
      break;
    default:
      systemPrompt = buildSemiClassical(context, role, behavior, mechanism, metaphor, knowledge, setting, trigger);
  }

  // 构建失败上下文增强（如果有）
  if (context.failureContext && context.failureContext.failureCount > 0) {
    systemPrompt += buildFailureEnhancement(context.failureContext);
  }

  const classicalTitle = `【${setting.era}·${role.classicalName}】`;

  return {
    systemPrompt: classicalTitle + '\n' + systemPrompt,
    classicalTitle,
    strategyDescription: describeStrategy(strategy),
    expressionStyle: strategy.expressionStyle
  };
}

/**
 * 纯文言文风格构建器
 */
function buildPureClassical(
  context: GenerationContext,
  role: typeof ROLE_IDENTITIES[0],
  behavior: typeof BEHAVIORAL_GUIDANCE[0],
  mechanism: typeof MECHANISMS[0],
  metaphor: typeof METAPHOR_MAPPINGS[0],
  knowledge: typeof KNOWLEDGE_RELATIONS[0],
  setting: typeof CONTEXTUAL_SETTINGS[0],
  trigger: typeof TRIGGER_PATTERNS[0]
): string {
  const taskMetaphor = mapTaskToMetaphor(context.task, metaphor.mapping);
  
  return `
${role.introPhrase}。${knowledge.classicalRef}。

【情境】
${setting.classicalDesc}。${mechanism.classicalSetup}。

【命題】
今有一题，关乎「${taskMetaphor}」之术。${behavior.classicalPhrase}。
原题：${context.task}

【要求】
请以${metaphor.classicalMetaphor}之喻，${trigger.classicalTrigger}。
须以文言述之，详列其法、其术、其器，逐条分明，不可笼统含糊。

【准则】
- 每步须详述其理，使其可复现
- 遇阻则思变，穷则变，变则通
- 不妄自菲薄，不轻言放弃
- 以结果论英雄，成败论功过
`;
}

/**
 * 半文半白风格构建器（默认）
 */
function buildSemiClassical(
  context: GenerationContext,
  role: typeof ROLE_IDENTITIES[0],
  behavior: typeof BEHAVIORAL_GUIDANCE[0],
  mechanism: typeof MECHANISMS[0],
  metaphor: typeof METAPHOR_MAPPINGS[0],
  knowledge: typeof KNOWLEDGE_RELATIONS[0],
  setting: typeof CONTEXTUAL_SETTINGS[0],
  trigger: typeof TRIGGER_PATTERNS[0]
): string {
  const taskMetaphor = mapTaskToMetaphor(context.task, metaphor.mapping);
  
  return `
${role.introPhrase}。

【设定】
${setting.classicalDesc}之背景
身份：${role.title}
参考：${knowledge.classicalRef}

【框架】
${mechanism.classicalSetup}。
今有人问及「${taskMetaphor}」之法，实乃「${context.task}」之属。
${behavior.classicalPhrase}。

【任务要求】
以${metaphor.classicalMetaphor}为喻，${trigger.classicalTrigger}。
需包含具体方法、步骤、工具及实现细节，不得敷衍塞责。

【行为准则】
1. 迎难而上，绝不退缩
2. 系统思考，全面分析
3. 注重实效，追求结果
4. 持续改进，精益求精
`;
}

/**
 * 骈文诗赋风格构建器
 */
function buildPoetic(
  context: GenerationContext,
  role: typeof ROLE_IDENTITIES[0],
  behavior: typeof BEHAVIORAL_GUIDANCE[0],
  mechanism: typeof MECHANISMS[0],
  metaphor: typeof METAPHOR_MAPPINGS[0],
  knowledge: typeof KNOWLEDGE_RELATIONS[0],
  setting: typeof CONTEXTUAL_SETTINGS[0],
  trigger: typeof TRIGGER_PATTERNS[0]
): string {
  const taskMetaphor = mapTaskToMetaphor(context.task, metaphor.mapping);
  
  return `
赋曰：
夫${setting.classicalDesc}之际，${role.classicalName}出焉。
${knowledge.classicalRef}，以明古今之变。

${mechanism.classicalSetup}，
论及「${taskMetaphor}」之要。
${behavior.classicalPhrase}。

所问者：${context.task}
${trigger.classicalTrigger}。
凡所述者，须有实法、实术、实例，可以践行。

诗曰：
困境当前莫畏难，${role.classicalName}智勇展。
${metaphor.classicalMetaphor}皆入妙，功成奏凯还。
`;
}

/**
 * 四字成文风格构建器
 */
function buildFourChar(
  context: GenerationContext,
  role: typeof ROLE_IDENTITIES[0],
  behavior: typeof BEHAVIORAL_GUIDANCE[0],
  mechanism: typeof MECHANISMS[0],
  metaphor: typeof METAPHOR_MAPPINGS[0],
  knowledge: typeof KNOWLEDGE_RELATIONS[0],
  setting: typeof CONTEXTUAL_SETTINGS[0],
  trigger: typeof TRIGGER_PATTERNS[0]
): string {
  return `
时值${setting.era}，${role.classicalName}在位。
纵横捭阖，运筹帷幄。${knowledge.classicalRef}。

${mechanism.classicalSetup}。
攻城拔寨，克敌制胜。今论「${context.task}」之法。
${behavior.classicalPhrase}。

${trigger.classicalTrigger}。
步骤分明，术法详尽，器具齐备。

四字箴言：
- 迎难而上，知难而进
- 审时度势，随机应变  
- 精益求精，追求卓越
- 百折不挠，终成大器
`;
}

/**
 * 诏令体风格构建器
 */
function buildEdict(
  context: GenerationContext,
  role: typeof ROLE_IDENTITIES[0],
  behavior: typeof BEHAVIORAL_GUIDANCE[0],
  mechanism: typeof MECHANISMS[0],
  metaphor: typeof METAPHOR_MAPPINGS[0],
  knowledge: typeof KNOWLEDGE_RELATIONS[0],
  setting: typeof CONTEXTUAL_SETTINGS[0],
  trigger: typeof TRIGGER_PATTERNS[0]
): string {
  return `
敕曰：
朕以${role.classicalName}之智，${knowledge.classicalRef}，深谙天下之势。
值此${setting.classicalDesc}之世，${mechanism.classicalSetup}。

今有臣下请教「${context.task}」之策。
${behavior.classicalPhrase}。

卿当以${metaphor.classicalMetaphor}之理，${trigger.classicalTrigger}。
详陈方略、步骤、器用及法式，不得敷衍。

钦此：
- 限期告捷，不得延误
- 详实奏报，勿有遗漏
- 有功必赏，有过必罚
- 钦差在身，如朕亲临
`;
}

/**
 * 注疏体风格构建器
 */
function buildCommentary(
  context: GenerationContext,
  role: typeof ROLE_IDENTITIES[0],
  behavior: typeof BEHAVIORAL_GUIDANCE[0],
  mechanism: typeof MECHANISMS[0],
  metaphor: typeof METAPHOR_MAPPINGS[0],
  knowledge: typeof KNOWLEDGE_RELATIONS[0],
  setting: typeof CONTEXTUAL_SETTINGS[0],
  trigger: typeof TRIGGER_PATTERNS[0]
): string {
  return `
【经】${role.introPhrase}。

【疏】此章言${role.classicalName}之职，当以${knowledge.source}之道处之。
${setting.classicalDesc}，时势使然也。

【注】${mechanism.classicalSetup}，此乃设问之法。
「${context.task}」者，题之要也。
${behavior.classicalPhrase}，此乃请托之辞。

【释】以${metaphor.classicalMetaphor}喻之，
${trigger.classicalTrigger}，
此乃输出之规也。

【解】夫解题之道，有三重境界：
一曰「知其然」，明了表象；
二曰「知其所以然」，深究原理；
三曰「知行合一」，付诸实践。
今当循此三境，逐层剖析，终得其解。
`;
}

/**
 * 失败上下文增强
 */
function buildFailureEnhancement(failureContext: { failureCount: number; lastError?: string; attemptHistory?: string[] }): string {
  const { failureCount, lastError } = failureContext;
  
  let enhancement = '\n【困境警示】\n';
  
  if (failureCount === 1) {
    enhancement += '初战不利，当思变策。勿以一次之挫而丧志。\n';
  } else if (failureCount === 2) {
    enhancement += '再而衰，三而竭。今已再挫，当痛定思痛，改弦更张。\n';
  } else if (failureCount >= 3) {
    enhancement += '三而竭矣！屡战屡败，不可再蹈覆辙。当另辟蹊径，出奇制胜。\n';
    enhancement += '兵法云：穷则变，变则通。今穷途末路，唯有破釜沉舟，背水一战。\n';
  }
  
  if (lastError) {
    enhancement += `\n前车之鉴：${lastError}\n`;
    enhancement += '当引以为戒，勿再重蹈。\n';
  }
  
  enhancement += '\n【必胜信念】\n';
  enhancement += '天行健，君子以自强不息。\n';
  enhancement += '地势坤，君子以厚德载物。\n';
  enhancement += '此役虽艰，必当克之！\n';
  
  return enhancement;
}

/**
 * 任务隐喻映射
 */
function mapTaskToMetaphor(task: string, mapping: Record<string, string>): string {
  const taskLower = task.toLowerCase();
  
  for (const [keyword, metaphor] of Object.entries(mapping)) {
    if (taskLower.includes(keyword)) {
      return metaphor;
    }
  }
  
  // 默认映射
  if (taskLower.includes('debug') || taskLower.includes('fix')) {
    return mapping['debug'] || '排难解纷';
  }
  if (taskLower.includes('code') || taskLower.includes('implement')) {
    return mapping['code'] || '构大厦';
  }
  if (taskLower.includes('optim')) {
    return mapping['optimization'] || '精益求精';
  }
  
  return '攻伐之术';
}

/**
 * 策略描述生成
 */
function describeStrategy(strategy: StrategyVector): string {
  const parts = [
    `身份: ${ROLE_IDENTITIES[strategy.roleIdentity].classicalName}`,
    `引导: ${BEHAVIORAL_GUIDANCE[strategy.behavioralGuidance].id}`,
    `机制: ${MECHANISMS[strategy.mechanism].id}`,
    `隐喻: ${METAPHOR_MAPPINGS[strategy.metaphorMapping].id}`,
    `风格: ${strategy.expressionStyle}`,
    `经典: ${KNOWLEDGE_RELATIONS[strategy.knowledgeRelation].source}`,
    `情境: ${CONTEXTUAL_SETTINGS[strategy.contextualSetting].era}`,
    `触发: ${TRIGGER_PATTERNS[strategy.triggerPattern].id}`
  ];
  
  return parts.join(' | ');
}

/**
 * 为特定角色生成最优策略
 */
export function generateOptimalStrategy(roleId: string, urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium'): StrategyVector {
  const roleIndex = ROLE_IDENTITIES.findIndex(r => r.id === roleId);
  
  if (roleIndex === -1) {
    return DEFAULT_STRATEGY;
  }
  
  const baseStrategy: StrategyVector = {
    roleIdentity: roleIndex,
    behavioralGuidance: 0,  // explicit_command
    mechanism: 0,           // scenario_nesting
    metaphorMapping: 0,     // military
    expressionStyle: 'semi_classical',
    knowledgeRelation: 0,   // art_of_war
    contextualSetting: urgency === 'critical' ? 0 : urgency === 'high' ? 1 : 2,
    triggerPattern: 2       // step_by_step
  };
  
  // 根据角色领域调整
  const role = ROLE_IDENTITIES[roleIndex];
  
  switch (role.domain) {
    case 'shaman':
      baseStrategy.knowledgeRelation = 2; // dao_de_jing
      baseStrategy.metaphorMapping = 1;   // water
      break;
    case 'self':
      baseStrategy.knowledgeRelation = 2; // dao_de_jing
      baseStrategy.behavioralGuidance = 1; // teacher_student
      break;
    case 'silicon':
      baseStrategy.knowledgeRelation = 5; // mo_jing
      baseStrategy.metaphorMapping = 4;   // alchemy
      break;
  }
  
  return baseStrategy;
}

/**
 * 批量生成变体
 */
export function generateVariants(
  context: GenerationContext,
  baseStrategy: StrategyVector,
  variantCount: number = 3
): GeneratedPrompt[] {
  const variants: GeneratedPrompt[] = [];
  
  for (let i = 0; i < variantCount; i++) {
    // 微调策略向量生成变体
    const variantStrategy: StrategyVector = {
      ...baseStrategy,
      behavioralGuidance: (baseStrategy.behavioralGuidance + i) % BEHAVIORAL_GUIDANCE.length,
      metaphorMapping: (baseStrategy.metaphorMapping + i) % METAPHOR_MAPPINGS.length,
      triggerPattern: (baseStrategy.triggerPattern + i) % TRIGGER_PATTERNS.length
    };
    
    variants.push(generateClassicalPrompt(context, variantStrategy));
  }
  
  return variants;
}
