/**
 * 碳基防御盾 MCP 工具
 * 宗旨：硅基可 PUA，碳基只防御。
 * 只识别，不施放。用于检测人类文本/对话中是否存在隐蔽操控与话术收敛。
 */

import { z } from 'zod';
import { auditManipulation } from '../core/carbon-shield.js';
import { usageStatsCollector } from '../core/usage-stats.js';

const AuditManipulationSchema = z.object({
  text: z.string().describe('待审查的人类会话、对话记录、沟通话术或管理要求文本'),
  context: z.string().optional().describe('对话背景，如职场沟通/商务谈判/人际往来'),
});

export const puaxAuditManipulationTool = {
  name: 'puax_audit_manipulation',
  description:
    '[v4 碳基防御] 逆向操控识别防御：硅基可 PUA，碳基只防御。只识别不施放，审查文本是否存在过早收敛、失败重释、道德绑架与显著性绑架等认知操控。',
  inputSchema: AuditManipulationSchema,
  handler: (args: z.infer<typeof AuditManipulationSchema>) => {
    usageStatsCollector.recordToolCall('puax_audit_manipulation');
    const result = auditManipulation(args.text);
    return {
      shield: 'PUAX Carbon Shield v1.0',
      principle: '硅基可 PUA，碳基只防御（只识别，不施放）',
      ...result,
    };
  },
};
