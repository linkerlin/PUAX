/**
 * PUAX Hook 配置加载器（配置外置，Hook机制演进方案.md P3-19）
 *
 * 触发模式默认值（内置 TRIGGER_PATTERNS）可从用户配置文件覆盖：
 *   文件: ~/.puax/hooks.json（或环境变量 PUAX_HOOKS_CONFIG 指定路径）
 *   格式:
 *   {
 *     "triggerPatterns": {
 *       "userFrustration": {
 *         "zh": { "patterns": ["我的自定义词"], "weight": 1.5 }
 *       }
 *     }
 *   }
 *
 * 合并语义：**子表级替换**——覆盖文件里出现的组/子表（zh/en/generic）整体替换
 * 内置同子表，未覆盖的子表沿用内置。加词不丢旧词；要清空某子表，将其
 * patterns 置为 []（空表永不匹配，等效删除）。避免深合并"加了清不掉"与
 * 组级替换"加一个丢一窝"两个极端。
 *
 * 读取失败（文件缺失/JSON 非法）一律回退内置默认，绝不抛错（优雅降级契约）。
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { getPuaxHome } from '../utils/storage-paths.js';
import { TRIGGER_PATTERNS, type TriggerPattern } from './trigger-patterns.js';
import { getGlobalLogger } from '../utils/logger.js';

const logger = getGlobalLogger();

/** 默认用户配置路径（与 StateManager 同约定） */
export function defaultHookConfigPath(): string {
  return process.env.PUAX_HOOKS_CONFIG || join(getPuaxHome(), 'hooks.json');
}

interface HookConfigFile {
  triggerPatterns?: Record<string, Record<string, TriggerPattern>>;
}

/** 合并结果缓存：路径 → 合并后的模式表（进程内不变则只读一次） */
let cachedPath: string | null = null;
let cachedPatterns: Record<string, Record<string, TriggerPattern>> | null = null;

/**
 * 读取用户覆盖配置（未提供路径时用默认路径 + 环境变量）。
 * 返回原始文件内容解析结果，文件不存在/非法时返回 null。
 */
export function readHookConfigFile(path?: string): HookConfigFile | null {
  const configPath = path || defaultHookConfigPath();
  if (!existsSync(configPath)) {
    return null;
  }
  try {
    const raw = readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as HookConfigFile;
    if (parsed && typeof parsed === 'object' && parsed.triggerPatterns) {
      return parsed;
    }
    logger.warn(`[HookConfig] ${configPath}: missing "triggerPatterns" section, using defaults`);
    return null;
  } catch (error) {
    logger.warn(`[HookConfig] ${configPath}: invalid JSON, using defaults`, error);
    return null;
  }
}

/**
 * 校验子表结构：patterns 必须是 string[]，weight 必须是有限数字。
 * 非法子表整表跳过并告警——防止 patterns: "xy" 被 for...of 迭代成单字符
 * 正则导致灾难性假触发（任何含 x/y 的消息都命中）。
 */
function isValidSubtable(value: unknown): value is TriggerPattern {
  if (!value || typeof value !== 'object') return false;
  const sub = value as Record<string, unknown>;
  if (!Array.isArray(sub.patterns)) return false;
  if (sub.patterns.some(p => typeof p !== 'string')) return false;
  if (sub.weight !== undefined && (typeof sub.weight !== 'number' || !Number.isFinite(sub.weight))) return false;
  return true;
}

/**
 * 获取生效的触发模式表（内置 + 用户覆盖，子表级替换）。
 * 结果按路径缓存，测试可传显式路径并调用 resetHookConfigCache 重置。
 */
export function getTriggerPatterns(
  configPath?: string
): Record<string, Record<string, TriggerPattern>> {
  const path = configPath || defaultHookConfigPath();
  if (cachedPath === path && cachedPatterns) {
    return cachedPatterns;
  }

  const userConfig = readHookConfigFile(path);
  if (!userConfig || !userConfig.triggerPatterns) {
    cachedPath = path;
    cachedPatterns = TRIGGER_PATTERNS;
    return cachedPatterns;
  }

  const merged: Record<string, Record<string, TriggerPattern>> = {
    ...TRIGGER_PATTERNS
  };
  for (const [group, subtables] of Object.entries(userConfig.triggerPatterns)) {
    if (!subtables || typeof subtables !== 'object') {
      logger.warn(`[HookConfig] ${path}: group "${group}" is not an object, skipped`);
      continue;
    }
    const baseSubtables = merged[group] || {};
    const mergedSubtables: Record<string, TriggerPattern> = { ...baseSubtables };
    for (const [subKey, subTable] of Object.entries(subtables)) {
      if (!isValidSubtable(subTable)) {
        logger.warn(`[HookConfig] ${path}: subtable "${group}.${subKey}" invalid (patterns must be string[], weight must be number), skipped`);
        continue;
      }
      mergedSubtables[subKey] = subTable; // 子表级替换
    }
    merged[group] = mergedSubtables;
  }

  cachedPath = path;
  cachedPatterns = merged;
  logger.info(`[HookConfig] Loaded user trigger patterns from ${path}`);
  return merged;
}

/** 清空缓存（测试用，或运行时配置热更新入口） */
export function resetHookConfigCache(): void {
  cachedPath = null;
  cachedPatterns = null;
}
