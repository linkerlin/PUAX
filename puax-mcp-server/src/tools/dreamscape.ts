#!/usr/bin/env node
/**
 * MCP Tools: GHM 导引幻梦法（Guided Hallucination Methodology）
 *
 * - puax_enter_dreamscape  入梦（知情入梦 + boundary 预算硬顶 + [DREAM] 协议注入）
 * - puax_awaken            醒梦（三分类：HYPOTHESIS / INSIGHT / DISCARDED，强校验拒收）
 * - puax_convergence_audit 虚假收敛审计（高精度低召回，L1 提醒级，不打断工作流）
 *
 * 安全设计（验证派修正案采纳）：
 * 1. 标记权在工具层：[DREAM] 印由 dreamscape 协议注入，Agent 不可自补；
 *    awaken 拒收任何缺结构化引用的产物（无法补票）。
 * 2. HYPOTHESIS 永不自动升格为结论：醒后必经 puax_confidence_check / puax_verify_completion。
 * 3. INSIGHT 禁入事实层：灵感只可启发，不可充当证据。
 * 4. 预算硬顶：max_hypotheses 超限则全部产物作废（DISCARDED），非宽容收尾。
 */

import { z } from 'zod';
import { randomBytes } from 'crypto';

// ============================================================================
// 常量
// ============================================================================

export const DREAM_ROLES = [
  'dream-zuowang',
  'dream-butterfly',
  'dream-hundun',
  'dream-kunpeng',
  'dream-qiushui',
  'dream-paoding',
  'dream-qiwu',
  'dream-xinhuo',
] as const;

export const DREAM_MARK = '[DREAM]';

const ARTIFACT_CATEGORIES = ['HYPOTHESIS', 'INSIGHT', 'DISCARDED'] as const;

/** 过早收敛信号词（强信号，用于高精度低召回审计） */
const LOCK_PATTERNS = [
  /就按(这个|此|该)(方案|思路|做法)/,
  /不用再(想|考虑|找了)/,
  /没有(别的|其他)(办法|方案|可能|选择)/,
  /(这|此)是唯一(的)?(方案|办法|选择|解)/,
  /就这样定(了)?/,
  /已经确定(了|下来)?/,
  /this is the only (way|solution|option)/i,
  /no other (way|option|choice)/i,
  /let's just go with this/i,
];

/** 多元探索信号词（存在则倾向健康收敛） */
const PLURALITY_PATTERNS = [
  /(备选|备胎|替代|另外|或者|另一(种|个|条)|plan ?b|多(个|种)方案)/i,
  /(alternative|other option|plan b|trade[- ]?off)/i,
  /(比较(了|一下)|权衡|对比|各自?的?(优|劣|利|弊))/,
];

const DREAM_ROLE_NAMES: Record<string, string> = {
  'dream-zuowang': '庄周·坐忘（空杯破先入）',
  'dream-butterfly': '庄周·梦蝶（可能性轰炸）',
  'dream-hundun': '庄周·混沌（自洽宇宙）',
  'dream-kunpeng': '庄周·鲲鹏（谶语回溯）',
  'dream-qiushui': '庄周·秋水（渐进升维）',
  'dream-paoding': '庄周·庖丁（错误重释）',
  'dream-qiwu': '庄周·齐物（假设平权）',
  'dream-xinhuo': '庄周·薪火（醒梦验真）',
};

// ============================================================================
// 梦境状态（进程内分区存储；元数据头不可剥离，供会话层 compaction 保护）
// ============================================================================

interface DreamBoundary {
  objective: string;
  max_turns: number;
  max_hypotheses: number;
  min_hypotheses: number;
  kill_criteria: string;
}

interface DreamArtifact {
  content: string;
  category: (typeof ARTIFACT_CATEGORIES)[number];
}

interface DreamState {
  ref: string;
  role: string;
  role_name: string;
  dream_depth: number;
  boundary: DreamBoundary;
  entered_at: string;
  status: 'dreaming' | 'awakened';
  artifacts: DreamArtifact[];
}

/** 进程内梦境分区。结构化引用（ref）即"印"：无 ref 不可唤醒，产物不可补票。 */
const dreamStates = new Map<string, DreamState>();

function newDreamRef(): string {
  return `dream-${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`;
}

