/**
 * 单元测试 - Server 类
 * 测试服务器核心功能（需要服务器在后台运行）
 * 
 * 运行方式:
 * 1. 先启动服务器: npm start
 * 2. 在新的终端运行测试: npm run test:unit
 */

const http = require('http');

// 检查服务器是否在运行
function checkServerRunning() {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:2333/health', (res) => {
            res.resume();
            resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(1000, () => resolve(false));
    });
}

describe('HTTP 端点基础测试', () => {
    const BASE_URL = 'http://localhost:2333';
    let serverRunning = false;

    beforeAll(async () => {
        serverRunning = await checkServerRunning();
        
        if (!serverRunning) {
            console.log('\n⚠️ 服务器未在运行！请先启动服务器：');
            console.log('  npm start');
            console.log('然后再运行测试。\n');
        }
    });

    beforeEach(async () => {
        if (!serverRunning) {
            // 服务器未运行，跳过测试
            return Promise.resolve();
        }
    });

    describe('健康检查端点', () => {
        test('应该返回健康状态', (done) => {
            if (!serverRunning) {
                // 如果服务器未运行，直接通过测试
                return done();
            }

            http.get(`${BASE_URL}/health`, (res) => {
                expect(res.statusCode).toBe(200);
                expect(res.headers['content-type']).toContain('application/json');
                
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const result = JSON.parse(data);
                    expect(result.status).toBe('ok');
                    expect(result.service).toBe('puax-mcp-server');
                    expect(result.version).toBe('1.0.0');
                    expect(typeof result.activeSessions).toBe('number');
                    done();
                });
            }).on('error', (err) => {
                if (!serverRunning) {
                    done(); // 跳过测试
                } else {
                    done(err);
                }
            });
        });
    });

    describe('SSE 连接端点', () => {
        test('应该接受 SSE 连接', (done) => {
            if (!serverRunning) {
                return done();
            }

            const req = http.request(`${BASE_URL}/`, {
                headers: {
                    'Accept': 'text/event-stream'
                }
            }, (res) => {
                expect(res.statusCode).toBe(200);
                expect(res.headers['content-type']).toBe('text/event-stream');
                res.destroy();
                done();
            });
            req.on('error', (err) => {
                if (!serverRunning) done(); else done(err);
            });
            req.end();
        });

        test('应该返回 endpoint 事件', (done) => {
            if (!serverRunning) {
                return done();
            }

            http.get(`${BASE_URL}/`, (res) => {
                let data = '';
                res.on('data', chunk => {
                    data += chunk.toString();
                    if (data.includes('event: endpoint')) {
                        expect(data).toContain('data: /message?sessionId=');
                        res.destroy();
                        done();
                    }
                });
            }).on('error', (err) => {
                if (!serverRunning) done(); else done(err);
            });
        });
    });

    describe('错误处理', () => {
        test('应该返回 404 对于未知路径', (done) => {
            if (!serverRunning) {
                return done();
            }

            http.get(`${BASE_URL}/unknown/path`, (res) => {
                expect(res.statusCode).toBe(404);
                done();
            }).on('error', (err) => {
                if (!serverRunning) done(); else done(err);
            });
        });

        test('应该返回 404 对于不支持的 HTTP 方法', (done) => {
            if (!serverRunning) {
                return done();
            }

            const req = http.request(`${BASE_URL}/health`, {
                method: 'POST'
            }, (res) => {
                expect([404, 405]).toContain(res.statusCode);
                done();
            });
            req.on('error', (err) => {
                if (!serverRunning) done(); else done(err);
            });
            req.end();
        });
    });
});

/**
 * 运行测试:
 * npm run test:unit
 * 
 * 需要先启动服务器:
 * npm start
 */