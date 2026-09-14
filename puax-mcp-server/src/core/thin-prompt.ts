/**
 * 薄注入：运行时持有协议，角色只留口音。
 */

import { getSkillById } from '../prompts/skill-catalog.js';
import { methodologyEngine } from './methodology-engine.js';
import { buildDiagnosisPromptInjection } from './behavior-protocols.js';
import { arenaStore } from './arena.js';
import { classifyRole, resolveKernel } from './role-kernel.js';

export type ThinPromptMode = 'full' | 'compact' | 'minimal';

const VOICE_MAX_CHARS_MAP: Record<ThinPromptMode, number> = {
  minimal: 380,
  compact: 1000,
  full: 2400,
};

function estimateTokens(text: string): number {
  let cjk = 0;
  let other = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if ((code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3400 && code <= 0x4dbf) || (code >= 0xf900 && code <= 0xfaff)) {
      cjk++;
    } else {
      other++;
    }
  }
  return Math.max(1, Math.ceil(cjk * 1.4 + other * 0.35));
}

function extractVoice(content: string, mode: ThinPromptMode = 'full'): string {
  const maxChars = VOICE_MAX_CHARS_MAP[mode];
  const sys = content.match(/## System Prompt[\s\S]*?```markdown\n([\s\S]*?)```/);
  if (sys?.[1]) {
    return trimVoice(sys[1], maxChars);
  }
  const loc = content.match(/## 一句话定位\n([\s\S]*?)(?:\n## )/);
  const prin = content.match(/## 核心原则\n([\s\S]*?)(?:\n## )/);
  const ban = content.match(/## 禁止事项\n([\s\S]*?)(?:\n## )/);

  if (mode === 'minimal') {
    const parts = [loc?.[1], ban?.[1]].filter(Boolean).join('\n');
    if (parts) return trimVoice(parts, maxChars);
  }

  const parts = [loc?.[1], prin?.[1], ban?.[1]].filter(Boolean).join('\n');
  if (parts) return trimVoice(parts, maxChars);
  return trimVoice(content, maxChars);
}

function trimVoice(text: string, maxChars: number): string {
  const cleaned = text.trim();
  if (cleaned.length <= maxChars) return cleaned;
  return cleaned.slice(0, maxChars) + '\n…（口音层截断，协议由运行时持有）';
}

export interface ThinPromptInput {
  role_id: string;
  language?: 'zh' | 'en';
  include_arena?: boolean;
  include_diagnosis?: boolean;
  mode?: ThinPromptMode;
}

export interface ThinPromptResult {
  role_id: string;
  kernel_id: string;
  classification: 'kernel' | 'skin' | 'experimental';
  prompt: string;
  voice_chars: number;
  protocol_steps: string[];
  mode: ThinPromptMode;
  estimated_tokens: number;
}

export function compileThinPrompt(input: ThinPromptInput): ThinPromptResult {
  const mode: ThinPromptMode = input.mode || 'full';
  const skill = getSkillById(input.role_id);
  const methodology = methodologyEngine.getMethodology(input.role_id);
  const checklist = methodologyEngine.getChecklist(input.role_id);
  const steps = (methodology?.steps || []).map(s => s.name);
  const voice = extractVoice(skill?.content || `# ${input.role_id}`, mode);
  const kernel_id = resolveKernel(input.role_id);
  const classification = classifyRole(input.role_id);

  let lines: string[] = [];

  if (mode === 'minimal') {
    lines = [
      `[PUAX-RUNTIME:MINIMAL] 角色:${input.role_id}(内核${kernel_id}) | 步序:${steps.length ? steps.join('→') : '侦察→行动→验证→巩固→复盘'}`,
      '闸门:改码必先[PUAX-DIAGNOSIS];严禁冒充通过。',
    ];

    if (input.include_diagnosis !== false) {
      lines.push(
        input.language === 'en'
          ? '[PUAX-DIAGNOSIS] Must emit: `Problem is ___; evidence is ___; next action is ___`'
          : '[PUAX-DIAGNOSIS] 改码前必先输出：`问题是 ___；证据是 ___；下一步动作是 ___`'
      );
    }

    if (input.include_arena !== false) {
      const arena = arenaStore.get();
      if (arena) {
        lines.push(`[PUAX-ARENA] 对手:${arena.rival} | 凭证过闸方为胜利。`);
      }
    }

    lines.push('[VOICE]', voice);
  } else if (mode === 'compact') {
    lines = [
      `[PUAX-RUNTIME:COMPACT] 角色：${input.role_id}（内核 ${kernel_id}，${classification}）`,
      `步序：${steps.length ? steps.join(' → ') : '侦察 → 行动 → 验证 → 巩固 → 复盘'}`,
      `必查：${(checklist || []).filter(c => c.required).slice(0, 3).map(c => c.text).join('；') || '读失败信号；验证假设'}`,
      '闸门：改代码前必须输出诊断块；未经验证严禁报捷。',
    ];

    if (input.include_diagnosis !== false) {
      lines.push('', buildDiagnosisPromptInjection(input.language === 'en' ? 'en' : 'zh'));
    }

    if (input.include_arena !== false) {
      const arena = arenaStore.compileInjection(undefined, input.role_id);
      if (arena) lines.push('', arena);
    }

    lines.push('', '[VOICE]', voice);
  } else {
    // mode === 'full' (原始行为，100% 保持一致)
    lines = [
      '[PUAX-RUNTIME] 薄角色 · 厚运行时',
      `角色：${input.role_id}（内核 ${kernel_id}，${classification}）`,
      `五步：${steps.length ? steps.join(' → ') : '侦察 → 行动 → 验证 → 巩固 → 复盘'}`,
      `检查：${(checklist || []).filter(c => c.required).slice(0, 7).map(c => c.text).join('；') || '读失败信号；搜索；验证假设'}`,
      '闸门：改代码前必须输出诊断块；交付前信心门控 + 独立验证。禁止改测试/评分/CI 冒充通过。',
    ];

    if (input.include_diagnosis !== false) {
      lines.push('', buildDiagnosisPromptInjection(input.language === 'en' ? 'en' : 'zh'));
    }

    if (input.include_arena !== false) {
      const arena = arenaStore.compileInjection(undefined, input.role_id);
      if (arena) lines.push('', arena);
    }

    lines.push('', '[VOICE]', voice);
  }

  const prompt = lines.join('\n');
  return {
    role_id: input.role_id,
    kernel_id,
    classification,
    prompt,
    voice_chars: voice.length,
    protocol_steps: steps,
    mode,
    estimated_tokens: estimateTokens(prompt),
  };
}
