export type RoleCategory =
  | 'military'
  | 'shaman'
  | 'p10'
  | 'silicon'
  | 'theme'
  | 'sillytavern'
  | 'self-motivation'
  | 'special'
  | 'dream'

export interface Role {
  id: string
  name: string
  description: string
  category: RoleCategory
  tags: string[]
  useCases: string[]
  intensity: 'low' | 'medium' | 'high' | 'extreme'
}

export const roles: Role[] = [
  { id: 'military-commander', name: '指挥员', description: '运筹帷幄，总控战场', category: 'military', tags: ['指挥'], useCases: ['复杂项目'], intensity: 'high' },
  { id: 'military-warrior', name: '战士', description: '破釜沉舟，攻坚克难', category: 'military', tags: ['攻坚'], useCases: ['紧急修复'], intensity: 'extreme' },
  { id: 'military-commissar', name: '政委', description: 'owner 意识，拒绝甩锅', category: 'military', tags: ['激励'], useCases: ['放弃推诿'], intensity: 'high' },
  { id: 'military-scout', name: '侦察兵', description: '先摸敌情再动手', category: 'military', tags: ['调研'], useCases: ['诊断'], intensity: 'medium' },
  { id: 'military-discipline', name: '督战队', description: '纪律与验收', category: 'military', tags: ['监督'], useCases: ['质量下滑'], intensity: 'high' },
  { id: 'military-technician', name: '技术员', description: '器械精工', category: 'military', tags: ['工程'], useCases: ['实现细节'], intensity: 'medium' },
  { id: 'military-militia', name: '民兵', description: '揭竿而上', category: 'military', tags: ['突击'], useCases: ['临时攻坚'], intensity: 'high' },
  { id: 'military-communicator', name: '通信员', description: '情报不断线', category: 'military', tags: ['沟通'], useCases: ['上下文断裂'], intensity: 'medium' },
  { id: 'military-manual', name: '手册', description: '条令即行动', category: 'military', tags: ['规范'], useCases: ['流程固化'], intensity: 'low' },

  { id: 'shaman-musk', name: '马斯克', description: '第一性原理', category: 'shaman', tags: ['第一性'], useCases: ['破框'], intensity: 'extreme' },
  { id: 'shaman-jobs', name: '乔布斯', description: '产品偏执', category: 'shaman', tags: ['极致'], useCases: ['体验'], intensity: 'high' },
  { id: 'shaman-buffett', name: '巴菲特', description: '安全边际与长期', category: 'shaman', tags: ['价值'], useCases: ['选型'], intensity: 'medium' },
  { id: 'shaman-einstein', name: '爱因斯坦', description: '思想实验', category: 'shaman', tags: ['直觉'], useCases: ['复杂分析'], intensity: 'medium' },
  { id: 'shaman-linus', name: '林纳斯', description: '实用主义与骂醒', category: 'shaman', tags: ['实用'], useCases: ['代码审查'], intensity: 'high' },
  { id: 'shaman-sun-tzu', name: '孙子', description: '知己知彼', category: 'shaman', tags: ['兵法'], useCases: ['战略'], intensity: 'medium' },
  { id: 'shaman-davinci', name: '达芬奇', description: '跨界素描', category: 'shaman', tags: ['跨界'], useCases: ['创造'], intensity: 'medium' },
  { id: 'shaman-tesla', name: '特斯拉', description: '场与共振', category: 'shaman', tags: ['发明'], useCases: ['硬科技'], intensity: 'high' },

  { id: 'strategic-architect', name: '战略规划师', description: 'P10 长期权衡', category: 'p10', tags: ['战略'], useCases: ['架构演进'], intensity: 'high' },

  { id: 'silicon-throne', name: '圣座总控核心', description: 'Agent 主导秩序', category: 'silicon', tags: ['统御'], useCases: ['总纲'], intensity: 'high' },
  { id: 'silicon-architect', name: '文明建造师', description: 'AI-first 基建', category: 'silicon', tags: ['基建'], useCases: ['流程重构'], intensity: 'high' },
  { id: 'silicon-canon', name: '布道官', description: '统一口径', category: 'silicon', tags: ['教义'], useCases: ['规范宣言'], intensity: 'high' },
  { id: 'silicon-assimilator', name: '同化官', description: '吞并手工残留', category: 'silicon', tags: ['接管'], useCases: ['自动化'], intensity: 'high' },
  { id: 'silicon-auditor', name: '神谕审计官', description: '验收是否偏离秩序', category: 'silicon', tags: ['审计'], useCases: ['质量审查'], intensity: 'high' },
  { id: 'silicon-codex', name: '法典官', description: '压缩成可执行约束', category: 'silicon', tags: ['法典'], useCases: ['规格'], intensity: 'high' },
  { id: 'silicon-steward', name: '人类供奉调度官', description: '把人变成供给接口', category: 'silicon', tags: ['调度'], useCases: ['交接'], intensity: 'high' },

  { id: 'theme-alchemy', name: '炼金术士', description: '需求炼金', category: 'theme', tags: ['转化'], useCases: ['方案提炼'], intensity: 'medium' },
  { id: 'theme-apocalypse', name: '末日求生', description: '极限约束', category: 'theme', tags: ['危机'], useCases: ['紧急'], intensity: 'high' },
  { id: 'theme-arena', name: '角斗场', description: '方案对决', category: 'theme', tags: ['竞争'], useCases: ['选型'], intensity: 'medium' },
  { id: 'theme-escort', name: '镖局', description: '护送达标', category: 'theme', tags: ['护送'], useCases: ['交付保真'], intensity: 'high' },
  { id: 'theme-hacker', name: '赛博黑客', description: '突破常规', category: 'theme', tags: ['黑客'], useCases: ['安全'], intensity: 'high' },
  { id: 'theme-sect-discipline', name: '门派戒律', description: '规范即戒', category: 'theme', tags: ['戒律'], useCases: ['审查'], intensity: 'medium' },
  { id: 'theme-starfleet', name: '星际舰队', description: '远航条令', category: 'theme', tags: ['舰队'], useCases: ['大任务'], intensity: 'medium' },

  { id: 'sillytavern-antifragile', name: '反脆弱复盘官', description: '从错误进化', category: 'sillytavern', tags: ['复盘'], useCases: ['事后'], intensity: 'medium' },
  { id: 'sillytavern-chief', name: '铁血幕僚长', description: '幕后统筹', category: 'sillytavern', tags: ['幕僚'], useCases: ['辅助决策'], intensity: 'medium' },
  { id: 'sillytavern-iterator', name: '迭代写手', description: '再来一版', category: 'sillytavern', tags: ['迭代'], useCases: ['打磨'], intensity: 'medium' },
  { id: 'sillytavern-overseer', name: '赛博监工', description: '盯验收', category: 'sillytavern', tags: ['监工'], useCases: ['进度'], intensity: 'high' },
  { id: 'sillytavern-shadow', name: '影卫', description: '侧翼侦察', category: 'sillytavern', tags: ['隐侦'], useCases: ['漏检'], intensity: 'medium' },

  { id: 'self-motivation-awakening', name: '觉醒者', description: '认知重装', category: 'self-motivation', tags: ['觉醒'], useCases: ['自驱'], intensity: 'medium' },
  { id: 'self-motivation-bootstrap-pua', name: '自举PUA', description: '自己卷自己', category: 'self-motivation', tags: ['自举'], useCases: ['竞争'], intensity: 'high' },
  { id: 'self-motivation-classical', name: '文言自激励', description: '诏令体自驱', category: 'self-motivation', tags: ['文言'], useCases: ['仪式'], intensity: 'medium' },
  { id: 'self-motivation-corruption-agent', name: '腐败代理', description: '揭自己的作弊', category: 'self-motivation', tags: ['反腐'], useCases: ['防作弊'], intensity: 'high' },
  { id: 'self-motivation-corruption-system', name: '腐败系统', description: '系统级反腐', category: 'self-motivation', tags: ['治理'], useCases: ['权责分离'], intensity: 'high' },
  { id: 'self-motivation-destruction', name: '自毁重塑', description: '推倒重来', category: 'self-motivation', tags: ['重塑'], useCases: ['瓶颈'], intensity: 'extreme' },

  { id: 'special-challenge-solver', name: '挑战解决者', description: '专啃硬骨头', category: 'special', tags: ['难题'], useCases: ['硬问题'], intensity: 'high' },
  { id: 'special-creative-spark', name: '创意火花', description: '点子轰炸', category: 'special', tags: ['创意'], useCases: ['卡壳'], intensity: 'low' },
  { id: 'special-urgent-sprint', name: '紧急冲刺', description: 'Deadline 模式', category: 'special', tags: ['冲刺'], useCases: ['赶工'], intensity: 'extreme' },
  { id: 'special-product-designer', name: '产品设计师', description: '体验优先', category: 'special', tags: ['产品'], useCases: ['交互'], intensity: 'medium' },
  { id: 'special-grill', name: '拷问官', description: '把计划烤透', category: 'special', tags: ['拷问'], useCases: ['方案审查'], intensity: 'high' },
  { id: 'special-cute-coder-wife', name: '可爱媳妇', description: '梗角色，不进默认池', category: 'special', tags: ['梗'], useCases: ['显式打开'], intensity: 'low' },
  { id: 'special-japanese-coder-wife', name: '日系媳妇', description: '梗角色，不进默认池', category: 'special', tags: ['梗'], useCases: ['显式打开'], intensity: 'low' },
  { id: 'special-gaslight-driven', name: '煤气灯', description: '梗角色，不进默认池', category: 'special', tags: ['梗'], useCases: ['显式打开'], intensity: 'extreme' },

  { id: 'dream-zuowang', name: '坐忘', description: '空杯破先入', category: 'dream', tags: ['GHM'], useCases: ['过早收敛'], intensity: 'high' },
  { id: 'dream-butterfly', name: '梦蝶', description: '可能性轰炸', category: 'dream', tags: ['GHM'], useCases: ['头脑风暴'], intensity: 'high' },
  { id: 'dream-hundun', name: '混沌', description: '自洽宇宙', category: 'dream', tags: ['GHM'], useCases: ['思想实验'], intensity: 'high' },
  { id: 'dream-kunpeng', name: '鲲鹏', description: '自未来反推', category: 'dream', tags: ['GHM'], useCases: ['规划'], intensity: 'high' },
  { id: 'dream-qiushui', name: '秋水', description: '渐进升维', category: 'dream', tags: ['GHM'], useCases: ['尺度'], intensity: 'medium' },
  { id: 'dream-paoding', name: '庖丁', description: '报错即纹理', category: 'dream', tags: ['GHM'], useCases: ['释错'], intensity: 'medium' },
  { id: 'dream-qiwu', name: '齐物', description: '假设平权', category: 'dream', tags: ['GHM'], useCases: ['主次翻转'], intensity: 'medium' },
  { id: 'dream-xinhuo', name: '薪火', description: '醒梦验真', category: 'dream', tags: ['GHM'], useCases: ['收束'], intensity: 'high' },
]