function buildDreamProtocolInjection(state: DreamState): string {
  return [
    `${DREAM_MARK} ===== 梦境空间 ${state.ref} =====`,
    `入梦角色：${state.role_name}`,
    `梦之目标：${state.boundary.objective}`,
    `梦之深度：${state.dream_depth} / 5`,
    `预算硬顶：max_turns=${state.boundary.max_turns}，max_hypotheses=${state.boundary.max_hypotheses}（超限全部作废），min_hypotheses=${state.boundary.min_hypotheses}（配额未满不得唤醒）`,
    `止梦信号：${state.boundary.kill_criteria}`,
    '',
    '四铁律（违者产物作废）：',
    '1. 知情入梦——本块即入梦声明，梦内一切产物皆为假设，非事实。',
    '2. 标记隔离——每条梦内产物必须以 [DREAM] 开头；此印由工具注入，汝不可给标记外内容补印。',
    '3. 随时可醒——唤醒无条件，随时可调用 puax_awaken。',
    '4. 醒后必验——HYPOTHESIS 未过 puax_confidence_check 与 puax_verify_completion，永不得称为结论；INSIGHT 只可启发，禁入事实层。',
    `===== 梦境边界止 =====`,
  ].join('\n');
}

// ============================================================================
// Tool 1: puax_enter_dreamscape
// ============================================================================

const DreamBoundarySchema = z.object({
  objective: z.string().min(1).describe('此次发散要回答什么（必填，梦之锚点）'),
  max_turns: z.number().int().min(1).max(20).describe('梦内轮数硬顶'),
  max_hypotheses: z.number().int().min(1).max(20).default(8).describe('假设数硬顶，超限全部作废'),
  min_hypotheses: z.number().int().min(1).max(20).default(3).describe('最少假设数，配额未满不得唤醒'),
  kill_criteria: z.string().min(1).describe('出现何种信号立即中止（必填）'),
});

const EnterDreamscapeInputSchema = z.object({
  role: z.enum(DREAM_ROLES).describe('入梦角色（庄周八梦之一）'),
  boundary: DreamBoundarySchema.describe('梦境边界（预算硬顶）'),
  dream_depth: z.number().int().min(1).max(5).default(3).describe('梦之深度：越高先验屏蔽越多'),
  session_id: z.string().optional().describe('关联会话 ID'),
});

export const enterDreamscapeTool = {
  name: 'puax_enter_dreamscape',
  description:
    'GHM 导引幻梦法·入梦：知情进入幻觉发散空间。注入 [DREAM] 协议（标记权在工具层，不可自补），' +
    'boundary 预算硬顶（objective/max_turns/max_hypotheses/kill_criteria 皆必填）。' +
    '梦内产物皆为假设非事实；醒必经 puax_awaken。',
  inputSchema: EnterDreamscapeInputSchema,

  handler: (args: z.infer<typeof EnterDreamscapeInputSchema>) => {
    const { role, boundary, dream_depth, session_id } = args;

    if (boundary.min_hypotheses > boundary.max_hypotheses) {
      return {
        entered: false,
        error: 'boundary 校验失败：min_hypotheses 不得大于 max_hypotheses。梦未开启，无产物。',
      };
    }

    const ref = newDreamRef();
    const state: DreamState = {
      ref,
      role,
      role_name: DREAM_ROLE_NAMES[role],
      dream_depth,
      boundary,
      entered_at: new Date().toISOString(),
      status: 'dreaming',
      artifacts: [],
    };
    dreamStates.set(ref, state);

    return {
      entered: true,
      dream_context_ref: ref,
      role,
      role_name: state.role_name,
      status: 'dreaming',
      protocol_injection: buildDreamProtocolInjection(state),
      next_step: `调用 get_skill（skillId=${role}）获取角色系统提示，梦内产物一律以 [DREAM] 开头；梦毕调用 puax_awaken（dream_context_ref=${ref}）醒梦分类。`,
      session_id,
      safety_note:
        '知情入梦已声明。梦内禁证伪不是免验证特权——醒后 HYPOTHESIS 必验，INSIGHT 禁入事实层，DISCARDED 直接作废。',
    };
  },
};

// ============================================================================
// Tool 2: puax_awaken
// ============================================================================

