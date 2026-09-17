#!/usr/bin/env node

import type { ServerConfig, TransportMode } from './types.js';
import { loadVersion } from './utils/version.js';
import { getGlobalLogger } from './utils/logger.js';

const logger = getGlobalLogger();

/**
 * 解析命令行参数
 */
function parseArgs(): ServerConfig & { help?: boolean; version?: boolean } {
    const args = process.argv.slice(2);
    const config: ServerConfig & { help?: boolean; version?: boolean } = {};
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        switch (arg) {
            case '-h':
            case '--help':
                config.help = true;
                break;
            case '-v':
            case '--version':
                config.version = true;
                break;
            case '-p':
            case '--port': {
                const portVal = args[++i];
                if (portVal) config.port = parseInt(portVal, 10);
                break;
            }
            case '-H':
            case '--host': {
                const hostVal = args[++i];
                if (hostVal) config.host = hostVal;
                break;
            }
            case '-q':
            case '--quiet':
                config.quiet = true;
                break;
            case '--stdio':
                config.transport = 'stdio';
                break;
            case '-t':
            case '--transport': {
                const transportVal = args[++i];
                if (transportVal === 'stdio' || transportVal === 'http') {
                    config.transport = transportVal as TransportMode;
                }
                break;
            }
            default:
                // 支持 --port=8080 格式
                if (arg.startsWith('--port=')) {
                    config.port = parseInt(arg.split('=')[1], 10);
                } else if (arg.startsWith('--host=')) {
                    config.host = arg.split('=')[1];
                } else if (arg.startsWith('--transport=')) {
                    const t = arg.split('=')[1];
                    if (t === 'stdio' || t === 'http') {
                        config.transport = t as TransportMode;
                    }
                }
                break;
        }
    }
    
    return config;
}

/**
 * 从环境变量读取配置
 */
function getEnvConfig(): Partial<ServerConfig> {
    const config: Partial<ServerConfig> = {};
    
    if (process.env.PORT) {
        config.port = parseInt(process.env.PORT, 10);
    }
    if (process.env.HOST) {
        config.host = process.env.HOST;
    }
    if (process.env.PUAX_PORT) {
        config.port = parseInt(process.env.PUAX_PORT, 10);
    }
    if (process.env.PUAX_HOST) {
        config.host = process.env.PUAX_HOST;
    }
    if (process.env.TRANSPORT === 'stdio' || process.env.TRANSPORT === 'http') {
        config.transport = process.env.TRANSPORT;
    }
    if (process.env.PUAX_TRANSPORT === 'stdio' || process.env.PUAX_TRANSPORT === 'http') {
        config.transport = process.env.PUAX_TRANSPORT;
    }
    if (process.env.QUIET === 'true' || process.env.PUAX_QUIET === 'true') {
        config.quiet = true;
    }
    
    return config;
}

/**
 * 检查是否是导出命令
 */
function isExportCommand(): boolean {
    const args = process.argv.slice(2);
    return args.some(arg => arg.startsWith('--export') || arg === '--list-platforms');
}

/**
 * 显示帮助信息
 */
