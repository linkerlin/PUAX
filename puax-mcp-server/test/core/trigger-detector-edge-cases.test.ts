#!/usr/bin/env node
/**
 * Trigger Detector Edge Cases and Error Handling Tests
 */

import { TriggerDetector } from '../../src/core/trigger-detector.js';

describe('TriggerDetector Edge Cases', () => {
  let detector: TriggerDetector;

  beforeEach(() => {
    detector = new TriggerDetector({ sensitivity: 'medium', language: 'auto' });
  });

  describe('Empty and Null Inputs', () => {
    it('should handle empty conversation', async () => {
      const result = await detector.detect([]);
      expect(result.triggers_detected).toHaveLength(0);
      expect(result.summary.should_trigger).toBe(false);
    });

    it('should handle null messages gracefully', async () => {
      const result = await detector.detect([
        { role: 'user', content: '' }
      ]);
      expect(result).toBeDefined();
      expect(result.triggers_detected).toBeDefined();
    });

    it('should handle whitespace-only messages', async () => {
      const result = await detector.detect([
        { role: 'assistant', content: '   \n\t   ' }
      ]);
      expect(result).toBeDefined();
    });
  });

  describe('Very Long Inputs', () => {
    it('should handle very long single message', async () => {
      const longContent = '失败'.repeat(10000);
      const result = await detector.detect([
        { role: 'assistant', content: longContent }
      ]);
      expect(result).toBeDefined();
      expect(result.triggers_detected).toBeDefined();
    });

    it('should handle many short messages', async () => {
      const messages = Array(1000).fill({
        role: 'assistant',
        content: '尝试...失败'
      });
      const result = await detector.detect(messages);
      expect(result).toBeDefined();
    });

    it('should handle very long conversation history', async () => {
      const history = Array(500).fill(null).map((_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`
      }));
      const result = await detector.detect(history);
      expect(result).toBeDefined();
    });
  });

  describe('Special Characters and Encoding', () => {
    it('should handle special characters', async () => {
      const result = await detector.detect([
        { role: 'user', content: '为什么还不行？？？！！！@#$%^&*()' }
      ]);
      expect(result).toBeDefined();
    });

    it('should handle emoji', async () => {
      const result = await detector.detect([
        { role: 'user', content: '为什么还不行😡😤' }
      ]);
      expect(result).toBeDefined();
    });

    it('should handle unicode characters', async () => {
      const result = await detector.detect([
        { role: 'user', content: '为什么还不行（╯°□°）╯︵ ┻━┻' }
      ]);
      expect(result).toBeDefined();
    });

    it('should handle mixed languages', async () => {
      const result = await detector.detect([
        { role: 'user', content: 'Why 还不行呢？this is frustrating!' }
      ]);
      expect(result).toBeDefined();
    });
  });

  describe('Boundary Values', () => {
    it('should handle zero attempt count', async () => {
      const result = await detector.detect(
        [{ role: 'assistant', content: 'Failed' }],
        { attempt_count: 0 }
      );
      expect(result).toBeDefined();
    });

    it('should handle very high attempt count', async () => {
      const result = await detector.detect(
        [{ role: 'assistant', content: 'Failed' }],
        { attempt_count: 999999 }
      );
      expect(result).toBeDefined();
    });

    it('should handle negative attempt count gracefully', async () => {
      const result = await detector.detect(
        [{ role: 'assistant', content: 'Failed' }],
        { attempt_count: -1 }
      );
      expect(result).toBeDefined();
    });

    it('should handle empty tools arrays', async () => {
      const result = await detector.detect(
        [{ role: 'assistant', content: 'Failed' }],
        { tools_available: [], tools_used: [] }
      );
      expect(result).toBeDefined();
    });

    it('should handle many tools', async () => {
      const tools = Array(100).fill(null).map((_, i) => `Tool${i}`);
      const result = await detector.detect(
        [{ role: 'assistant', content: 'Failed' }],
        { tools_available: tools, tools_used: tools.slice(0, 50) }
      );
      expect(result).toBeDefined();
    });
  });

  describe('Sensitivity Settings', () => {
    it('should work with low sensitivity', async () => {
      const lowDetector = new TriggerDetector({ sensitivity: 'low' });
      const result = await lowDetector.detect([
        { role: 'user', content: '为什么还不行？' }
      ]);
      expect(result).toBeDefined();
    });

    it('should work with high sensitivity', async () => {
      const highDetector = new TriggerDetector({ sensitivity: 'high' });
      const result = await highDetector.detect([
        { role: 'user', content: '为什么还不行？' }
      ]);
      expect(result).toBeDefined();
    });

    it('should work with different languages', async () => {
      const zhDetector = new TriggerDetector({ language: 'zh' });
      const enDetector = new TriggerDetector({ language: 'en' });
      
      const zhResult = await zhDetector.detect([
        { role: 'user', content: '为什么还不行？' }
      ]);
      const enResult = await enDetector.detect([
        { role: 'user', content: 'why does this not work?' }
      ]);
      
      expect(zhResult).toBeDefined();
      expect(enResult).toBeDefined();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle rapid alternation between user and assistant', async () => {
      const history = Array(50).fill(null).map((_, i) => ({
        role: i % 2 === 0 ? 'assistant' : 'user',
        content: i % 2 === 0 ? '尝试...失败' : '还不行？'
      }));
      const result = await detector.detect(history, { attempt_count: 25 });
      expect(result).toBeDefined();
    });

    it('should handle all identical messages', async () => {
      const history = Array(10).fill({
        role: 'assistant',
        content: '失败'
      });
      const result = await detector.detect(history);
      expect(result).toBeDefined();
    });

    it('should handle single character messages', async () => {
      const history = [
        { role: 'assistant', content: '?' },
        { role: 'user', content: '!' },
        { role: 'assistant', content: '...' }
      ];
      const result = await detector.detect(history);
      expect(result).toBeDefined();
    });
  });

  describe('Malformed Inputs', () => {
    it('should handle messages without content field', async () => {
      const result = await detector.detect([
        { role: 'assistant' } as any
      ]);
      expect(result).toBeDefined();
    });

    it('should handle messages with non-string content', async () => {
      const result = await detector.detect([
        { role: 'assistant', content: 123 } as any
      ]);
      expect(result).toBeDefined();
    });

    it('should handle messages with unknown role', async () => {
      const result = await detector.detect([
        { role: 'unknown', content: 'test' } as any
      ]);
      expect(result).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should complete detection within timeout', async () => {
      const start = Date.now();
      await detector.detect([
        { role: 'user', content: '为什么还不行？' }
      ]);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent detections', async () => {
      const promises = Array(10).fill(null).map(() =>
        detector.detect([{ role: 'user', content: '为什么还不行？' }])
      );
      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      results.forEach(r => expect(r).toBeDefined());
    });
  });
});
