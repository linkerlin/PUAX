/**
 * Platform Adapter for Trae IDE
 *
 * Trae uses SKILL.md format for skill definitions.
 * Export format: ~/.trae/skills/puax/SKILL.md
 */

import { PlatformAdapter, RoleExportData, FlavorExportData, PlatformExportConfig } from './base-adapter.js';

const SKILL_TEMPLATE = `# {{name}}

## Description

{{description}}

## Trigger Conditions

{{triggerConditions}}

## Task Types

{{taskTypes}}

## Compatible Flavors

{{compatibleFlavors}}

## System Prompt

{{systemPrompt}}

---

*PUAX Skill | v{{metadata.version}} | {{metadata.tone}} tone*
`;

export class TraeAdapter extends PlatformAdapter {
  constructor() {
    super('trae', ['zh', 'en']);
  }

  protected getFileExtension(): string {
    return 'md';
  }

  protected supportsFlavorExport(): boolean {
    return true;
  }

  exportRole(role: RoleExportData, _config: PlatformExportConfig): string {
    let content = SKILL_TEMPLATE;

    content = content.replace(/\{\{name\}\}/g, role.name);
    content = content.replace(/\{\{description\}\}/g, role.description);
    content = content.replace(/\{\{systemPrompt\}\}/g, role.systemPrompt);
    content = content.replace(/\{\{triggerConditions\}\}/g, role.triggerConditions.join(', '));
    content = content.replace(/\{\{taskTypes\}\}/g, role.taskTypes.join(', '));
    content = content.replace(/\{\{compatibleFlavors\}\}/g, role.compatibleFlavors.join(', '));
    content = content.replace(/\{\{metadata\.version\}\}/g, role.metadata.version);
    content = content.replace(/\{\{metadata\.tone\}\}/g, role.metadata.tone);

    return content;
  }

  exportFlavor(flavor: FlavorExportData, _config: PlatformExportConfig): string {
    return `# ${flavor.name}

${flavor.description}

## Keywords

${flavor.keywords.join(', ')}

## Rhetoric

### Opening
${flavor.rhetoric.opening.map(s => `- ${s}`).join('\n')}

### Closing
${flavor.rhetoric.closing.map(s => `- ${s}`).join('\n')}

### Emphasis
${flavor.rhetoric.emphasis.map(s => `- ${s}`).join('\n')}
`;
  }

  generateConfig(roles: RoleExportData[], config: PlatformExportConfig): string {
    const configObj = {
      version: '3.5.0',
      platform: 'trae',
      exportedAt: new Date().toISOString(),
      rolesCount: roles.length,
      roles: roles.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category
      })),
      instructions: `Place this directory at ~/.trae/skills/puax/ for Trae to discover these skills.`
    };

    return JSON.stringify(configObj, null, 2);
  }

  protected getConfigFileName(): string {
    return 'trae-config.json';
  }
}

export const traeAdapter = new TraeAdapter();