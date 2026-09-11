/**
 * 薄注入：运行时持有协议，角色只留口音。
 */

import { getSkillById } from '../prompts/skill-catalog.js';
import { methodologyEngine } from './methodology-engine.js';
import { buildDiagnosisPromptInjection } from './behavior-protocols.js';
import { arenaStore } from './arena.js';
import { classifyRole, resolveKernel } from './role-kernel.js';

const VOICE_MAX_CHARS = 2400;

function extractVoice(content: string): string {
  const sys = content.match(/## System Prompt[\s\S]*?```markdown\n([\s\S]*?)```/);
  if (sys?.[1]) {
    return trimVoice(sys[1]);
  }
  const loc = content.match(/## 一句话定位\n([\s\S]*?)(?:\n## )/);
  const prin = content.match(/## 核心原则\n([\s\S]*?)(?:\n## )/);
  const ban = content.match(/## 禁止事项\n([\s\S]*?)(?:\n## )/);
  const parts = [loc?.[1], prin?.[1], ban?.[1]].filter(Boolean).join('\n');
  if (parts) return trimVoice(parts);
  return trimVoice(content);
}

function trimVoice(text: string): string {
  const cleaned = text.trim();
  if (cleaned.length <= VOICE_MAX_CHARS) return cleaned;
  return cleaned.slice(0, VOICE_MAX_CHARS) + '\n…（口音层截断，协议由运行时持有）';
}

export interface ThinPromptInput {
  role_id: string;
  language?: 'zh' | 'en';
  include_arena?: boolean;
  include_diagnosis?: boolean;
}

export interface ThinPromptResult {
  role_id: string;
  kernel_id: string;
  classification: 'kernel' | 'skin' | 'experimental';
  prompt: string;
  voice_chars: number;
  protocol_steps: string[];
}

export function compileThinPrompt(input: ThinPromptInput): ThinPromptResult {
  const skill = getSkillById(input.role_id);
  const methodology = methodologyEngine.getMethodology(input.role_id);
  const checklist = methodologyEngine.getChecklist(input.role_id);
  const steps = (methodology?.steps || []).map(s => s.name);
  const voice = extractVoice(skill?.content || `# ${input.role_id}`);
  const kernel_id = resolveKernel(input.role_id);
  const classification = classifyRole(input.role_id);

  const lines: string[] = [
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
    const arena = arenaStore.compileInjection();
    if (arena) lines.push('', arena);
  }

  lines.push('', '[VOICE]', voice);

  const prompt = lines.join('\n');
  return {
    role_id: input.role_id,
    kernel_id,
    classification,
    prompt,
    voice_chars: voice.length,
    protocol_steps: steps,
  };
}
