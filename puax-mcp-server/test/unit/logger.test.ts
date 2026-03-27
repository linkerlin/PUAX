/**
 * Logger 单元测试
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Logger } from '../../src/utils/logger';
import { initGlobalLogger } from '../../src/utils/logger';

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create logger instance with default settings', () => {
      const logger = new Logger(false);
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should create logger instance with quiet mode', () => {
      const quietLogger = new Logger(true);
      expect(quietLogger).toBeInstanceOf(Logger);
    });

    it('should log info message in non-quiet mode', () => {
      const logger = new Logger(false);
      expect(() => logger.info('Info message')).not.toThrow();
    });

    it('should log all message types in non-quiet mode', () => {
      const logger = new Logger(false);
      expect(() => logger.info('Info message')).not.toThrow();
      expect(() => logger.warn('warn message')).not.toThrow();
      expect(() => logger.error('error message')).not.toThrow();
      expect(() => logger.success('success message')).not.toThrow();
      expect(() => logger.debug('debug message')).not.toThrow();
    });

    it('should not throw when logging in quiet mode', () => {
      const logger = new Logger(true);
      expect(() => logger.info('Info message')).not.toThrow();
      expect(() => logger.debug('debug message')).not.toThrow();
    });
  });

  describe('initGlobalLogger', () => {
    it('should initialize global logger', () => {
      expect(() => initGlobalLogger(false)).not.toThrow();
    });
  });
});