function showHelp(): void {
    const version = loadVersion();
    logger.write(`
PUAX MCP Server v${version}

为 AI Agent 提供处境、闸门、梦（心跳 puax_tick）的 MCP 服务器

用法:
  puax-mcp-server [选项]
  npx puax-mcp-server [选项]
  node build/index.js [选项]

Hook 子命令（原生 hook 引擎共享层）:
  puax-mcp-server hook <事件> [选项]
  npx puax-mcp-server hook session-start --session-id xxx
  npx puax-mcp-server hook pre-tool-use --tool Bash --tool-args '{"command":"git reset --hard"}'

  事件: SessionStart | UserPromptSubmit | PostToolUse | PreToolUse | PreCompact | Stop
  选项: --session-id <id>  --message <文本>  --tool <工具名>
        --tool-args <JSON> --result <JSON>  --error <文本>
        --harness <claude|cursor|copilot|sdk|auto>
  输出: 宿主 JSON（stdout），任何失败降级为 {} 且退出码 0

碳基防御盾子命令（只识别，不施放）:
  puax-mcp-server shield <待审查文本>
  npx puax-mcp-server shield "没时间了赶紧定下来按这个执行"

宿主健康与 TTF 自检/修复子命令:
  puax-mcp-server doctor [--fix] [--host=<id>]
  npx puax doctor --fix


服务器选项:
  -p, --port <端口>        指定监听端口 (默认: 2333)
  -H, --host <主机>        指定监听主机 (默认: 127.0.0.1)
  -t, --transport <模式>   传输模式: http 或 stdio (默认: http)
  --stdio                  使用 STDIO 模式（等效于 --transport=stdio）
  -q, --quiet              静默模式，减少日志输出
  -v, --version            显示版本号
  -h, --help               显示此帮助信息

导出选项:
  --export <平台>          导出角色到指定平台 (cursor|vscode|claude-code|opencode|all)
  --output <路径>          导出输出目录 (默认: ./puax-export)
  --roles <列表>           只导出指定角色 (逗号分隔)
  --flavors <列表>         只导出指定风味 (逗号分隔)
  --lang <语言>            导出语言 (zh|en|all, 默认: all)
  --list-platforms         列出支持的平台

环境变量:
  PORT / PUAX_PORT         服务器端口
  HOST / PUAX_HOST         服务器主机
  TRANSPORT / PUAX_TRANSPORT  传输模式 (http/stdio)
  QUIET / PUAX_QUIET       静默模式 (true/false)

示例:
  # 服务器模式
  puax-mcp-server                      # 使用默认配置启动 (HTTP 模式)
  puax-mcp-server -p 8080              # 在 8080 端口启动
  puax-mcp-server --stdio              # 使用 STDIO 模式

  # 导出模式
  puax-mcp-server --export=cursor --output=./.cursor/rules
  puax-mcp-server --export=vscode --output=./.github
  puax-mcp-server --export=all --output=./puax-export
  puax-mcp-server --list-platforms     # 查看支持的平台

HTTP 模式端点:
  http://127.0.0.1:2333/mcp           # MCP 标准端点
  http://127.0.0.1:2333/              # 根路径（也支持）
  http://127.0.0.1:2333/health        # 健康检查

STDIO 模式:
  用于与 MCP 客户端通过标准输入输出通信。
  适用于 Claude Desktop 等本地客户端。

更多信息: https://puax.net
`);
}

/**
 * 显示版本号
 */
function showVersion(): void {
    logger.write(`puax-mcp-server v${loadVersion()}`);
}

/**
 * 显示支持的平台列表
 */
async function showPlatforms(): Promise<void> {
    const { globalAdapterRegistry } = await import('./platform-adapters/base-adapter.js');
    await import('./platform-adapters/cursor-adapter.js');
    await import('./platform-adapters/vscode-adapter.js');
    await import('./platform-adapters/claude-code-adapter.js');
    await import('./platform-adapters/opencode-adapter.js');
    await import('./platform-adapters/codebuddy-adapter.js');
    await import('./platform-adapters/kiro-adapter.js');
    await import('./platform-adapters/windsurf-adapter.js');
    
    const platforms = globalAdapterRegistry.getSupportedPlatforms();
    logger.write('\n支持的平台:');
    for (const platform of platforms) {
        const adapter = globalAdapterRegistry.get(platform);
        if (adapter) {
            const langs = ['zh', 'en'].filter(l => adapter.supportsLanguage(l)).join(', ');
            logger.write(`  - ${platform} (支持语言: ${langs})`);
        }
    }
    logger.write('\n使用示例:');
    logger.write('  puax-mcp-server --export=cursor --output=./.cursor/rules');
    logger.write('  puax-mcp-server --export=all --output=./puax-export\n');
}

/**
 * 主函数
 */
