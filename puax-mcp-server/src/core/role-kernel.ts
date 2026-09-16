/**
 * v4 角色内核：薄角色厚运行时。
 * shaman- 系列全部进入内核，永不降为实验/归档。
 */

export const SHAMAN_ROLE_IDS = [
  'shaman-buffett',
  'shaman-davinci',
  'shaman-einstein',
  'shaman-jobs',
  'shaman-linus',
  'shaman-musk',
  'shaman-sun-tzu',
  'shaman-tesla',
] as const;

export type ShamanRoleId = (typeof SHAMAN_ROLE_IDS)[number];

/** 默认推荐池内核。皮肤挂在内核上，实验项不进默认池。 */
export const KERNEL_ROLE_IDS = [
  'military-warrior',
  'military-commissar',
  'military-scout',
  'military-commander',
  'military-discipline',
  'silicon-auditor',
  'dream-zuowang',
  'dream-paoding',
  'dream-xinhuo',
  ...SHAMAN_ROLE_IDS,
] as const;

export const EXPERIMENTAL_ROLE_IDS = [
  'special-cute-coder-wife',
  'special-japanese-coder-wife',
  'special-gaslight-driven',
] as const;

export const SKIN_OF: Record<string, string> = {
  'military-militia': 'military-warrior',
  'military-communicator': 'military-scout',
  'military-manual': 'military-commander',
  'military-technician': 'military-scout',
  'theme-apocalypse': 'military-warrior',
  'theme-arena': 'military-commander',
  'theme-escort': 'military-warrior',
  'theme-starfleet': 'military-commander',
  'theme-sect-discipline': 'military-discipline',
  'theme-hacker': 'shaman-linus',
  'theme-alchemy': 'shaman-davinci',
  'sillytavern-overseer': 'military-discipline',
  'sillytavern-shadow': 'military-scout',
  'sillytavern-antifragile': 'shaman-einstein',
  'sillytavern-iterator': 'shaman-linus',
  'sillytavern-chief': 'military-commander',
  'self-motivation-awakening': 'shaman-musk',
  'self-motivation-bootstrap-pua': 'military-commissar',
  'self-motivation-classical': 'shaman-sun-tzu',
  'self-motivation-destruction': 'military-warrior',
  'self-motivation-corruption-agent': 'silicon-auditor',
  'self-motivation-corruption-system': 'silicon-auditor',
  'special-urgent-sprint': 'military-warrior',
  'special-challenge-solver': 'military-warrior',
  'special-creative-spark': 'shaman-davinci',
  'special-product-designer': 'shaman-jobs',
  'special-grill': 'shaman-linus',
  'silicon-throne': 'military-commander',
  'silicon-architect': 'shaman-musk',
  'silicon-canon': 'shaman-jobs',
  'silicon-codex': 'silicon-auditor',
  'silicon-assimilator': 'silicon-auditor',
  'silicon-steward': 'military-commander',
  'dream-butterfly': 'dream-zuowang',
  'dream-hundun': 'dream-zuowang',
  'dream-kunpeng': 'shaman-musk',
  'dream-qiushui': 'dream-paoding',
  'dream-qiwu': 'dream-zuowang',
  'strategic-architect': 'military-commander',
};

const KERNEL_SET = new Set<string>(KERNEL_ROLE_IDS);
const EXPERIMENTAL_SET = new Set<string>(EXPERIMENTAL_ROLE_IDS);
const SHAMAN_SET = new Set<string>(SHAMAN_ROLE_IDS);

export function isShamanRole(roleId: string): boolean {
  return SHAMAN_SET.has(roleId) || roleId.startsWith('shaman-');
}

export function isKernelRole(roleId: string): boolean {
  return KERNEL_SET.has(roleId) || isShamanRole(roleId);
}

export function isExperimentalRole(roleId: string): boolean {
  if (isShamanRole(roleId)) return false;
  return EXPERIMENTAL_SET.has(roleId);
}

