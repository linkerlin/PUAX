/**
 * 全局测试设置
 * 为所有测试提供全局配置
 */

const { waitForServer } = require('../../test-helpers/wait-for-server');

// 在测试开始前确保服务器可用
module.exports = async () => {
    const isRunning = process.env.TEST_SERVER_RUNNING === 'true';
    
    if (isRunning) {
        console.log('\n[Global Setup] 测试服务器正在运行，等待准备就绪...');
        await waitForServer();
        console.log('[Global Setup] 服务器已准备就绪\n');
    }
};