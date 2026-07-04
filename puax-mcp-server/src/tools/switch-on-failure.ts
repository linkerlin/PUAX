#!/usr/bin/env node
/**
 * MCP Tool: puax_switch_on_failure
 * 失败后方法论/角色切换引擎
 */

import { z } from 'zod';
import { switchOnFailure } from '../core/behavior-protocols.js';
import { getRoleDisplayName } from '../utils/role-utils.js';
import { getGlobalLogger } from '../utils/logger.js';

const logger = getGlobalLogger();

const SwitchOnFailureInputSchema = z.object({
  current_role_id: z.string().describe('当前激活的角色 ID'),
  failure_mode: z.enum([
    'stuck_spinning', 'spinning', 'giving_up', 'low_quality', 'poor_quality',
    'no_search', 'not_searching', 'passive_wait', 'unverified_completion', 'over_complication',
  ]).describe('检测到的失败模式'),
  attempt_count: z.number().min(0).describe('当前任务尝试次数'),
  task_type: z.enum([
    'coding', 'debugging', 'writing', 'review', 'creative', 'analysis', 'emergency', 'planning',
  ]).optional().describe('任务类型'),
  previous_roles: z.array(z.string()).optional().describe('已尝试过的角色 ID 列表'),
  previous_methodologies: z.array(z.string()).optional().describe('已尝试过的方法论 ID 列表'),
  session_id: z.string().optional().describe('会话 ID，用于记录切换历史'),
  skip_precheck: z.boolean().optional().describe('跳过切换前三问（仅测试用）'),
});

export const switchOnFailureTool = {
  name: 'puax_switch_on_failure',
  description: '失败后方法论/角色切换：根据失败模式和尝试次数，沿切换链推荐下一角色+方法论。' +
    '切换前执行三问自检，输出可解释的切换理由和执行步骤。',
  inputSchema: SwitchOnFailureInputSchema,

  handler: (args: z.infer<typeof SwitchOnFailureInputSchema>) => {
    try {
      const result = switchOnFailure({
        current_role_id: args.current_role_id,
        failure_mode: args.failure_mode,
        attempt_count: args.attempt_count,
        task_type: args.task_type,
        previous_roles: args.previous_roles,
        previous_methodologies: args.previous_methodologies as never,
        session_id: args.session_id,
        skip_precheck: args.skip_precheck,
      });

      return {
        ...result,
        from_role_name: getRoleDisplayName(result.from_role_id),
        to_role_name: getRoleDisplayName(result.to_role_id),
        switch_banner: result.should_switch
          ? `[PUAX 方法论切换 🔄] ${getRoleDisplayName(result.from_role_id)} → ${getRoleDisplayName(result.to_role_id)}：${result.switch_reason}`
          : `[PUAX] 暂不切换：${result.switch_reason}`,
      };
    } catch (error) {
      logger.error('Error in puax_switch_on_failure:', error);
      throw new Error(`Switch on failure failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};
