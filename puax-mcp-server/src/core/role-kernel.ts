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
