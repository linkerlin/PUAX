/**
 * 平台适配器基类
 * 定义所有平台适配器的通用接口和行为
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

// ============================================================================
// 类型定义
// ============================================================================

export interface RoleExportData {
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

export interface FlavorExportData {
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

export interface PlatformExportConfig {
  outputPath: string;
  roleFilter?: string[];
  flavorFilter?: string[];
  includeMethodology?: boolean;
  language?: 'zh' | 'en' | 'all';
}

export interface ExportResult {
  success: boolean;
  exportedFiles: string[];
  errors: string[];
  warnings: string[];
}

/** 原生 hook 产物文件（配置或脚本），写入导出目录 */
export interface HookFile {
  /** 相对输出目录的路径，如 'hooks/hooks.json' */
  path: string;
  content: string;
}

// ============================================================================
// 抽象基类
// ============================================================================

export abstract class PlatformAdapter {
  protected platformName: string;
  protected supportedLanguages: string[];

  constructor(platformName: string, supportedLanguages: string[] = ['zh', 'en']) {
    this.platformName = platformName;
    this.supportedLanguages = supportedLanguages;
  }

  /**
   * 获取平台名称
   */
  getPlatformName(): string {
    return this.platformName;
  }

  /**
   * 检查是否支持某语言
   */
  supportsLanguage(language: string): boolean {
    return this.supportedLanguages.includes(language);
  }

  /**
   * 导出角色到目标平台格式（抽象方法）
   */
  abstract exportRole(
    role: RoleExportData,
    config: PlatformExportConfig
  ): string;

  /**
   * 导出风味叠加（抽象方法）
   */
  abstract exportFlavor(
    flavor: FlavorExportData,
    config: PlatformExportConfig
  ): string;

  /**
   * 生成平台配置文件（抽象方法）
   */
  abstract generateConfig(
    roles: RoleExportData[],
    config: PlatformExportConfig
  ): string;

  /**
   * 生成原生 hook 配置/脚本（默认不生成）。
   * 实现方返回相对输出目录的 HookFile 列表，export() 会写入并计入 exportedFiles。
   * 见 Hook机制演进方案.md Phase 1：从"只发 skill 文件"升级为"同时发宿主 hook 配置"。
   */
  generateHooks(_config: PlatformExportConfig): HookFile[] {
    return [];
  }

  /**
   * 执行导出流程
   */
  export(
    roles: RoleExportData[],
    flavors: FlavorExportData[],
    config: PlatformExportConfig
  ): ExportResult {
    const result: ExportResult = {
      success: true,
      exportedFiles: [],
      errors: [],
      warnings: []
    };

    try {
      // 创建输出目录
      if (!existsSync(config.outputPath)) {
        mkdirSync(config.outputPath, { recursive: true });
      }

      // 过滤角色
      const filteredRoles = this.filterRoles(roles, config.roleFilter);
      
      // 过滤风味
      const filteredFlavors = this.filterFlavors(flavors, config.flavorFilter);

      // 导出每个角色
      for (const role of filteredRoles) {
        try {
          const content = this.exportRole(role, config);
          const fileName = this.getRoleFileName(role);
          const filePath = join(config.outputPath, fileName);
          
          // 确保目录存在
          const dir = dirname(filePath);
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }

          writeFileSync(filePath, content, 'utf-8');
          result.exportedFiles.push(filePath);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to export role ${role.id}: ${errorMsg}`);
        }
      }

      // 导出风味（如果支持）
      if (this.supportsFlavorExport()) {
        for (const flavor of filteredFlavors) {
          try {
            const content = this.exportFlavor(flavor, config);
            const fileName = this.getFlavorFileName(flavor);
            const filePath = join(config.outputPath, fileName);
            const dir = dirname(filePath);
            if (!existsSync(dir)) {
              mkdirSync(dir, { recursive: true });
            }
            writeFileSync(filePath, content, 'utf-8');
            result.exportedFiles.push(filePath);
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push(`Failed to export flavor ${flavor.id}: ${errorMsg}`);
          }
        }
      }

      // 生成配置文件
      try {
        const configContent = this.generateConfig(filteredRoles, config);
        const configFileName = this.getConfigFileName();
        const configPath = join(config.outputPath, configFileName);
        const configDir = dirname(configPath);
        if (!existsSync(configDir)) {
          mkdirSync(configDir, { recursive: true });
        }
        
        writeFileSync(configPath, configContent, 'utf-8');
        result.exportedFiles.push(configPath);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Failed to generate config: ${errorMsg}`);
      }

      // 生成原生 hook 配置/脚本（Phase 1：运行时强制接入）
      for (const hookFile of this.generateHooks(config)) {
        try {
          const hookPath = join(config.outputPath, hookFile.path);
          const dir = dirname(hookPath);
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
          writeFileSync(hookPath, hookFile.content, 'utf-8');
          result.exportedFiles.push(hookPath);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to generate hook file ${hookFile.path}: ${errorMsg}`);
        }
      }

      // 更新成功状态
      result.success = result.errors.length === 0;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Export failed: ${errorMsg}`);
      result.success = false;
    }

    return result;
  }

  /**
   * 过滤角色
   */
  protected filterRoles(
    roles: RoleExportData[],
    filter?: string[]
  ): RoleExportData[] {
    if (!filter || filter.length === 0) {
      return roles;
    }
    return roles.filter(role => filter.includes(role.id));
  }

  /**
   * 过滤风味
   */
  protected filterFlavors(
    flavors: FlavorExportData[],
    filter?: string[]
  ): FlavorExportData[] {
    if (!filter || filter.length === 0) {
      return flavors;
    }
    return flavors.filter(flavor => filter.includes(flavor.id));
  }

  /**
   * 获取角色文件名（可覆盖）
   */
  protected getRoleFileName(role: RoleExportData): string {
    return `${role.id}.${this.getFileExtension()}`;
  }

  /**
   * 获取风味文件名（可覆盖）
   */
  protected getFlavorFileName(flavor: FlavorExportData): string {
    return `flavor-${flavor.id}.${this.getFileExtension()}`;
  }

  /**
   * 获取配置文件名（可覆盖）
   */
  protected getConfigFileName(): string {
    return `puax-config.json`;
  }

  /**
   * 获取文件扩展名（抽象方法）
   */
  protected abstract getFileExtension(): string;

  /**
   * 是否支持风味导出（可覆盖）
   */
  protected supportsFlavorExport(): boolean {
    return false;
  }

  /**
   * 验证导出配置
   */
  validateConfig(config: PlatformExportConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.outputPath) {
      errors.push('outputPath is required');
    }

    if (config.language && !this.supportsLanguage(config.language)) {
      errors.push(`Language '${config.language}' is not supported by ${this.platformName}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// ============================================================================
// 适配器注册表
// ============================================================================

export class AdapterRegistry {
  private adapters: Map<string, PlatformAdapter> = new Map();

  register(adapter: PlatformAdapter): void {
    this.adapters.set(adapter.getPlatformName().toLowerCase(), adapter);
  }

  get(platformName: string): PlatformAdapter | undefined {
    return this.adapters.get(platformName.toLowerCase());
  }

  getAll(): PlatformAdapter[] {
    return Array.from(this.adapters.values());
  }

  getSupportedPlatforms(): string[] {
    return Array.from(this.adapters.keys());
  }
}

// 全局注册表实例
export const globalAdapterRegistry = new AdapterRegistry();
