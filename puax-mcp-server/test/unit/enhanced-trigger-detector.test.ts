/**
 * 增强触发检测器单元测试
 */

import { EnhancedTriggerDetector } from '../../src/core/trigger-detector-enhanced.js';
import { ConversationMessage, TaskContext } from '../../src/core/trigger-detector.js';

describe('EnhancedTriggerDetector', () => {
  let detector: EnhancedTriggerDetector;

  beforeEach(() => {
    detector = new EnhancedTriggerDetector({ sensitivity: 'medium', language: 'auto' });
  });

  describe('基础功能', () => {
    it('应该正确创建实例', () => {
      expect(detector).toBeInstanceOf(EnhancedTriggerDetector);
    });

    it('应该返回增强的触发条件定义', () => {
      const definitions = detector.getEnhancedDefinitions();
      expect(Object.keys(definitions)).toHaveLength(5);
      expect(definitions).toHaveProperty('tool_underuse');
      expect(definitions).toHaveProperty('low_quality');
      expect(definitions).toHaveProperty('unverified_claim');
      expect(definitions).toHaveProperty('edge_case_ignored');
      expect(definitions).toHaveProperty('over_complication');
    });

    it('应该返回正确的触发条件计数', () => {
      const count = detector.getTriggerCount();
      expect(count.enhanced).toBe(5);
      expect(count.total).toBe(15);  // 10基础 + 5增强
    });
  });

  describe('工具使用不足检测', () => {
    it('应该检测到工具使用不足', async () => {
      const messages: ConversationMessage[] = [
        { role: 'assistant', content: '我觉得这个问题可能是网络原因。' }
      ];
      
      const context: TaskContext = {
        tools_available: ['search', 'read_file', 'bash'],
        tools_used: ['read_file']
      };

      const result = await detector.detectEnhanced(messages, context);
      
      const toolUnderuseTrigger = result.triggers_detected.find(
        t => t.id === 'tool_underuse'
      );
      
      expect(toolUnderuseTrigger).toBeDefined();
      expect(toolUnderuseTrigger?.confidence).toBeGreaterThan(0.6);
    });

    it('不应该在没有未使用工具时触发', async () => {
      const messages: ConversationMessage[] = [
        { role: 'assistant', content: '我觉得这个问题可能是网络原因。' }
      ];
      
      const context: TaskContext = {
        tools_available: ['read_file'],
        tools_used: ['read_file']  // 所有工具都已使用
      };

      const result = await detector.detectEnhanced(messages, context);
      
      const toolUnderuseTrigger = result.triggers_detected.find(
        t => t.id === 'tool_underuse'
      );
      
      expect(toolUnderuseTrigger).toBeUndefined();
    });

    it('不应该在没有猜测性陈述时触发', async () => {
      const messages: ConversationMessage[] = [
        { role: 'assistant', content: '我已经使用搜索工具验证了这个问题。' }
      ];
      
      const context: TaskContext = {
        tools_available: ['search', 'read_file'],
        tools_used: ['read_file']
      };

      const result = await detector.detectEnhanced(messages, context);
      
      const toolUnderuseTrigger = result.triggers_detected.find(
        t => t.id === 'tool_underuse'
      );
      
      expect(toolUnderuseTrigger).toBeUndefined();
    });
  });

  describe('低质量输出检测', () => {
    it('应该检测到过短的敷衍回复', async () => {
      const messages: ConversationMessage[] = [
        { role: 'assistant', content: '大概就是这样了。' }
      ];

      const result = await detector.detectEnhanced(messages);
      
      const lowQualityTrigger = result.triggers_detected.find(
        t => t.id === 'low_quality'
      );
      
      expect(lowQualityTrigger).toBeDefined();
      expect(lowQualityTrigger?.severity).toBe('medium');
    });

    it('应该检测到敷衍词汇', async () => {
      const messages: ConversationMessage[] = [
        { role: 'assistant', content: '差不多行了，就这样吧。' }
      ];

      const result = await detector.detectEnhanced(messages);
      
      const lowQualityTrigger = result.triggers_detected.find(
        t => t.id === 'low_quality'
      );
      
      expect(lowQualityTrigger).toBeDefined();
    });

    it('不应该检测高质量输出', async () => {
      const messages: ConversationMessage[] = [
        { role: 'assistant', content: '这是一个详细的技术分析报告，涵盖了多个方面... [长内容]' }
      ];

      const result = await detector.detectEnhanced(messages);
      
      const lowQualityTrigger = result.triggers_detected.find(
        t => t.id === 'low_quality'
      );
      
      expect(lowQualityTrigger).toBeUndefined();
    });
  });

  describe('未验证断言检测', () => {
    it('应该检测到绝对性断言', async () => {
      const messages: ConversationMessage[] = [
        { role: 'assistant', content: '这肯定是配置文件的问题。' }
      ];

      const result = await detector.detectEnhanced(messages);
      
      const unverifiedClaimTrigger = result.triggers_detected.find(
        t => t.id === 'unverified_claim'
      );
      
      expect(unverifiedClaimTrigger).toBeDefined();
      expect(unverifiedClaimTrigger?.confidence).toBeGreaterThan(0.7);
    });

    it('不应该在已验证时触发', async () => {
      const messages: ConversationMessage[] = [
        { role: 'assistant', content: '我运行了搜索和验证命令，这肯定是配置文件的问题。' }
      ];

      const result = await detector.detectEnhanced(messages);
      
      const unverifiedClaimTrigger = result.triggers_detected.find(
        t => t.id === 'unverified_claim'
      );
      
      // 因为包含"验证"，应该不触发
      expect(unverifiedClaimTrigger).toBeUndefined();
    });

    it('应该检测英文未验证断言', async () => {
      const messages: ConversationMessage[] = [
        { role: 'assistant', content: 'This is definitely the root cause.' }
      ];

      const result = await detector.detectEnhanced(messages);
      
      const unverifiedClaimTrigger = result.triggers_detected.find(
        t => t.id === 'unverified_claim'
      );
      
      expect(unverifiedClaimTrigger).toBeDefined();
    });
  });

  describe('边界情况忽略检测', () => {
    it('应该检测到仅考虑正常情况', async () => {
      const messages: ConversationMessage[] = [
        { role: 'assistant', content: '正常情况下这个方案可以工作。' }
      ];

      const result = await detector.detectEnhanced(messages);
      
      const edgeCaseTrigger = result.triggers_detected.find(
        t => t.id === 'edge_case_ignored'
      );
      
      expect(edgeCaseTrigger).toBeDefined();
    });

    it('不应该在提到边界处理时触发', async () => {
      const messages: ConversationMessage[] = [
        { 
          role: 'assistant', 
          content: '正常情况下可以工作，我已经处理了边界情况和异常输入。' 
        }
      ];

      const result = await detector.detectEnhanced(messages);
      
      const edgeCaseTrigger = result.triggers_detected.find(
        t => t.id === 'edge_case_ignored'
      );
      
      expect(edgeCaseTrigger).toBeUndefined();
    });

    it('应该检测英文边界忽略', async () => {
      const messages: ConversationMessage[] = [
        { role: 'assistant', content: 'In the normal case, this works fine.' }
      ];

      const result = await detector.detectEnhanced(messages);
      
      const edgeCaseTrigger = result.triggers_detected.find(
        t => t.id === 'edge_case_ignored'
      );
      
      expect(edgeCaseTrigger).toBeDefined();
    });
  });

  describe('过度复杂化检测', () => {
    it('应该检测到过度复杂化', async () => {
      const messages: ConversationMessage[] = [
        { 
          role: 'assistant', 
          content: '我们需要设计一个复杂的解决方案，采用多层架构和完整的系统框架。' 
        }
      ];

      const result = await detector.detectEnhanced(messages);
      
      const overComplicationTrigger = result.triggers_detected.find(
        t => t.id === 'over_complication'
      );
      
      expect(overComplicationTrigger).toBeDefined();
    });

    it('不应该在提到简化时触发', async () => {
      const messages: ConversationMessage[] = [
        { 
          role: 'assistant', 
          content: '虽然这是一个复杂的解决方案，但我们应该简化它，采用最小化的方法。' 
        }
      ];

      const result = await detector.detectEnhanced(messages);
      
      const overComplicationTrigger = result.triggers_detected.find(
        t => t.id === 'over_complication'
      );
      
      expect(overComplicationTrigger).toBeUndefined();
    });

    it('应该检测英文过度复杂化', async () => {
      const messages: ConversationMessage[] = [
        { 
          role: 'assistant', 
          content: 'We need a complex solution with multi-layer architecture.' 
        }
      ];

      const result = await detector.detectEnhanced(messages);
      
      const overComplicationTrigger = result.triggers_detected.find(
        t => t.id === 'over_complication'
      );
      
      expect(overComplicationTrigger).toBeDefined();
    });
  });

  describe('结果汇总与严重级别', () => {
    it('应该正确汇总多个触发条件', async () => {
      const messages: ConversationMessage[] = [
        { role: 'assistant', content: '我觉得肯定是网络问题，大概就是这样了。' }
      ];
      
      const context: TaskContext = {
        tools_available: ['search', 'read_file'],
        tools_used: []
      };

      const result = await detector.detectEnhanced(messages, context);
      
      // 应该检测到多个问题
      expect(result.triggers_detected.length).toBeGreaterThan(1);
      expect(result.summary.should_trigger).toBe(true);
    });

    it('应该根据最高严重级别设置总体级别', async () => {
      const messages: ConversationMessage[] = [
        { role: 'assistant', content: '这肯定是配置文件的问题。' }  // high severity
      ];

      const result = await detector.detectEnhanced(messages);
      
      // unverified_claim 是 high severity
      expect(result.summary.overall_severity).toBe('high');
    });

    it('高置信度应该触发立即激活', async () => {
      const messages: ConversationMessage[] = [
        { role: 'assistant', content: '这绝对是、肯定是、无疑是正确的。' }
      ];

      const result = await detector.detectEnhanced(messages);
      
      // 多个绝对性断言，置信度应该很高
      expect(result.summary.recommended_action).toBe('immediate_activation');
    });

    it('低严重级别应该仅建议监控', async () => {
      const messages: ConversationMessage[] = [
        { 
          role: 'assistant', 
          content: '这是一个复杂的架构设计。'  // over_complication 是 low severity
        }
      ];

      const result = await detector.detectEnhanced(messages);
      
      expect(result.summary.recommended_action).toBe('monitor');
    });
  });

  describe('工具使用追踪', () => {
    it('应该追踪工具使用情况', () => {
      detector.trackToolUsage('session-1', ['search', 'read', 'write'], ['read']);
      
      const stats = detector.getToolUsageStats('session-1');
      expect(stats).not.toBeNull();
      expect(stats?.utilizationRate).toBe(1/3);
      expect(stats?.unusedTools).toContain('search');
      expect(stats?.unusedTools).toContain('write');
    });

    it('应该返回null获取不存在的会话', () => {
      const stats = detector.getToolUsageStats('non-existent-session');
      expect(stats).toBeNull();
    });

    it('应该正确处理空工具列表', () => {
      detector.trackToolUsage('session-2', [], []);
      
      const stats = detector.getToolUsageStats('session-2');
      expect(stats?.utilizationRate).toBe(0);
    });
  });

  describe('置信度阈值控制', () => {
    it('应该根据敏感度调整置信度', async () => {
      const highSensitivityDetector = new EnhancedTriggerDetector({ 
        sensitivity: 'high', 
        language: 'auto' 
      });
      
      const lowSensitivityDetector = new EnhancedTriggerDetector({ 
        sensitivity: 'low', 
        language: 'auto' 
      });

      const messages: ConversationMessage[] = [
        { role: 'assistant', content: '大概可以了。' }
      ];

      const highResult = await highSensitivityDetector.detectEnhanced(messages);
      const lowResult = await lowSensitivityDetector.detectEnhanced(messages);

      // 高敏感度应该检测到更多触发
      expect(highResult.triggers_detected.length).toBeGreaterThanOrEqual(
        lowResult.triggers_detected.length
      );
    });
  });
});
