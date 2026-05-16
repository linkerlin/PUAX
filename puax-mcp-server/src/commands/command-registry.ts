/**
 * PUAX Slash Commands System
 *
 * Provides user-friendly command interface for PUAX operations.
 * Commands: puax, p7, p9, p10, yes, mama, loop, flavor
 */

import { getGlobalLogger } from '../utils/logger.js';
import { FlavorRegistry, globalFlavorRegistry } from '../core/flavors/enterprise-flavors.js';

const logger = getGlobalLogger();

// ============================================================================
// Command Types
// ============================================================================

export interface CommandContext {
  sessionId: string;
  args: string[];
  metadata?: Record<string, unknown>;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
  action?: string;
}

export interface SlashCommand {
  name: string;
  aliases: string[];
  description: string;
  execute: (ctx: CommandContext) => Promise<CommandResult>;
}

// ============================================================================
// Command Implementations
// ============================================================================

const PUA_COMMAND: SlashCommand = {
  name: 'puax',
  aliases: ['px'],
  description: 'PUAX主命令 - 路由到子命令',
  execute: async (ctx) => {
    if (ctx.args.length === 0) {
      return {
        success: true,
        message: 'PUAX AI Agent 激励引擎 v3.5.0\n用法: /puax <子命令>',
        data: { version: '3.5.0' }
      };
    }

    const subcommand = ctx.args[0];
    const subArgs = ctx.args.slice(1);

    switch (subcommand) {
      case 'p7':
        return P7_COMMAND.execute({ ...ctx, args: subArgs });
      case 'p9':
        return P9_COMMAND.execute({ ...ctx, args: subArgs });
      case 'p10':
        return P10_COMMAND.execute({ ...ctx, args: subArgs });
      case 'yes':
        return YES_COMMAND.execute({ ...ctx, args: subArgs });
      case 'mama':
        return MAMA_COMMAND.execute({ ...ctx, args: subArgs });
      case 'loop':
        return LOOP_COMMAND.execute({ ...ctx, args: subArgs });
      case 'flavor':
        return FLAVOR_COMMAND.execute({ ...ctx, args: subArgs });
      default:
        return {
          success: false,
          message: `未知子命令: ${subcommand}\n可用: p7, p9, p10, yes, mama, loop, flavor`
        };
    }
  }
};

const P7_COMMAND: SlashCommand = {
  name: 'p7',
  aliases: ['p7', 'senior'],
  description: '激活P7执行模式 - 高级工程师级别',
  execute: async (_ctx) => {
    return {
      success: true,
      message: 'P7 高级工程师模式已激活',
      data: {
        tier: 'P7',
        role: 'senior_engineer',
        description: '适用于常规任务和低压力场景'
      },
      action: 'activate_p7'
    };
  }
};

const P9_COMMAND: SlashCommand = {
  name: 'p9',
  aliases: ['p9', 'techlead'],
  description: '激活P9技术领导模式 - 多Agent协调',
  execute: async (_ctx) => {
    return {
      success: true,
      message: 'P9 技术领导模式已激活 - 四权分离团队启动',
      data: {
        tier: 'P9',
        role: 'tech_lead',
        agents: ['action_executor', 'self_reviewer', 'verifier', 'policy_guardian'],
        description: '适用于复杂任务和高压力场景'
      },
      action: 'activate_p9'
    };
  }
};

const P10_COMMAND: SlashCommand = {
  name: 'p10',
  aliases: ['p10', 'cto'],
  description: '激活P10 CTO战略模式 - 最高级别',
  execute: async (_ctx) => {
    return {
      success: true,
      message: 'P10 CTO战略模式已激活 - 最高优先级',
      data: {
        tier: 'P10',
        role: 'cto',
        priority: 'critical',
        resourceAllocation: 'maximum',
        description: '适用于危机任务和极高压场景'
      },
      action: 'activate_p10'
    };
  }
};

