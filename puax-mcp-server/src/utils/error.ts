/**
 * PUAX 统一错误处理
 * 提供一致的错误类型和错误代码和错误消息
 */

// ============================================================================
// 错误代码定义 - 统一使用 SCREAMING_SNAKE_CASE
// ============================================================================

export enum PuaxErrorCode {
  // 配置错误
  CONFIG_ERROR = 'CONFIG_ERROR',
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
  INVALID_CONFIG = 'INVALID_CONFIG',

  // 链路错误
  CHAIN_ERROR = 'CHAIN_ERROR',
  TOOL_NOT_FOUND = 'TOOL_NOT_FOUND',
  INVALID_PARAMS = 'INVALID_PARAMS',
  INTERNAL_ERROR = 'INTERNAL_ERROR',

  // 业务错误
  BUSINESS_ERROR = 'BUSINESS_ERROR',
  TRIGGER_NOT_DETECTED = 'TRIGGER_NOT_DETECTED',
  ROLE_NOT_FOUND = 'ROLE_NOT_FOUND',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
}

// ============================================================================
// PuaxError 类
// ============================================================================
export class PuaxError extends Error {
  public readonly code: PuaxErrorCode;
  public readonly details?: Record<string, unknown>;
  public readonly cause?: Error;

  constructor(
    code: PuaxErrorCode,
    message: string,
    details?: Record<string, unknown>,
    cause?: Error
  ) {
    super(message);
    this.code = code;
    this.details = details;
    this.cause = cause;
    this.name = 'PuaxError';
  }

  /**
   * 创建配置错误
   */
  static configNotFound(message: string, details?: Record<string, unknown>): PuaxError {
    return new PuaxError(PuaxErrorCode.CONFIG_NOT_FOUND, message, details);
  }

  /**
   * 创建无效配置错误
   */
  static invalidConfig(message: string, details?: Record<string, unknown>): PuaxError {
    return new PuaxError(PuaxErrorCode.INVALID_CONFIG, message, details);
  }

  /**
   * 创建工具未找到错误
   */
  static toolNotFound(toolName: string, details?: Record<string, unknown>): PuaxError {
    return new PuaxError(PuaxErrorCode.TOOL_NOT_FOUND, `Tool not found: ${toolName}`, details);
  }

  /**
   * 创建无效参数错误
   */
  static invalidParams(message: string, details?: Record<string, unknown>): PuaxError {
    return new PuaxError(PuaxErrorCode.INVALID_PARAMS, message, details);
  }

  /**
   * 创建内部错误
   */
  static internalError(message: string, cause?: Error): PuaxError {
    return new PuaxError(PuaxErrorCode.INTERNAL_ERROR, message, undefined, cause);
  }

  /**
   * 创建业务错误
   */
  static businessError(message: string, details?: Record<string, unknown>): PuaxError {
    return new PuaxError(PuaxErrorCode.BUSINESS_ERROR, message, details);
  }

  /**
   * 创建角色未找到错误
   */
  static roleNotFound(roleId: string, details?: Record<string, unknown>): PuaxError {
    return new PuaxError(PuaxErrorCode.ROLE_NOT_FOUND, `Role not found: ${roleId}`, details);
  }

  /**
   * 创建会话过期错误
   */
  static sessionExpired(sessionId: string, details?: Record<string, unknown>): PuaxError {
    return new PuaxError(PuaxErrorCode.SESSION_EXPIRED, `Session expired: ${sessionId}`, details);
  }

  /**
   * 转换为 JSON（用于日志）
   */
  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      cause: this.cause?.message,
      stack: this.stack
    };
  }

  /**
   * 检查是否是特定错误类型
   */
  isConfigError(): boolean {
    return this.code === PuaxErrorCode.CONFIG_NOT_FOUND || this.code === PuaxErrorCode.INVALID_CONFIG;
  }

  isChainError(): boolean {
    return this.code === PuaxErrorCode.TOOL_NOT_FOUND ||
           this.code === PuaxErrorCode.INVALID_PARAMS ||
           this.code === PuaxErrorCode.INTERNAL_ERROR;
  }

  isBusinessError(): boolean {
    return this.code === PuaxErrorCode.BUSINESS_ERROR ||
           this.code === PuaxErrorCode.ROLE_NOT_FOUND ||
           this.code === PuaxErrorCode.SESSION_EXPIRED;
  }
}
