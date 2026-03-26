/**
 * PUAX Client SDK
 * 简化客户端集成，提供自动化 Hook 调用
 * 
 * 使用示例:
 * ```typescript
 * const client = new PuaxClient({
 *   mcpClient: mcpClientInstance,
 *   sessionId: 'my-session'
 * });
 * 
 * // 自动检测
 * await client.onUserMessage('为什么还不行？');
 * await client.onToolUse('Bash', { exit_code: 1 });
 * 
 * // 获取建议
 * const suggestion = await client.getRoleSuggestion();
 * ```
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';

// ============================================================================
// 类型定义
// ============================================================================

export interface PuaxClientConfig {
  mcpClient: Client;
  sessionId: string;
  autoTrigger?: boolean;
  minConfidence?: number;
  cooldownMs?: number;
  language?: 'zh' | 'en' | 'auto';
}

export interface PuaxSuggestion {
  shouldTrigger: boolean;
  triggerType?: string;
  confidence: number;
  pressureLevel?: number;
  recommendedRole?: {
    id: string;
    name: string;
    description?: string;
  };
  injectionPrompt?: string;
  action: 'immediate' | 'suggest' | 'monitor' | 'none';
  reason: string;
}

export interface PuaxSessionState {
  sessionId: string;
  pressureLevel: number;
  failureCount: number;
  triggerCount: number;
  activeRole?: string;
  isActive: boolean;
}

export interface PuaxFeedback {
  success: boolean;
  rating: number;  // 1-5
  comments?: string;
}

// ============================================================================
// PUAX 客户端类
// ============================================================================

export class PuaxClient {
  private mcpClient: Client;
  private sessionId: string;
  private config: Required<PuaxClientConfig>;
  private lastCheckTime: number = 0;
  private messageCount: number = 0;
  private isInitialized: boolean = false;

  constructor(config: PuaxClientConfig) {
    this.mcpClient = config.mcpClient;
    this.sessionId = config.sessionId;
    this.config = {
      mcpClient: config.mcpClient,
      sessionId: config.sessionId,
      autoTrigger: config.autoTrigger ?? true,
      minConfidence: config.minConfidence ?? 0.6,
      cooldownMs: config.cooldownMs ?? 30000,
      language: config.language ?? 'auto'
    };
  }

  // ============================================================================
  // 初始化
  // ============================================================================

  /**
   * 初始化会话
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 调用 MCP server 初始化会话
      await this.callTool('start_session', {
        sessionId: this.sessionId,
        language: this.config.language
      });

      this.isInitialized = true;
      console.log(`[PuaxClient] Session initialized: ${this.sessionId}`);
    } catch (error) {
      console.error('[PuaxClient] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * 结束会话并收集反馈
   */
  async endSession(feedback?: PuaxFeedback): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await this.callTool('end_session', {
        sessionId: this.sessionId,
        feedback
      });

      this.isInitialized = false;
      console.log(`[PuaxClient] Session ended: ${this.sessionId}`);
    } catch (error) {
      console.error('[PuaxClient] Failed to end session:', error);
    }
  }

  // ============================================================================
  // 事件处理
  // ============================================================================

  /**
   * 用户消息事件
   */
  async onUserMessage(message: string): Promise<PuaxSuggestion | null> {
    if (!this.isInitialized) await this.initialize();

    this.messageCount++;

    if (!this.shouldCheck()) {
      return null;
    }

    try {
      const result = await this.callTool('detect_trigger', {
        sessionId: this.sessionId,
        eventType: 'UserPromptSubmit',
        message,
        messageIndex: this.messageCount
      });

      this.lastCheckTime = Date.now();
      return this.formatSuggestion(result);
    } catch (error) {
      console.error('[PuaxClient] detect_trigger error:', error);
      return null;
    }
  }

  /**
   * 工具使用事件
   */
  async onToolUse(
    toolName: string,
    toolResult: any,
    errorMessage?: string
  ): Promise<PuaxSuggestion | null> {
    if (!this.isInitialized) await this.initialize();

    // 只对 Bash 工具进行检测
    if (toolName !== 'Bash' && toolName !== 'bash') {
      return null;
    }

    try {
      const result = await this.callTool('detect_trigger', {
        sessionId: this.sessionId,
        eventType: 'PostToolUse',
        toolName,
        toolResult,
        errorMessage
      });

      return this.formatSuggestion(result);
    } catch (error) {
      console.error('[PuaxClient] detect_trigger error:', error);
      return null;
    }
  }

  /**
   * 上下文压缩前事件
   */
  async onPreCompact(contextInfo: {
    currentTask?: string;
    triedApproaches?: string[];
    excludedPossibilities?: string[];
    nextHypothesis?: string;
    keyContext?: string;
  }): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await this.callTool('detect_trigger', {
        sessionId: this.sessionId,
        eventType: 'PreCompact',
        ...contextInfo
      });
    } catch (error) {
      console.error('[PuaxClient] PreCompact error:', error);
    }
  }

  /**
   * 助手消息事件（仅记录，不触发检测）
   */
  onAssistantMessage(message: string): void {
    // 可以选择发送到 server 用于上下文分析
    // 当前版本仅本地记录
  }

  // ============================================================================
  // 主动查询
  // ============================================================================

  /**
   * 获取角色建议
   */
  async getRoleSuggestion(): Promise<PuaxSuggestion | null> {
    if (!this.isInitialized) await this.initialize();

    try {
      const result = await this.callTool('get_role_suggestion', {
        sessionId: this.sessionId
      });

      return this.formatSuggestion(result);
    } catch (error) {
      console.error('[PuaxClient] get_role_suggestion error:', error);
      return null;
    }
  }

  /**
   * 获取当前会话状态
   */
  async getSessionState(): Promise<PuaxSessionState | null> {
    if (!this.isInitialized) return null;

    try {
      const result = await this.callTool('get_session_state', {
        sessionId: this.sessionId
      });

      return result as PuaxSessionState;
    } catch (error) {
      console.error('[PuaxClient] get_session_state error:', error);
      return null;
    }
  }

  /**
   * 激活角色
   */
  async activateRole(roleId: string): Promise<boolean> {
    if (!this.isInitialized) await this.initialize();

    try {
      await this.callTool('activate_role', {
        sessionId: this.sessionId,
        roleId
      });

      return true;
    } catch (error) {
      console.error('[PuaxClient] activate_role error:', error);
      return false;
    }
  }

  /**
   * 获取当前激活的角色
   */
  async getActiveRole(): Promise<{ id: string; name: string } | null> {
    if (!this.isInitialized) return null;

    try {
      const result = await this.callTool('get_active_role', {
        sessionId: this.sessionId
      });

      return result.role || null;
    } catch (error) {
      console.error('[PuaxClient] get_active_role error:', error);
      return null;
    }
  }

  // ============================================================================
  // 反馈
  // ============================================================================

  /**
   * 提交反馈
   */
  async submitFeedback(feedback: PuaxFeedback): Promise<void> {
    await this.endSession(feedback);
  }

  // ============================================================================
  // 私有方法
  // ============================================================================

  private shouldCheck(): boolean {
    const now = Date.now();
    return now - this.lastCheckTime >= this.config.cooldownMs;
  }

  private async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    const result = await this.mcpClient.callTool({
      name: `puax_${toolName}`,
      arguments: args
    });

    const content = result.content as any;
    if (content && content.length > 0) {
      const textContent = content.find((c: any) => c.type === 'text');
      if (textContent && textContent.text) {
        try {
          return JSON.parse(textContent.text);
        } catch {
          return textContent.text;
        }
      }
    }

    return result;
  }

  private formatSuggestion(result: any): PuaxSuggestion | null {
    if (!result || !result.triggered) {
      return {
        shouldTrigger: false,
        confidence: result?.confidence || 0,
        action: 'none',
        reason: 'No trigger detected'
      };
    }

    let action: PuaxSuggestion['action'] = 'suggest';
    if (result.severity === 'critical') action = 'immediate';
    else if (result.severity === 'high') action = 'immediate';
    else if (result.severity === 'medium') action = 'suggest';
    else action = 'monitor';

    return {
      shouldTrigger: true,
      triggerType: result.triggerType,
      confidence: result.confidence,
      pressureLevel: result.pressureLevel,
      recommendedRole: result.recommendedRole,
      injectionPrompt: result.injectionPrompt,
      action,
      reason: result.pressureResponse?.message || 'Trigger detected'
    };
  }
}

// ============================================================================
// 简化的快速使用函数
// ============================================================================

/**
 * 创建 PUAX 客户端
 */
export function createPuaxClient(config: PuaxClientConfig): PuaxClient {
  return new PuaxClient(config);
}

/**
 * 快速检测（无需管理会话）
 */
export async function quickDetect(
  mcpClient: Client,
  text: string,
  options: {
    sessionId?: string;
    context?: Record<string, any>;
  } = {}
): Promise<PuaxSuggestion | null> {
  const sessionId = options.sessionId || `quick_${Date.now()}`;
  
  try {
    const result = await mcpClient.callTool({
      name: 'puax_quick_detect',
      arguments: {
        sessionId,
        text,
        ...options.context
      }
    });

    const content = result.content as any;
    if (content && content.length > 0) {
      const textContent = content.find((c: any) => c.type === 'text');
      if (textContent && textContent.text) {
        try {
          return JSON.parse(textContent.text);
        } catch {
          return null;
        }
      }
    }
  } catch (error) {
    console.error('[PuaxClient] quickDetect error:', error);
  }

  return null;
}

// 导出
export default PuaxClient;
