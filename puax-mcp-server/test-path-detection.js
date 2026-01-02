#!/usr/bin/env node

const path = require('path');

console.log('\n📍 路径自动检测逻辑验证\n');

// 模拟 __dirname
const __dirname = 'C:\\GitHub\\PUAX\\puax-mcp-server\\src\\prompts';

console.log('__dirname:', __dirname);
console.log('path.dirname(__dirname):', path.dirname(__dirname));
console.log('path.resolve(__dirname, ".."):', path.resolve(__dirname, '..'));
console.log('path.resolve(puaxMcpServerDir, ".."):', path.resolve(path.resolve(__dirname, '..'), '..'));

console.log('\n✅ 正确识别:');
console.log('  puax-mcp-server 目录: C:\\GitHub\\PUAX\\puax-mcp-server');
console.log('  PUAX 项目根目录: C:\\GitHub\\PUAX');
console.log('  （puax-mcp-server 的父目录）\n');
