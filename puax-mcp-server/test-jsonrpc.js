// 测试 JSON-RPC over HTTP 请求
const http = require('http');

// 发送 JSON-RPC 请求的通用函数
function sendJsonRpcRequest(method, params, id) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            jsonrpc: "2.0",
            id: id,
            method: method,
            params: params
        });

        console.log(`Sending ${method} request:`, postData);

        const options = {
            hostname: 'localhost',
            port: 2333,
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`Response status: ${res.statusCode}`);
                console.log(`Response data: ${data}`);
                
                try {
                    const result = JSON.parse(data);
                    resolve({ statusCode: res.statusCode, data: result });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function runTests() {
    try {
        console.log('=== Testing prompts/get ===');
        const promptsGetResult = await sendJsonRpcRequest('prompts/get', { name: 'test' }, 11);
        console.log('prompts/get result:', promptsGetResult);
        
        console.log('\n=== Testing resources/list ===');
        const resourcesListResult = await sendJsonRpcRequest('resources/list', {}, 12);
        console.log('resources/list result:', resourcesListResult);
        
        console.log('\n=== Testing resources/read ===');
        const resourcesReadResult = await sendJsonRpcRequest('resources/read', { uri: 'test://uri' }, 13);
        console.log('resources/read result:', resourcesReadResult);
        
        console.log('\nAll tests completed!');
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

runTests();