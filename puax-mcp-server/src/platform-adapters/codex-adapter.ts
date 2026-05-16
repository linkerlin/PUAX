/**
 * Platform Adapter for OpenAI Codex CLI
 *
 * Codex uses the SKILL.md format for skill definitions.
 * Export format: ~/.codex/skills/puax/SKILL.md
 */

import { PlatformAdapter, RoleExportData, FlavorExportData, PlatformExportConfig } from './base-adapter.js';

const SKILL_TEMPLATE = `---
id: {{id}}
name: {{name}}
description: {{description}}
triggerConditions: {{triggerConditions}}
taskTypes: {{taskTypes}}
compatibleFlavors: {{compatibleFlavors}}
---

# {{name}}

{{systemPrompt}}
`;

const SKILL_METADATA_TEMPLATE = `
## Metadata

- **Category**: {{category}}
- **Tone**: {{metadata.tone}}
- **Intensity**: {{metadata.intensity}}
- **Version**: {{metadata.version}}
`;

export class CodexAdapter extends PlatformAdapter {
  constructor() {
    super('codex', ['zh', 'en']);
  }

  protected getFileExtension(): string {
    return 'md';
  }

  protected supportsFlavorExport(): boolean {
    return false;
  }

  exportRole(role: RoleExportData, _config: PlatformExportConfig): string {
    let content = SKILL_TEMPLATE;

    content = content.replace(/\{\{id\}\}/g, role.id);
    content = content.replace(/\{\{name\}\}/g, role.name);
    content = content.replace(/\{\{description\}\}/g, role.description);
    content = content.replace(/\{\{systemPrompt\}\}/g, role.systemPrompt);
    content = content.replace(/\{\{triggerConditions\}\}/g, role.triggerConditions.join(', '));
    content = content.replace(/\{\{taskTypes\}\}/g, role.taskTypes.join(', '));
    content = content.replace(/\{\{compatibleFlavors\}\}/g, role.compatibleFlavors.join(', '));
    content = content.replace(/\{\{category\}\}/g, role.category);

    const metadataContent = SKILL_METADATA_TEMPLATE
      .replace(/\{\{metadata\.tone\}\}/g, role.metadata.tone)
      .replace(/\{\{metadata\.intensity\}\}/g, role.metadata.intensity)
      .replace(/\{\{metadata\.version\}\}/g, role.metadata.version);

    content += metadataContent;

    return content;
  }

  exportFlavor(_flavor: FlavorExportData, _config: PlatformExportConfig): string {
    return '';
  }

  generateConfig(roles: RoleExportData[], config: PlatformExportConfig): string {
    const configObj = {
      version: '3.5.0',
      platform: 'codex',
      exportedAt: new Date().toISOString(),
      rolesCount: roles.length,
      roles: roles.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category
      })),
      instructions: `Place this directory at ~/.codex/skills/puax/ for Codex to discover these skills.`
    };

    return JSON.stringify(configObj, null, 2);
  }

  protected getConfigFileName(): string {
    return 'config.json';
  }
}

export const codexAdapter = new CodexAdapter();