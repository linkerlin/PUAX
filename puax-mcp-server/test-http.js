// 简单的测试脚本来验证 HTTP 服务器
const http = require('http');

// 测试健康端点
function testHealth() {
    return new Promise((resolve, reject) => {
        const req = http.request('http://localhost:23333/health', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('Health check response:', data);
                resolve(data);
            });
        });
        req.on('error', reject);
        req.end();
    });
}

// 测试 SSE 连接
function testSSE() {
    return new Promise((resolve, reject) => {
        console.log('Testing SSE connection...');
        const req = http.request('http://localhost:23333/', (res) => {
            console.log('SSE Status:', res.statusCode);
            console.log('SSE Headers:', res.headers);
            
            res.on('data', chunk => {
                console.log('SSE Data:', chunk.toString());
            });
            
            setTimeout(() => {
                res.destroy();
                resolve('SSE test completed');
            }, 2000);
        });
        req.on('error', reject);
        req.end();
    });
}

async function runTests() {
    try {
        console.log('Running health check...');
        await testHealth();
        
        console.log('\nRunning SSE connection test...');
        await testSSE();
        
        console.log('\nAll tests completed!');
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

runTests();