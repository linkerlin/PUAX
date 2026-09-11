/**
 * v4 心跳：宿主 Hook 与 Agent 共用的一拍。
 */

import { z } from 'zod';
import { runEvolveCycle, type TickEvent } from '../core/evolve-cycle.js';
import { usageStatsCollector } from '../core/usage-stats.js';
import { getTtfSummary } from '../core/ttf.js';
import { toAmpEnvelope } from '../core/amp.js';

const TickEvents = [
  'SessionStart',
  'UserPromptSubmit',
  'PostToolUse',
  'PreCompact',
  'Stop',
  'Manual',
] as const;

const TickInputSchema = z.object({
  session_id: z.string().describe('会话 ID'),
  event: z.enum(TickEvents).default('Manual').describe('宿主事件或手动心跳'),
  message: z.string().optional().describe('用户消息或上下文摘录'),
  tool_name: z.string().optional(),
  error_message: z.string().optional(),
  task_type: z.string().optional(),
  agent_name: z.string().optional().describe('命名 Agent，默认 main'),
  force: z.boolean().optional().describe('忽略冷却与饱和门'),
  skip_detect: z.boolean().optional(),
  detected_triggers: z.array(z.string()).optional(),
  success: z.boolean().optional().describe('Stop 时传入结局'),
  active_role: z.string().optional(),
});

export const puaxTickTool = {
  name: 'puax_tick',
  description:
    'PUAX v4 心跳。检测→升压→选角→薄注入→进化一拍。默认路径：宿主 Hook 代跳。返回 AMP/0.1 信封。',
  inputSchema: TickInputSchema,
  handler: (args: z.infer<typeof TickInputSchema>) => {
    usageStatsCollector.recordToolCall('puax_tick');
    const result = runEvolveCycle({
      session_id: args.session_id,
      event: args.event as TickEvent,
      message: args.message,
      tool_name: args.tool_name,
      error_message: args.error_message,
      task_type: args.task_type,
      agent_name: args.agent_name,
      force: args.force,
      skip_detect: args.skip_detect,
      detected_triggers: args.detected_triggers,
      success: args.success,
      active_role: args.active_role,
    });
    if (result.selected_role) {
      usageStatsCollector.recordRoleRecommended(result.selected_role);
      if (result.happened && result.action !== 'silent') {
        usageStatsCollector.recordRoleActivated(result.selected_role);
      }
    }
    return {
      ...result,
      product: '处境、闸门、梦',
      ttf: getTtfSummary(),
      amp: toAmpEnvelope(result, args.session_id, args.event as TickEvent),
    };
  },
};
