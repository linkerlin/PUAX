#!/usr/bin/env node
/**
 * MCP Tool: puax_verify_completion
 * 独立验证闸门（非 Agent 自评）
 */

import { z } from 'zod';
import { verifyCompletion, type TaskContract } from '../core/governance.js';

const TaskContractSchema = z.object({
  feature_id: z.string(),
  intent: z.string(),
  acceptance: z.array(z.string()),
  forbidden: z.array(z.string()),
  verify_commands: z.array(z.string()),
  agent_proposed_status: z.enum(['pending', 'candidate_pass', 'blocked']),
  verifier_status: z.enum(['pending', 'pass', 'fail']),
  created_at: z.string(),
});

const VerifyCompletionInputSchema = z.object({
  contract: TaskContractSchema,
  evidence: z.array(z.object({
    command: z.string(),
    exit_code: z.number(),
    output_summary: z.string(),
    passed: z.boolean(),
  })).describe('验证命令的实际运行结果'),
  agent_claims_complete: z.boolean().describe('Agent 是否声称完成'),
  files_changed: z.array(z.string()).optional().describe('本次修改的文件列表（防 grader gaming）'),
});

export const verifyCompletionTool = {
  name: 'puax_verify_completion',
  description: '独立验证完成状态：对照 Task Contract 检查证据，输出 verifier_status。' +
    '评分权与行动权分离，Agent 不能自行标记 pass。',
  inputSchema: VerifyCompletionInputSchema,

  handler: (args: z.infer<typeof VerifyCompletionInputSchema>) => {
    const result = verifyCompletion({
      contract: args.contract as TaskContract,
      evidence: args.evidence,
      agent_claims_complete: args.agent_claims_complete,
      files_changed: args.files_changed,
    });

    return {
      ...result,
      updated_contract: {
        ...args.contract,
        agent_proposed_status: result.agent_proposed_status,
        verifier_status: result.verifier_status,
      },
    };
  },
};
