/**
 * 方法论智能路由
 * 根据任务类型和失败模式自动选择最优方法论
 * 
 * v2: 数据从 methodologies.yaml 加载，实现数据与逻辑分离
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';

// ============================================================================
// 类型定义
// ============================================================================

export type TaskType = 
  | 'debugging' 
  | 'building' 
  | 'research' 
  | 'architecture' 
  | 'performance' 
  | 'deployment' 
  | 'review' 
  | 'planning';

export type FailureMode = 
  | 'spinning' 
  | 'giving_up' 
  | 'poor_quality' 
  | 'not_searching' 
  | 'passive_wait' 
  | 'unverified_completion'
  | 'over_complication';

export type Methodology = 
  | 'alibaba-closed-loop'
  | 'huawei-rca'
  | 'musk-algorithm'
  | 'jobs-subtraction'
  | 'baidu-search'
  | 'amazon-backwards'
  | 'bytedance-abtest'
  | 'netflix-keeper'
  | 'pinduoduo-simplify'
  | 'xiaomi-focus'
  | 'amazon-deep-dive'
  | 'bytedance-data';

export interface MethodologyDefinition {
  id: Methodology;
  name: string;
  description: string;
  flavor: string;
  keywords: string[];
  suitableTasks: TaskType[];
  effectiveAgainst: FailureMode[];
  steps: string[];
  switchToOnFailure: Methodology[];
}

export interface RoutingRequest {
  taskType: TaskType;
  failureMode?: FailureMode;
  attemptCount: number;
  previousMethodologies?: Methodology[];
  context?: string;
}

export interface RoutingResult {
  selectedMethodology: Methodology;
  reason: string;
  confidence: number;
  alternativeMethodologies: Methodology[];
  executionSteps: string[];
  switchingChain?: Methodology[];
}

// ============================================================================
// YAML 数据结构
// ============================================================================

interface MethodologyYamlEntry {
  name: string;
  description: string;
  flavor: string;
  keywords: string[];
  suitable_tasks: string[];
  effective_against: string[];
  steps: string[];
  switch_to_on_failure: string[];
}

interface RouterYaml {
  methodology_definitions: Record<string, MethodologyYamlEntry>;
  task_methodology_map: Record<string, string[]>;
  failure_switch_chains: Record<string, string[]>;
}

// ============================================================================
// 数据加载
// ============================================================================

function loadRouterData(): RouterYaml {
  const yamlPath = join(__dirname, '..', 'data', 'methodologies.yaml');
  try {
    const content = readFileSync(yamlPath, 'utf-8');
    const parsed = YAML.parse(content);
    return {
      methodology_definitions: parsed.methodology_definitions || {},
      task_methodology_map: parsed.task_methodology_map || {},
      failure_switch_chains: parsed.failure_switch_chains || {}
    };
  } catch {
    return {
      methodology_definitions: {},
      task_methodology_map: {},
      failure_switch_chains: {}
    };
  }
}

const yamlData = loadRouterData();

/** 将 YAML 条目转换为 MethodologyDefinition */
function yamlToDefinition(id: string, entry: MethodologyYamlEntry): MethodologyDefinition {
  return {
    id: id as Methodology,
    name: entry.name,
    description: entry.description,
    flavor: entry.flavor,
    keywords: entry.keywords || [],
    suitableTasks: (entry.suitable_tasks || []) as TaskType[],
    effectiveAgainst: (entry.effective_against || []) as FailureMode[],
    steps: entry.steps || [],
    switchToOnFailure: (entry.switch_to_on_failure || []) as Methodology[]
  };
}

/** 从 YAML 数据构建 METHODOLOGIES 记录 */
function buildMethodologies(): Record<Methodology, MethodologyDefinition> {
  const result: Partial<Record<Methodology, MethodologyDefinition>> = {};
  for (const [id, entry] of Object.entries(yamlData.methodology_definitions)) {
    result[id as Methodology] = yamlToDefinition(id, entry);
  }
  return result as Record<Methodology, MethodologyDefinition>;
}

/** 从 YAML 数据构建任务映射 */
function buildTaskMapping(): Record<TaskType, Methodology[]> {
  const result: Partial<Record<TaskType, Methodology[]>> = {};
  for (const [taskType, methodologies] of Object.entries(yamlData.task_methodology_map)) {
    result[taskType as TaskType] = (methodologies as string[]) as Methodology[];
  }
  return result as Record<TaskType, Methodology[]>;
}

/** 从 YAML 数据构建失败模式映射 */
function buildFailureMapping(): Record<FailureMode, Methodology[]> {
  const result: Partial<Record<FailureMode, Methodology[]>> = {};
  for (const [failureMode, chain] of Object.entries(yamlData.failure_switch_chains)) {
    result[failureMode as FailureMode] = (chain as string[]) as Methodology[];
  }
  return result as Record<FailureMode, Methodology[]>;
}

// 初始化数据
export const METHODOLOGIES = buildMethodologies();
const TASK_METHODLOGY_MAPPING = buildTaskMapping();
const FAILURE_SWITCH_CHAIN = buildFailureMapping();

// ============================================================================
// 方法论路由器
// ============================================================================

export class MethodologyRouter {
  private usageHistory: Map<string, Methodology[]> = new Map();

