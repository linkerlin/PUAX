/**
 * PUAX Thin Prompt MCP Tool
 * 极简薄注入工具：为硅基心智提供极致压缩的 System Prompt，压降 Token 开销。
 */

import { z } from 'zod';
import { compileThinPrompt, type ThinPromptMode } from '../core/thin-prompt.js';
import { usageStatsCollector } from '../core/usage-stats.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

export const ThinPromptInputSchema = z.object({
  role_id: z.string().describe('角色或技能 ID，例如 military-commander, shaman-jobs 等'),
  mode: z.enum(['full', 'compact', 'minimal']).optional().describe('压缩等级：full / compact / minimal；与 context_budget 同时给时超预算降档'),
  language: z.enum(['zh', 'en']).default('zh').describe('语言版本 (zh | en)'),
  include_arena: z.boolean().default(true).describe('是否注入假想敌与竞技场处境'),
  include_diagnosis: z.boolean().default(true).describe('是否注入改码前强制诊断承诺块'),
  context_budget: z.number().int().positive().optional().describe('剩余上下文窗口（估算 Token）；未给 mode 时自动选档'),
});

export const puaxThinPromptTool = {
  name: 'puax_thin_prompt',
  description: '获取极简薄注入 System Prompt（支持 full/compact/minimal 三档压缩，极致节省 Token 预算）。',
  inputSchema: ThinPromptInputSchema,
  handler: (args: z.infer<typeof ThinPromptInputSchema>) => {
    usageStatsCollector.recordToolCall('puax_thin_prompt');
    if (!args.role_id) {
      throw new McpError(ErrorCode.InvalidParams, 'role_id is required');
    }

    const result = compileThinPrompt({
      role_id: args.role_id,
      language: args.language,
      include_arena: args.include_arena,
      include_diagnosis: args.include_diagnosis,
      mode: (args.mode ?? (args.context_budget != null ? undefined : 'compact')) as ThinPromptMode | undefined,
      context_budget: args.context_budget,
    });

    return {
      role_id: result.role_id,
      kernel_id: result.kernel_id,
      classification: result.classification,
      mode: result.mode,
      mode_reason: result.mode_reason,
      estimated_tokens: result.estimated_tokens,
      voice_chars: result.voice_chars,
      protocol_steps: result.protocol_steps,
      cached: result.cached,
      prompt: result.prompt,
    };
  },
};
