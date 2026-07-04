import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { 
  PlatformAdapter, 
  RoleExportData, 
  FlavorExportData, 
  PlatformExportConfig,
  ExportResult,
  globalAdapterRegistry
} from './base-adapter.js';

export class CodeBuddyAdapter extends PlatformAdapter {
  constructor() {
    super('codebuddy', ['zh', 'en']);
  }

  /**
   * 导出角色为 SKILL.md 格式
   */
  exportRole(role: RoleExportData, _config: PlatformExportConfig): string {
    return `---
name: ${role.id}
description: "${role.description}"
license: MIT
---

# ${role.name}

${role.description}

## 触发条件
${role.triggerConditions.map(c => `- ${c}`).join('\n')}

## 适用任务类型
${role.taskTypes.map(t => `- ${t}`).join('\n')}

## 系统提示词

${role.systemPrompt}

## 元数据
- 语气: ${role.metadata.tone}
- 强度: ${role.metadata.intensity}
- 版本: ${role.metadata.version}

---
*此文件由 PUAX 自动生成 - https://puax.net*
`;
  }

  /**
   * CodeBuddy 使用独立风味文件
   */
  exportFlavor(flavor: FlavorExportData, _config: PlatformExportConfig): string {
    return `---
name: flavor-${flavor.id}
description: "${flavor.name} 风味叠加"
---

# ${flavor.name} 风味

${flavor.description}

## 关键词
${flavor.keywords.map(k => `- ${k}`).join('\n')}

## 修辞
- 开场: ${flavor.rhetoric.opening.join(', ')}
- 结束: ${flavor.rhetoric.closing.join(', ')}
- 强调: ${flavor.rhetoric.emphasis.join(', ')}
`;
  }

  /**
   * 生成 CodeBuddy 配置
   */
  generateConfig(roles: RoleExportData[], _config: PlatformExportConfig): string {
    const configObj = {
      name: 'PUAX for CodeBuddy',
      version: '2.0.0',
      description: 'AI Agent 激励系统 - CodeBuddy 版本',
      skills: roles.map(r => ({
        id: r.id,
        name: r.name,
        directory: r.id,
        file: 'SKILL.md'
      })),
      installation: {
        description: '将技能目录复制到 .codebuddy/skills/',
        path: '.codebuddy/skills/',
        command: 'codebuddy plugin install'
      }
    };

    return JSON.stringify(configObj, null, 2);
  }

  /**
   * CodeBuddy 导出需要特殊处理，创建子目录
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
      warnings: [],
    };

    try {
      for (const role of roles) {
        try {
          const roleDir = `${config.outputPath}/${role.id}`;
          const content = this.exportRole(role, config);
          const filePath = `${roleDir}/SKILL.md`;

          if (!existsSync(roleDir)) {
            mkdirSync(roleDir, { recursive: true });
          }

          writeFileSync(filePath, content, 'utf-8');
          result.exportedFiles.push(filePath);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to export role ${role.id}: ${errorMsg}`);
        }
      }

      if (flavors.length > 0) {
        const flavorDir = `${config.outputPath}/flavors`;
        if (!existsSync(flavorDir)) {
          mkdirSync(flavorDir, { recursive: true });
        }

        for (const flavor of flavors) {
          try {
            const content = this.exportFlavor(flavor, config);
            const filePath = `${flavorDir}/flavor-${flavor.id}.md`;
            writeFileSync(filePath, content, 'utf-8');
            result.exportedFiles.push(filePath);
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push(`Failed to export flavor ${flavor.id}: ${errorMsg}`);
          }
        }
      }

      try {
        const configContent = this.generateConfig(roles, config);
        const configPath = `${config.outputPath}/codebuddy-config.json`;
        writeFileSync(configPath, configContent, 'utf-8');
        result.exportedFiles.push(configPath);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Failed to generate config: ${errorMsg}`);
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMsg);
      result.success = false;
    }

    return result;
  }

  protected getFileExtension(): string {
    return 'md';
  }

  protected getConfigFileName(): string {
    return 'codebuddy-config.json';
  }

  protected supportsFlavorExport(): boolean {
    return true;
  }

  protected getRoleFileName(role: RoleExportData): string {
    return `${role.id}/SKILL.md`;
  }
}

// 注册适配器
globalAdapterRegistry.register(new CodeBuddyAdapter());
