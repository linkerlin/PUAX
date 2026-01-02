#!/usr/bin/env node

/**
 * 测试助手
 * 检查服务器是否在运行，如果没有则提示用户
 */

const http = require('http');
const { spawn } = require('child_process');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m'
};

function log(color, ...args) {
    console.log(`${color}${args.join(' ')}${colors.reset}`);
}

function checkServerRunning() {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:23333/health', (res) => {
            res.resume();
            resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(2000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'check') {
        // 只检查服务器状态
        const running = await checkServerRunning();
        if (running) {
            log(colors.green, '✅ 服务器正在运行');
            process.exit(0);
        } else {
            log(colors.red, '❌ 服务器未运行');
            log(colors.cyan, '\n💡 启动服务器: npm start');
            process.exit(1);
        }
    }

    // 检查服务器是否在运行
    log(colors.cyan, '\n检查服务器状态...');
    const isRunning = await checkServerRunning();

    if (isRunning) {
        log(colors.green, '✅ 服务器正在运行');
        
        // 直接运行测试
        const jestArgs = ['jest', ...args, '--testTimeout=15000'];
        log(colors.cyan, '\n运行命令: npx ' + jestArgs.join(' ') + '\n');
        
        const jestProcess = spawn('npx', jestArgs, {
            stdio: 'inherit',
            shell: true
        });

        jestProcess.on('close', (code) => {
            process.exit(code);
        });
    } else {
        log(colors.red, '❌ 服务器未在运行');
        log(colors.yellow, '\n⚠️  这些测试需要服务器在后台运行才能执行。');
        log(colors.cyan, '\n💡 请按照以下步骤操作:\n');
        log(colors.blue, '  1. 打开新终端');
        log(colors.blue, '  2. 运行: npm start');
        log(colors.blue, '  3. 等待服务器启动（显示 "Listening on http://localhost:23333"）');
        log(colors.blue, '  4. 在本终端运行: npm test\n');
        log(colors.cyan, '或者使用自动测试:\n');
        log(colors.blue, '  node test-with-server.js\n');
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch((err) => {
        console.error(colors.red, '错误:', err);
        process.exit(1);
    });
}