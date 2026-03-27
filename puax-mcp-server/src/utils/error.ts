/**
 * PUAX 统一错误处理
 * 提供一致的错误类型和错误代码和错误消息
 */

// ============================================================================
// 错误代码定义
// ============================================================================

export enum PuaxErrorCode {
  // 配置错误
  CONFIG_error = 'CONFIG_error',
  config_not_found = 'CONFIG_NOT_found',
  invalid_config = 'INVALID_config',
  
  // 链路错误
  CHAIN_error = 'CHAIN_error',
  tool_not_found = 'TOOL_not_found',
  invalid_params = 'Invalid_params',
  internal_error = 'Internal_error',
  
  // 业务错误
  business_error = 'Business_error',
  trigger_not_detected = 'trigger_not_detected',
  role_not_found = 'role_not_found',
  session_expired = 'session_expired',
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
    return new PuaxError(
      PuaxErrorCode.config_not_found,
      message,
      details
    );
  }
  
  /**
   * 创建无效配置错误
   */
  static invalidConfig(message: string, details?: Record<string, unknown>): PuaxError {
    return new PuaxError(
      PuaxErrorCode.invalid_config,
      message,
      details
    );
  }
  
  /**
   * 创建工具未找到错误
   */
  static toolNotFound(toolName: string, details?: Record<string, unknown>): PuaxError {
    return new PuaxError(
      PuaxErrorCode.tool_not_found,
      `Tool not found: ${toolName}`,
      details
    );
  }
  
  /**
   * 创建无效参数错误
   */
  static invalidParams(message: string, details?: Record<string, unknown>): PuaxError {
    return new PuaxError(
      PuaxErrorCode.invalid_params,
      message,
      details
    );
  }
  
  /**
   * 创建内部错误
   */
  static internalError(message: string, cause?: Error): PuaxError {
    return new PuaxError(
      PuaxErrorCode.internal_error,
      message,
      undefined,
      cause
    );
  }
  
  /**
   * 创建业务错误
   */
  static businessError(message: string, details?: Record<string, unknown>): PuaxError {
    return new PuaxError(
      PuaxErrorCode.business_error,
      message,
      details
    );
  }
  
  /**
   * 创建角色未找到错误
   */
  static roleNotFound(roleId: string, details?: Record<string, unknown>): PuaxError {
    return new PuaxError(
      PuaxErrorCode.role_not_found,
      `Role not found: ${roleId}`,
      details
    );
  }
  
  /**
   * 创建会话过期错误
   */
  static sessionExpired(sessionId: string, details?: Record<string, unknown>): PuaxError {
    return new PuaxError(
      PuaxErrorCode.session_expired,
      `Session expired: ${sessionId}`,
      details
    );
  }
  
  /**
   * 转换为 JSON（用于日志)
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
    return this.code === PuaxErrorCode.config_not_found || this.code === PuaxErrorCode.invalid_config;
  }
  
  isChainError(): boolean {
    return this.code === PuaxErrorCode.tool_not_found || 
           this.code === PuaxErrorCode.invalid_params ||
           this.code === PuaxErrorCode.internal_error;
  }
  
  isBusinessError(): boolean {
    return this.code === PuaxErrorCode.business_error ||
           this.code === PuaxErrorCode.role_not_found ||
           this.code === PuaxErrorCode.session_expired;
  }
}
