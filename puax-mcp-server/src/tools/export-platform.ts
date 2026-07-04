/**
 * 平台导出工具
 * 实现 npx puax-mcp-server --export [platform] 功能
 */

import { globalAdapterRegistry, PlatformExportConfig } from '../platform-adapters/base-adapter.js';
import '../platform-adapters/cursor-adapter.js';
import '../platform-adapters/vscode-adapter.js';
import '../platform-adapters/kiro-adapter.js';
import '../platform-adapters/codebuddy-adapter.js';
import '../platform-adapters/windsurf-adapter.js';
import '../platform-adapters/skill-md-platform-adapter.js';
import { join } from 'path';
import { getAllSkills } from '../prompts/skill-catalog.js';
import { getFlavorExportList } from '../core/flavor-methodology.js';
import { getGlobalLogger } from '../utils/logger.js';
import { assertSafeOutputPath, PathTraversalError } from '../utils/path-security.js';

const logger = getGlobalLogger();

// ============================================================================
// 类型定义
// ============================================================================

export type ExportPlatformId =
  | 'cursor' | 'vscode' | 'kiro' | 'codebuddy' | 'windsurf'
  | 'codex' | 'opencode' | 'openclaw' | 'antigravity' | 'trae' | 'pi'
  | 'all';

export interface ExportPlatformArgs {
  platform: ExportPlatformId;
  outputPath: string;
  roleFilter?: string[];
  flavorFilter?: string[];
  language?: 'zh' | 'en' | 'all';
  includeMethodology?: boolean;
}

export interface ExportResult {
  success: boolean;
  platform: string;
  exportedFiles: string[];
  errors: string[];
  warnings: string[];
  duration: number;
}

// ============================================================================
// 角色数据加载
// ============================================================================

interface RoleData {
  id: string;
  name: string;
  description: string;
  category: string;
  systemPrompt: string;
  triggerConditions: string[];
  taskTypes: string[];
  compatibleFlavors: string[];
  metadata: {
    tone: string;
    intensity: string;
    version: string;
  };
}

interface FlavorData {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  rhetoric: {
    opening: string[];
    closing: string[];
    emphasis: string[];
  };
}

/**
 * 从内置 bundle 加载角色数据
 */
function loadRoles(): RoleData[] {
  return getAllSkills().map(skill => ({
    id: skill.id,
    name: skill.name,
    description: skill.description,
    category: skill.category,
    systemPrompt: skill.content,
    triggerConditions: skill.triggerConditions,
    taskTypes: skill.taskTypes,
    compatibleFlavors: skill.compatibleFlavors,
    metadata: {
      tone: skill.metadata.tone,
      intensity: skill.metadata.intensity,
      version: skill.version
    }
  }));
}

/** 从 flavor-methodologies.yaml 加载风味数据（单一数据源） */
function loadFlavors(): FlavorData[] {
  return getFlavorExportList();
}

// ============================================================================
// 导出功能
// ============================================================================

/**
 * 导出到指定平台
 */
export function exportPlatform(args: ExportPlatformArgs): ExportResult {
  const startTime = Date.now();
  
  const result: ExportResult = {
    success: false,
    platform: args.platform,
    exportedFiles: [],
    errors: [],
    warnings: [],
    duration: 0
  };

  try {
    const safeOutputPath = assertSafeOutputPath(args.outputPath);

    // 获取适配器
    const adapter = globalAdapterRegistry.get(args.platform);
    if (!adapter) {
      result.errors.push(`Unsupported platform: ${args.platform}`);
      result.errors.push(`Supported platforms: ${globalAdapterRegistry.getSupportedPlatforms().join(', ')}`);
      return result;
    }

    // 验证配置
    const config: PlatformExportConfig = {
      outputPath: safeOutputPath,
      roleFilter: args.roleFilter,
      flavorFilter: args.flavorFilter,
      language: args.language === 'all' ? undefined : args.language,
      includeMethodology: args.includeMethodology
    };

    const validation = adapter.validateConfig(config);
    if (!validation.valid) {
      result.errors.push(...validation.errors);
      return result;
    }

    // 加载数据
    logger.info(`[PUAX Export] Loading roles...`);
    const roles = loadRoles();
    logger.info(`[PUAX Export] Loaded ${roles.length} roles`);

    logger.info(`[PUAX Export] Loading flavors...`);
    const flavors = loadFlavors();
    logger.info(`[PUAX Export] Loaded ${flavors.length} flavors`);

    if (roles.length === 0) {
      result.warnings.push('No roles found to export');
    }

    // 执行导出
    logger.info(`[PUAX Export] Exporting to ${args.platform}...`);
    const exportResult = adapter.export(roles, flavors, config);

    // 合并结果
    result.success = exportResult.success;
    result.exportedFiles = exportResult.exportedFiles;
    result.errors.push(...exportResult.errors);
    result.warnings.push(...exportResult.warnings);

    result.duration = Date.now() - startTime;

    if (result.success) {
      logger.info(`[PUAX Export] ✓ Successfully exported ${result.exportedFiles.length} files in ${result.duration}ms`);
    } else {
      logger.error(`[PUAX Export] ✗ Export failed with ${result.errors.length} errors`);
    }

  } catch (error) {
    if (error instanceof PathTraversalError) {
      result.errors.push(error.message);
    } else {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }
    result.duration = Date.now() - startTime;
  }

  return result;
}

