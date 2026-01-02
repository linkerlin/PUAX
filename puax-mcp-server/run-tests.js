#!/usr/bin/env node

/**
 * 测试运行器
 * 提供方便的接口运行各种测试
 */

const { spawn } = require('child_process');
const path = require('path');

// ANSI 颜色代码
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(color, ...args) {
    console.log(`${color}${args.join(' ')}${colors.reset}`);
}

function runTest(command, args = [], description) {
    return new Promise((resolve, reject) => {
        log(colors.cyan, `\n${'='.repeat(60)}`);
        log(colors.cyan, `运行: ${description}`);
        log(colors.cyan, `命令: ${command} ${args.join(' ')}`);
        log(colors.cyan, `${'='.repeat(60)}\n`);

        const proc = spawn(command, args, {
            stdio: 'inherit',
            shell: true,
            cwd: __dirname
        });

        proc.on('close', (code) => {
            if (code === 0) {
                log(colors.green, `\n✓ ${description} 通过`);
                resolve();
            } else {
                log(colors.red, `\n✗ ${description} 失败 (退出码: ${code})`);
                reject(new Error(`测试失败: ${description}`));
            }
        });

        proc.on('error', (err) => {
            log(colors.red, `\n✗ ${description} 出错: ${err.message}`);
            reject(err);
        });
    });
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'all';

    log(colors.bright, '\n🧪 PUAX MCP Server 测试套件\n');

    try {
        switch (command) {
            case 'all':
                // 运行所有测试
                await runTest('npm', ['test'], '所有测试');
                break;

            case 'unit':
                // 单元测试
                await runTest('npm', ['run', 'test:unit'], '单元测试');
                break;

            case 'http':
                // HTTP 端点测试
                await runTest('npm', ['run', 'test:http'], 'HTTP 端点测试');
                break;

            case 'sse':
                // SSE 传输测试
                await runTest('npm', ['run', 'test:sse'], 'SSE 传输测试');
                break;

            case 'tools':
                // 工具功能测试
                await runTest('npm', ['run', 'test:tools'], '工具功能测试');
                break;

            case 'integration':
                // 集成测试
                await runTest('npm', ['run', 'test:integration'], '集成测试');
                break;

            case 'coverage':
                // 覆盖率测试
                await runTest('npm', ['run', 'test:coverage'], '覆盖率测试');
                break;

            case 'smoke':
                // 冒烟测试（快速验证）
                log(colors.yellow, '\n🔥 运行冒烟测试...\n');
                await runTest('npm', ['run', 'test:unit'], '单元测试');
                await runTest('npm', ['run', 'test:http'], 'HTTP 测试');
                log(colors.green, '\n✅ 冒烟测试通过！\n');
                break;

            case 'watch':
                // 监听模式
                await runTest('npm', ['run', 'test:watch'], '监听模式');
                break;

            case 'ci':
                // CI/CD 模式（无交互）
                await runTest('npm', ['run', 'test:coverage', '--', '--ci'], 'CI 测试');
                break;

            default:
                // 显示帮助
                log(colors.bright, '\nPUAX MCP Server 测试运行器\n');
                log(colors.cyan, '用法: node run-tests.js <command>\n');
                log(colors.bright, '可用命令:\n');
                log(colors.yellow, '  all          运行所有测试');
                log(colors.yellow, '  unit         运行单元测试');
                log(colors.yellow, '  http         运行 HTTP 端点测试');
                log(colors.yellow, '  sse          运行 SSE 传输测试');
                log(colors.yellow, '  tools        运行工具功能测试');
                log(colors.yellow, '  integration  运行集成测试');
                log(colors.yellow, '  coverage     运行覆盖率测试');
                log(colors.yellow, '  smoke        运行冒烟测试（快速验证）');
                log(colors.yellow, '  watch        监听模式（开发用）');
                log(colors.yright, '  ci           CI/CD 模式');
                log(colors.yellow, '  help         显示帮助信息\n');
                log(colors.bright, '示例:\n');
                log(colors.blue, '  node run-tests.js smoke    # 快速验证');
                log(colors.blue, '  node run-tests.js coverage # 完整测试带覆盖率\n');
                process.exit(1);
        }

        log(colors.green, '\n' + '='.repeat(60));
        log(colors.green, '所有测试完成！');
        log(colors.green, '='.repeat(60) + '\n');
        process.exit(0);

    } catch (error) {
        log(colors.red, '\n' + '='.repeat(60));
        log(colors.red, '测试运行失败');
        log(colors.red, '='.repeat(60) + '\n');
        console.error(error);
        process.exit(1);
    }
}

// 支持直接运行
if (require.main === module) {
    main().catch(err => {
        console.error('致命错误:', err);
        process.exit(1);
    });
}

module.exports = { runTest };