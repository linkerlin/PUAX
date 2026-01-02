#!/usr/bin/env node

/**
 * 完整的测试套件运行器
 * 
 * 1. 检查服务器是否在运行
 * 2. 如果运行中，执行所有测试
 * 3. 如果没有运行，提示用户并显示选项
 */

const { spawn } = require('child_process');
const readline = require('readline');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m',
    gray: '\x1b[37m'
};

function log(color, ...args) {
    console.log(`${color}${args.join(' ')}${colors.reset}`);
}

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(query, resolve);
    }).finally(() => rl.close());
}

async function checkServer() {
    const { spawn } = require('child_process');
    return new Promise(resolve => {
        const cmd = spawn('node', ['run-with-server.js', 'check'], {
            stdio: 'pipe',
            shell: true
        });
        
        let output = '';
        cmd.stdout.on('data', data => output += data.toString());
        cmd.stderr.on('data', data => output += data.toString());
        
        cmd.on('close', code => {
            resolve({ running: code === 0, output });
        });
        
        setTimeout(() => {
            cmd.kill();
            resolve({ running: false, output: 'timeout' });
        }, 3000);
    });
}

async function runAllTests() {
    return new Promise(resolve => {
        const testProcess = spawn('node', ['test-report.js'], {
            stdio: 'inherit',
            shell: true
        });

        testProcess.on('close', code => resolve(code));
        testProcess.on('error', err => {
            console.error(colors.red, '运行测试失败:', err);
            resolve(1);
        });
    });
}

async function runUnitTests() {
    return new Promise(resolve => {
        const testProcess = spawn('node', ['run-with-server.js', 'test/unit'], {
            stdio: 'inherit',
            shell: true
        });

        testProcess.on('close', code => resolve(code));
    });
}

async function main() {
    log(colors.blue, '\n' + '='.repeat(60));
    log(colors.blue, 'PUAX MCP Server - 完整测试套件');
    log(colors.blue, '='.repeat(60));
    log(colors.cyan, '\n准备运行测试...\n');

    // 检查服务器状态
    log(colors.cyan, '检查服务器状态...');
    const server = await checkServer();
    
    if (server.running) {
        log(colors.green, '✅ 服务器正在运行\n');
        
        const exitCode = await runAllTests();
        process.exit(exitCode);
    } else {
        log(colors.red, '❌ 服务器未在运行\n');
        log(colors.yellow, '💡 请选择一个选项:\n');
        log(colors.blue, '  1. 自动启动服务器并运行测试');
        log(colors.blue, '  2. 手动启动服务器（在新终端运行 npm start）');
        log(colors.blue, '  3. 跳过测试，直接退出\n');
        
        const choice = await askQuestion('请输入选项 (1-3): ');
        
        switch (choice) {
            case '1':
                log(colors.cyan, '\n启动自动测试...\n');
                const autoTestProcess = spawn('node', ['test-with-server.js'], {
                    stdio: 'inherit',
                    shell: true
                });
                autoTestProcess.on('close', code => process.exit(code));
                break;
                
            case '2':
                log(colors.cyan, '\n请在新终端运行: npm start');
                log(colors.cyan, '然后按 Enter 继续...');
                await askQuestion('');
                log(colors.cyan, '\n运行测试...\n');
                const code = await runAllTests();
                process.exit(code);
                break;
                
            case '3':
                log(colors.yellow, '\n退出测试\n');
                process.exit(0);
                break;
                
            default:
                log(colors.red, '无效选项\n');
                process.exit(1);
        }
    }
}

if (require.main === module) {
    main().catch(err => {
        console.error(colors.red, '错误:', err);
        process.exit(1);
    });
}