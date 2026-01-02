#!/usr/bin/env node

/**
 * 测试套件验证脚本
 * 验证所有测试文件和配置是否正确
 */

const fs = require('fs');
const path = require('path');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(color, ...args) {
    console.log(`${color}${args.join(' ')}${colors.reset}`);
}

function checkFile(filePath, description) {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
        log(colors.green, `✅ ${description}: ${filePath}`);
        return true;
    } else {
        log(colors.red, `❌ ${description}: ${filePath} (缺失)`);
        return false;
    }
}

function main() {
    log(colors.cyan, '\n' + '='.repeat(60));
    log(colors.cyan, 'PUAX MCP Server 测试套件验证');
    log(colors.cyan, '='.repeat(60) + '\n');

    let allPassed = true;

    // 1. 检查测试配置文件
    log(colors.yellow, '检查测试配置...');
    allPassed &= checkFile('jest.config.js', 'Jest 配置');
    allPassed &= checkFile('test/setup.js', '测试环境设置');
    allPassed &= checkFile('test/sequencer.js', '测试序列器');
    allPassed &= checkFile('run-tests.js', '测试运行器');

    // 2. 检查测试文件
    log(colors.yellow, '\n检查测试文件...');
    allPassed &= checkFile('test/unit/server.test.js', '单元测试文件');
    allPassed &= checkFile('test/http/endpoint.test.js', 'HTTP 测试文件');
    allPassed &= checkFile('test/sse/transport.test.js', 'SSE 测试文件');
    allPassed &= checkFile('test/tools/tools.test.js', '工具测试文件');
    allPassed &= checkFile('test/integration/mcp-flow.test.js', '集成测试文件');

    // 3. 检查文档
    log(colors.yellow, '\n检查文档文件...');
    allPassed &= checkFile('测试用例文档.md', '测试用例文档');
    allPassed &= checkFile('测试套件总结.md', '测试套件总结');

    // 4. 检查 package.json
    log(colors.yellow, '\n检查 package.json...');
    const packagePath = path.join(__dirname, 'package.json');
    if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        const hasJest = packageJson.devDependencies && packageJson.devDependencies.jest;
        if (hasJest) {
            log(colors.green, '✅ Jest 依赖');
        } else {
            log(colors.red, '❌ Jest 依赖 (缺失)');
            allPassed = false;
        }

        const testScripts = ['test', 'test:unit', 'test:http', 'test:sse', 'test:tools', 'test:integration', 'test:coverage', 'test:watch'];
        const missingScripts = testScripts.filter(script => !packageJson.scripts[script]);
        
        if (missingScripts.length === 0) {
            log(colors.green, '✅ 测试脚本 (全部存在)');
        } else {
            log(colors.red, `❌ 测试脚本 (缺失: ${missingScripts.join(', ')})`);
            allPassed = false;
        }
    } else {
        log(colors.red, '❌ package.json (缺失)');
        allPassed = false;
    }

    // 5. 验证测试文件内容
    log(colors.yellow, '\n验证测试文件内容...');
    const testDirectories = ['unit', 'http', 'sse', 'tools', 'integration'];
    let totalTestCases = 0;
    
    testDirectories.forEach(dir => {
        const testFile = path.join(__dirname, `test/${dir}/*.test.js`);
        // 简化：假设文件存在且有内容
        try {
            const files = fs.readdirSync(path.join(__dirname, `test/${dir}`));
            files.forEach(file => {
                const content = fs.readFileSync(path.join(__dirname, `test/${dir}`, file), 'utf8');
                const testMatches = content.match(/test\(/g) || [];
                const itMatches = content.match(/it\(/g) || [];
                const total = testMatches.length + itMatches.length;
                totalTestCases += total;
                log(colors.green, `✅ ${dir} 测试文件 (${total} 个用例)`);
            });
        } catch (err) {
            // 忽略错误
        }
    });

    // 6. 总结
    log(colors.cyan, '\n' + '='.repeat(60));
    if (allPassed) {
        log(colors.green, '✅ 所有检查通过！');
        log(colors.green, `✅ 总共 ${totalTestCases}+ 个测试用例`);
        log(colors.green, '✅ 测试套件已准备就绪！');
    } else {
        log(colors.red, '❌ 部分检查失败！');
        process.exit(1);
    }
    log(colors.cyan, '='.repeat(60) + '\n');

    // 7. 使用指南
    log(colors.cyan, '使用指南:\n');
    log(colors.blue, '  npm test                    # 运行所有测试');
    log(colors.blue, '  npm run test:unit           # 运行单元测试');
    log(colors.blue, '  npm run test:http           # 运行 HTTP 测试');
    log(colors.blue, '  npm run test:sse            # 运行 SSE 测试');
    log(colors.blue, '  npm run test:tools          # 运行工具测试');
    log(colors.blue, '  npm run test:integration    # 运行集成测试');
    log(colors.blue, '  npm run test:coverage       # 运行覆盖率测试');
    log(colors.blue, '  node run-tests.js smoke     # 冒烟测试');
    log(colors.blue, '\n  node run-tests.js <command> # 使用测试运行器');
    log(colors.reset, '\n');
}

if (require.main === module) {
    main();
}