/**
 * 显式进化周期（与心跳同源，force 默认开）。
 */

import { z } from 'zod';
import { runEvolveCycle } from '../core/evolve-cycle.js';
import { evolutionEngine } from '../core/evolution-engine.js';
import { namedAgentStore } from '../core/named-agent.js';
import { memoryGraph } from '../core/memory-graph.js';
import { usageStatsCollector } from '../core/usage-stats.js';
import { toAmpEnvelope } from '../core/amp.js';

const EvolveInputSchema = z.object({
  session_id: z.string().default('manual'),
  message: z.string().optional(),
  task_type: z.string().optional(),
  agent_name: z.string().optional(),
  success: z.boolean().optional(),
  active_role: z.string().optional(),
});

export const puaxEvolveTool = {
  name: 'puax_evolve',
  description:
    '跑一拍自进化周期（collect→signals→select→autopoiesis→dispatch→solidify）。仿 evolver.py 流水线，无外部依赖。',
  inputSchema: EvolveInputSchema,
  handler: (args: z.infer<typeof EvolveInputSchema>) => {
    usageStatsCollector.recordToolCall('puax_evolve');
    const cycle = runEvolveCycle({
      session_id: args.session_id,
      event: 'Manual',
      message: args.message,
      task_type: args.task_type,
      agent_name: args.agent_name,
      success: args.success,
      active_role: args.active_role,
      force: true,
    });
    const agent = namedAgentStore.load(args.agent_name || 'main');
    return {
      cycle,
      baseline: evolutionEngine.getBaselineReminder(),
      agent,
      recent_memory: memoryGraph.readRecent(8),
      amp: toAmpEnvelope(cycle, args.session_id, 'Manual'),
    };
  },
};
