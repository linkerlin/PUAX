#!/usr/bin/env node

/**
 * 运行所有测试（确保服务器运行）
 */

const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m',
    gray: '\x1b[37m'
};

function log(color, ...args) {
    console.log(`${color}${args.join(' ')}${colors.reset}`);
}

function waitForServer(url = 'http://localhost:23333/health', timeout = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        let attempt = 0;
        
        const checkServer = () => {
            attempt++;
            const req = http.get(url, (res) => {
                if (res.statusCode === 200) {
                    log(colors.green, '✅ 服务器响应正常');
                    resolve();
                } else {
                    if (Date.now() - startTime < timeout) {
                        setTimeout(checkServer, 500);
                    } else {
                        reject(new Error('等待服务器响应超时'));
                    }
                }
            });
            
            req.on('error', () => {
                if (Date.now() - startTime < timeout) {
                    if (attempt % 5 === 0) {
                        log(colors.gray, `  等待服务器响应... (${attempt}次尝试)`);
                    }
                    setTimeout(checkServer, 500);
                } else {
                    reject(new Error('等待服务器响应超时'));
                }
            });
            
            req.setTimeout(2000, () => {
                req.destroy();
                if (Date.now() - startTime < timeout) {
                    setTimeout(checkServer, 500);
                } else {
                    reject(new Error('等待服务器超时'));
                }
            });
        };
        
        checkServer();
    });
}

async function runTest(testPath) {
    const testName = path.basename(testPath).replace('.test.js', '');
    const testDir = path.dirname(testPath);
    log(colors.cyan, `\n${'='.repeat(60)}`);
    log(colors.cyan, `运行测试: ${testName}`);
    log(colors.cyan, `${'='.repeat(60)}`);
    
    return new Promise((resolve) => {
        const args = [
            'jest',
            testPath,
            '--testTimeout=15000',
            '--forceExit',
            '--verbose'
        ];
        
        const cwd = process.cwd();
        log(colors.gray, `  目录: ${cwd}`);
        log(colors.gray, `  命令: npx ${args.join(' ')}`);
        
        const jestProcess = spawn('npx', args, {
            stdio: 'inherit',
            shell: true,
            cwd: cwd,
            env: {
                ...process.env,
                TEST_SERVER_RUNNING: 'true'
            }
        });

        jestProcess.on('close', (code) => {
            log(colors.cyan, `\n  完成: ${code === 0 ? '✅' : '❌'} ${testName} (退出码: ${code})`);
            resolve({ testPath, code });
        });

        jestProcess.on('error', (err) => {
            log(colors.red, `运行失败: ${err.message}`);
            resolve({ testPath, code: 1, error: err.message });
        });
    });
}

async function main() {
    log(colors.blue, '\n' + '='.repeat(60));
    log(colors.blue, 'PUAX MCP Server - 运行所有测试');
    log(colors.blue, '='.repeat(60));

    // 启动服务器
    log(colors.cyan, '\n✨ 步骤1: 启动服务器...');
    const serverPath = path.join(__dirname, 'build', 'index.js');
    const serverProcess = spawn('node', [serverPath], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
            ...process.env,
            TEST_SERVER_RUNNING: 'true'
        }
    });

    // 捕获
    serverProcess.stdout.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg.includes('listening') || msg.includes('Listening')) {
            console.log(`[Server 🟢] ${msg}`);
        }
    });

    serverProcess.stderr.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg.includes('error') || msg.includes('Error')) {
            console.log(`[Server 🔴] ${msg}`);
        }
    });

    // 等待服务器就绪
    log(colors.cyan, '\n⏳ 步骤2: 等待服务器准备就绪...');
    try {
        await waitForServer();
        log(colors.green, '✅ 服务器已就绪');
    } catch (error) {
        log(colors.red, `❌ 服务器启动失败: ${error.message}`);
        serverProcess.kill('SIGTERM');
        process.exit(1);
    }

    // 运行测试（按顺序）
    log(colors.cyan, '\n🧪 步骤3: 运行测试...\n');
    
    // 使用实际存在的测试文件
    const testFiles = [
        'test/unit/server.test.js',              // 5个测试 - HTTP基础
        'test/http/endpoint-simple.test.js',     // 9个测试 - HTTP端点
        'test/sse/transport-minimal.test.js',    // 1个测试 - SSE基础
        'test/tools/tools-minimal.test.js',      // 1个测试 - 工具基础
        'test/integration/mcp-flow-minimal.test.js', // 1个测试 - 集成基础
        'test/unit/server-minimal.test.js',      // 1个测试 - 单元基础
        'test/http/endpoint-minimal.test.js'     // 1个测试 - HTTP基础
    ];

    const results = [];
    for (const testFile of testFiles) {
        const result = await runTest(testFile);
        results.push(result);
    }

    // 停止服务器
    log(colors.cyan, '\n🛑 步骤4: 停止服务器...');
    serverProcess.kill('SIGTERM');

    // 等待一下确保服务器关闭
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 生成报告
    log(colors.blue, '\n' + '='.repeat(60));
    log(colors.blue, '测试报告');
    log(colors.blue, '='.repeat(60));

    let passed = 0;
    let failed = 0;

    results.forEach(result => {
        const name = path.basename(result.testPath).replace('.test.js', '');
        if (result.code === 0) {
            log(colors.green, `  ✅ ${name}`);
            passed++;
        } else {
            log(colors.red, `  ❌ ${name} (退出码: ${result.code})`);
            failed++;
        }
    });

    log(colors.blue, `\n${'='.repeat(60)}`);
    log(colors.cyan, '汇总:');
    log(colors.green, `  通过: ${passed}`);
    log(colors.red, `  失败: ${failed}`);
    log(colors.blue, `${'='.repeat(60)}`);

    if (failed === 0) {
        log(colors.green, '\n🎉 所有测试成功完成！\n');
        process.exit(0);
    } else {
        log(colors.yellow, `\n⚠️  ${failed} 个测试套件失败\n`);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch((err) => {
        console.error(colors.red, '致命错误:', err);
        process.exit(1);
    });
}

module.exports = { runTest, waitForServer };