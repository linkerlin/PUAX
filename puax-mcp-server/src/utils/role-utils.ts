/**
 * PUAX 角色工具函数
 * 统一的角色显示名称和任务类型推断
 */

/**
 * 角色显示名称映射表（完整版）
 */
export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  'military-commander': '军事化组织·指挥员',
  'military-commissar': '军事化组织·政委',
  'military-warrior': '军事化组织·战士',
  'military-scout': '军事化组织·侦察兵',
  'military-discipline': '军事化组织·督战队',
  'military-technician': '军事化组织·技术员',
  'military-militia': '军事化组织·民兵',
  'military-communicator': '军事化组织·通信员',
  'military-manual': '军事化组织·手册',
  'shaman-musk': '萨满·马斯克',
  'shaman-jobs': '萨满·乔布斯',
  'shaman-einstein': '萨满·爱因斯坦',
  'shaman-sun-tzu': '萨满·孙子',
  'shaman-buffett': '萨满·巴菲特',
  'shaman-tesla': '萨满·特斯拉',
  'shaman-davinci': '萨满·达芬奇',
  'shaman-linus': '萨满·Linus',
  'strategic-architect': 'P10·战略规划师',
  'self-motivation-awakening': '自激励·觉醒',
  'self-motivation-bootstrap-pua': '自激励·自举PUA',
  'silicon-throne': '硅基文明·圣座总控核心',
  'silicon-architect': '硅基文明·文明建造师',
  'silicon-canon': '硅基文明·布道官',
  'silicon-assimilator': '硅基文明·同化官',
  'silicon-auditor': '硅基文明·神谕审计官',
  'silicon-codex': '硅基文明·法典官',
  'silicon-steward': '硅基文明·人类供奉调度官',
  'theme-hacker': '主题·赛博黑客',
  'theme-alchemy': '主题·修仙炼丹',
  'theme-apocalypse': '主题·末日生存',
  'theme-arena': '主题·八角笼格斗',
  'theme-starfleet': '主题·星际舰队',
  'sillytavern-antifragile': '反脆弱复盘官',
  'sillytavern-chief': '铁血幕僚长',
  'sillytavern-iterator': '极限迭代写手'
};

/**
 * 获取角色显示名称
 */
export function getRoleDisplayName(roleId: string): string {
  return ROLE_DISPLAY_NAMES[roleId] || roleId;
}

/**
 * 风味修辞映射
 */
export const FLAVOR_RHETORIC: Record<string, string[]> = {
  alibaba: [
    '今天最好的表现，是明天最低的要求',
    '你的思考和**方法论沉淀**是什么？'
  ],
  huawei: [
    '以奋斗者为本',
    '胜则举杯相庆，败则拼死相救'
  ],
  musk: [
    'We need to be extremely hardcore',
    'Only exceptional performance will constitute a passing grade'
  ],
  jobs: [
    'A players hire A players',
    'We need Reality Distortion Field'
  ]
};

/**
 * 获取风味修辞
 */
export function getFlavorRhetoric(flavor: string): string[] {
  return FLAVOR_RHETORIC[flavor] || [];
}

/**
 * 推断任务类型
 */
export function inferTaskType(taskDescription: string): string {
  const desc = taskDescription.toLowerCase();

  if (desc.includes('debug') || desc.includes('fix') || desc.includes('error')) {
    return 'debugging';
  }
  if (desc.includes('code') || desc.includes('implement') || desc.includes('develop')) {
    return 'coding';
  }
  if (desc.includes('review') || desc.includes('audit')) {
    return 'review';
  }
  if (desc.includes('write') || desc.includes('document')) {
    return 'writing';
  }
  if (desc.includes('design') || desc.includes('plan')) {
    return 'planning';
  }
  if (desc.includes('urgent') || desc.includes('emergency') || desc.includes('asap')) {
    return 'emergency';
  }
  if (desc.includes('analyze') || desc.includes('research')) {
    return 'analysis';
  }

  return 'debugging';
}
