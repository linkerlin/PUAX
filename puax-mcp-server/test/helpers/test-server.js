/**
 * 测试服务器管理器
 * 用于在测试中启动和停止服务器
 */

const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

class TestServer {
    constructor() {
        this.process = null;
        this.serverPath = path.join(__dirname, '../../build/index.js');
    }

    /**
     * 启动服务器
     */
    async start(timeout = 10000) {
        return new Promise((resolve, reject) => {
            console.log('正在启动测试服务器...');
            
            this.process = spawn('node', [this.serverPath], {
                stdio: ['ignore', 'pipe', 'pipe'],
                env: process.env
            });

            let started = false;
            let stderr = '';

            // 捕获错误输出
            this.process.stderr.on('data', (data) => {
                stderr += data.toString();
                console.log('Server stderr:', data.toString());
                
                // 检查服务器是否已启动
                if (stderr.includes('Listening on') || stderr.includes('started successfully')) {
                    started = true;
                    console.log('服务器启动成功！');
                    resolve();
                }
            });

            this.process.stdout.on('data', (data) => {
                const output = data.toString();
                console.log('Server stdout:', output);
                
                if (output.includes('Listening on')) {
                    started = true;
                    console.log('服务器启动成功！');
                    resolve();
                }
            });

            this.process.on('error', (err) => {
                console.error('启动服务器失败:', err);
                reject(err);
            });

            // 超时保护
            setTimeout(() => {
                if (!started) {
                    console.error('服务器启动超时');
                    console.error('stderr:', stderr);
                    this.stop();
                    reject(new Error('服务器启动超时'));
                }
            }, timeout);
        });
    }

    /**
     * 停止服务器
     */
    stop() {
        if (this.process) {
            console.log('正在停止服务器...');
            this.process.kill('SIGTERM');
            this.process = null;
        }
    }

    /**
     * 等待服务器响应
     */
    async waitForServer(url = 'http://localhost:2333/health', timeout = 5000) {
        return new Promise((resolve, reject) => {
            const checkServer = () => {
                http.get(url, (res) => {
                    if (res.statusCode === 200) {
                        resolve();
                    } else {
                        setTimeout(checkServer, 500);
                    }
                }).on('error', () => {
                    setTimeout(checkServer, 500);
                });
            };
            
            checkServer();
            
            setTimeout(() => {
                reject(new Error('等待服务器超时'));
            }, timeout);
        });
    }

    /**
     * 获取服务器进程
     */
    getProcess() {
        return this.process;
    }
}

module.exports = { TestServer };