/**
 * Claude Code 平台适配器
 * 生成 hooks/hooks.json（SessionStart 注入 + PreToolUse 拦截 + PostToolUse 失败检测）
 * 与 hooks/ 目录下的脚本产物（Phase 1：运行时强制接入）。
 *
 * 对标 obra/superpowers 的 hooks/hooks.json 形态：
 * - SessionStart matcher 只覆盖 startup|clear|compact（排除 resume，恢复会话已有上下文）；
 * - async: false 确保注入在模型首条消息前完成；
 * - 事件脚本统一经 `node hooks/hook.js <event>` 调用引擎共享层（cli/hook-cli.ts）。
 */

import {
  PlatformAdapter,
  RoleExportData,
  FlavorExportData,
  PlatformExportConfig,
  HookFile
} from './base-adapter.js';
import { globalAdapterRegistry } from './base-adapter.js';
import { HOOK_JS, RUN_HOOK_CMD, eventScript, DEFAULT_MARKER } from './hook-templates.js';

/** hooks.json 里被 hook 脚本识别的 PUAX 注入标记（用于去重守卫） */
export const CLAUDE_HOOK_MARKER = DEFAULT_MARKER;

export class ClaudeCodeAdapter extends PlatformAdapter {
  constructor() {
    super('claude-code', ['zh', 'en']);
  }

  exportRole(role: RoleExportData, _config: PlatformExportConfig): string {
    return [
      '# PUAX Role: ' + role.name,
      '',
      '## 角色定位',
      role.description,
      '',
      '## 触发条件',
      ...role.triggerConditions.map(c => `- ${c}`),
      '',
      '## 适用任务类型',
      ...role.taskTypes.map(t => `- ${t}`),
      '',
      '## 系统提示词',
      '',
      role.systemPrompt,
      '',
      '---',
      '*此文件由 PUAX 自动生成 - https://puax.net*'
    ].join('\n');
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
      ...flavor.rhetoric.opening.map(r => `> ${r}`),
      '',
      '## 强调词汇',
      ...flavor.rhetoric.emphasis.map(e => `- **${e}**`)
    ].join('\n');
  }

  generateConfig(roles: RoleExportData[], _config: PlatformExportConfig): string {
    return JSON.stringify({
      name: 'PUAX for Claude Code',
      version: '3.11.0',
      description: 'AI Agent 激励系统 - Claude Code 版本（hooks + skills）',
      roles: roles.map(r => ({ id: r.id, name: r.name, file: `${r.id}.md` })),
      hooks: {
        session_start: { script: 'hooks/hook.js', events: ['SessionStart', 'PreToolUse', 'PostToolUse'] }
      }
    }, null, 2);
  }

  /**
   * 生成 Claude Code 原生 hook 产物：
   * - hooks/hooks.json：宿主配置（SessionStart 注入 / PreToolUse 拦截 / PostToolUse 失败检测）
   * - hooks/hook.js：node 入口（引擎共享层）
   * - hooks/run-hook.cmd：polyglot 分发器（bash 宿主兜底）
   * - hooks/session-start、pre-tool-use、post-tool-use：无扩展名事件脚本
   */
  generateHooks(_config: PlatformExportConfig): HookFile[] {
    const command = (script: string): string => `node "./hooks/hook.js" ${script}`;

    const hooksJson = {
      hooks: {
        SessionStart: [
          {
            matcher: 'startup|clear|compact',
            hooks: [
              { type: 'command', command: command('session-start'), shell: 'bash', async: false }
            ]
          }
        ],
        PreToolUse: [
          {
            matcher: 'Bash|Read|Write|Edit',
            hooks: [
              { type: 'command', command: command('pre-tool-use'), shell: 'bash', async: false }
            ]
          }
        ],
        PostToolUse: [
          {
            matcher: 'Bash',
            hooks: [
              { type: 'command', command: command('post-tool-use'), shell: 'bash', async: false }
            ]
          }
        ]
      }
    };

    return [
      { path: 'hooks/hooks.json', content: JSON.stringify(hooksJson, null, 2) + '\n' },
      { path: 'hooks/hook.js', content: HOOK_JS },
      { path: 'hooks/run-hook.cmd', content: RUN_HOOK_CMD },
      { path: 'hooks/session-start', content: eventScript('session-start') },
      { path: 'hooks/pre-tool-use', content: eventScript('pre-tool-use') },
      { path: 'hooks/post-tool-use', content: eventScript('post-tool-use') }
    ];
  }

  protected getFileExtension(): string {
    return 'md';
  }

  protected getConfigFileName(): string {
    return 'puax-config.json';
  }

  protected supportsFlavorExport(): boolean {
    return true;
  }

  protected getFlavorFileName(flavor: FlavorExportData): string {
    return `flavor-${flavor.id}.md`;
  }
}

// 注册适配器
globalAdapterRegistry.register(new ClaudeCodeAdapter());
