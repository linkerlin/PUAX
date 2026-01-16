#!/usr/bin/env node

/**
 * 测试助手 - 修复版本
 * 先确保服务器运行，再执行 jest
 */

const { spawn } = require('child_process');
const http = require('http');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(color, ...args) {
    console.log(`${color}${args.join(' ')}${colors.reset}`);
}

function waitForServer(url = 'http://localhost:2333/health', timeout = 10000) {
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

async function main() {
    const args = process.argv.slice(2);
    const testPath = args[0] || null;

    log(colors.cyan, '\n============================================================');
    log(colors.cyan, 'PUAX MCP Server - 测试运行器（修复版）');
    log(colors.cyan, '============================================================\n');

    try {
        log(colors.cyan, '步骤1: 启动服务器...');
        
        // 启动服务器
        const serverPath = `${__dirname}/build/index.js`;
        const serverProcess = spawn('node', [serverPath], {
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
                ...process.env,
                TEST_SERVER_RUNNING: 'true'  // 告诉测试服务器正在运行
            }
        });

        // 捕获输出以便调试
        serverProcess.stdout.on('data', (data) => {
            console.log(`[Server] ${data.toString().trim()}`);
        });

        serverProcess.stderr.on('data', (data) => {
            console.log(`[Server Error] ${data.toString().trim()}`);
        });

        // 等待服务器真正就绪
        log(colors.cyan, '\n步骤2: 等待服务器就绪...');
        await waitForServer();

        // 运行 Jest 测试
        log(colors.cyan, '\n步骤3: 运行测试...');
        const jestArgs = ['jest'];
        if (testPath) {
            jestArgs.push(testPath);
        }
        jestArgs.push('--testTimeout=20000');
        jestArgs.push('--forceExit');

        const jestProcess = spawn('npx', jestArgs, {
            stdio: 'inherit',
            shell: true,
            cwd: __dirname,
            env: {
                ...process.env,
                TEST_SERVER_RUNNING: 'true'  // 传递给 Jest
            }
        });

        jestProcess.on('close', (code) => {
            log(colors.cyan, '\n步骤4: 停止服务器...');
            serverProcess.kill('SIGTERM');
            
            setTimeout(() => {
                log(colors.cyan, '============================================================');
                if (code === 0) {
                    log(colors.green, '🎉 所有测试完成！');
                } else {
                    log(colors.red, `❌ 测试失败 (退出码: ${code})`);
                }
                log(colors.cyan, '============================================================\n');
                process.exit(code);
            }, 500);
        });

        jestProcess.on('error', (err) => {
            log(colors.red, '运行 Jest 失败:', err.message);
            serverProcess.kill('SIGTERM');
            process.exit(1);
        });

    } catch (error) {
        log(colors.red, '错误:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch((err) => {
        console.error(colors.red, '致命错误:', err);
        process.exit(1);
    });
}