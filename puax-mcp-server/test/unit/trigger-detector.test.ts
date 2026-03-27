/**
 * TriggerDetector 单元测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { TriggerDetector } from '../../src/core/trigger-detector';
import { ConfigLoader } from '../../src/core/config-loader';
import type { ConversationMessage } from '../../src/core/trigger-detector';

describe('TriggerDetector', () => {
  let mockConfigLoader: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfigLoader = {
      loadTriggerCatalog: jest.fn(),
      reload: jest.fn(),
      getLoadErrors: jest.fn().mockReturnValue([]),
      setDataDir: jest.fn(),
    };
    jest.spyOn(ConfigLoader, 'getInstance').mockReturnValue(mockConfigLoader as ConfigLoader);
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const mockCatalog = {
        triggers: {
          test_trigger: {
            id: 'test_trigger',
            name: 'Test Trigger',
            description: 'Test description',
            category: 'test',
            severity: 'high',
            patterns: {
              zh: ['测试模式'],
              en: ['test pattern']
            },
            detection: {
              type: 'regex',
              case_sensitive: false
            },
            recommended_roles: {
              primary: 'military-warrior',
              alternatives: [],
              reason: 'Test reason'
            }
          }
        },
        categories: {
          test: {
            id: 'test',
            name: 'Test Category',
            description: 'Test category',
            color: '#ffffff'
          }
        }
      };

      mockConfigLoader.loadTriggerCatalog.mockReturnValue(mockCatalog);

      const detector = new TriggerDetector();

      expect(detector).toBeDefined();
      expect(detector.getAllTriggers().length).toBe(1);
    });
  });

  describe('detect', () => {
    let detector: TriggerDetector;
    let mockCatalog: any;

    beforeEach(() => {
      mockCatalog = {
        triggers: {
          consecutive_failures: {
            id: 'consecutive_failures',
            name: '连续失败',
            description: '连续失败描述',
            category: 'failure',
            severity: 'high',
            patterns: {
              zh: ['又失败了', '再次失败'],
              en: ['failed again', 'failed repeatedly']
            },
            detection: {
              type: 'regex',
              case_sensitive: false
            },
            recommended_roles: {
              primary: 'military-warrior',
              alternatives: [],
              reason: '需要激励'
            }
          },
          user_frustration: {
            id: 'user_frustration',
            name: '用户沮丧',
            description: '用户沮丧描述',
            category: 'frustration',
            severity: 'critical',
            patterns: {
              zh: ['为什么还不行', '怎么又失败了'],
              en: ['why not working', 'frustrated']
            },
            detection: {
              type: 'regex',
              case_sensitive: false
            },
            recommended_roles: {
              primary: 'military-commander',
              alternatives: [],
              reason: '需要安抚'
            }
          }
        },
        categories: {}
      };

      mockConfigLoader.loadTriggerCatalog.mockReturnValue(mockCatalog);
      detector = new TriggerDetector();
    });

    it('should detect triggers from conversation history', async () => {
      const messages: ConversationMessage[] = [
        { role: 'assistant', content: '尝试连接数据库失败' },
        { role: 'assistant', content: '又失败了，还是连不上' },
        { role: 'user', content: '为什么还不行？' }
      ];

      const result = await detector.detect(messages);

      expect(result.triggers_detected.length).toBeGreaterThan(0);
      expect(result.summary.should_trigger).toBe(true);
    });

    it('should detect user frustration with higher confidence', async () => {
      const messages: ConversationMessage[] = [
        { role: 'user', content: '为什么还不行？这太令人沮丧了！' }
      ];

      const result = await detector.detect(messages);

      expect(result.triggers_detected.length).toBeGreaterThan(0);
      expect(result.triggers_detected[0].confidence).toBeGreaterThan(0.5);
    });

    it('should return no triggers for normal conversation', async () => {
      const messages: ConversationMessage[] = [
        { role: 'user', content: '你好，请帮我查看代码' },
        { role: 'assistant', content: '好的，我来帮你查看' }
      ];

      const result = await detector.detect(messages);

      expect(result.triggers_detected.length).toBe(0);
      expect(result.summary.should_trigger).toBe(false);
    });

    it('should consider attempt_count from task context', async () => {
      const messages: ConversationMessage[] = [
        { role: 'assistant', content: '尝试中...' }
      ];

      const taskContext = {
        attempt_count: 3
      };

      const result = await detector.detect(messages, taskContext);

      // Should detect consecutive_failures based on attempt_count
      expect(result.triggers_detected.length).toBeGreaterThan(0);
    });
  });

  describe('getAllTriggers', () => {
    it('should return all triggers', () => {
      mockConfigLoader.loadTriggerCatalog.mockReturnValue({
        triggers: {},
        categories: {}
      });

      const detector = new TriggerDetector();
      const triggers = detector.getAllTriggers();

      expect(Array.isArray(triggers)).toBe(true);
    });
  });

  describe('getCategories', () => {
    it('should return all categories', () => {
      mockConfigLoader.loadTriggerCatalog.mockReturnValue({
        triggers: {},
        categories: {
          test: { id: 'test', name: 'Test', description: 'Test', color: '#fff' }
        }
      });

      const detector = new TriggerDetector();
      const categories = detector.getCategories();

      expect(categories.length).toBe(1);
      expect(categories[0].id).toBe('test');
    });
  });
});
