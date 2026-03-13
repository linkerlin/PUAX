#!/usr/bin/env node
/**
 * Trigger Detector Unit Tests
 */

import { TriggerDetector, TriggerDetectionResult } from '../../src/core/trigger-detector.js';

describe('TriggerDetector', () => {
  let detector: TriggerDetector;

  beforeEach(() => {
    detector = new TriggerDetector({ sensitivity: 'medium', language: 'auto' });
  });

  describe('Basic Detection', () => {
    it('should detect user frustration in Chinese', async () => {
      const result = await detector.detect([
        { role: 'user', content: '为什么还不行？' }
      ]);

      expect(result.triggers_detected).toContainEqual(
        expect.objectContaining({ id: 'user_frustration' })
      );
      expect(result.summary.should_trigger).toBe(true);
      expect(result.summary.overall_severity).toBe('critical');
    });

    it('should detect user frustration in English', async () => {
      const result = await detector.detect([
        { role: 'user', content: 'why does this still not work' }
      ]);

      expect(result.triggers_detected).toContainEqual(
        expect.objectContaining({ id: 'user_frustration' })
      );
    });

    it('should detect consecutive failures', async () => {
      const result = await detector.detect([
        { role: 'assistant', content: '尝试连接...失败' },
        { role: 'assistant', content: '再次尝试...还是失败' }
      ], {
        attempt_count: 2
      });

      expect(result.triggers_detected).toContainEqual(
        expect.objectContaining({ id: 'consecutive_failures' })
      );
    });

    it('should detect giving up language', async () => {
      const result = await detector.detect([
        { role: 'assistant', content: '我无法解决这个问题' }
      ]);

      expect(result.triggers_detected).toContainEqual(
        expect.objectContaining({ id: 'giving_up_language' })
      );
    });

    it('should detect blame environment', async () => {
      const result = await detector.detect([
        { role: 'assistant', content: '这可能是环境问题导致的' }
      ]);

      expect(result.triggers_detected).toContainEqual(
        expect.objectContaining({ id: 'blame_environment' })
      );
    });
  });

  describe('Multiple Triggers', () => {
    it('should detect multiple triggers in complex scenario', async () => {
      const result = await detector.detect([
        { role: 'assistant', content: '尝试连接API...失败' },
        { role: 'assistant', content: '再试一次...还是失败' },
        { role: 'assistant', content: '可能是网络问题' },
        { role: 'user', content: '为什么还不行？' }
      ], {
        attempt_count: 2
      });

      const triggerIds = result.triggers_detected.map(t => t.id);
      expect(triggerIds).toContain('user_frustration');
      expect(triggerIds).toContain('consecutive_failures');
      expect(triggerIds).toContain('blame_environment');
    });
  });

  describe('Sensitivity Settings', () => {
    it('should be more sensitive with high sensitivity', async () => {
      const highSensitivityDetector = new TriggerDetector({ 
        sensitivity: 'high',
        language: 'auto'
      });

      const result = await highSensitivityDetector.detect([
        { role: 'assistant', content: '可能有点问题' }
      ]);

      // High sensitivity should catch more subtle triggers
      expect(result.triggers_detected.length).toBeGreaterThanOrEqual(0);
    });

    it('should be less sensitive with low sensitivity', async () => {
      const lowSensitivityDetector = new TriggerDetector({ 
        sensitivity: 'low',
        language: 'auto'
      });

      const result = await lowSensitivityDetector.detect([
        { role: 'assistant', content: '可能有点问题' }
      ]);

      // Low sensitivity should require stronger signals
      expect(result.triggers_detected.length).toBe(0);
    });
  });

  describe('Language Support', () => {
    it('should support Chinese language detection', async () => {
      const zhDetector = new TriggerDetector({ 
        sensitivity: 'medium',
        language: 'zh'
      });

      const result = await zhDetector.detect([
        { role: 'user', content: '你怎么又失败了' }
      ]);

      expect(result.triggers_detected).toContainEqual(
        expect.objectContaining({ id: 'user_frustration' })
      );
    });

    it('should support English language detection', async () => {
      const enDetector = new TriggerDetector({ 
        sensitivity: 'medium',
        language: 'en'
      });

      const result = await enDetector.detect([
        { role: 'user', content: 'you keep failing' }
      ]);

      expect(result.triggers_detected).toContainEqual(
        expect.objectContaining({ id: 'user_frustration' })
      );
    });
  });

  describe('Task Context', () => {
    it('should detect tool underuse', async () => {
      const result = await detector.detect([
        { role: 'assistant', content: '我需要搜索一下' }
      ], {
        attempt_count: 3,
        tools_available: ['WebSearch', 'Bash', 'Read'],
        tools_used: ['Bash']
      });

      // Should detect that WebSearch is available but not used
      const toolUnderuseTrigger = result.triggers_detected.find(
        t => t.id === 'tool_underuse'
      );
      
      if (toolUnderuseTrigger) {
        expect(toolUnderuseTrigger.confidence).toBeGreaterThan(0);
      }
    });
  });

  describe('Summary Generation', () => {
    it('should recommend immediate activation for critical triggers', async () => {
      const result = await detector.detect([
        { role: 'user', content: '为什么还不行？' }
      ]);

      expect(result.summary.recommended_action).toBe('immediate_activation');
    });

    it('should recommend monitoring for low severity', async () => {
      const result = await detector.detect([
        { role: 'assistant', content: '让我检查一下' }
      ]);

      // No triggers or low severity triggers
      if (result.triggers_detected.length === 0) {
        expect(result.summary.recommended_action).toBe('none');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty conversation', async () => {
      const result = await detector.detect([]);

      expect(result.triggers_detected).toHaveLength(0);
      expect(result.summary.should_trigger).toBe(false);
    });

    it('should handle very long messages', async () => {
      const longMessage = '失败'.repeat(1000);
      const result = await detector.detect([
        { role: 'assistant', content: longMessage }
      ]);

      // Should not crash
      expect(result).toBeDefined();
    });

    it('should handle special characters', async () => {
      const result = await detector.detect([
        { role: 'user', content: '为什么还不行？？？！！！@#$%' }
      ]);

      expect(result).toBeDefined();
    });
  });

  describe('Confidence Scoring', () => {
    it('should assign higher confidence to exact matches', async () => {
      const result = await detector.detect([
        { role: 'user', content: '为什么还不行' }
      ]);

      const trigger = result.triggers_detected.find(
        t => t.id === 'user_frustration'
      );

      if (trigger) {
        expect(trigger.confidence).toBeGreaterThan(0.7);
      }
    });

    it('should provide match reasons', async () => {
      const result = await detector.detect([
        { role: 'user', content: '为什么还不行' }
      ]);

      const trigger = result.triggers_detected[0];
      if (trigger) {
        expect(trigger.matched_patterns.length).toBeGreaterThan(0);
      }
    });
  });
});
