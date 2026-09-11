/**
 * 处境原语 MCP 工具
 */

import { z } from 'zod';
import { arenaStore } from '../core/arena.js';
import { usageStatsCollector } from '../core/usage-stats.js';

const SetArenaInputSchema = z.object({
  rival: z.string().optional().describe('假想或真实对手已领先的陈述'),
  audience: z.string().optional().describe('谁在看：用户 / 本机排行榜 / 公开评测'),
  scarce_badge: z.string().optional().describe('稀缺认可条件，默认连败后独立验证'),
  public_scoreboard: z.boolean().optional(),
  clear: z.boolean().optional().describe('拆除处境'),
});

export const puaxSetArenaTool = {
  name: 'puax_set_arena',
  description:
    '立处境（Cranmer 原题）：对手 + 观众 + 稀缺徽章。角色口音可选；处境改先验。',
  inputSchema: SetArenaInputSchema,
  handler: (args: z.infer<typeof SetArenaInputSchema>) => {
    usageStatsCollector.recordToolCall('puax_set_arena');
    if (args.clear) {
      arenaStore.clear();
      return { cleared: true, injection: '' };
    }
    const config = arenaStore.set({
      rival: args.rival,
      audience: args.audience,
      scarce_badge: args.scarce_badge,
      public_scoreboard: args.public_scoreboard,
    });
    return {
      arena: config,
      injection: arenaStore.compileInjection(config),
    };
  },
};
