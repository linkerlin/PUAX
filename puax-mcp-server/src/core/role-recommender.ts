#!/usr/bin/env node
/**
 * PUAX 角色推荐器
 * 基于触发条件、任务类型、失败模式等维度推荐最合适的角色
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import * as YAML from 'yaml';
import { getAllBundledSkills } from '../prompts/prompts-bundle';
import { getRoleDisplayName } from '../utils/role-utils.js';
import { getGlobalLogger } from '../utils/logger.js';

const logger = getGlobalLogger();

// ============================================================================
// 类型定义
// ============================================================================

export interface RoleMapping {
  primary: string;
  alternatives: string[];
  reason?: string;
}

export interface FailureModeRound {
  round: number;
  roles: string[];
  intensity: 'low' | 'medium' | 'high' | 'extreme';
}

export interface FailureModeMapping {
  description: string;
  rounds: FailureModeRound[];
}

export interface RoleMetadata {
  category: string;
  tone: 'aggressive' | 'supportive' | 'analytical' | 'creative';
  intensity: 'low' | 'medium' | 'high' | 'extreme';
  suitable_for: string[];
}

type RoleTone = RoleMetadata['tone'];
type RoleIntensity = RoleMetadata['intensity'];

export interface RoleMappings {
  trigger_role_mappings: Record<string, RoleMapping>;
  task_type_role_mappings: Record<string, { primary: string[]; secondary: string[] }>;
  failure_mode_role_mappings: Record<string, FailureModeMapping>;
  flavor_overlay: Record<string, {
    name: string;
    keywords: string[];
    rhetoric: string[];
    suitable_roles: string[];
  }>;
  role_metadata: Record<string, RoleMetadata>;
  role_combinations: Record<string, {
    name: string;
    roles: string[];
    sequence: 'sequential' | 'fallback' | 'parallel';
    description: string;
  }>;
}

interface RawFailureModeRound {
  roles: string[];
  intensity: 'low' | 'medium' | 'high' | 'extreme';
}

interface RawRoleMappings {
  trigger_role_mappings?: Record<string, RoleMapping>;
  task_type_role_mappings?: Record<string, { primary: string[]; secondary: string[] }>;
  failure_mode_role_mappings?: Record<string, {
    description: string;
    rounds: Record<string, RawFailureModeRound>;
  }>;
  flavor_overlay?: RoleMappings['flavor_overlay'];
  role_metadata?: Record<string, RoleMetadata>;
  role_combinations?: RoleMappings['role_combinations'];
}

export interface RecommendationRequest {
  detected_triggers: string[];
  task_context: {
    task_type: string;
    description?: string;
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    attempt_count?: number;
  };
  user_preferences?: {
    favorite_roles?: string[];
    blacklisted_roles?: string[];
    preferred_tone?: 'aggressive' | 'supportive' | 'analytical' | 'creative';
    preferred_categories?: string[];
  };
  session_history?: {
    recently_used_roles?: string[];
    role_success_rates?: Record<string, number>;
    role_usage_count?: Record<string, number>;
  };
}

export interface RoleRecommendation {
  primary: {
    role_id: string;
    role_name: string;
    category: string;
    confidence_score: number;
    match_reasons: string[];
    suggested_flavor?: string;
    estimated_effectiveness: 'low' | 'medium' | 'high';
  };
  alternatives: Array<{
    role_id: string;
    role_name: string;
    confidence_score: number;
    difference: string;
  }>;
  activation_suggestion: {
    immediate: boolean;
    cooldown_seconds: number;
    user_confirmation: boolean;
    suggested_prompt_injection?: string;
  };
  metadata: {
    identified_failure_mode?: string;
    calculation_breakdown: Record<string, number>;
    algorithm_version: string;
    cache_hit: boolean;
  };
}

export interface ScoredRole {
  role_id: string;
  scores: {
    trigger_match: number;
    task_type: number;
    failure_mode: number;
    historical: number;
    user_preference: number;
  };
  total_score: number;
  reasons: string[];
}

// ============================================================================
// 角色推荐器类
// ============================================================================

export class RoleRecommender {
  private mappings: RoleMappings;
  private cache: Map<string, { result: RoleRecommendation; timestamp: number }>;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5分钟

  constructor() {
    this.mappings = this.loadMappings();
    this.cache = new Map();
  }

  /**
   * 加载角色映射
   */
  private loadMappings(): RoleMappings {
    try {
      const mappingsPath = join(__dirname, '..', 'data', 'role-mappings.yaml');
      const rawContent = readFileSync(mappingsPath, 'utf-8');
      const parsed = YAML.parse(rawContent) as RawRoleMappings;

      const failureModeMappings: RoleMappings['failure_mode_role_mappings'] = {};
      for (const [failureMode, mapping] of Object.entries(parsed.failure_mode_role_mappings || {})) {
        const rounds = Object.entries(mapping.rounds || {})
          .map(([roundKey, round]) => ({
            round: Number(roundKey.replace(/[^0-9]/g, '')) || 0,
            roles: round.roles || [],
            intensity: round.intensity
          }))
          .filter(round => round.round > 0)
          .sort((left, right) => left.round - right.round);

        failureModeMappings[failureMode] = {
          description: mapping.description,
          rounds
        };
      }

      const mappings: RoleMappings = {
        trigger_role_mappings: parsed.trigger_role_mappings || {},
        task_type_role_mappings: parsed.task_type_role_mappings || {},
        failure_mode_role_mappings: failureModeMappings,
        flavor_overlay: parsed.flavor_overlay || {},
        role_metadata: parsed.role_metadata || {},
        role_combinations: parsed.role_combinations || {}
      };

      mappings.role_metadata = this.mergeBundledRoleMetadata(mappings.role_metadata);

      return mappings;
    } catch (error) {
      logger.error('[RoleRecommender] Failed to load role mappings:', error);
      return {
        trigger_role_mappings: {},
        task_type_role_mappings: {},
        failure_mode_role_mappings: {},
        flavor_overlay: {},
        role_metadata: {},
        role_combinations: {}
      };
    }
  }

  /**
   * 用 bundle 中的角色补齐缺失元数据，避免推荐器只覆盖部分角色。
   */
  private mergeBundledRoleMetadata(existing: Record<string, RoleMetadata>): Record<string, RoleMetadata> {
    const merged = { ...existing };

    for (const skill of getAllBundledSkills()) {
      if (merged[skill.id]) {
        continue;
      }

      merged[skill.id] = this.deriveRoleMetadata(skill);
    }

    return merged;
  }

  private deriveRoleMetadata(skill: ReturnType<typeof getAllBundledSkills>[number]): RoleMetadata {
    const lowerText = [skill.description, ...(skill.tags || []), ...(skill.capabilities || [])]
      .join(' ')
      .toLowerCase();

    const tone = this.inferTone(skill.category, lowerText);
    const intensity = this.inferIntensity(skill.category, lowerText);
    const suitableFor = this.inferSuitableFor(skill);

    return {
      category: skill.category,
      tone,
      intensity,
      suitable_for: suitableFor
    };
  }

  private inferTone(category: string, lowerText: string): RoleTone {
    if (/(审计|分析|调研|架构|法典|analysis|audit|research|architecture)/.test(lowerText)) {
      return 'analytical';
    }
    if (/(激励|战斗|冲刺|督战|militia|warrior|hardcore|discipline)/.test(lowerText)) {
      return 'aggressive';
    }
    if (/(创意|写作|灵感|alchemy|creative|design|narrative)/.test(lowerText)) {
      return 'creative';
    }
    if (category === 'military') return 'aggressive';
    if (category === 'shaman' || category === 'silicon' || category === 'p10') return 'analytical';
    if (category === 'special' || category === 'theme') return 'creative';
    return 'supportive';
  }

  private inferIntensity(category: string, lowerText: string): RoleIntensity {
    if (/(极限|末日|冲刺|战斗|毁灭|审判|extreme|urgent|apocalypse|hardcore)/.test(lowerText)) {
      return 'extreme';
    }
    if (/(统御|架构|指挥|法典|高压|高质量|governance|architecture|commander|audit)/.test(lowerText)) {
      return 'high';
    }
    if (category === 'special' || category === 'military') return 'high';
    return 'medium';
  }

  private inferSuitableFor(skill: ReturnType<typeof getAllBundledSkills>[number]): string[] {
    const tokens = [
      ...skill.tags,
      ...skill.capabilities.flatMap(capability => capability.split(/[:：,，/\s]+/))
    ]
      .map(token => token.trim().toLowerCase())
      .filter(Boolean);

    const mapped = new Set<string>();

    for (const token of tokens) {
      if (/(plan|规划|战略|strategy|governance)/.test(token)) mapped.add('planning');
      if (/(review|审查|审计|质量|verification|audit)/.test(token)) mapped.add('review');
      if (/(writing|写作|文案|doctrine|narrative)/.test(token)) mapped.add('writing');
      if (/(creative|创意|灵感|innovation)/.test(token)) mapped.add('creative');
      if (/(debug|调试|侦察|investigation|analysis)/.test(token)) mapped.add('analysis');
      if (/(automation|架构|implementation|technical|系统)/.test(token)) mapped.add('implementation');
      if (/(emergency|紧急|冲刺|末日)/.test(token)) mapped.add('emergency');
    }

    if (mapped.size === 0) {
      mapped.add(skill.category === 'silicon' || skill.category === 'p10' ? 'planning' : 'analysis');
    }

    return Array.from(mapped).slice(0, 4);
  }

  /**
   * 推荐角色
   */
  recommend(request: RecommendationRequest): RoleRecommendation {
    // 检查缓存
    const cacheKey = this.generateCacheKey(request);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      cached.metadata.cache_hit = true;
      return cached;
    }

    // 计算各角色分数
    const scoredRoles = this.calculateScores(request);

    // 排序并选择最佳角色
    const sortedRoles = scoredRoles.sort((a, b) => b.total_score - a.total_score);
    const topRoles = sortedRoles.slice(0, 4); // 主推荐 + 3个备选

    // 构建推荐结果
    const result = this.buildRecommendation(topRoles, request);

    // 存入缓存
    this.setCache(cacheKey, result);

    return result;
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(request: RecommendationRequest): string {
    // 基于触发条件+任务类型+失败模式生成缓存键
    const key = JSON.stringify({
      triggers: request.detected_triggers.sort(),
      task_type: request.task_context.task_type,
      attempt_count: request.task_context.attempt_count
    });
    return Buffer.from(key).toString('base64');
  }

  /**
   * 从缓存获取
   */
  private getFromCache(key: string): RoleRecommendation | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return this.cloneRecommendation(cached.result, true);
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * 存入缓存
   */
  private setCache(key: string, result: RoleRecommendation): void {
    this.cache.set(key, { result: this.cloneRecommendation(result, false), timestamp: Date.now() });
    
    // 清理过期缓存
    if (this.cache.size > 100) {
      const now = Date.now();
      for (const [k, v] of this.cache) {
        if (now - v.timestamp > this.CACHE_TTL_MS) {
          this.cache.delete(k);
        }
      }
    }
  }

  /**
   * 计算所有角色的分数
   */
  private calculateScores(request: RecommendationRequest): ScoredRole[] {
    const allRoles = Object.keys(this.mappings.role_metadata);
    const scoredRoles: ScoredRole[] = [];

    for (const roleId of allRoles) {
      if (request.user_preferences?.blacklisted_roles?.includes(roleId)) {
        continue;
      }

      const scores = this.calculateRoleScores(roleId, request);
      const totalScore = this.calculateTotalScore(scores);
      
      scoredRoles.push({
        role_id: roleId,
        scores,
        total_score: totalScore,
        reasons: this.generateReasons(roleId, scores, request)
      });
    }

    return scoredRoles;
  }

  /**
   * 计算单个角色的各项分数
   */
  private calculateRoleScores(
    roleId: string,
    request: RecommendationRequest
  ): ScoredRole['scores'] {
    return {
      trigger_match: this.calculateTriggerMatchScore(roleId, request.detected_triggers),
      task_type: this.calculateTaskTypeScore(roleId, request.task_context.task_type),
      failure_mode: this.calculateFailureModeScore(
        roleId,
        request.detected_triggers,
        request.task_context.attempt_count || 0
      ),
      historical: this.calculateHistoricalScore(roleId, request.session_history),
      user_preference: this.calculateUserPreferenceScore(roleId, request.user_preferences)
    };
  }

  /**
   * 计算总分（加权平均）
   */
  private calculateTotalScore(scores: ScoredRole['scores']): number {
    const weights = {
      trigger_match: 0.35,
      task_type: 0.25,
      failure_mode: 0.25,
      historical: 0.10,
      user_preference: 0.05
    };

    return Object.entries(scores).reduce((total, [key, score]) => {
      return total + score * weights[key as keyof typeof weights];
    }, 0);
  }

  /**
   * 计算触发条件匹配分数
   */
  private calculateTriggerMatchScore(roleId: string, triggers: string[]): number {
    let maxScore = 0;

    for (const triggerId of triggers) {
      const mapping = this.mappings.trigger_role_mappings[triggerId];
      if (!mapping) continue;

      if (mapping.primary === roleId) {
        maxScore = Math.max(maxScore, 100);
      } else if (mapping.alternatives?.includes(roleId)) {
        maxScore = Math.max(maxScore, 70);
      }
    }

    return maxScore;
  }

  /**
   * 计算任务类型匹配分数
   */
  private calculateTaskTypeScore(roleId: string, taskType: string): number {
    const mapping = this.mappings.task_type_role_mappings[taskType];
    if (!mapping) return 30;

    if (mapping.primary?.includes(roleId)) return 100;
    if (mapping.secondary?.includes(roleId)) return 70;
    return 30;
  }

  /**
   * 计算失败模式匹配分数
   */
  private calculateFailureModeScore(
    roleId: string,
    triggers: string[],
    attemptCount: number
  ): number {
    // 根据触发条件识别失败模式
    const failureMode = this.identifyFailureMode(triggers);
    if (!failureMode) return 50;

    const mapping = this.mappings.failure_mode_role_mappings[failureMode];
    if (!mapping) return 50;

    // 根据尝试次数确定轮次
    const round = Math.min(Math.floor(attemptCount / 2) + 1, 3);
    const roundData = mapping.rounds.find(r => r.round === round);

    if (roundData?.roles.includes(roleId)) return 100;

    // 检查是否是其他轮次的推荐角色
    for (const r of mapping.rounds) {
      if (r.roles.includes(roleId)) return 70;
    }

    return 30;
  }

  /**
   * 识别失败模式
   */
  private identifyFailureMode(triggers: string[]): string | undefined {
    // 触发条件到失败模式的映射
    const triggerToFailureMode: Record<string, string> = {
      'parameter_tweaking': 'stuck_spinning',
      'repetitive_attempts': 'stuck_spinning',
      'giving_up_language': 'giving_up',
      'suggest_manual': 'giving_up',
      'surface_fix': 'low_quality',
      'no_verification': 'low_quality',
      'blame_environment': 'no_search',
      'need_more_context': 'no_search',
      'passive_wait': 'passive_wait',
      'tool_underuse': 'passive_wait'
    };

    for (const trigger of triggers) {
      if (triggerToFailureMode[trigger]) {
        return triggerToFailureMode[trigger];
      }
    }

    return undefined;
  }

  /**
   * 计算历史表现分数
   */
  private calculateHistoricalScore(
    roleId: string,
    sessionHistory?: RecommendationRequest['session_history']
  ): number {
    if (!sessionHistory) return 50;

    let score = 50;

    // 成功率加成
    const successRate = sessionHistory.role_success_rates?.[roleId];
    if (successRate !== undefined) {
      score += successRate * 30;
    }

    // 使用频率减分（避免过度使用）
    const usageCount = sessionHistory.role_usage_count?.[roleId] || 0;
    score -= Math.min(usageCount * 2, 20);

    // 最近使用惩罚
    if (sessionHistory.recently_used_roles?.includes(roleId)) {
      score -= 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 计算用户偏好分数
   */
  private calculateUserPreferenceScore(
    roleId: string,
    userPreferences?: RecommendationRequest['user_preferences']
  ): number {
    if (!userPreferences) return 50;

    // 黑名单检查
    if (userPreferences.blacklisted_roles?.includes(roleId)) {
      return 0;
    }

    let score = 50;

    // 收藏角色加成
    if (userPreferences.favorite_roles?.includes(roleId)) {
      score += 30;
    }

    // 偏好类别加成
    const roleMeta = this.mappings.role_metadata[roleId];
    if (roleMeta && userPreferences.preferred_categories?.includes(roleMeta.category)) {
      score += 15;
    }

    // 语调匹配
    if (roleMeta && userPreferences.preferred_tone === roleMeta.tone) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * 生成匹配原因
   */
  private generateReasons(
    roleId: string,
    scores: ScoredRole['scores'],
    request: RecommendationRequest
  ): string[] {
    const reasons: string[] = [];
    const roleMeta = this.mappings.role_metadata[roleId];

    if (scores.trigger_match >= 70) {
      reasons.push('触发条件高度匹配');
    }

    if (scores.task_type >= 70) {
      reasons.push(`适合${request.task_context.task_type}任务类型`);
    }

    if (scores.failure_mode >= 70) {
      reasons.push('匹配当前失败模式');
    }

    if (scores.historical >= 70) {
      reasons.push('历史表现良好');
    }

    if (scores.user_preference >= 70) {
      reasons.push('符合用户偏好');
    }

    if (roleMeta) {
      reasons.push(`${roleMeta.category}类角色，语调${roleMeta.tone}`);
    }

    return reasons;
  }

  /**
   * 构建默认推荐（当没有匹配角色时）
   */
  private buildDefaultRecommendation(request: RecommendationRequest): RoleRecommendation {
    const defaultRoleId = 'military-warrior';
    return {
      primary: {
        role_id: defaultRoleId,
        role_name: getRoleDisplayName(defaultRoleId),
        category: 'military',
        confidence_score: 50,
        match_reasons: ['默认推荐：未找到精确匹配的角色'],
        estimated_effectiveness: 'medium'
      },
      alternatives: [],
      activation_suggestion: {
        immediate: false,
        cooldown_seconds: 30,
        user_confirmation: true,
        suggested_prompt_injection: '建议尝试战士角色进行攻坚'
      },
      metadata: {
        identified_failure_mode: this.identifyFailureMode(request.detected_triggers),
        calculation_breakdown: {
          trigger_match: 0,
          task_type_match: 0,
          failure_mode_match: 0,
          history_match: 0,
          user_preference_match: 0
        },
        algorithm_version: '1.0.0',
        cache_hit: false
      }
    };
  }

  /**
   * 构建推荐结果
   */
  private buildRecommendation(
    topRoles: ScoredRole[],
    request: RecommendationRequest
  ): RoleRecommendation {
    // 确保有推荐结果
    if (!topRoles || topRoles.length === 0) {
      return this.buildDefaultRecommendation(request);
    }

    const primary = topRoles[0];
    const primaryMeta = this.mappings.role_metadata[primary.role_id];

    // 确定建议的大厂风味
    const suggestedFlavor = this.suggestFlavor(primary.role_id, request.detected_triggers);

    // 确定激活建议
    const hasCriticalTrigger = request.detected_triggers.some(t => {
      // 这里简化处理，实际应该查询触发条件定义
      return ['user_frustration', 'giving_up_language'].includes(t);
    });

    return {
      primary: {
        role_id: primary.role_id,
        role_name: getRoleDisplayName(primary.role_id),
        category: primaryMeta?.category || 'unknown',
        confidence_score: Math.round(primary.total_score),
        match_reasons: primary.reasons,
        suggested_flavor: suggestedFlavor,
        estimated_effectiveness: this.estimateEffectiveness(primary.total_score)
      },
      alternatives: topRoles.slice(1).map(role => ({
        role_id: role.role_id,
        role_name: getRoleDisplayName(role.role_id),
        confidence_score: Math.round(role.total_score),
        difference: this.describeDifference(primary.role_id, role.role_id)
      })),
      activation_suggestion: {
        immediate: hasCriticalTrigger || primary.total_score >= 85,
        cooldown_seconds: hasCriticalTrigger ? 0 : 30,
        user_confirmation: false,
        suggested_prompt_injection: hasCriticalTrigger 
          ? `检测到${request.detected_triggers.length}个触发条件，建议立即激活${getRoleDisplayName(primary.role_id)}`
          : undefined
      },
      metadata: {
        identified_failure_mode: this.identifyFailureMode(request.detected_triggers),
        calculation_breakdown: primary.scores,
        algorithm_version: '1.0.0',
        cache_hit: false
      }
    };
  }

  private cloneRecommendation(
    recommendation: RoleRecommendation,
    cacheHit: boolean
  ): RoleRecommendation {
    return {
      primary: {
        ...recommendation.primary,
        match_reasons: [...recommendation.primary.match_reasons]
      },
      alternatives: recommendation.alternatives.map(alternative => ({
        ...alternative
      })),
      activation_suggestion: {
        ...recommendation.activation_suggestion
      },
      metadata: {
        ...recommendation.metadata,
        calculation_breakdown: {
          ...recommendation.metadata.calculation_breakdown
        },
        cache_hit: cacheHit
      }
    };
  }

  /**
   * 建议大厂风味
   */
  private suggestFlavor(roleId: string, triggers: string[]): string | undefined {
    // 基于角色和触发条件建议风味
    for (const [flavorName, flavor] of Object.entries(this.mappings.flavor_overlay)) {
      if (flavor.suitable_roles.includes(roleId)) {
        return flavorName;
      }
    }

    // 默认推荐
    const triggerToFlavor: Record<string, string> = {
      'user_frustration': 'huawei',
      'giving_up_language': 'musk',
      'consecutive_failures': 'alibaba'
    };

    for (const trigger of triggers) {
      if (triggerToFlavor[trigger]) {
        return triggerToFlavor[trigger];
      }
    }

    return undefined;
  }

  /**
   * 估计效果
   */
  private estimateEffectiveness(score: number): 'low' | 'medium' | 'high' {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  /**
   * 描述角色差异
   */
  private describeDifference(primaryId: string, alternativeId: string): string {
    const primaryMeta = this.mappings.role_metadata[primaryId];
    const altMeta = this.mappings.role_metadata[alternativeId];

    if (!primaryMeta || !altMeta) {
      return '备选方案';
    }

    if (altMeta.intensity !== primaryMeta.intensity) {
      const intensityMap: Record<string, string> = {
        low: '温和',
        medium: '适中',
        high: '强烈',
        extreme: '极致'
      };
      return `${intensityMap[altMeta.intensity]}强度，适合不同场景`;
    }

    if (altMeta.tone !== primaryMeta.tone) {
      const toneMap: Record<string, string> = {
        aggressive: '激进',
        supportive: '支持',
        analytical: '分析',
        creative: '创意'
      };
      return `${toneMap[altMeta.tone]}语调风格`;
    }

    return '同类别备选';
  }

  /**
   * 获取角色元数据
   */
  getRoleMetadata(roleId: string): RoleMetadata | undefined {
    return this.mappings.role_metadata[roleId];
  }

  /**
   * 获取所有角色
   */
  getAllRoles(): string[] {
    return Object.keys(this.mappings.role_metadata);
  }
}

// 导出单例
export const roleRecommender = new RoleRecommender();
