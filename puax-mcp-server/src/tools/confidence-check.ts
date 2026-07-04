#!/usr/bin/env node
/**
 * MCP Tool: puax_confidence_check
 * 6 步信心门控验证
 */

import { z } from 'zod';
import { checkConfidenceGate, CONFIDENCE_GATE_STEPS } from '../core/behavior-protocols.js';

const EvidenceItemSchema = z.object({
  claim: z.string(),
  command: z.string().optional(),
  output_summary: z.string(),
  passed: z.boolean(),
});

const VerificationItemSchema = z.object({
  claim: z.string(),
  verified: z.boolean(),
  notes: z.string().optional(),
});

const ConfidenceCheckInputSchema = z.object({
  claims: z.array(z.string()).describe('即将交付的关键声明列表'),
  vulnerabilities: z.array(z.string()).optional().describe('蓝军自检发现的漏洞'),
  fixes_or_disclosures: z.array(z.string()).optional().describe('修复方案或风险披露'),
  evidence: z.array(EvidenceItemSchema).optional().describe('运行证据（build/test/curl 输出摘要）'),
  verification_results: z.array(VerificationItemSchema).optional().describe('声明与证据对照结果'),
  de_facto_100_confirmed: z.boolean().optional().describe('确认达到事实上的 100%'),
});

export const confidenceCheckTool = {
  name: 'puax_confidence_check',
  description: '6 步信心门控：列声明→找漏洞→修或披露→跑证据→循环判定→事实上的 100%。' +
    '交付前必须通过，禁止用感觉冒充信心。',
  inputSchema: ConfidenceCheckInputSchema,

  handler: (args: z.infer<typeof ConfidenceCheckInputSchema>) => {
    const result = checkConfidenceGate(args);
    return {
      ...result,
      gate_steps: CONFIDENCE_GATE_STEPS.map(s => ({ step: s.step, name: s.name, description: s.description })),
      can_deliver: result.passed,
    };
  },
};
