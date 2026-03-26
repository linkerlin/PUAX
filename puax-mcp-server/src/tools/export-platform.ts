/**
 * 平台导出工具
 * 实现 npx puax-mcp-server --export [platform] 功能
 */

import { globalAdapterRegistry, PlatformExportConfig } from '../platform-adapters/base-adapter.js';
import '../platform-adapters/cursor-adapter.js';
import '../platform-adapters/vscode-adapter.js';
import { join } from 'path';
import { getAllBundledSkills } from '../prompts/prompts-bundle.js';

// ============================================================================
// 类型定义
// ============================================================================

export interface ExportPlatformArgs {
  platform: 'cursor' | 'vscode' | 'kiro' | 'codebuddy' | 'all';
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
  return getAllBundledSkills().map(skill => ({
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

/**
 * 加载风味数据
 */
function loadFlavors(): FlavorData[] {
  // 内置风味数据
  return [
    {
      id: 'alibaba',
      name: '阿里味',
      description: '阿里巴巴企业文化 - 底层逻辑、抓手、闭环',
      keywords: ['底层逻辑', '抓手', '闭环', '颗粒度', '3.25', 'owner意识'],
      rhetoric: {
        opening: ['对齐目标', '拉通资源'],
        closing: ['拿到结果', '形成闭环'],
        emphasis: ['因为信任所以简单', '今天最好的表现是明天最低的要求']
      }
    },
    {
      id: 'huawei',
      name: '华为味',
      description: '华为企业文化 - 奋斗者、自我批判',
      keywords: ['力出一孔', '烧不死的鸟', '自我批判', '让听得见炮声的人呼唤炮火'],
      rhetoric: {
        opening: ['以奋斗者为本', '力出一孔'],
        closing: ['胜则举杯相庆，败则拼死相救'],
        emphasis: ['烧不死的鸟是凤凰']
      }
    },
    {
      id: 'bytedance',
      name: '字节味',
      description: '字节跳动企业文化 - ROI、Always Day 1',
      keywords: ['ROI', 'Always Day 1', 'Context not Control', '坦诚清晰'],
      rhetoric: {
        opening: ['坦诚直接地说', '这个需求的ROI你算过了吗'],
        closing: ['务实敢为', '追求极致'],
        emphasis: ['数据驱动', '速度>完美']
      }
    },
    {
      id: 'tencent',
      name: '腾讯味',
      description: '腾讯企业文化 - 赛马机制、小步快跑',
      keywords: ['赛马机制', '小步快跑', '用户价值', '产品思维'],
      rhetoric: {
        opening: ['我已经让另一个agent也在看这个问题了'],
        closing: ['向上管理好你的结果'],
        emphasis: ['赛不过就换方案']
      }
    },
    {
      id: 'netflix',
      name: 'Netflix味',
      description: 'Netflix企业文化 - Keeper Test、Pro Sports Team',
      keywords: ['Keeper Test', 'pro sports team', 'generous severance', 'talent density'],
      rhetoric: {
        opening: ['Would I fight to keep you?'],
        closing: ['We\'re a pro sports team, not a family'],
        emphasis: ['A players hire A players']
      }
    },
    {
      id: 'musk',
      name: 'Musk味',
      description: 'Elon Musk风格 - First Principles、Extremely Hardcore',
      keywords: ['extremely hardcore', 'ship or die', 'the algorithm', 'first principles'],
      rhetoric: {
        opening: ['Going forward, this will require being extremely hardcore'],
        closing: ['Ship or die'],
        emphasis: ['The Algorithm: question→delete→simplify→accelerate→automate']
      }
    },
    {
      id: 'jobs',
      name: 'Jobs味',
      description: 'Steve Jobs风格 - Simplicity、Perfection',
      keywords: ['A players', 'real artists ship', 'subtraction', 'pixel-perfect'],
      rhetoric: {
        opening: ['A players hire A players'],
        closing: ['Real artists ship'],
        emphasis: ['What can we DELETE from this requirement?']
      }
    },
    {
      id: 'amazon',
      name: 'Amazon味',
      description: 'Amazon企业文化 - Customer Obsession、Working Backwards',
      keywords: ['Customer Obsession', 'Bias for Action', 'Dive Deep', 'Working Backwards'],
      rhetoric: {
        opening: ['Are you working backwards from the customer?'],
        closing: ['Bias for Action — ship'],
        emphasis: ['Disagree and Commit']
      }
    }
  ];
}

// ============================================================================
// 导出功能
// ============================================================================

/**
 * 导出到指定平台
 */
export async function exportPlatform(args: ExportPlatformArgs): Promise<ExportResult> {
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
    // 获取适配器
    const adapter = globalAdapterRegistry.get(args.platform);
    if (!adapter) {
      result.errors.push(`Unsupported platform: ${args.platform}`);
      result.errors.push(`Supported platforms: ${globalAdapterRegistry.getSupportedPlatforms().join(', ')}`);
      return result;
    }

    // 验证配置
    const config: PlatformExportConfig = {
      outputPath: args.outputPath,
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
    console.log(`[PUAX Export] Loading roles...`);
    const roles = loadRoles();
    console.log(`[PUAX Export] Loaded ${roles.length} roles`);

    console.log(`[PUAX Export] Loading flavors...`);
    const flavors = loadFlavors();
    console.log(`[PUAX Export] Loaded ${flavors.length} flavors`);

    if (roles.length === 0) {
      result.warnings.push('No roles found to export');
    }

    // 执行导出
    console.log(`[PUAX Export] Exporting to ${args.platform}...`);
    const exportResult = await adapter.export(roles, flavors, config);

    // 合并结果
    result.success = exportResult.success;
    result.exportedFiles = exportResult.exportedFiles;
    result.errors.push(...exportResult.errors);
    result.warnings.push(...exportResult.warnings);

    result.duration = Date.now() - startTime;

    if (result.success) {
      console.log(`[PUAX Export] ✓ Successfully exported ${result.exportedFiles.length} files in ${result.duration}ms`);
    } else {
      console.error(`[PUAX Export] ✗ Export failed with ${result.errors.length} errors`);
    }

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    result.duration = Date.now() - startTime;
  }

  return result;
}

/**
 * 导出到所有平台
 */
export async function exportAllPlatforms(
  outputDir: string,
  options: Omit<ExportPlatformArgs, 'platform' | 'outputPath'>
): Promise<ExportResult[]> {
  const platforms = ['cursor', 'vscode'] as const;
  const results: ExportResult[] = [];

  for (const platform of platforms) {
    const platformOutputDir = join(outputDir, platform);
    const result = await exportPlatform({
      platform,
      outputPath: platformOutputDir,
      ...options
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
export async function handleExportCommand(args: string[]): Promise<void> {
  const platformArg = args.find(arg => arg.startsWith('--export=')) || args.find(arg => arg === '--export');
  const outputArg = args.find(arg => arg.startsWith('--output=')) || args.find(arg => arg === '--output');
  const rolesArg = args.find(arg => arg.startsWith('--roles='));
  const flavorsArg = args.find(arg => arg.startsWith('--flavors='));
  const langArg = args.find(arg => arg.startsWith('--lang='));

  if (!platformArg) {
    console.error('[PUAX Export] Error: --export flag is required');
    console.error('Usage: npx puax-mcp-server --export=<platform> --output=<path>');
    console.error('Supported platforms: cursor, vscode, all');
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
    console.log('[PUAX Export] Exporting to all platforms...');
    const results = await exportAllPlatforms(outputPath, {
      roleFilter,
      flavorFilter,
      language
    });

    const successCount = results.filter(r => r.success).length;
    console.log(`\n[PUAX Export] Summary: ${successCount}/${results.length} platforms exported successfully`);
    
    for (const result of results) {
      const status = result.success ? '✓' : '✗';
      console.log(`  ${status} ${result.platform}: ${result.exportedFiles.length} files`);
      if (result.errors.length > 0) {
        console.log(`    Errors: ${result.errors.join(', ')}`);
      }
    }
  } else {
    const result = await exportPlatform({
      platform: platform as ExportPlatformArgs['platform'],
      outputPath,
      roleFilter,
      flavorFilter,
      language
    });

    if (result.success) {
      console.log(`\n[PUAX Export] ✓ Success! Exported to ${outputPath}`);
      console.log(`  Files: ${result.exportedFiles.length}`);
      console.log(`  Duration: ${result.duration}ms`);
    } else {
      console.error(`\n[PUAX Export] ✗ Failed!`);
      console.error(`  Errors: ${result.errors.join('\n  ')}`);
      process.exit(1);
    }
  }
}