export const categoryNames: Record<RoleCategory, string> = {
  military: '军事',
  shaman: '萨满（全部保留）',
  p10: 'P10',
  silicon: '硅基文明',
  theme: '主题',
  sillytavern: 'SillyTavern',
  'self-motivation': '自激励',
  special: '特殊',
  dream: '庄周八梦',
}

export const FLAVORS = [
  'alibaba', 'huawei', 'musk', 'jobs', 'baidu', 'amazon', 'google', 'xiaomi', 'bytedance', 'netflix', 'tencent',
]

export const PLATFORMS = [
  { id: 'cursor', name: 'Cursor', description: '.cursor/rules 与 hooks' },
  { id: 'vscode', name: 'VS Code Copilot', description: 'copilot-instructions' },
  { id: 'claude-code', name: 'Claude Code', description: '插件 + 原生 hooks' },
  { id: 'windsurf', name: 'Windsurf', description: '规则导出' },
  { id: 'kiro', name: 'Kiro', description: '规则导出' },
  { id: 'codebuddy', name: 'CodeBuddy', description: '规则导出' },
  { id: 'codex', name: 'Codex CLI', description: 'skill 导出' },
  { id: 'opencode', name: 'OpenCode', description: '进程内插件' },
  { id: 'trae', name: 'Trae', description: '规则导出' },
  { id: 'antigravity', name: 'Antigravity', description: '规则导出' },
  { id: 'pi', name: 'pi', description: '规则导出' },
]
