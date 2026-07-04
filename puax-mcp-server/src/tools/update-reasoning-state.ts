#!/usr/bin/env node
/**
 * MCP Tool: puax_update_reasoning_state
 * Compaction 状态保护：保存推理状态
 */

import { z } from 'zod';
import { stateManager } from '../hooks/state-manager.js';

const UpdateReasoningStateInputSchema = z.object({
  session_id: z.string(),
  tried_approaches: z.array(z.string()).optional(),
  excluded_possibilities: z.array(z.string()).optional(),
  next_hypothesis: z.string().optional(),
  active_task: z.string().optional(),
});

export const updateReasoningStateTool = {
  name: 'puax_update_reasoning_state',
  description: '保存 tried_approaches/excluded_possibilities/next_hypothesis，Compaction 前调用。同步写入 builder-journal。',
  inputSchema: UpdateReasoningStateInputSchema,

  handler: (args: z.infer<typeof UpdateReasoningStateInputSchema>) => {
    stateManager.updateReasoningState(args.session_id, {
      triedApproaches: args.tried_approaches,
      excludedPossibilities: args.excluded_possibilities,
      nextHypothesis: args.next_hypothesis,
      activeTask: args.active_task,
    });

    const state = stateManager.getSessionState(args.session_id);
    return {
      success: true,
      session_id: args.session_id,
      reasoning_state: {
        tried_approaches: state.triedApproaches,
        excluded_possibilities: state.excludedPossibilities,
        next_hypothesis: state.nextHypothesis,
        active_task: state.activeTask,
      },
    };
  },
};
