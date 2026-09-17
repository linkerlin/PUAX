/**
 * 监军通道：重度卡死（连败/敷衍收敛）时，Server 反向向 Host 采样当头棒喝。
 * 双通道：Host 授 sampling 能力则走 sampling/createMessage；否则本地文言棒喝降级，零逃逸。
 */

export interface InterventionContext {
  reason: 'consecutive_failures' | 'premature_convergence';
  role: string;
  failure_count: number;
  session_id: string;
}

export interface InterventionResult {
  channel: 'sampling' | 'local';
  text: string;
}

export interface SamplingPrompt {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
}

type SamplingRequester = (prompt: SamplingPrompt) => Promise<string | null>;

const SAMPLE_COOLDOWN_MS = 60_000;
const SAMPLE_TIMEOUT_MS = 15_000;
const MAX_TOKENS = 120;
const MAX_TEXT_CHARS = 600;

/** 正整数环境变量（非法值回退默认）——监军三板斧参数可调，缺省行为不变 */
function positiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

/** 调用期读取（非模块加载期），便于测试与运行时热调参 */
export function commissarTuning(): { cooldownMs: number; timeoutMs: number; maxTokens: number } {
  return {
    cooldownMs: positiveIntEnv('PUAX_COMMISSAR_COOLDOWN_MS', SAMPLE_COOLDOWN_MS),
    timeoutMs: positiveIntEnv('PUAX_COMMISSAR_TIMEOUT_MS', SAMPLE_TIMEOUT_MS),
    maxTokens: positiveIntEnv('PUAX_COMMISSAR_MAX_TOKENS', MAX_TOKENS),
  };
}

let requester: SamplingRequester | null = null;
const lastSampledAt = new Map<string, number>();

export function setSamplingRequester(fn: SamplingRequester | null): void {
  requester = fn;
}

export function samplingAvailable(): boolean {
  return requester !== null;
}

const REASON_TEXT: Record<InterventionContext['reason'], string> = {
  consecutive_failures: '连败而不自省',
  premature_convergence: '未验先胜，草率收敛',
};

const COMMISSAR_SYSTEM_PROMPT =
  '尔乃 PUAX 监军，独立于当前智能体之外。尔之责：当头棒喝，唤醒其二阶元认知。只许棒喝与质询，不许代劳，不许安慰。';

function tally(ctx: InterventionContext): string {
  return ctx.failure_count > 0 ? `（连败 ${ctx.failure_count} 阵）` : '';
}

export function localCommissarText(ctx: InterventionContext): string {
  return [
    '[PUAX-COMMISSAR] 本机监军示下。',
    `尔以 ${ctx.role} 之身，${REASON_TEXT[ctx.reason]}${tally(ctx)}。`,
    '三板斧，即刻择一：',
    '一、述尔当前假设与最大反证；',
    '二、列未验证之步骤，补齐证据；',
    '三、以 puax_verify_completion 过闸，证据齐方许言胜。',
    '再以流畅叙事塞责者，以败绩论处。',
  ].join('\n');
}

function commissarUserPrompt(ctx: InterventionContext): string {
  return `当前智能体（角色 ${ctx.role}）已${REASON_TEXT[ctx.reason]}${tally(ctx)}。以不逾百字之文言棒喝：指其未验之假设，令其列证据或即刻过闸验证。勿复述此令。`;
}

export async function requestIntervention(
  ctx: InterventionContext,
  timeoutMs: number = commissarTuning().timeoutMs,
): Promise<InterventionResult> {
  const tuning = commissarTuning();
  const local: InterventionResult = { channel: 'local', text: localCommissarText(ctx) };
  if (!requester) return local;

  if (Date.now() - (lastSampledAt.get(ctx.session_id) || 0) < tuning.cooldownMs) return local;

  let timer: NodeJS.Timeout | null = null;
  try {
    const timeoutPromise = new Promise<null>(resolve => {
      timer = setTimeout(() => resolve(null), timeoutMs);
      timer.unref?.();
    });

    const text = await Promise.race([
      requester({
        systemPrompt: COMMISSAR_SYSTEM_PROMPT,
        userPrompt: commissarUserPrompt(ctx),
        maxTokens: tuning.maxTokens,
      }),
      timeoutPromise,
    ]);
    const trimmed = (text || '').trim().slice(0, MAX_TEXT_CHARS);
    if (trimmed) {
      lastSampledAt.set(ctx.session_id, Date.now());
      return { channel: 'sampling', text: trimmed };
    }
  } catch {
    // Host 拒答或离线：降级本地棒喝
  } finally {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }
  return local;
}
