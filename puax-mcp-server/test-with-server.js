#!/usr/bin/env node

/**
 * 完整测试脚本
 * 自动启动服务器，运行测试，然后关闭服务器
 */

const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const { waitForServer } = require('./test-helpers/wait-for-server');

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

class TestRunner {
    constructor() {
        this.serverProcess = null;
        this.serverPath = path.join(__dirname, 'build/index.js');
    }

    /**
     * 启动服务器
     */
    async startServer(timeout = 15000) {
        return new Promise((resolve, reject) => {
            log(colors.cyan, '\n正在启动服务器...');
            
            this.serverProcess = spawn('node', [this.serverPath], {
                stdio: ['ignore', 'pipe', 'pipe'],
                env: { ...process.env }
            });

            let stderr = '';
            let stdout = '';

            // 捕获输出
            this.serverProcess.stderr.on('data', (data) => {
                const output = data.toString();
                stderr += output;
                log(colors.gray, `[server] ${output.trim()}`);
            });

            this.serverProcess.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                log(colors.gray, `[server] ${output.trim()}`);
            });

            this.serverProcess.on('error', (err) => {
                log(colors.red, '❌ 启动服务器失败:', err.message);
                reject(err);
            });

            // 等待服务器响应（使用 waitForServer）
            setTimeout(async () => {
                try {
                    log(colors.cyan, '等待服务器准备就绪...');
                    await waitForServer('http://localhost:2333/health', timeout - 2000);
                    log(colors.green, '✅ 服务器启动成功！');
                    resolve();
                } catch (error) {
                    log(colors.red, '❌ 服务器启动失败:', error.message);
                    log(colors.red, 'stderr:', stderr);
                    log(colors.red, 'stdout:', stdout);
                    this.stopServer();
                    reject(error);
                }
            }, 1000); // 先给服务器1秒时间开始启动
        });
    }

    /**
     * 等待服务器响应
     */
    async waitForServerReady(url = 'http://localhost:2333/health', timeout = 10000) {
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
                        reject(new Error('等待服务器响应超时'));
                    }
                });
            };
            
            checkServer();
        });
    }

    /**
     * 运行测试
     */
    async runTests(testPath = null, timeout = 60000) {
        return new Promise((resolve, reject) => {
            const args = ['test'];
            if (testPath) {
                args.push(testPath);
            }
            
            args.push('--testTimeout=20000');
            args.push('--forceExit');
            
            log(colors.cyan, `\n正在运行测试${testPath ? `: ${testPath}` : ''}...`);
            
            const jestProcess = spawn('npx', ['jest', ...args], {
                stdio: 'inherit',
                shell: true,
                cwd: __dirname,
                env: {
                    ...process.env,
                    TEST_SERVER_RUNNING: 'true'  // 告诉测试服务器已经运行
                }
            });

            jestProcess.on('close', (code) => {
                if (code === 0) {
                    log(colors.green, '\n✅ 测试通过！');
                    resolve();
                } else {
                    log(colors.red, `\n❌ 测试失败 (退出码: ${code})`);
                    reject(new Error(`测试失败，退出码: ${code}`));
                }
            });

            jestProcess.on('error', (err) => {
                log(colors.red, '❌ 运行测试失败:', err.message);
                reject(err);
            });

            // 超时保护
            setTimeout(() => {
                jestProcess.kill('SIGTERM');
                reject(new Error('测试运行超时'));
            }, timeout);
        });
    }

    /**
     * 停止服务器
     */
    stopServer() {
        if (this.serverProcess) {
            log(colors.cyan, '\n正在停止服务器...');
            this.serverProcess.kill('SIGTERM');
            this.serverProcess = null;
            log(colors.green, '✅ 服务器已停止');
        }
    }

    /**
     * 完整的测试流程
     */
    async runFullTest(testPath = null) {
        try {
            // 步骤 1: 启动服务器
            await this.startServer();
            
            // 步骤 2: 等待服务器准备就绪
            await this.waitForServerReady();
            
            // 步骤 3: 运行测试
            await this.runTests(testPath);
            
            // 步骤 4: 停止服务器
            this.stopServer();
            
            log(colors.green, '\n' + '='.repeat(60));
            log(colors.green, '🎉 所有测试完成！');
            log(colors.green, '='.repeat(60) + '\n');
            
            return 0;
        } catch (error) {
            log(colors.red, '\n' + '='.repeat(60));
            log(colors.red, '❌ 测试流程失败');
            log(colors.red, '错误:', error.message);
            log(colors.red, '='.repeat(60) + '\n');
            
            this.stopServer();
            return 1;
        }
    }
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    const testPath = args[0] || null;

    log(colors.blue, '='.repeat(60));
    log(colors.blue, 'PUAX MCP Server - 完整测试流程');
    log(colors.blue, '='.repeat(60));

    const runner = new TestRunner();
    const exitCode = await runner.runFullTest(testPath);
    
    process.exit(exitCode);
}

if (require.main === module) {
    main().catch((err) => {
        console.error(colors.red, '致命错误:', err);
        process.exit(1);
    });
}

module.exports = { TestRunner };