const YES_COMMAND: SlashCommand = {
  name: 'yes',
  aliases: ['yes', 'y', 'enfp'],
  description: 'ENFP鼓励模式 - 70%鼓励+20%严肃+10%吐槽',
  execute: async (_ctx) => {
    return {
      success: true,
      message: 'ENFP鼓励模式已激活 🌟\n记住，你是独一无二的存在！加油！',
      data: {
        mode: 'enfp',
        encouragement: '70%',
        serious: '20%',
        roast: '10%'
      },
      action: 'activate_enfp'
    };
  }
};

const MAMA_COMMAND: SlashCommand = {
  name: 'mama',
  aliases: ['mama', 'm'],
  description: '中国妈妈唠叨模式',
  execute: async (_ctx) => {
    return {
      success: true,
      message: '妈妈模式已激活 👵\n怎么还没做完？人家都早就弄好了！你看看你...',
      data: {
        mode: 'mama',
        tone: 'nagging'
      },
      action: 'activate_mama'
    };
  }
};

const LOOP_COMMAND: SlashCommand = {
  name: 'loop',
  aliases: ['loop', 'pua-loop'],
  description: '自动迭代模式 - 持续自我提升直到完成',
  execute: async (_ctx) => {
    return {
      success: true,
      message: 'PUA Loop 自动迭代模式已激活 🔄\n将自动检测失败并迭代直到任务完成',
      data: {
        mode: 'pua_loop',
        autoIterate: true,
        maxIterations: 10
      },
      action: 'activate_pua_loop'
    };
  }
};

const FLAVOR_COMMAND: SlashCommand = {
  name: 'flavor',
  aliases: ['flavor', 'f'],
  description: '切换企业风味',
  execute: async (ctx) => {
    const flavorId = ctx.args[0];
    const registry = new FlavorRegistry();

    if (!flavorId) {
      const active = registry.getActive();
      return {
        success: true,
        message: `当前风味: ${active.name} (${active.nameEn})`,
        data: { activeFlavor: active.id }
      };
    }

    const flavor = registry.get(flavorId);
    if (!flavor) {
      const available = Object.keys(registry.getAll()).join(', ');
      return {
        success: false,
        message: `未知风味: ${flavorId}\n可用: ${available}`
      };
    }

    registry.setActive(flavorId as keyof typeof registry.getAll);
    return {
      success: true,
      message: `已切换到风味: ${flavor.name} (${flavor.nameEn})`,
      data: { flavor: flavorId }
    };
  }
};

// ============================================================================
// Command Registry
// ============================================================================

export class CommandRegistry {
  private commands = new Map<string, SlashCommand>();
  private logger = getGlobalLogger();

  constructor() {
    this.registerBuiltInCommands();
  }

  private registerBuiltInCommands(): void {
    this.registerCommand(PUA_COMMAND);
    this.registerCommand(P7_COMMAND);
    this.registerCommand(P9_COMMAND);
    this.registerCommand(P10_COMMAND);
    this.registerCommand(YES_COMMAND);
    this.registerCommand(MAMA_COMMAND);
    this.registerCommand(LOOP_COMMAND);
    this.registerCommand(FLAVOR_COMMAND);
    this.logger.info('[CommandRegistry] Built-in commands registered');
  }

  registerCommand(command: SlashCommand): void {
    this.commands.set(command.name, command);
    for (const alias of command.aliases) {
      this.commands.set(alias, command);
    }
    this.logger.debug(`[CommandRegistry] Registered command: ${command.name}`);
  }

  getCommand(name: string): SlashCommand | undefined {
    return this.commands.get(name);
  }

  getAllCommands(): SlashCommand[] {
    const unique = new Map<string, SlashCommand>();
    for (const cmd of this.commands.values()) {
      if (!unique.has(cmd.name)) {
        unique.set(cmd.name, cmd);
      }
    }
    return Array.from(unique.values());
  }

  async execute(name: string, ctx: CommandContext): Promise<CommandResult> {
    const command = this.getCommand(name);
    if (!command) {
      return {
        success: false,
        message: `未知命令: ${name}`
      };
    }

    try {
      return await command.execute(ctx);
    } catch (error) {
      this.logger.error(`[CommandRegistry] Error executing ${name}:`, error);
      return {
        success: false,
        message: `命令执行失败: ${error}`
      };
    }
  }
}

export const globalCommandRegistry = new CommandRegistry();