#!/usr/bin/env node

/**
 * 快速测试脚本 - 验证服务器是否正常工作
 */

const http = require('http');

const TESTS = {
    health: {
        name: '健康检查',
        url: 'http://localhost:23333/health',
        method: 'GET',
        expectedStatus: 200,
        timeout: 5000
    },
    sse: {
        name: 'SSE 连接',
        url: 'http://localhost:23333/',
        method: 'GET',
        expectedStatus: 200,
        timeout: 5000
    }
};

function runTest(testName, testConfig) {
    return new Promise((resolve, reject) => {
        console.log(`\n📋 测试: ${testConfig.name}`);
        console.log(`   URL: ${testConfig.url}`);
        
        const url = new URL(testConfig.url);
        const options = {
            hostname: url.hostname,
            port: url.port || 80,
            path: url.pathname,
            method: testConfig.method,
            timeout: testConfig.timeout
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`   状态码: ${res.statusCode}`);
                
                if (res.statusCode === testConfig.expectedStatus) {
                    console.log(`   ✅ 通过`);
                    if (data.length > 0) {
                        try {
                            const json = JSON.parse(data);
                            console.log(`   响应:`, JSON.stringify(json, null, 2));
                        } catch (e) {
                            console.log(`   响应: ${data.substring(0, 100)}...`);
                        }
                    }
                    resolve({ name: testConfig.name, status: 'pass', data });
                } else {
                    console.log(`   ❌ 失败 - 期望状态码 ${testConfig.expectedStatus}`);
                    reject(new Error(`状态码不匹配: ${res.statusCode}`));
                }
            });
        });

        req.on('error', (err) => {
            console.log(`   ❌ 失败 - ${err.message}`);
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy();
            console.log(`   ❌ 超时`);
            reject(new Error('请求超时'));
        });

        req.end();
    });
}

async function main() {
    console.log('═══════════════════════════════════════');
    console.log('  PUAX MCP Server 快速测试');
    console.log('═══════════════════════════════════════');
    console.log('测试服务器: http://localhost:23333');
    console.log('═══════════════════════════════════════');

    const results = {
        passed: 0,
        failed: 0,
        details: []
    };

    for (const [testName, testConfig] of Object.entries(TESTS)) {
        try {
            await runTest(testName, testConfig);
            results.passed++;
            results.details.push({ name: testConfig.name, status: 'pass' });
        } catch (error) {
            results.failed++;
            results.details.push({ name: testConfig.name, status: 'fail', error: error.message });
        }
    }

    console.log('\n═══════════════════════════════════════');
    console.log('  测试结果汇总');
    console.log('═══════════════════════════════════════');
    console.log(`总测试数: ${results.passed + results.failed}`);
    console.log(`✅ 通过: ${results.passed}`);
    console.log(`❌ 失败: ${results.failed}`);
    console.log('═══════════════════════════════════════');

    if (results.failed === 0) {
        console.log('\n🎉 所有测试通过！服务器工作正常。');
        console.log('\n💡 您可以使用以下方式连接服务器:');
        console.log('   - MCP 客户端: http://localhost:23333');
        console.log('   - MCP Inspector: npx @modelcontextprotocol/inspector http://localhost:23333');
        process.exit(0);
    } else {
        console.log('\n⚠️  部分测试失败，请检查服务器是否正在运行。');
        console.log('\n💡 启动服务器命令:');
        console.log('   cd puax-mcp-server && npm start');
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = { runTest, TESTS };