/**
 * 内置 bundle + 用户自定义角色统一目录
 */

import {
  getAllBundledSkills,
  getBundledSkillById,
  getSkillManifest,
  searchBundledSkills,
  getSkillCategories as getBundledCategories,
} from './prompts-bundle.js';
import type { BundledSkill, SkillManifestEntry } from './bundle-types.js';
import { getCustomRoleStore, CUSTOM_ROLE_CATEGORY } from '../core/custom-role-store.js';

export function getSkillById(id: string): BundledSkill | undefined {
  return getCustomRoleStore().getBundledSkillById(id) ?? getBundledSkillById(id);
}

export function getAllSkills(): BundledSkill[] {
  return [...getAllBundledSkills(), ...getCustomRoleStore().getAllBundledSkills()];
}

export function getCombinedManifest(): SkillManifestEntry[] {
  return [...getSkillManifest(), ...getCustomRoleStore().getManifestEntries()];
}

export function searchSkills(keyword: string): BundledSkill[] {
  const lower = keyword.toLowerCase();
  const customMatches = getCustomRoleStore()
    .getAllBundledSkills()
    .filter(skill =>
      skill.name.toLowerCase().includes(lower)
      || skill.description.toLowerCase().includes(lower)
      || skill.tags.some(tag => tag.toLowerCase().includes(lower))
    );
  const bundledMatches = searchBundledSkills(keyword);
  const seen = new Set<string>();
  return [...customMatches, ...bundledMatches].filter(skill => {
    if (seen.has(skill.id)) return false;
    seen.add(skill.id);
    return true;
  });
}

export function getSkillCategories(): string[] {
  const categories = new Set(getBundledCategories());
  if (getCustomRoleStore().list().length > 0) {
    categories.add(CUSTOM_ROLE_CATEGORY);
  }
  return [...categories].sort();
}

export { CUSTOM_ROLE_CATEGORY };