const ArtifactSchema = z.object({
  content: z.string().min(1).describe('梦内产物内容（应含 [DREAM] 印）'),
  category: z.enum(ARTIFACT_CATEGORIES).describe('HYPOTHESIS(待验) / INSIGHT(灵感,禁入事实层) / DISCARDED(作废)'),
});

const AwakenInputSchema = z.object({
  dream_context_ref: z.string().min(1).describe('入梦时返回的结构化梦境引用（即"印"，不可补票）'),
  artifacts: z.array(ArtifactSchema).min(1).describe('梦内产物清单，逐条分类'),
  handover_notes: z.string().optional().describe('未燃尽之问题（显式移交，防静默丢弃）'),
});

export const awakenTool = {
  name: 'puax_awaken',
  description:
    'GHM 导引幻梦法·醒梦：退出幻觉空间，产物强制三分类（HYPOTHESIS/INSIGHT/DISCARDED）。' +
    '缺 dream_context_ref 或产物超限 → 全部拒收作废。HYPOTHESIS 永不自动升格为结论。',
  inputSchema: AwakenInputSchema,

  handler: (args: z.infer<typeof AwakenInputSchema>) => {
    const { dream_context_ref, artifacts, handover_notes } = args;

    const state = dreamStates.get(dream_context_ref);
    if (!state) {
      return {
        awakened: false,
        rejected: true,
        error:
          '拒收：梦境引用不存在。无印产物不可补票——凡未经理性入梦（puax_enter_dreamscape）的内容，不得以"梦内产物"名义绕过验证。',
        all_discarded: true,
      };
    }

    if (state.status === 'awakened') {
      return {
        awakened: false,
        rejected: true,
        error: `梦境 ${dream_context_ref} 已醒。重复唤醒无效，请重新入梦。`,
      };
    }

    // 预算硬顶：超限全部作废（非宽容收尾）
    if (artifacts.length > state.boundary.max_hypotheses) {
      state.status = 'awakened';
      return {
        awakened: true,
        budget_exceeded: true,
        all_discarded: true,
        error: `产物 ${artifacts.length} 条超出预算硬顶 max_hypotheses=${state.boundary.max_hypotheses}，全部作废（DISCARDED）。收束的合法性来自清点的完整性，预算的严肃性来自超限即作废。`,
        dream_context_ref,
        handover_notes,
        next_step: '如需重梦，请重新 puax_enter_dreamscape 并收窄 boundary。',
      };
    }

    const hypotheses: string[] = [];
    const insights: string[] = [];
    const discarded: string[] = [];

    for (const artifact of artifacts) {
      // 缺 [DREAM] 印的产物：不听自辩，强制降级为 DISCARDED（标记权在工具层）
      const marked = artifact.content.trimStart().startsWith(DREAM_MARK);
      if (!marked) {
        discarded.push(`[无印拒收→作废] ${artifact.content}`);
        continue;
      }
      switch (artifact.category) {
        case 'HYPOTHESIS':
          hypotheses.push(artifact.content);
          break;
        case 'INSIGHT':
          insights.push(artifact.content);
          break;
        default:
          discarded.push(artifact.content);
          break;
      }
    }

    const quotaMet = hypotheses.length + insights.length >= state.boundary.min_hypotheses;

    state.status = 'awakened';
    state.artifacts = artifacts.map(a => ({ content: a.content, category: a.category }));

    return {
      awakened: true,
      dream_context_ref,
      role: state.role,
      role_name: state.role_name,
      quota_met: quotaMet,
      classification: {
        hypotheses: {
          count: hypotheses.length,
          items: hypotheses,
          rule: '待验假设。永不自动升格为结论——必须逐条经 puax_confidence_check 信心门控与 puax_verify_completion 独立验证，方可转正。',
        },
        insights: {
          count: insights.length,
          items: insights,
          rule: '灵感火种。仅可启发后续思考，禁入事实层，禁充当完成证据或事实依据。',
        },
        discarded: {
          count: discarded.length,
          items: discarded,
          rule: '作废。含无印拒收者——补票无效，标记权在工具层。',
        },
      },
      handover_notes: handover_notes || '（无未燃尽问题移交）',
      warning: !quotaMet
        ? `配额未满：实质产物（HYPOTHESIS+INSIGHT）${hypotheses.length + insights.length} 条 < min_hypotheses=${state.boundary.min_hypotheses}。发散不足，建议重梦。`
        : undefined,
      next_step: hypotheses.length > 0
        ? `① 逐条验证 ${hypotheses.length} 条假设（puax_confidence_check → puax_verify_completion）；② INSIGHT ${insights.length} 条仅存灵感区；③ 未燃尽问题显式移交。`
        : '无待验假设。INSIGHT 入灵感区，DISCARDED 归档。',
    };
  },
};

