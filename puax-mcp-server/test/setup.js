/**
 * 测试环境配置
 * 在运行测试前执行
 */

// 增加超时时间
jest.setTimeout(20000);

// 全局测试辅助函数
global.testHelpers = {
    /**
     * 等待指定时间
     */
    wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    
    /**
     * 重试异步操作
     */
    retry: async (fn, maxAttempts = 3, delay = 1000) => {
        let lastError;
        for (let i = 0; i < maxAttempts; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                if (i < maxAttempts - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError;
    },
    
    /**
     * 检查服务器是否运行
     */
    checkServer: async (url = 'http://localhost:2333/health', timeout = 5000) => {
        const http = require('http');
        return new Promise((resolve, reject) => {
            const req = http.get(url, (res) => {
                resolve(res.statusCode === 200);
            });
            req.setTimeout(timeout, () => {
                req.destroy();
                resolve(false);
            });
            req.on('error', () => resolve(false));
        });
    }
};

// 测试环境变量
process.env.NODE_ENV = 'test';
process.env.PUAX_PROJECT_PATH = process.cwd();

// 控制台输出捕获（可选）
const originalError = console.error;
global.console.error = (...args) => {
    // 在测试中抑制某些错误输出
    const message = args.join(' ');
    if (message.includes('listening') || message.includes('Listening')) {
        // 服务器启动信息，可以显示
        originalError.apply(console, args);
    }
};

console.log('Test environment configured');