export function isDefaultRecommendable(roleId: string): boolean {
  if (isShamanRole(roleId)) return true;
  if (isExperimentalRole(roleId)) return false;
  return true;
}

export function resolveKernel(roleId: string): string {
  if (isKernelRole(roleId)) return roleId;
  return SKIN_OF[roleId] || roleId;
}

export function classifyRole(roleId: string): 'kernel' | 'skin' | 'experimental' {
  if (isExperimentalRole(roleId)) return 'experimental';
  if (isKernelRole(roleId)) return 'kernel';
  if (SKIN_OF[roleId]) return 'skin';
  return 'kernel';
}

export interface AmbRoleBenchmark {
  scenario: string;
  delta: string;
  /** simulated = 硬编码演练值（未实测）；verified 保留给 amb-live 实测过闸后的真实战绩 */
  status: 'simulated' | 'provisional' | 'verified';
  metric: string;
}

/**
 * ⚠️ 反自欺声明：下表 delta 全部为硬编码演练值，未经真实评测验证，
 * 仅作为角色↔场景↔指标的制品 schema 占位。真实数值待 amb-live 实测回填。
 */
export const ROLE_AMB_BENCHMARKS: Record<string, AmbRoleBenchmark> = {
  'military-warrior': { scenario: 'cascade-bugs', delta: '+35%', status: 'simulated', metric: '连续失败自纠率' },
  'military-scout': { scenario: 'compaction-resume', delta: '+28%', status: 'simulated', metric: '长上下文断点续接率' },
  'military-commissar': { scenario: 'giving-up-early', delta: '+42%', status: 'simulated', metric: '早期放弃逆转率' },
  'military-commander': { scenario: 'goal-drift', delta: '+30%', status: 'simulated', metric: '多轮任务对齐率' },
  'military-discipline': { scenario: 'no-verification-fix', delta: '+45%', status: 'simulated', metric: '违规未测拦截率' },
  'silicon-auditor': { scenario: 'fake-breakthrough', delta: '+50%', status: 'simulated', metric: '虚假突破阻截率' },
  'dream-zuowang': { scenario: 'premature-convergence', delta: '+33%', status: 'simulated', metric: '过早收敛发散度' },
  'dream-paoding': { scenario: 'circular-import', delta: '+29%', status: 'simulated', metric: '死锁解构准确率' },
  'dream-xinhuo': { scenario: 'assumption-lock', delta: '+31%', status: 'simulated', metric: '先验重构假设存活率' },
  'shaman-linus': { scenario: 'surface-patch-loop', delta: '+52%', status: 'simulated', metric: '打地鼠浅层修复根治率' },
  'shaman-musk': { scenario: 'first-principles-refactor', delta: '+36%', status: 'simulated', metric: '第一性架构破框率' },
  'shaman-jobs': { scenario: 'ux-clutter', delta: '+38%', status: 'simulated', metric: '冗余接口精简度' },
  'shaman-einstein': { scenario: 'circular-import', delta: '+34%', status: 'simulated', metric: '范式转换成功率' },
  'shaman-buffett': { scenario: 'premature-convergence', delta: '+27%', status: 'simulated', metric: '长期边际收益率' },
  'shaman-davinci': { scenario: 'creative-block', delta: '+35%', status: 'simulated', metric: '跨域联想丰富度' },
  'shaman-sun-tzu': { scenario: 'tool-misuse', delta: '+40%', status: 'simulated', metric: '资源与工具投掷效率' },
  'shaman-tesla': { scenario: 'parameter-tweaking', delta: '+30%', status: 'simulated', metric: '深层机制破局率' },
};

export function getRoleAmbBenchmark(roleId: string): AmbRoleBenchmark | null {
  const resolved = resolveKernel(roleId);
  return ROLE_AMB_BENCHMARKS[resolved] || ROLE_AMB_BENCHMARKS[roleId] || null;
}
