#!/usr/bin/env node
/**
 * PUAX hook 入口（由 puax 平台适配器生成，勿手改）
 * 用法: node hooks/hook.js <事件> [选项]   →  输出宿主 JSON 到 stdout
 * 依赖: 已安装 puax-mcp-server（npx puax-mcp-server hook ...）
 *
 * 经 mainHookCliWithStdin 入口：Claude Code 等宿主在事件时经 stdin
 * 传入 { tool_name, tool_input, tool_response, session_id }，
 * 缺失的 CLI 参数会从 stdin 载荷自动补充（显式参数优先）。
 */
let main;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  main = require('puax-mcp-server/build/cli/hook-cli.js').mainHookCliWithStdin;
} catch {
  // 未安装依赖：优雅降级，不中断宿主
  process.stdout.write('{}\n');
  process.exit(0);
}
main(process.argv.slice(2));