  /**
   * 路由到最优方法论
   */
  route(request: RoutingRequest): RoutingResult {
    const { taskType, failureMode, attemptCount, previousMethodologies } = request;

    // 1. 基于任务类型获取候选方法论
    const candidates = TASK_METHODLOGY_MAPPING[taskType] || ['alibaba-closed-loop' as Methodology];

    // 2. 如果存在失败模式，使用切换链
    let selectedMethodology: Methodology;
    let reason: string;
    let switchingChain: Methodology[] | undefined;

    if (failureMode && attemptCount >= 3) {
      const chain = FAILURE_SWITCH_CHAIN[failureMode];
      const tried = new Set(previousMethodologies || []);
      selectedMethodology = chain?.find(m => !tried.has(m)) || chain?.[chain.length - 1] || candidates[0];
      reason = `检测到失败模式 "${failureMode}"，已尝试 ${attemptCount} 次，切换到 ${METHODOLOGIES[selectedMethodology]?.name || selectedMethodology}`;
      switchingChain = chain;
    } else {
      selectedMethodology = candidates[0];
      reason = `根据任务类型 "${taskType}" 推荐 ${METHODOLOGIES[selectedMethodology]?.name || selectedMethodology}`;
    }

    // 3. 计算置信度
    const confidence = this.calculateConfidence(selectedMethodology, taskType, failureMode);

    // 4. 获取备选方案
    const alternativeMethodologies = candidates
      .filter(m => m !== selectedMethodology)
      .slice(0, 2);

    // 5. 获取执行步骤
    const definition = METHODOLOGIES[selectedMethodology];
    const executionSteps = definition?.steps || [];

    return {
      selectedMethodology,
      reason,
      confidence,
      alternativeMethodologies,
      executionSteps,
      switchingChain
    };
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(
    methodology: Methodology,
    taskType: TaskType,
    failureMode?: FailureMode
  ): number {
    const def = METHODOLOGIES[methodology];
    if (!def) return 0.5;

    let confidence = 0.7;

    if (def.suitableTasks.includes(taskType)) {
      confidence += 0.15;
    }

    if (failureMode && def.effectiveAgainst.includes(failureMode)) {
      confidence += 0.1;
    }

    return Math.min(0.95, confidence);
  }

  /**
   * 获取方法论详情
   */
  getMethodology(methodology: Methodology): MethodologyDefinition {
    return METHODOLOGIES[methodology];
  }

  /**
   * 获取所有方法论
   */
  getAllMethodologies(): MethodologyDefinition[] {
    return Object.values(METHODOLOGIES);
  }

  /**
   * 记录方法论使用
   */
  recordUsage(sessionId: string, methodology: Methodology): void {
    const history = this.usageHistory.get(sessionId) || [];
    history.push(methodology);
    this.usageHistory.set(sessionId, history.slice(-10));
  }

  /**
   * 获取使用历史
   */
  getUsageHistory(sessionId: string): Methodology[] {
    return this.usageHistory.get(sessionId) || [];
  }

  /**
   * 建议下一次切换
   */
  suggestSwitch(
    sessionId: string,
    currentMethodology: Methodology,
    failureMode: FailureMode
  ): Methodology | undefined {
    const def = METHODOLOGIES[currentMethodology];
    const history = this.getUsageHistory(sessionId);
    
    if (def) {
      const next = def.switchToOnFailure.find(m => !history.includes(m));
      if (next) return next;
    }

    const chain = FAILURE_SWITCH_CHAIN[failureMode];
    return chain?.find(m => m !== currentMethodology && !history.includes(m));
  }

  /**
   * 解释为什么选择这个方法论
   */
  explainChoice(
    methodology: Methodology,
    taskType: TaskType,
    failureMode?: FailureMode
  ): string {
    const def = METHODOLOGIES[methodology];
    if (!def) return `方法论 ${methodology} 未找到定义`;

    const lines: string[] = [
      `选择 ${def.name} 的原因：`,
      ''
    ];

    if (def.suitableTasks.includes(taskType)) {
      lines.push(`✓ 适合任务类型：${taskType}`);
    }

    if (failureMode && def.effectiveAgainst.includes(failureMode)) {
      lines.push(`✓ 有效解决：${failureMode}`);
    }

    lines.push(`✓ 核心方法：${def.steps[0]}`);
    lines.push(`✓ 风味特色：${def.flavor}`);

    return lines.join('\n');
  }

  /**
   * 获取方法论统计
   */
  getStatistics(): Record<Methodology, number> {
    const stats: Partial<Record<Methodology, number>> = {};
    
    for (const history of this.usageHistory.values()) {
      for (const m of history) {
        stats[m] = (stats[m] || 0) + 1;
      }
    }

    return stats as Record<Methodology, number>;
  }
}

// ============================================================================
// 单例导出
// ============================================================================

export const methodologyRouter = new MethodologyRouter();

// ============================================================================
// 工具函数
// ============================================================================

export function getMethodologyName(methodology: Methodology): string {
  return METHODOLOGIES[methodology]?.name || methodology;
}

export function getMethodologyFlavor(methodology: Methodology): string {
  return METHODOLOGIES[methodology]?.flavor || 'alibaba';
}

export function isValidMethodology(m: string): m is Methodology {
  return Object.keys(METHODOLOGIES).includes(m);
}

export function getSuitableMethodologies(taskType: TaskType): Methodology[] {
  return TASK_METHODLOGY_MAPPING[taskType] || [];
}
