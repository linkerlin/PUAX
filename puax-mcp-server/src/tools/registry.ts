/**
 * MCP 工具注册表 — handler 查找与响应规范化
 */

import type { TextContent } from '@modelcontextprotocol/sdk/types.js';

export type ToolHandler = (args: Record<string, unknown>) => unknown;

export interface McpToolResponse {
  content: TextContent[];
  [key: string]: unknown;
}

export function normalizeToolResponse(result: unknown): McpToolResponse {
  if (
    result &&
    typeof result === 'object' &&
    'content' in result &&
    Array.isArray((result as McpToolResponse).content)
  ) {
    return result as McpToolResponse;
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2)
    }]
  };
}

export function buildToolHandlerMap(
  tools: ReadonlyArray<{ name: string; handler?: ToolHandler }>
): Map<string, ToolHandler> {
  const map = new Map<string, ToolHandler>();
  for (const tool of tools) {
    if (typeof tool.handler === 'function') {
      map.set(tool.name, tool.handler);
    }
  }
  return map;
}

export function buildHookToolHandlers(
  tools: ReadonlyArray<{ name: string; handler?: ToolHandler }>
): Record<string, ToolHandler> {
  return Object.fromEntries(buildToolHandlerMap(tools));
}