/**
 * 导出到所有平台
 */
export function exportAllPlatforms(
  outputDir: string,
  options: Omit<ExportPlatformArgs, 'platform' | 'outputPath'>
): ExportResult[] {
  const platforms = globalAdapterRegistry.getSupportedPlatforms();
  const results: ExportResult[] = [];

  for (const platform of platforms) {
    const platformOutputDir = join(outputDir, platform);
    const result = exportPlatform({
      platform: platform as ExportPlatformId,
      outputPath: platformOutputDir,
      ...options,
    });
    results.push(result);
  }

  return results;
}

// ============================================================================
// CLI 集成
// ============================================================================

/**
 * 处理导出命令
 */
export function handleExportCommand(args: string[]): void {
  const platformArg = args.find(arg => arg.startsWith('--export=')) || args.find(arg => arg === '--export');
  const outputArg = args.find(arg => arg.startsWith('--output=')) || args.find(arg => arg === '--output');
  const rolesArg = args.find(arg => arg.startsWith('--roles='));
  const flavorsArg = args.find(arg => arg.startsWith('--flavors='));
  const langArg = args.find(arg => arg.startsWith('--lang='));

  if (!platformArg) {
    logger.error('[PUAX Export] Error: --export flag is required');
    logger.error('Usage: npx puax-mcp-server --export=<platform> --output=<path>');
    logger.error('Supported platforms: cursor, vscode, kiro, codebuddy, windsurf, codex, opencode, openclaw, antigravity, trae, pi, all');
    process.exit(1);
  }

  const platform = platformArg.includes('=') 
    ? platformArg.split('=')[1] 
    : (args[args.indexOf(platformArg) + 1] || 'all');

  const outputPath = outputArg 
    ? (outputArg.includes('=') ? outputArg.split('=')[1] : args[args.indexOf(outputArg) + 1])
    : './puax-export';

  const roleFilter = rolesArg ? rolesArg.split('=')[1].split(',') : undefined;
  const flavorFilter = flavorsArg ? flavorsArg.split('=')[1].split(',') : undefined;
  const language = (langArg ? langArg.split('=')[1] : 'all') as 'zh' | 'en' | 'all';

  if (platform === 'all') {
    logger.info('[PUAX Export] Exporting to all platforms...');
    const results = exportAllPlatforms(outputPath, {
      roleFilter,
      flavorFilter,
      language
    });

    const successCount = results.filter(r => r.success).length;
    logger.info(`\n[PUAX Export] Summary: ${successCount}/${results.length} platforms exported successfully`);
    
    for (const result of results) {
      const status = result.success ? '✓' : '✗';
      logger.info(`  ${status} ${result.platform}: ${result.exportedFiles.length} files`);
      if (result.errors.length > 0) {
        logger.info(`    Errors: ${result.errors.join(', ')}`);
      }
    }
  } else {
    const result = exportPlatform({
      platform: platform as ExportPlatformArgs['platform'],
      outputPath,
      roleFilter,
      flavorFilter,
      language
    });

    if (result.success) {
      logger.info(`\n[PUAX Export] ✓ Success! Exported to ${outputPath}`);
      logger.info(`  Files: ${result.exportedFiles.length}`);
      logger.info(`  Duration: ${result.duration}ms`);
    } else {
      logger.error(`\n[PUAX Export] ✗ Failed!`);
      logger.error(`  Errors: ${result.errors.join('\n  ')}`);
      process.exit(1);
    }
  }
}