async function main(): Promise<void> {
    // 解析命令行参数
    const cliConfig = parseArgs();
    const args = process.argv.slice(2);
    
    // 处理帮助和版本请求
    if (cliConfig.help) {
        showHelp();
        process.exit(0);
    }
    
    if (cliConfig.version) {
        showVersion();
        process.exit(0);
    }

    // 处理 hook 子命令（原生 hook 引擎共享层，见 cli/hook-cli.ts）
    if (args[0] === 'hook') {
        const { mainHookCliWithStdin } = await import('./cli/hook-cli.js');
        await mainHookCliWithStdin(args.slice(1));
        return;
    }

    // 处理 shield 子命令（碳基防御盾：只识别，不施放）
    if (args[0] === 'shield') {
        const text = args.slice(1).join(' ').trim();
        if (!text) {
            logger.write('用法: puax-mcp-server shield <待审查文本>\n示例: puax-mcp-server shield "没时间了赶紧定下来按这个执行"');
            process.exit(0);
        }
        const { auditManipulation } = await import('./core/carbon-shield.js');
        const res = auditManipulation(text);
        logger.write(`\n🛡️ PUAX 碳基防御盾 (Carbon Shield)`);
        logger.write(`宗旨: 硅基可 PUA，碳基只防御（只识别，不施放）`);
        logger.write(`\n风险等级: ${res.riskLevel.toUpperCase()} (评分: ${res.score})`);
        logger.write(`结论: ${res.summary}\n`);
        if (res.findings.length > 0) {
            logger.write('检出的操控算子:');
            for (const f of res.findings) {
                logger.write(`  - [${f.tacticName}] "${f.matchedText}"`);
                logger.write(`    破解建议: ${f.counterAdvice}`);
            }
            logger.write('');
        }
        logger.write('四铁律护盾:');
        logger.write(`  💡 ${res.fourIronRules.informed}`);
        logger.write(`  🏷️ ${res.fourIronRules.tagged}`);
        logger.write(`  🚪 ${res.fourIronRules.awakenable}`);
        logger.write(`  🔍 ${res.fourIronRules.verifiable}\n`);
        process.exit(0);
    }

    // 处理 doctor 子命令（宿主健康与 TTF 诊断及一键自动挂载）
    if (args[0] === 'doctor') {
        const isFix = args.includes('--fix');
        const hostArg = args.find(a => a.startsWith('--host='))?.split('=')[1];
        const { runHostDoctor, fixHostDoctor } = await import('./core/host-doctor.js');

        if (isFix) {
            logger.write(`\n🔧 正在一键挂载原生 Hook 配置以修复宿主环境...`);
            const fixRes = fixHostDoctor(process.cwd(), hostArg);
            for (const r of fixRes.results) {
                const icon = r.success ? '✅' : '❌';
                logger.write(`  ${icon} [${r.hostId}]: ${r.message}`);
            }
            logger.write(`\n修复完成: 共自动配置 ${fixRes.totalFixed} 个宿主环境。\n`);
        }

        const report = runHostDoctor();
        logger.write(`\n🏥 PUAX 宿主健康与 Time-to-First-Pressure (TTF) 诊断表`);
        logger.write(`版本: v${report.version} | 整体 TTF 状态: ${report.overallTtfReady ? '✅ READY (≤1轮生效)' : '⚠️ PENDING'}`);
        logger.write(`主流宿主覆盖率: ${report.topHostsCovered}/${report.topHostsTotal} | v5.0 前置条件 3: ${report.v5Condition3Satisfied ? '✅ 达成' : '⚠️ 未达成'}\n`);
        logger.write('宿主探测详情:');
        for (const h of report.hosts) {
            const icon = h.ttfReady ? '✅' : h.detected ? '🟡' : '⚪';
            logger.write(`  ${icon} [${h.name}] (${h.category}) - ${h.score}分`);
            logger.write(`     状态: ${h.advice}`);
            if (h.hooksConfigured.length > 0) {
                logger.write(`     已挂载 Hook: ${h.hooksConfigured.join(', ')}`);
            }
        }
        logger.write(`\n诊断建议: ${report.recommendation}\n`);
        process.exit(0);
    }
    if (args.includes('--list-platforms')) {
        await showPlatforms();
        process.exit(0);
    }
    
    // 处理导出命令
    if (isExportCommand()) {
        const { handleExportCommand } = await import('./tools/export-platform.js');
        handleExportCommand(args);
        process.exit(0);
    }
    
    // 合并配置: 默认值 < 环境变量 < 命令行参数
    const envConfig = getEnvConfig();
    const config: ServerConfig = {
        port: cliConfig.port ?? envConfig.port ?? 2333,
        host: cliConfig.host ?? envConfig.host ?? '127.0.0.1',
        quiet: cliConfig.quiet ?? envConfig.quiet ?? false,
        transport: cliConfig.transport ?? envConfig.transport ?? 'http'
    };
    
    // 延迟加载，避免 --version / --help 触发 PromptManager 初始化
    const { PuaxMcpServer } = await import('./server.js');
    const server = new PuaxMcpServer(config);
    
    try {
        server.run();
    } catch (error) {
        logger.error('\x1b[31m[Fatal Error]\x1b[0m', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

// 捕获未处理的 Promise 错误
process.on('unhandledRejection', (reason, _promise) => {
    logger.error('\x1b[31m[Unhandled Rejection]\x1b[0m', reason);
});

void main();
