#!/usr/bin/env node

/**
 * 测试报告生成器
 * 运行所有测试并生成报告
 */

const { spawn } = require('child_process');
const path = require('path');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m'
};

function log(color, ...args) {
    console.log(`${color}${args.join(' ')}${colors.reset}`);
}

class TestReporter {
    constructor() {
        this.results = [];
    }

    async runTest(name, testPath) {
        return new Promise((resolve) => {
            log(colors.cyan, `\n${'='.repeat(60)}`);
            log(colors.cyan, `运行测试: ${name}`);
            log(colors.cyan, `${'='.repeat(60)}`);

            const jestProcess = spawn('npx', [
                'jest',
                testPath,
                '--testTimeout=20000',
                '--forceExit',
                '--verbose'
            ], {
                stdio: 'pipe',
                shell: true,
                cwd: path.join(__dirname)
            });

            let stdout = '';
            let stderr = '';

            jestProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            jestProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            jestProcess.on('close', (code) => {
                const passed = code === 0;
                
                this.results.push({
                    name,
                    testPath,
                    passed,
                    code,
                    stdout,
                    stderr
                });

                if (passed) {
                    log(colors.green, `✅ ${name}: 通过`);
                } else {
                    log(colors.red, `❌ ${name}: 失败`);
                }
                
                resolve();
            });

            jestProcess.on('error', (err) => {
                this.results.push({
                    name,
                    testPath,
                    passed: false,
                    error: err.message
                });
                log(colors.red, `❌ ${name}: 错误 - ${err.message}`);
                resolve();
            });
        });
    }

    generateReport() {
        log(colors.blue, '\n' + '='.repeat(60));
        log(colors.blue, '测试报告');
        log(colors.blue, '='.repeat(60));

        const passedTests = this.results.filter(r => r.passed);
        const failedTests = this.results.filter(r => !r.passed);
        const totalTests = this.results.length;

        log(colors.cyan, '\n测试汇总:');
        log(colors.green, `  ✅ 通过: ${passedTests.length}/${totalTests}`);
        log(colors.red, `  ❌ 失败: ${failedTests.length}/${totalTests}`);

        if (failedTests.length > 0) {
            log(colors.red, '\n失败详情:');
            failedTests.forEach(test => {
                log(colors.red, `  - ${test.name}`);
                if (test.error) {
                    log(colors.red, `    错误: ${test.error}`);
                }
            });
        }

        log(colors.blue, '\n' + '='.repeat(60));
        if (failedTests.length === 0) {
            log(colors.green, '🎉 所有测试通过！');
        } else {
            log(colors.yellow, '⚠️  部分测试失败，请查看详细信息');
        }
        log(colors.blue, '='.repeat(60) + '\n');

        return failedTests.length === 0 ? 0 : 1;
    }

    async runAllTests() {
        log(colors.blue, '='.repeat(60));
        log(colors.blue, 'PUAX MCP Server - 完整测试套件');
        log(colors.blue, '='.repeat(60));

        const tests = [
            // ['单元测试', 'test/unit/server.test.js'],
            ['HTTP 端点测试', 'test/http/endpoint.test.js'],
            ['SSE 传输测试', 'test/sse/transport.test.js'],
            ['工具功能测试', 'test/tools/tools.test.js'],
            ['集成测试', 'test/integration/mcp-flow.test.js']
        ];

        for (const [name, path] of tests) {
            await this.runTest(name, path);
        }

        return this.generateReport();
    }
}

async function main() {
    const reporter = new TestReporter();
    const exitCode = await reporter.runAllTests();
    process.exit(exitCode);
}

if (require.main === module) {
    main().catch((err) => {
        console.error(colors.red, '致命错误:', err);
        process.exit(1);
    });
}

module.exports = { TestReporter };