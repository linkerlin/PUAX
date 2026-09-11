#!/usr/bin/env node
/**
 * 使用指南必须把心跳写成默认路径，而不是 45 工具导购。
 */
const { readFileSync } = require('fs');
const { join } = require('path');

const guide = readFileSync(join(__dirname, '..', 'docs', 'USER-GUIDE.md'), 'utf-8');
const idxTick = guide.indexOf('puax_tick');
const idxRecommend = guide.indexOf('recommend_role');
if (idxTick < 0) throw new Error('USER-GUIDE 缺少 puax_tick');
if (idxRecommend >= 0 && idxTick > idxRecommend) {
  throw new Error('USER-GUIDE 仍把 recommend_role 写在心跳前面');
}
if (!guide.includes('UserPromptSubmit')) throw new Error('指南应写明宿主事件');
if (!guide.includes('[PUAX-DIAGNOSIS]')) throw new Error('指南应保留诊断闸门');

console.log('USER-GUIDE v4 default path ok');
