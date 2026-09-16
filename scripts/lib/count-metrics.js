/**
 * 计数助手：从编译产物读取工具数/动词数（供 check-metrics-consistency.js 子进程调用）。
 * 路径全部为字面量，不做任何动态拼装。
 */
const { allTools } = require('../../puax-mcp-server/build/tools/index.js');
const { V4_PUBLIC_VERBS } = require('../../puax-mcp-server/build/core/v4-dashboard.js');

console.log(JSON.stringify({ tools: allTools.length, verbs: V4_PUBLIC_VERBS.length }));
