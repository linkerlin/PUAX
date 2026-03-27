/**
 * PuaxError 单元测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PuaxError, PuaxErrorCode } from '../../src/utils/error';

describe('PuaxError', () => {
  beforeEach(() => {
    // Reset any global state if needed
  });

  describe('constructor', () => {
    it('should create error with code and message', () => {
      const error = new PuaxError(PuaxErrorCode.config_not_found, 'Configuration file not found');
      expect(error).toBeInstanceOf(PuaxError);
      expect(error.code).toBe(PuaxErrorCode.config_not_found);
      expect(error.message).toBe('Configuration file not found');
    });

    it('should create error with details', () => {
      const details = { key: 'value' };
      const error = new PuaxError(PuaxErrorCode.business_error, '业务错误', details);
      expect(error.details).toEqual(details);
    });
  });

  describe('static factory methods', () => {
    it('should create config not found error', () => {
      const error = PuaxError.configNotFound('Config missing');
      expect(error.code).toBe(PuaxErrorCode.config_not_found);
      expect(error.message).toBe('Config missing');
    });

    it('should create tool not found error', () => {
      const error = PuaxError.toolNotFound('myTool');
      expect(error.code).toBe(PuaxErrorCode.tool_not_found);
      expect(error.message).toBe('Tool not found: myTool');
    });

    it('should create business error', () => {
      const error = PuaxError.businessError('业务错误');
      expect(error.code).toBe(PuaxErrorCode.business_error);
    });

    it('should create session expired error', () => {
      const error = PuaxError.sessionExpired('session123');
      expect(error.code).toBe(PuaxErrorCode.session_expired);
      expect(error.message).toBe('Session expired: session123');
    });

    it('should create role not found error', () => {
      const error = PuaxError.roleNotFound('unknown-role');
      expect(error.code).toBe(PuaxErrorCode.role_not_found);
      expect(error.message).toBe('Role not found: unknown-role');
    });
  });

  describe('isConfigError', () => {
    it('should identify config not found error', () => {
      const error = PuaxError.configNotFound('Config missing');
      expect(error.isConfigError()).toBe(true);
    });

    it('should identify invalid config error', () => {
      const error = PuaxError.invalidConfig('Invalid config');
      expect(error.isConfigError()).toBe(true);
    });

    it('should not identify non-config error', () => {
      const error = PuaxError.businessError('Business error');
      expect(error.isConfigError()).toBe(false);
    });
  });

  describe('isChainError', () => {
    it('should identify tool not found error', () => {
      const error = PuaxError.toolNotFound('myTool');
      expect(error.isChainError()).toBe(true);
    });

    it('should identify invalid params error', () => {
      const error = PuaxError.invalidParams('Invalid params');
      expect(error.isChainError()).toBe(true);
    });

    it('should identify internal error', () => {
      const error = PuaxError.internalError('Internal error');
      expect(error.isChainError()).toBe(true);
    });

    it('should not identify business error', () => {
      const error = PuaxError.businessError('Business error');
      expect(error.isChainError()).toBe(false);
    });
  });

  describe('isBusinessError', () => {
    it('should identify business error', () => {
      const error = PuaxError.businessError('业务错误');
      expect(error.isBusinessError()).toBe(true);
    });

    it('should identify role not found error', () => {
      const error = PuaxError.roleNotFound('unknown-role');
      expect(error.isBusinessError()).toBe(true);
    });

    it('should identify session expired error', () => {
      const error = PuaxError.sessionExpired('session123');
      expect(error.isBusinessError()).toBe(true);
    });

    it('should not identify config error', () => {
      const error = PuaxError.configNotFound('Config missing');
      expect(error.isBusinessError()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should serialize error to JSON', () => {
      const error = new PuaxError(PuaxErrorCode.config_not_found, 'Test error');
      const json = error.toJSON();
      expect(json.code).toBe(PuaxErrorCode.config_not_found);
      expect(json.message).toBe('Test error');
    });
  });
});
