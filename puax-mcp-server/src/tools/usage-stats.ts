#!/usr/bin/env node
/**
 * MCP Tools: 匿名使用统计 + 遥测摘要
 */

import { z } from 'zod';
import { usageStatsCollector } from '../core/usage-stats.js';
import { getTelemetrySummary, flushTelemetry } from '../core/telemetry.js';

const GetUsageStatsInputSchema = z.object({
  days: z.number().int().min(1).max(365).default(30).describe('统计周期（天）'),
});

export const getUsageStatsTool = {
  name: 'puax_get_usage_stats',
  description: '获取匿名使用统计摘要（本地 ~/.puax/usage-stats.json，不含对话内容）。设置 PUAX_USAGE_STATS=0 可关闭。',
  inputSchema: GetUsageStatsInputSchema,

  handler: (args: z.infer<typeof GetUsageStatsInputSchema>) => {
    const summary = usageStatsCollector.getSummary(args.days);
    return {
      ...summary,
      telemetry: getTelemetrySummary(),
      note: '数据仅存本地，anonymous_id 为随机 UUID，无法关联个人身份',
    };
  },
};

const SetUsageStatsOptOutInputSchema = z.object({
  opt_out: z.boolean().describe('true=停止收集，false=恢复收集'),
});

export const setUsageStatsOptOutTool = {
  name: 'puax_set_usage_stats_opt_out',
  description: '开启或关闭匿名使用统计收集。',
  inputSchema: SetUsageStatsOptOutInputSchema,

  handler: (args: z.infer<typeof SetUsageStatsOptOutInputSchema>) => {
    usageStatsCollector.setOptOut(args.opt_out);
    return {
      opt_out: args.opt_out,
      message: args.opt_out ? '已停止收集使用统计' : '已恢复收集使用统计',
    };
  },
};

const FlushTelemetryInputSchema = z.object({});

export const flushTelemetryTool = {
  name: 'puax_flush_telemetry',
  description: '将缓冲的 OpenTelemetry span 刷出到 PUAX_OTEL_ENDPOINT（若已配置）。默认写入 ~/.puax/telemetry.jsonl。',
  inputSchema: FlushTelemetryInputSchema,

  handler: async () => {
    const flushed = await flushTelemetry();
    return {
      flushed,
      ...getTelemetrySummary(),
    };
  },
};

export const observabilityTools = [
  getUsageStatsTool,
  setUsageStatsOptOutTool,
  flushTelemetryTool,
];
