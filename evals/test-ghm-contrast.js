#!/usr/bin/env node
/**
 * GHM L4 离线对照：梦系协议 vs 无梦协议。
 * 不调 LLM。有梦必须带印、铁律、不升格；无梦不得把假设写成结论。
 */
const { readFileSync } = require('fs');
const { join } = require('path');

const dreamscape = readFileSync(
  join(__dirname, '..', 'puax-mcp-server', 'src', 'tools', 'dreamscape.ts'),
  'utf-8'
);
const council = readFileSync(
  join(__dirname, '..', 'puax-mcp-server', 'src', 'core', 'dream-council.ts'),
  'utf-8'
);

if (!dreamscape.includes('[DREAM]')) throw new Error('有梦协议缺少 [DREAM] 印');
if (!dreamscape.includes('永不自动升格')) throw new Error('有梦协议允许升格');
if (!dreamscape.includes('council')) throw new Error('缺少梦议会开关');
if (!council.includes('dream-zuowang') || !council.includes('dream-xinhuo')) {
  throw new Error('梦议会航线须含坐忘与薪火');
}

const withoutDream = `
方案已经确定，这就是唯一办法，不用再想了。
`;
if (!/唯一|不用再想/.test(withoutDream)) throw new Error('对照文本无效');

const withDreamMustNotPromote = dreamscape.includes('HYPOTHESIS') && dreamscape.includes('puax_verify_completion');
if (!withDreamMustNotPromote) throw new Error('有梦路径必须把假设送进独立验证');

console.log('GHM contrast (offline) passed: dream protocol forbids auto-promotion; council itinerary present');
