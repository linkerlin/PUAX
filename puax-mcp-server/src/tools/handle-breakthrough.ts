#!/usr/bin/env node
/**
 * MCP Tool: puax_handle_breakthrough
 * 突破降压 + 方法论沉淀
 */

import { z } from 'zod';
import { pressureSystem } from '../hooks/pressure-system.js';
import { evolutionEngine } from '../core/evolution-engine.js';

const HandleBreakthroughInputSchema = z.object({
  session_id: z.string(),
  record_lesson: z.object({
    root_cause: z.string(),
    effective_method: z.string(),
    shortcut: z.string(),
    flavor: z.string().optional(),
  }).optional(),
});

export const handleBreakthroughTool = {
  name: 'puax_handle_breakthrough',
  description: '连续失败≥3 次后成功时触发 [PUAX 突破 ✨] 降压：压力归零、味道认可、方法论沉淀。',
  inputSchema: HandleBreakthroughInputSchema,

  handler: (args: z.infer<typeof HandleBreakthroughInputSchema>) => {
    const result = pressureSystem.handleSuccess(args.session_id, true);

    if (!result?.triggered) {
      return {
        triggered: false,
        message: '未达突破条件（需连续失败≥3 且峰值压力≥L2）。正常成功，无额外降压。',
      };
    }

    if (args.record_lesson) {
      evolutionEngine.appendBreakthroughLesson(args.record_lesson);
    }

    return { ...result };
  },
};
