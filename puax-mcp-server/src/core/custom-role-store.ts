/**
 * 用户自定义角色存储
 * 持久化于 ~/.puax/custom-roles.json，并入推荐池与激活流程
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { getGlobalLogger } from '../utils/logger.js';
import { getManifestEntryById } from '../prompts/prompts-bundle.js';
import type { BundledSkill, SkillManifestEntry } from '../prompts/bundle-types.js';
import type { RoleMetadata } from './role-recommender.js';

const logger = getGlobalLogger();

export const CUSTOM_ROLE_ID_PATTERN = /^custom-[a-z0-9-]{2,46}$/;
export const CUSTOM_ROLE_CATEGORY = 'custom';

export interface CustomRoleInput {
  id: string;
  name: string;
  description: string;
  content: string;
  tags?: string[];
  task_types?: string[];
  trigger_conditions?: string[];
  compatible_flavors?: string[];
  recommended_for_triggers?: string[];
  metadata?: Partial<Pick<RoleMetadata, 'tone' | 'intensity' | 'suitable_for'>>;
}

export interface CustomRoleRecord extends CustomRoleInput {
  category: typeof CUSTOM_ROLE_CATEGORY;
  created_at: string;
  updated_at: string;
}

interface CustomRoleRegistry {
  version: string;
  roles: Record<string, CustomRoleRecord>;
}

export interface CustomRoleValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCustomRoleId(id: string): CustomRoleValidationResult {
  const errors: string[] = [];
  if (!id?.trim()) {
    errors.push('id 不能为空');
  } else if (!CUSTOM_ROLE_ID_PATTERN.test(id)) {
    errors.push('id 须以 custom- 开头，仅含小写字母、数字与连字符，长度 9–53');
  } else if (getManifestEntryById(id)) {
    errors.push(`id 与内置角色冲突: ${id}`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateCustomRoleInput(input: CustomRoleInput): CustomRoleValidationResult {
  const errors = [...validateCustomRoleId(input.id).errors];
  if (!input.name?.trim()) errors.push('name 不能为空');
  if (!input.description?.trim()) errors.push('description 不能为空');
  if (!input.content?.trim() || input.content.trim().length < 20) {
    errors.push('content（角色提示词）至少 20 字');
  }
  return { valid: errors.length === 0, errors };
}

export class CustomRoleStore {
  private readonly baseDir: string;
  private readonly registryFile: string;
  private registry: CustomRoleRegistry;

  constructor(customDir?: string) {
    this.baseDir = customDir || join(homedir(), '.puax');
    this.registryFile = join(this.baseDir, 'custom-roles.json');
    this.ensureDirectory();
    this.registry = this.loadRegistry();
  }

  private ensureDirectory(): void {
    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private loadRegistry(): CustomRoleRegistry {
    try {
      if (!existsSync(this.registryFile)) {
        return { version: '1.0.0', roles: {} };
      }
      const parsed = JSON.parse(readFileSync(this.registryFile, 'utf-8')) as CustomRoleRegistry;
      return {
        version: parsed.version || '1.0.0',
        roles: parsed.roles || {},
      };
    } catch (error) {
      logger.error('[CustomRoleStore] Failed to load registry:', error);
      return { version: '1.0.0', roles: {} };
    }
  }

  private saveRegistry(): void {
    writeFileSync(this.registryFile, JSON.stringify(this.registry, null, 2), 'utf-8');
  }

  list(): CustomRoleRecord[] {
    return Object.values(this.registry.roles).sort(
      (a, b) => a.name.localeCompare(b.name, 'zh-CN')
    );
  }

  get(id: string): CustomRoleRecord | undefined {
    return this.registry.roles[id];
  }

  register(input: CustomRoleInput): CustomRoleRecord {
    const validation = validateCustomRoleInput(input);
    if (!validation.valid) {
      throw new Error(validation.errors.join('；'));
    }

    const now = new Date().toISOString();
    const existing = this.registry.roles[input.id];
    const record: CustomRoleRecord = {
      ...input,
      category: CUSTOM_ROLE_CATEGORY,
      tags: input.tags || [],
      task_types: input.task_types || ['debugging'],
      trigger_conditions: input.trigger_conditions || [],
      compatible_flavors: input.compatible_flavors || [],
      recommended_for_triggers: input.recommended_for_triggers || [],
      created_at: existing?.created_at || now,
      updated_at: now,
    };

    this.registry.roles[input.id] = record;
    this.saveRegistry();
    return record;
  }

  remove(id: string): boolean {
    if (!this.registry.roles[id]) return false;
    delete this.registry.roles[id];
    this.saveRegistry();
    return true;
  }

  toBundledSkill(record: CustomRoleRecord): BundledSkill {
    const tone = record.metadata?.tone || 'supportive';
    const intensity = record.metadata?.intensity || 'medium';
    return {
      id: record.id,
      name: record.name,
      category: CUSTOM_ROLE_CATEGORY,
      description: record.description,
      tags: record.tags || [],
      author: 'user',
      version: '1.0.0',
      filePath: `~/.puax/custom-roles.json#${record.id}`,
      triggerConditions: record.trigger_conditions || [],
      taskTypes: record.task_types || [],
      compatibleFlavors: record.compatible_flavors || [],
      metadata: { tone, intensity },
      capabilities: record.tags?.length ? record.tags : [record.description.slice(0, 40)],
      howToUse: '用户自定义角色，通过 puax_register_custom_role 注册',
      inputFormat: '{{task}}',
      outputFormat: '按角色设定输出',
      exampleUsage: `puax_activate_role roleId=${record.id}`,
      content: record.content,
    };
  }

  toManifestEntry(record: CustomRoleRecord): SkillManifestEntry {
    const { content: _content, ...entry } = this.toBundledSkill(record);
    return entry;
  }

  toRoleMetadata(record: CustomRoleRecord): RoleMetadata {
    return {
      category: CUSTOM_ROLE_CATEGORY,
      tone: record.metadata?.tone || 'supportive',
      intensity: record.metadata?.intensity || 'medium',
      suitable_for: record.metadata?.suitable_for?.length
        ? record.metadata.suitable_for
        : record.task_types || ['debugging'],
    };
  }

  getBundledSkillById(id: string): BundledSkill | undefined {
    const record = this.get(id);
    return record ? this.toBundledSkill(record) : undefined;
  }

  getAllBundledSkills(): BundledSkill[] {
    return this.list().map(r => this.toBundledSkill(r));
  }

  getManifestEntries(): SkillManifestEntry[] {
    return this.list().map(r => this.toManifestEntry(r));
  }
}

let defaultStore: CustomRoleStore | null = null;

export function getCustomRoleStore(customDir?: string): CustomRoleStore {
  if (customDir) return new CustomRoleStore(customDir);
  if (!defaultStore) defaultStore = new CustomRoleStore();
  return defaultStore;
}

export function resetCustomRoleStoreForTesting(): void {
  defaultStore = null;
}

/** 测试专用：将默认 store 指向临时目录 */
export function useCustomRoleStoreDirForTesting(dir: string): CustomRoleStore {
  defaultStore = new CustomRoleStore(dir);
  return defaultStore;
}
