/**
 * 等待服务器准备就绪
 */

const http = require('http');

function waitForServer(url = 'http://localhost:23333/health', timeout = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const checkServer = () => {
            const req = http.get(url, (res) => {
                if (res.statusCode === 200) {
                    resolve(true);
                } else {
                    if (Date.now() - startTime < timeout) {
                        setTimeout(checkServer, 500);
                    } else {
                        reject(new Error('服务器响应但状态码不是200'));
                    }
                }
            });
            
            req.on('error', () => {
                if (Date.now() - startTime < timeout) {
                    setTimeout(checkServer, 500);
                } else {
                    reject(new Error('等待服务器超时'));
                }
            });
            
            req.setTimeout(2000, () => {
                req.destroy();
                if (Date.now() - startTime < timeout) {
                    setTimeout(checkServer, 500);
                } else {
                    reject(new Error('等待服务器超时'));
                }
            });
        };
        
        checkServer();
    });
}

module.exports = { waitForServer };