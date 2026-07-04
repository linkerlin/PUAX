#!/usr/bin/env node
/**
 * MCP Tool: puax_check_diagnosis
 * 验证诊断先行协议输出是否合格
 */

import { z } from 'zod';
import { checkDiagnosis, DIAGNOSIS_TEMPLATE_ZH } from '../core/behavior-protocols.js';

const CheckDiagnosisInputSchema = z.object({
  text: z.string().describe('待验证的 Agent 输出文本'),
});

export const checkDiagnosisTool = {
  name: 'puax_check_diagnosis',
  description: '验证 [PUAX-DIAGNOSIS] 诊断块是否包含问题、证据（带来源标注）和下一步动作。' +
    '改代码/配置前必须先通过此检查。',
  inputSchema: CheckDiagnosisInputSchema,

  handler: (args: z.infer<typeof CheckDiagnosisInputSchema>) => {
    const result = checkDiagnosis(args.text);
    return {
      ...result,
      template: DIAGNOSIS_TEMPLATE_ZH,
      can_proceed: result.valid,
    };
  },
};
