/**
 * opencode 平台适配器
 * 生成 .opencode/plugins/puax.js（Shape B 进程内插件，每个 agent step 自动触发）
 * 与 .opencode/skills/ 角色文件。
 *
 * 对标 obra/superpowers 的 .opencode/plugins/superpowers.js（Hook机制演进方案.md 4.1）：
 * - config hook 注册技能目录，免 symlink；
 * - experimental.chat.messages.transform 每 step 触发，带去重守卫 + 会话级缓存；
 * - 经 `puax-mcp-server hook` 单通路调用检测引擎（引擎共享层，4.3）。
 */

import {
  PlatformAdapter,
  RoleExportData,
  FlavorExportData,
  PlatformExportConfig,
  HookFile
} from './base-adapter.js';
import { globalAdapterRegistry } from './base-adapter.js';
import { opencodePlugin, DEFAULT_MARKER } from './hook-templates.js';

export class OpenCodeAdapter extends PlatformAdapter {
  constructor() {
    super('opencode', ['zh', 'en']);
  }

  exportRole(role: RoleExportData, _config: PlatformExportConfig): string {
    return `---
name: ${role.name}
description: ${role.description}
---

# PUAX Role: ${role.name}

## 触发条件
${role.triggerConditions.map(c => `- ${c}`).join('\n')}

## 适用任务类型
${role.taskTypes.map(t => `- ${t}`).join('\n')}

## 系统提示词

${role.systemPrompt}
`;
  }

  exportFlavor(flavor: FlavorExportData, _config: PlatformExportConfig): string {
    return [
      `# ${flavor.name} 风味叠加`,
      '',
      flavor.description,
      '',
      '## 关键词',
      ...flavor.keywords.map(k => `- ${k}`),
      '',
      '## 开场白',
      ...flavor.rhetoric.opening.map(r => `> ${r}`)
    ].join('\n');
  }

  generateConfig(_roles: RoleExportData[], _config: PlatformExportConfig): string {
    return JSON.stringify({
      name: 'PUAX for OpenCode',
      version: '3.11.0',
      description: 'AI Agent 激励系统 - OpenCode 版本（进程内插件 + skills）',
      plugin: '.opencode/plugins/puax.js',
      skills: '.opencode/skills/'
    }, null, 2);
  }

  /** 生成 .opencode/plugins/puax.js（Shape B 进程内插件） */
  generateHooks(_config: PlatformExportConfig): HookFile[] {
    return [
      {
        path: '.opencode/plugins/puax.js',
        content: opencodePlugin({ marker: DEFAULT_MARKER })
      }
    ];
  }

  protected getFileExtension(): string {
    return 'md';
  }

  /** 角色文件落入 .opencode/skills/（与插件 config hook 注册的路径一致） */
  protected getRoleFileName(role: RoleExportData): string {
    return `.opencode/skills/${role.id}.md`;
  }

  protected getFlavorFileName(flavor: FlavorExportData): string {
    return `.opencode/skills/flavor-${flavor.id}.md`;
  }

  protected getConfigFileName(): string {
    return '.opencode/puax-config.json';
  }

  protected supportsFlavorExport(): boolean {
    return true;
  }
}

// 注册适配器
globalAdapterRegistry.register(new OpenCodeAdapter());
