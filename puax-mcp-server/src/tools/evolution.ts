#!/usr/bin/env node
/**
 * MCP Tools: 自进化引擎
 */

import { z } from 'zod';
import { evolutionEngine } from '../core/evolution-engine.js';

const GetEvolutionInputSchema = z.object({});

export const getEvolutionBaselineTool = {
  name: 'puax_get_evolution_baseline',
  description: '加载 ~/.puax/evolution.json 基线、已内化模式和段位。会话启动时调用。',
  inputSchema: GetEvolutionInputSchema,

  handler: () => {
    const reminder = evolutionEngine.getBaselineReminder();
    const data = evolutionEngine.load();
    return {
      ...reminder,
      stats: data.stats,
      anti_patterns: data.anti_patterns.slice(-5),
      project_memory: data.project_memory,
    };
  },
};

const RecordEvolutionInputSchema = z.object({
  pua_effects: z.array(z.string()).describe('本次会话主动行为列表'),
  success: z.boolean(),
  breakthrough: z.object({
    root_cause: z.string(),
    effective_method: z.string(),
    shortcut: z.string(),
  }).optional(),
  anti_pattern: z.object({
    pattern: z.string(),
    lesson: z.string(),
  }).optional(),
  project_id: z.string().optional(),
  project_facts: z.array(z.string()).optional(),
});

export const recordEvolutionTool = {
  name: 'puax_record_evolution',
  description: '会话结束时更新自进化基线。超越基线则刷新标准，低于基线触发退化警告。',
  inputSchema: RecordEvolutionInputSchema,

  handler: (args: z.infer<typeof RecordEvolutionInputSchema>) => {
    return evolutionEngine.recordSessionEnd(args);
  },
};

export const evolutionTools = [getEvolutionBaselineTool, recordEvolutionTool];
