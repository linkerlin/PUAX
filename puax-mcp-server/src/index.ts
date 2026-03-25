#!/usr/bin/env node

import { PuaxMcpServer, ServerConfig, TransportMode } from './server.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * 读取 package.json 版本号
 */
function getVersion(): string {
    const paths = [
        join(__dirname, '..', 'package.json'),     // build/ -> root
        join(__dirname, 'package.json'),            // 直接在 root
        join(process.cwd(), 'package.json')         // 回退到 cwd
    ];
    
    for (const pkgPath of paths) {
        if (existsSync(pkgPath)) {
            try {
                const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
                return pkg.version || '1.0.0';
            } catch {
                continue;
            }
        }
    }
    return '1.5.0';
}

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
            case '--port':
                const portVal = args[++i];
                if (portVal) config.port = parseInt(portVal, 10);
                break;
            case '-H':
            case '--host':
                const hostVal = args[++i];
                if (hostVal) config.host = hostVal;
                break;
            case '-q':
            case '--quiet':
                config.quiet = true;
                break;
            case '--stdio':
                config.transport = 'stdio';
                break;
            case '-t':
            case '--transport':
                const transportVal = args[++i];
                if (transportVal === 'stdio' || transportVal === 'http') {
                    config.transport = transportVal as TransportMode;
                }
                break;
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
    const version = getVersion();
    console.log(`
PUAX MCP Server v${version}

为 AI Agent 提供 PUAX 角色选择、切换和激活功能的 MCP 服务器

用法:
  puax-mcp-server [选项]
  npx puax-mcp-server [选项]
  node build/index.js [选项]

服务器选项:
  -p, --port <端口>        指定监听端口 (默认: 2333)
  -H, --host <主机>        指定监听主机 (默认: 127.0.0.1)
  -t, --transport <模式>   传输模式: http 或 stdio (默认: http)
  --stdio                  使用 STDIO 模式（等效于 --transport=stdio）
  -q, --quiet              静默模式，减少日志输出
  -v, --version            显示版本号
  -h, --help               显示此帮助信息

导出选项:
  --export <平台>          导出角色到指定平台 (cursor|vscode|all)
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
    console.log(`puax-mcp-server v${getVersion()}`);
}

/**
 * 显示支持的平台列表
 */
async function showPlatforms(): Promise<void> {
    const { globalAdapterRegistry } = await import('../../platform-adapters/base-adapter.js');
    await import('../../platform-adapters/cursor-adapter.js');
    await import('../../platform-adapters/vscode-adapter.js');
    
    const platforms = globalAdapterRegistry.getSupportedPlatforms();
    console.log('\n支持的平台:');
    for (const platform of platforms) {
        const adapter = globalAdapterRegistry.get(platform);
        if (adapter) {
            const langs = ['zh', 'en'].filter(l => adapter.supportsLanguage(l)).join(', ');
            console.log(`  - ${platform} (支持语言: ${langs})`);
        }
    }
    console.log('\n使用示例:');
    console.log('  puax-mcp-server --export=cursor --output=./.cursor/rules');
    console.log('  puax-mcp-server --export=all --output=./puax-export\n');
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

    // 处理平台列表请求
    if (args.includes('--list-platforms')) {
        await showPlatforms();
        process.exit(0);
    }
    
    // 处理导出命令
    if (isExportCommand()) {
        const { handleExportCommand } = await import('./tools/export-platform.js');
        await handleExportCommand(args);
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
    
    // 创建并启动服务器
    const server = new PuaxMcpServer(config);
    
    try {
        await server.run();
    } catch (error) {
        console.error('\x1b[31m[Fatal Error]\x1b[0m', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

// 捕获未处理的 Promise 错误
process.on('unhandledRejection', (reason, promise) => {
    console.error('\x1b[31m[Unhandled Rejection]\x1b[0m', reason);
});

main();
