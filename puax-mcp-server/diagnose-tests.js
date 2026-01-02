#!/usr/bin/env node

/**
 * 诊断脚本 - 找出哪些测试被跳过
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

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

// 找出所有测试文件
function findTestFiles(dir) {
    const files = [];
    function scan(currentDir) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory() && entry.name !== 'node_modules') {
                scan(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
                files.push(fullPath);
            }
        }
    }
    scan(dir);
    return files;
}

async function runTestWithDetails(testFile) {
    return new Promise((resolve) => {
        const testName = path.relative(process.cwd(), testFile);
        log(colors.cyan, `\n测试文件: ${testName}`);
        
        const jestProcess = spawn('npx', [
            'jest',
            testFile,
            '--testTimeout=5000',
            '--verbose'
        ], {
            stdio: 'pipe',
            shell: true,
            env: { ...process.env }
        });

        let output = '';
        let errorOutput = '';

        jestProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        jestProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        jestProcess.on('close', (code) => {
            // 分析输出
            const lines = output.split('\n');
            const results = [];
            let isTestLine = false;
            let suiteStatus = 'unknown';
            
            for (const line of lines) {
                if (line.includes('●')) {
                    // 测试名称
                    const match = line.match(/● (.*)/);
                    if (match) {
                        results.push({ name: match[1].trim(), status: 'failed' });
                    }
                } else if (line.includes('√') || line.includes('✓')) {
                    // 通过的测试
                    const match = line.match(/[√✓] (.*)/);
                    if (match) {
                        results.push({ name: match[1].trim(), status: 'passed' });
                    }
                } else if (line.includes('○') || line.includes('⊘')) {
                    // 跳过的测试
                    const match = line.match(/[○⊘] (.*)/);
                    if (match) {
                        results.push({ name: match[1].trim(), status: 'skipped' });
                    }
                } else if (line.includes('PASS')) {
                    suiteStatus = 'passed';
                } else if (line.includes('FAIL')) {
                    suiteStatus = 'failed';
                } else if (line.includes('skipped')) {
                    suiteStatus = suiteStatus === 'passed' ? 'passed with skipped' : 'skipped';
                }
            }

            const match = output.match(/(\d+) passed/);
            const match2 = output.match(/(\d+) skipped/);
            
            resolve({
                testFile,
                suiteStatus,
                passed: match ? parseInt(match[1]) : 0,
                skipped: match2 ? parseInt(match2[1]) : 0,
                results: results,
                output,
                errorOutput
            });
        });

        jestProcess.on('error', (err) => {
            resolve({
                testFile,
                suiteStatus: 'error',
                error: err.message
            });
        });
    });
}

async function main() {
    log(colors.cyan, '\n' + '='.repeat(60));
    log(colors.cyan, '诊断测试运行状态');
    log(colors.cyan, '='.repeat(60));

    const testDir = path.join(__dirname, 'test');
    const testFiles = findTestFiles(testDir);
    
    log(colors.yellow, `\n找到 ${testFiles.length} 个测试文件:\n`);

    let totalPassed = 0;
    let totalSkipped = 0;
    const skippedFiles = [];
    const okFiles = [];

    // 逐个运行诊断
    for (const testFile of testFiles) {
        const result = await runTestWithDetails(testFile);
        
        const relativePath = path.relative(__dirname, testFile);
        const testName = path.basename(testFile, '.test.js');
        
        if (result.suiteStatus === 'error') {
            log(colors.red, `❌ ${relativePath}`);
            log(colors.gray, `   错误: ${result.error}`);
        } else {
            const status = result.suiteStatus === 'skipped' || result.skipped > 0 ? 
                          colors.yellow : colors.green;
            log(status, `${result.suiteStatus === 'skipped' || result.skipped > 0 ? '⚠️' : '✅'} ${relativePath}`);
            log(colors.gray, `   通过: ${result.passed}, 跳过: ${result.skipped}`);
            
            totalPassed += result.passed;
            totalSkipped += result.skipped;
            
            if (result.skipped > 0) {
                skippedFiles.push({
                    file: testName,
                    path: relativePath,
                    skipped: result.skipped,
                    passed: result.passed
                });
            } else if (result.passed > 0) {
                okFiles.push({
                    file: testName,
                    passed: result.passed
                });
            }
        }
    }

    // 总结
    log(colors.blue, '\n' + '='.repeat(60));
    log(colors.blue, '诊断总结');
    log(colors.blue, '='.repeat(60));
    
    log(colors.green, `\n测试通过: ${totalPassed}`);
    log(colors.yellow, `测试跳过: ${totalSkipped}`);
    log(colors.cyan, `测试总计: ${totalPassed + totalSkipped}`);

    if (skippedFiles.length > 0) {
        log(colors.red, '\n⚠️  以下文件有跳过的测试:\n');
        skippedFiles.forEach(f => {
            log(colors.yellow, `  - ${f.path}: ${f.skipped} 个测试被跳过`);
        });
    }

    if (okFiles.length > 0) {
        log(colors.green, '\n✅ 以下文件全部通过:\n');
        okFiles.forEach(f => {
            log(colors.green, `  - ${f.file}: ${f.passed} 个测试`);
        });
    }

    log(colors.blue, '\n' + '='.repeat(60) + '\n');

    if (totalSkipped > 0) {
        log(colors.red, `建议: 运行以下命令查看跳过的原因:\n`);
        skippedFiles.forEach(f => {
            log(colors.cyan, `  npx jest ${f.path} --verbose --testTimeout=5000`);
        });
        log();
    }

    process.exit(totalSkipped > 0 ? 1 : 0);
}

if (require.main === module) {
    main().catch((err) => {
        console.error('致命错误:', err);
        process.exit(1);
    });
}

module.exports = { findTestFiles, runTestWithDetails };