#!/usr/bin/env node
/**
 * MCP Tool: puax_list_platforms
 */

import { z } from 'zod';
import { globalAdapterRegistry } from '../platform-adapters/base-adapter.js';
import '../platform-adapters/skill-md-platform-adapter.js';
import '../platform-adapters/cursor-adapter.js';
import '../platform-adapters/vscode-adapter.js';
import '../platform-adapters/kiro-adapter.js';
import '../platform-adapters/codebuddy-adapter.js';
import '../platform-adapters/windsurf-adapter.js';

const INSTALL_PATHS: Record<string, string> = {
  cursor: '.cursor/rules/*.mdc',
  vscode: '.github/copilot-instructions.md',
  kiro: '.kiro/steering/*.md',
  codebuddy: 'CodeBuddy skills directory',
  windsurf: '.windsurf/rules/',
  codex: '~/.codex/skills/ or npx skills add',
  opencode: '~/.config/opencode/skills/',
  openclaw: 'OpenClaw skills directory',
  antigravity: 'Google Antigravity agent config',
  trae: 'Trae skills path (see distributions/trae/INSTALL.md)',
  pi: 'pi install ./package or ~/.pi/agent/extensions/puax/',
  mcp: 'npx puax-mcp-server (stdio/http)',
};

export const listPlatformsTool = {
  name: 'puax_list_platforms',
  description: '列出 PUAX 支持的所有平台导出适配器及安装路径。含 MCP 运行时 + skill 文件直装。',
  inputSchema: z.object({}),

  handler: () => {
    const platforms = globalAdapterRegistry.getSupportedPlatforms();
    return {
      total: platforms.length + 1,
      mcp: {
        id: 'mcp',
        install: INSTALL_PATHS.mcp,
        description: 'MCP 运行时引擎（推荐，可编程工具链）',
      },
      platforms: platforms.map(p => ({
        id: p,
        install: INSTALL_PATHS[p] || 'See puax export output',
        export_command: `npx puax-mcp-server --export=${p} --output=./puax-export/${p}`,
      })),
      distributions: {
        claude_code_plugin: 'distributions/claude-code/',
        skills_cli: 'npx skills add linkerlin/PUAX',
        npm: 'npx puax-mcp-server',
      },
      languages: ['zh', 'en'],
      tone_variants: ['strict', 'yes', 'mama'],
    };
  },
};
