/**
 * MCP Sampling Client
 * 利用 MCP 2024-11 版本的 sampling 能力实现主动触发
 * 模拟 Hook 系统的自动触发行为
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';

// ============================================================================
// 类型定义
// ============================================================================

export interface SamplingTriggerRequest {
  sessionId: string;
  triggerType: 'consecutive_failures' | 'giving_up' | 'user_frustration' | 'surface_fix' | 'passive_wait';
  confidence: number;
  context: {
    attemptCount: number;
    lastError?: string;
    conversationSummary?: string;
  };
  recommendedRole: {
    id: string;
    name: string;
    systemPrompt: string;
  };
}

export interface SamplingResponse {
  accepted: boolean;
  injectedPrompt?: string;
  metadata: {
    processingTime: number;
    modelUsed?: string;
    tokensUsed?: number;
  };
}

export interface SamplingClientConfig {
  maxTokensPerRequest: number;
  defaultTemperature: number;
  cooldownMs: number;  // 防止频繁触发的冷却时间
}

// ============================================================================
// Sampling Client 类
// ============================================================================

export class SamplingClient {
  private client: Client;
  private config: SamplingClientConfig;
  private lastTriggerTime: Map<string, number> = new Map();
  private triggerHistory: Map<string, SamplingTriggerRequest[]> = new Map();

  constructor(client: Client, config: Partial<SamplingClientConfig> = {}) {
    this.client = client;
    this.config = {
      maxTokensPerRequest: config.maxTokensPerRequest ?? 500,
      defaultTemperature: config.defaultTemperature ?? 0.7,
      cooldownMs: config.cooldownMs ?? 30000  // 默认30秒冷却
    };
  }

  /**
   * 检查是否可以触发（冷却时间验证）
   */
  private canTrigger(sessionId: string): boolean {
    const lastTime = this.lastTriggerTime.get(sessionId);
    if (!lastTime) return true;
    
    const elapsed = Date.now() - lastTime;
    return elapsed >= this.config.cooldownMs;
  }

  /**
   * 构建采样请求消息
   */
  private buildSamplingRequest(
    triggerRequest: SamplingTriggerRequest
  ): { systemPrompt: string } {
    const { triggerType, recommendedRole } = triggerRequest;

    // 构建 MCP Sampling 请求参数并添加系统提示词注入
    const systemPrompt = this.buildSystemPromptInjection(recommendedRole, triggerType);
    
    return {
      systemPrompt
    };
  }

  /**
   * 构建系统提示词注入
   */
  private buildSystemPromptInjection(
    role: { id: string; name: string; systemPrompt: string },
    triggerType: string
  ): string {
    const triggerDisplayName = this.getTriggerDisplayName(triggerType);

    return `# PUAX 自动激活 - ${role.name}

[自动触发原因: ${triggerDisplayName} (${triggerType})]

${role.systemPrompt}

---
[PUAX 自动注入] 此角色由触发条件自动激活。请按照上述角色设定继续对话。`;
  }

  private getTriggerDisplayName(triggerType: string): string {
    const displayNames: Record<string, string> = {
      consecutive_failures: '连续失败',
      giving_up: '放弃意图',
      user_frustration: '用户沮丧',
      surface_fix: '表面修复',
      passive_wait: '被动等待'
    };

    return displayNames[triggerType] || triggerType;
  }

  /**
   * 执行采样请求（主动触发）
   */
  executeSampling(
    request: SamplingTriggerRequest
  ): SamplingResponse {
    const startTime = Date.now();
    
    // 检查冷却时间
    if (!this.canTrigger(request.sessionId)) {
      return {
        accepted: false,
        metadata: {
          processingTime: Date.now() - startTime,
          modelUsed: undefined,
          tokensUsed: 0
        }
      };
    }

    try {
      // 构建采样请求
      const samplingRequest = this.buildSamplingRequest(request);
      
      // 记录触发时间
      this.lastTriggerTime.set(request.sessionId, Date.now());
      
      // 添加到历史记录
      const history = this.triggerHistory.get(request.sessionId) || [];
      history.push(request);
      this.triggerHistory.set(request.sessionId, history.slice(-10));  // 保留最近10条

      // 返回注入的提示词（客户端可以使用此提示词）
      return {
        accepted: true,
        injectedPrompt: samplingRequest.systemPrompt,
        metadata: {
          processingTime: Date.now() - startTime,
          modelUsed: 'sampling',
          tokensUsed: samplingRequest.systemPrompt?.length || 0
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[PUAX Sampling] Error:', errorMessage);
      
      return {
        accepted: false,
        metadata: {
          processingTime: Date.now() - startTime,
          modelUsed: undefined,
          tokensUsed: 0
        }
      };
    }
  }

  /**
   * 获取会话的触发历史
   */
  getTriggerHistory(sessionId: string): SamplingTriggerRequest[] {
    return this.triggerHistory.get(sessionId) || [];
  }

  /**
   * 清除会话状态
   */
  clearSession(sessionId: string): void {
    this.lastTriggerTime.delete(sessionId);
    this.triggerHistory.delete(sessionId);
  }

  /**
   * 获取所有活跃会话
   */
  getActiveSessions(): string[] {
    return Array.from(this.lastTriggerTime.keys());
  }

  /**
   * 获取触发统计
   */
  getTriggerStats(): {
    totalSessions: number;
    totalTriggers: number;
    triggerTypeDistribution: Record<string, number>;
  } {
    const triggerTypeDistribution: Record<string, number> = {};
    let totalTriggers = 0;

    for (const history of this.triggerHistory.values()) {
      for (const trigger of history) {
        triggerTypeDistribution[trigger.triggerType] = 
          (triggerTypeDistribution[trigger.triggerType] || 0) + 1;
        totalTriggers++;
      }
    }

    return {
      totalSessions: this.lastTriggerTime.size,
      totalTriggers,
      triggerTypeDistribution
    };
  }
}

// ============================================================================
// 工厂函数
// ============================================================================

export function createSamplingClient(
  client: Client,
  config?: Partial<SamplingClientConfig>
): SamplingClient {
  return new SamplingClient(client, config);
}

// 导出单例（用于测试）
export let samplingClientInstance: SamplingClient | null = null;

export function setSamplingClientInstance(client: SamplingClient): void {
  samplingClientInstance = client;
}

export function getSamplingClientInstance(): SamplingClient | null {
  return samplingClientInstance;
}