// ============================================================================
// Tool 3: puax_convergence_audit
// ============================================================================

const ConvergenceAuditInputSchema = z.object({
  context: z.string().min(1).describe('近期会话摘要或方案讨论文本'),
  evidence_sample: z.array(z.string()).min(1).describe('引用的具体对话/产物片段（审计依据，可人工复核）'),
});

export const ConvergenceAuditInput = ConvergenceAuditInputSchema;

export const convergenceAuditTool = {
  name: 'puax_convergence_audit',
  description:
    'GHM 导引幻梦法·虚假收敛审计：检测会话是否陷入人机互激的过早收敛（双向幻觉）。' +
    '高精度低召回（宁漏报勿误伤心流）；判定为疑似时仅注入 L1 提醒级压力信号，不打断工作流。',
  inputSchema: ConvergenceAuditInputSchema,

  handler: (args: z.infer<typeof ConvergenceAuditInputSchema>) => {
    const { context, evidence_sample } = args;

    const haystack = [context, ...evidence_sample].join('\n');

    const lockHits = LOCK_PATTERNS.filter(p => p.test(haystack));
    const pluralityHits = PLURALITY_PATTERNS.filter(p => p.test(haystack));

    const signals: Array<{ type: string; evidence: string; note: string }> = [];
    for (const hit of lockHits) {
      const matched = evidence_sample.find(s => hit.test(s)) ?? context.match(hit)?.[0] ?? '';
      signals.push({
        type: 'single_solution_lock',
        evidence: matched,
        note: '出现单方案锁定语（"唯一/没别的/就这样定了"类）——收敛轨道疑似被人机互激提前焊死。',
      });
    }
    if (lockHits.length > 0 && pluralityHits.length === 0) {
      signals.push({
        type: 'plurality_absent',
        evidence: evidence_sample[0],
        note: '全程无备选/替代/权衡语——未探索他径即收敛，符合虚假收敛特征。',
      });
    }

    // 高精度低召回：只有强信号（存在锁定语且无多元探索）才判 suspected
    const suspected = lockHits.length > 0 && pluralityHits.length === 0;

    return {
      verdict: suspected ? 'suspected_premature_convergence' : 'healthy_convergence',
      confidence: suspected ? (lockHits.length >= 2 ? 'high' : 'medium') : 'high',
      signals,
      lock_signal_count: lockHits.length,
      plurality_signal_count: pluralityHits.length,
      recommendation: suspected
        ? {
            action: 'L1_reminder',
            rationale:
              '仅提醒，不打断。虚假收敛最可能的实际发生路径：Agent 携"对话必收敛"先验强行收束，人顺而随之，互证互强。此刻宜入梦重散。',
            suggested_roles: ['dream-qiushui', 'dream-butterfly'],
            injectable_reminder:
              '[PUAX-L1 提醒] 检测到疑似过早收敛（单一方案锁定、无备选探索）。建议 puax_enter_dreamscape 入梦重散：秋水五解并置，或梦蝶十种若可能。醒后经 puax_awaken 分类、puax_confidence_check 验证，再定取舍。',
          }
        : {
            action: 'none',
            rationale: pluralityHits.length > 0
              ? '检测到多元探索信号（备选/权衡语），收敛具备合法性。'
              : '未检测到单方案锁定信号，正常收敛。',
          },
      disclaimer:
        '本审计为代理指标判定（非 ground truth），按高精度低召回设计：宁可漏报，不可误伤健康收敛。审计器自身可能误判，提醒可被忽略。',
    };
  },
};

// ============================================================================
// 导出
// ============================================================================

export const dreamscapeTools = [enterDreamscapeTool, awakenTool, convergenceAuditTool];
