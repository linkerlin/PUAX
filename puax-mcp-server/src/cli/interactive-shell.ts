/**
 * PUAX Interactive CLI
 *
 * Interactive shell for PUAX commands with readline support.
 */

import * as readline from 'readline';
import { getGlobalLogger } from '../utils/logger.js';
import { CommandRegistry, globalCommandRegistry, CommandContext } from '../commands/command-registry.js';

const logger = getGlobalLogger();

// ============================================================================
// Interactive Shell
// ============================================================================

export class InteractiveShell {
  private rl: readline.Interface | null = null;
  private running = false;
  private registry: CommandRegistry;
  private sessionId: string;

  constructor(sessionId?: string) {
    this.registry = globalCommandRegistry;
    this.sessionId = sessionId || this.generateSessionId();
  }

  private generateSessionId(): string {
    return `puax-cli-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async start(): Promise<void> {
    this.running = true;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '\x1b[36mpuax>\x1b[0m '
    });

    this.printBanner();
    this.printHelp();

    this.rl.prompt();

    this.rl.on('line', async (line) => {
      const input = line.trim();
      if (input) {
        await this.handleInput(input);
      }
      this.rl?.prompt();
    });

    this.rl.on('close', () => {
      this.running = false;
      console.log('\n再见！👋\n');
    });
  }

  private printBanner(): void {
    console.log(`
\x1b[36m╔═══════════════════════════════════════════════════════════════╗
║     P U A X  Interactive Shell  v3.5.0                      ║
║     AI Agent 激励引擎 - 企业风味 + 四权分离 + 确定性触发     ║
╚═══════════════════════════════════════════════════════════════╝\x1b[0m
    `);
  }

  private printHelp(): void {
    console.log(`
\x1b[33m可用命令:\x1b[0m
  \x1b[32m/puax p7\x1b[0m     - 激活P7执行模式
  \x1b[32m/puax p9\x1b[0m     - 激活P9技术领导模式
  \x1b[32m/puax p10\x1b[0m    - 激活P10 CTO战略模式
  \x1b[32m/puax yes\x1b[0m    - ENFP鼓励模式
  \x1b[32m/puax mama\x1b[0m   - 中国妈妈唠叨模式
  \x1b[32m/puax loop\x1b[0m    - 自动迭代模式
  \x1b[32m/puax flavor\x1b[0m  - 切换企业风味
  \x1b[32m/puax help\x1b[0m    - 显示帮助
  \x1b[32m/exit\x1b[0m       - 退出

\x1b[33m快捷方式:\x1b[0m
  \x1b[36mp7\x1b[0m, \x1b[36mp9\x1b[0m, \x1b[36mp10\x1b[0m - 直接激活对应模式
  \x1b[36mflavor\x1b[0m <name>  - 切换风味 (alibaba, huawei, musk, etc.)
    `);
  }

  private async handleInput(input: string): Promise<void> {
    try {
      if (input === 'exit' || input === 'quit' || input === 'q') {
        this.rl?.close();
        return;
      }

      if (input === 'help' || input === '?') {
        this.printHelp();
        return;
      }

      const commandLine = input.startsWith('/') ? input.slice(1) : input;
      const [cmd, ...args] = commandLine.split(/\s+/);

      const ctx: CommandContext = {
        sessionId: this.sessionId,
        args
      };

      const result = await this.registry.execute(cmd, ctx);

      if (result.success) {
        console.log(`\x1b[32m✓\x1b[0m ${result.message}`);
      } else {
        console.log(`\x1b[31m✗\x1b[0m ${result.message}`);
      }
    } catch (error) {
      logger.error('[InteractiveShell] Error handling input:', error);
      console.log(`\x1b[31m错误: ${error}\x1b[0m`);
    }
  }

  stop(): void {
    this.running = false;
    this.rl?.close();
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

export async function startCLI(args: string[]): Promise<void> {
  const sessionId = args.find(arg => arg.startsWith('--session='))?.split('=')[1];

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
PUAX Interactive CLI

用法: puax-cli [选项]

选项:
  --session=<id>  指定会话ID
  --help, -h      显示帮助

示例:
  puax-cli
  puax-cli --session=my-session
    `);
    return;
  }

  const shell = new InteractiveShell(sessionId);
  await shell.start();
}