#!/usr/bin/env node
/**
 * MCP Tool: puax_define_contract
 * Task Contract 定义（防作弊治理）
 */

import { z } from 'zod';
import { defineContract, GOVERNANCE_PRINCIPLES } from '../core/governance.js';

const DefineContractInputSchema = z.object({
  feature_id: z.string().describe('任务/功能 ID'),
  intent: z.string().describe('用户意图（一句话）'),
  acceptance: z.array(z.string()).min(1).describe('验收标准列表'),
  forbidden: z.array(z.string()).optional().describe('禁止事项'),
  verify_commands: z.array(z.string()).min(1).describe('验证命令，如 npm test'),
});

export const defineContractTool = {
  name: 'puax_define_contract',
  description: '定义 Task Contract：intent/acceptance/forbidden/verify_commands。' +
    '权责分离——Agent 只能更新 agent_proposed_status，verifier_status 由 puax_verify_completion 写入。',
  inputSchema: DefineContractInputSchema,

  handler: (args: z.infer<typeof DefineContractInputSchema>) => {
    const contract = defineContract(args);
    return {
      contract,
      governance_principles: GOVERNANCE_PRINCIPLES,
      reminder: '开始工作前确认 contract。完成时调用 puax_verify_completion，禁止自评自判。',
    };
  },
};
