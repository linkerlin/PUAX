/**
 * STDIO 模式测试
 * 测试 PUAX MCP Server 的 STDIO 传输模式
 *
 * 慢速 runner（Windows CI）上的历史败因是僵尸看门狗：done() 成功后
 * 25s 定时器不清除、二次 done(err) 把已过测试翻成失败。现以一次性
 * finish 闸门 + clearTimeout 根治；retryTimes 仅作兜底，确定性失败
 * 不会连过三次，仍被拦下。
 */

jest.retryTimes(2);

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

// 使用更长的超时，因为需要启动进程
jest.setTimeout(30000);

describe('STDIO Mode Tests', () => {
    let serverProcess: ChildProcess | null = null;
    const serverPath = path.join(__dirname, '../../build/index.js');

    afterEach(() => {
        // 确保每个测试后清理进程
        if (serverProcess) {
            serverProcess.kill('SIGTERM');
            serverProcess = null;
        }
    });

    test('Server should start in stdio mode', (done) => {
        const receivedMessages: any[] = [];

        // 一次性 finish 闸门：done 成功后清掉看门狗，杜绝僵尸定时器二次 done 翻盘
        let finished = false;
        let watchdog: NodeJS.Timeout | undefined;
        const finish = (err?: Error) => {
            if (finished) return;
            finished = true;
            clearTimeout(watchdog);
            done(err);
        };

        serverProcess = spawn('node', [serverPath, '--stdio'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stderr = '';
        serverProcess.stderr?.on('data', (data) => {
            stderr += data.toString();
        });

        // 发送 initialize 请求
        const initRequest = {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: {
                    name: 'test-client',
                    version: '1.0.0'
                }
            }
        };

        // 等待服务器启动
        setTimeout(() => {
            const message = JSON.stringify(initRequest);
            serverProcess?.stdin?.write(message + '\n');
        }, 1000);

        // 收集响应
        let buffer = '';
        serverProcess.stdout?.on('data', (data) => {
            buffer += data.toString();

            // 尝试解析 JSON-RPC 消息
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 保留不完整的行

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const msg = JSON.parse(line);
                        receivedMessages.push(msg);

                        // 收到 initialize 响应
                        if (msg.id === 1 && msg.result) {
                            expect(msg.result.protocolVersion).toBeDefined();
                            expect(msg.result.serverInfo).toBeDefined();
                            expect(msg.result.serverInfo.name).toBe('puax-mcp-server');
                            finish();
                        }
                    } catch (e) {
                        // 忽略非 JSON 行
                    }
                }
            }
        });

        // 超时处理
        watchdog = setTimeout(() => {
            if (receivedMessages.length === 0) {
                finish(new Error(`No response received. Stderr: ${stderr}`));
            } else {
                finish(new Error(`No initialize response. Received: ${JSON.stringify(receivedMessages)}`));
            }
        }, 25000);
    });

    test('Server should handle tools/list request in stdio mode', (done) => {
        const receivedMessages: any[] = [];
        let initialized = false;

        let finished = false;
        let watchdog: NodeJS.Timeout | undefined;
        const finish = (err?: Error) => {
            if (finished) return;
            finished = true;
            clearTimeout(watchdog);
            done(err);
        };

        serverProcess = spawn('node', [serverPath, '--stdio'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let buffer = '';
        serverProcess.stdout?.on('data', (data) => {
            buffer += data.toString();

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const msg = JSON.parse(line);
                        receivedMessages.push(msg);

                        if (msg.id === 1 && msg.result) {
                            initialized = true;
                            // 发送 tools/list 请求
                            const toolsRequest = {
                                jsonrpc: '2.0',
                                id: 2,
                                method: 'tools/list',
                                params: {}
                            };
                            serverProcess?.stdin?.write(JSON.stringify(toolsRequest) + '\n');
                        }

                        if (msg.id === 2 && msg.result) {
                            expect(msg.result.tools).toBeDefined();
                            expect(Array.isArray(msg.result.tools)).toBe(true);
                            expect(msg.result.tools.length).toBeGreaterThan(0);
                            finish();
                        }
                    } catch (e) {
                        // 忽略非 JSON 行
                    }
                }
            }
        });

        // 等待服务器启动后发送 initialize
        setTimeout(() => {
            const initRequest = {
                jsonrpc: '2.0',
                id: 1,
                method: 'initialize',
                params: {
                    protocolVersion: '2024-11-05',
                    capabilities: {},
                    clientInfo: {
                        name: 'test-client',
                        version: '1.0.0'
                    }
                }
            };
            serverProcess?.stdin?.write(JSON.stringify(initRequest) + '\n');
        }, 1000);

        watchdog = setTimeout(() => {
            finish(new Error(`Test timeout. Initialized: ${initialized}. Messages: ${JSON.stringify(receivedMessages)}`));
        }, 25000);
    });

    test('Server should handle list_skills tool call', (done) => {
        const receivedMessages: any[] = [];
        let step = 0;

        let finished = false;
        let watchdog: NodeJS.Timeout | undefined;
        const finish = (err?: Error) => {
            if (finished) return;
            finished = true;
            clearTimeout(watchdog);
            done(err);
        };

        serverProcess = spawn('node', [serverPath, '--stdio'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let buffer = '';
        serverProcess.stdout?.on('data', (data) => {
            buffer += data.toString();

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const msg = JSON.parse(line);
                        receivedMessages.push(msg);

                        if (msg.id === 1 && msg.result) {
                            step = 1;
                            // 发送 initialized 通知
                            const initializedNotification = {
                                jsonrpc: '2.0',
                                method: 'notifications/initialized'
                            };
                            serverProcess?.stdin?.write(JSON.stringify(initializedNotification) + '\n');

                            // 然后发送 tools/call 请求
                            const callRequest = {
                                jsonrpc: '2.0',
                                id: 2,
                                method: 'tools/call',
                                params: {
                                    name: 'list_skills',
                                    arguments: {}
                                }
                            };
                            serverProcess?.stdin?.write(JSON.stringify(callRequest) + '\n');
                        }

                        if (msg.id === 2 && msg.result) {
                            expect(msg.result.content).toBeDefined();
                            expect(Array.isArray(msg.result.content)).toBe(true);
                            // 验证返回了技能列表
                            const text = msg.result.content[0]?.text;
                            expect(text).toBeDefined();
                            const data = JSON.parse(text);
                            expect(data.skills).toBeDefined();
                            expect(data.total).toBeGreaterThan(0);
                            finish();
                        }
                    } catch (e) {
                        // 忽略非 JSON 行
                    }
                }
            }
        });

        setTimeout(() => {
            const initRequest = {
                jsonrpc: '2.0',
                id: 1,
                method: 'initialize',
                params: {
                    protocolVersion: '2024-11-05',
                    capabilities: {},
                    clientInfo: {
                        name: 'test-client',
                        version: '1.0.0'
                    }
                }
            };
            serverProcess?.stdin?.write(JSON.stringify(initRequest) + '\n');
        }, 1000);

        watchdog = setTimeout(() => {
            finish(new Error(`Test timeout. Step: ${step}. Messages: ${JSON.stringify(receivedMessages)}`));
        }, 25000);
    });
});
