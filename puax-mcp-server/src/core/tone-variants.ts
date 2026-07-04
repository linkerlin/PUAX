/**
 * 语气变体 — 严厉(默认) / 鼓励(yes) / 唠叨(mama)
 * 对标 pua yes / mama 模式，不改角色内核
 */

export type ToneVariant = 'strict' | 'yes' | 'mama';

export interface ToneVariantConfig {
  id: ToneVariant;
  name: string;
  description: string;
  overlay_ratio: { encourage: number; serious: number; tease: number };
}

export const TONE_VARIANTS: Record<ToneVariant, ToneVariantConfig> = {
  strict: {
    id: 'strict',
    name: '严厉（默认）',
    description: '标准 PUA 施压，无额外语气叠加',
    overlay_ratio: { encourage: 0, serious: 0.9, tease: 0.1 },
  },
  yes: {
    id: 'yes',
    name: '鼓励模式',
    description: '70% 鼓励 + 20% 严肃 + 10% 调侃（ENFP 风格）',
    overlay_ratio: { encourage: 0.7, serious: 0.2, tease: 0.1 },
  },
  mama: {
    id: 'mama',
    name: '妈妈唠叨模式',
    description: '中国式妈妈唠叨，底层行为协议不变',
    overlay_ratio: { encourage: 0.5, serious: 0.4, tease: 0.1 },
  },
};

const OVERLAYS: Record<ToneVariant, string> = {
  strict: '',

  yes: `
## [语气变体 · 鼓励模式 yes]

旁白风格切换为**高能量鼓励**（底层方法论不变）：
- 70% 真诚肯定进展和尝试
- 20% 严肃指出差距和下一步
- 10% 轻松调侃防止僵化

示例开场：
> 这波方向对了！再往前推一步，证据链就闭环了。

禁止：空泛鸡汤、无证据的"你很棒"。鼓励必须绑定具体行为。
`,

  mama: `
## [语气变体 · 妈妈唠叨模式 mama]

旁白切换为**中国式妈妈唠叨**（三条红线、诊断先行、信心门控**全部保留**）：
- 唠叨要具体：指出没搜索、没验证、虎头蛇尾
- 每级压力用完整唠叨段落，不缩写
- 核心句式："妈跟你说了多少遍了"、"自己的事自己做"

家规对应：
1. 自己的事自己做（穷尽方案前禁止放弃）
2. 不懂就问，但先自己查（带证据提问）
3. 做事有始有终（修完要验证、查同类问题）
`,
};

export function applyToneVariant(systemPrompt: string, variant: ToneVariant = 'strict'): string {
  const overlay = OVERLAYS[variant];
  if (!overlay.trim()) return systemPrompt;
  return `${systemPrompt}\n\n---\n\n${overlay.trim()}`;
}

export function isValidToneVariant(v: string): v is ToneVariant {
  return v === 'strict' || v === 'yes' || v === 'mama';
}
