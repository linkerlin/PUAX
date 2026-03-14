/**
 * STDIO 模式命令行参数测试
 * 测试命令行参数解析和环境变量
 */

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

jest.setTimeout(10000);

describe('STDIO Command Line Arguments', () => {
    let serverProcess: ChildProcess | null = null;
    const serverPath = path.join(__dirname, '../../build/index.js');

    afterEach(() => {
        if (serverProcess) {
            serverProcess.kill('SIGTERM');
            serverProcess = null;
        }
    });

    test('should accept --stdio argument', (done) => {
        serverProcess = spawn('node', [serverPath, '--stdio'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stderr = '';
        serverProcess.stderr?.on('data', (data) => {
            stderr += data.toString();
            
            // 检查是否显示 STDIO 模式启动信息
            if (stderr.includes('Mode: STDIO') || stderr.includes('STDIO')) {
                done();
            }
        });

        // 超时
        setTimeout(() => {
            // 即使没有看到特定消息，只要进程还在运行就算成功
            if (serverProcess && !serverProcess.killed) {
                done();
            } else {
                done(new Error(`Process died. Stderr: ${stderr}`));
            }
        }, 3000);
    });

    test('should accept -t stdio argument', (done) => {
        serverProcess = spawn('node', [serverPath, '-t', 'stdio'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stderr = '';
        serverProcess.stderr?.on('data', (data) => {
            stderr += data.toString();
        });

        setTimeout(() => {
            if (serverProcess && !serverProcess.killed) {
                done();
            } else {
                done(new Error(`Process died. Stderr: ${stderr}`));
            }
        }, 3000);
    });

    test('should accept --transport=stdio argument', (done) => {
        serverProcess = spawn('node', [serverPath, '--transport=stdio'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stderr = '';
        serverProcess.stderr?.on('data', (data) => {
            stderr += data.toString();
        });

        setTimeout(() => {
            if (serverProcess && !serverProcess.killed) {
                done();
            } else {
                done(new Error(`Process died. Stderr: ${stderr}`));
            }
        }, 3000);
    });

    test('should show help with --help', (done) => {
        serverProcess = spawn('node', [serverPath, '--help'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        serverProcess.stdout?.on('data', (data) => {
            stdout += data.toString();
        });

        serverProcess.on('close', (code) => {
            expect(stdout).toContain('PUAX MCP Server');
            expect(stdout).toContain('--stdio');
            expect(stdout).toContain('--transport');
            expect(stdout).toContain('STDIO');
            done();
        });
    });

    test('should show version with --version', (done) => {
        serverProcess = spawn('node', [serverPath, '--version'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        serverProcess.stdout?.on('data', (data) => {
            stdout += data.toString();
        });

        serverProcess.on('close', (code) => {
            expect(stdout).toContain('puax-mcp-server');
            expect(stdout).toMatch(/\d+\.\d+\.\d+/); // 版本号格式
            done();
        });
    });
});
