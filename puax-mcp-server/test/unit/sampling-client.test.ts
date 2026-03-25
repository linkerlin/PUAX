/**
 * Sampling Client 单元测试
 */

import { SamplingClient, SamplingTriggerRequest } from '../../src/mcp/sampling-client.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

// Mock MCP Client
const mockClient = {
  callTool: jest.fn(),
  request: jest.fn()
} as unknown as Client;

describe('SamplingClient', () => {
  let client: SamplingClient;

  beforeEach(() => {
    client = new SamplingClient(mockClient, {
      maxTokensPerRequest: 500,
      cooldownMs: 1000  // 1秒冷却便于测试
    });
    jest.clearAllMocks();
  });

  describe('冷却时间控制', () => {
    it('应该允许首次触发', async () => {
      const request: SamplingTriggerRequest = {
        sessionId: 'test-session-1',
        triggerType: 'consecutive_failures',
        confidence: 0.85,
        context: { attemptCount: 3 },
        recommendedRole: {
          id: 'military-warrior',
          name: '战士',
          systemPrompt: '你是战士角色...'
        }
      };

      const result = await client.executeSampling(request);
      expect(result.accepted).toBe(true);
    });

    it('应该在冷却时间内拒绝重复触发', async () => {
      const request: SamplingTriggerRequest = {
        sessionId: 'test-session-2',
        triggerType: 'giving_up',
        confidence: 0.9,
        context: { attemptCount: 2 },
        recommendedRole: {
          id: 'shaman-musk',
          name: '马斯克',
          systemPrompt: '你是马斯克...'
        }
      };

      // 第一次触发
      const result1 = await client.executeSampling(request);
      expect(result1.accepted).toBe(true);

      // 立即再次触发（冷却期内）
      const result2 = await client.executeSampling(request);
      expect(result2.accepted).toBe(false);
    });

    it('应该在冷却时间后允许再次触发', async () => {
      const request: SamplingTriggerRequest = {
        sessionId: 'test-session-3',
        triggerType: 'user_frustration',
        confidence: 0.8,
        context: { attemptCount: 1 },
        recommendedRole: {
          id: 'military-commander',
          name: '指挥员',
          systemPrompt: '你是指挥员...'
        }
      };

      // 第一次触发
      await client.executeSampling(request);

      // 等待冷却时间
      await new Promise(resolve => setTimeout(resolve, 1100));

      // 再次触发
      const result = await client.executeSampling(request);
      expect(result.accepted).toBe(true);
    });
  });

  describe('触发请求构建', () => {
    it('应该为连续失败构建正确的提示词', async () => {
      const request: SamplingTriggerRequest = {
        sessionId: 'test-session-4',
        triggerType: 'consecutive_failures',
        confidence: 0.85,
        context: { attemptCount: 5 },
        recommendedRole: {
          id: 'military-warrior',
          name: '战士',
          systemPrompt: '战士角色设定...'
        }
      };

      const result = await client.executeSampling(request);
      expect(result.accepted).toBe(true);
      expect(result.injectedPrompt).toContain('连续失败');
      expect(result.injectedPrompt).toContain('战士');
      expect(result.injectedPrompt).toContain('战士角色设定');
    });

    it('应该为用户沮丧构建安抚提示词', async () => {
      const request: SamplingTriggerRequest = {
        sessionId: 'test-session-5',
        triggerType: 'user_frustration',
        confidence: 0.9,
        context: { attemptCount: 2 },
        recommendedRole: {
          id: 'special-cute-coder-wife',
          name: '程序员老婆',
          systemPrompt: '可爱角色设定...'
        }
      };

      const result = await client.executeSampling(request);
      expect(result.accepted).toBe(true);
      expect(result.injectedPrompt).toContain('沮丧');
    });

    it('应该包含元数据信息', async () => {
      const request: SamplingTriggerRequest = {
        sessionId: 'test-session-6',
        triggerType: 'surface_fix',
        confidence: 0.75,
        context: { attemptCount: 1 },
        recommendedRole: {
          id: 'shaman-einstein',
          name: '爱因斯坦',
          systemPrompt: '科学家设定...'
        }
      };

      const result = await client.executeSampling(request);
      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.metadata.tokensUsed).toBeGreaterThan(0);
    });
  });

  describe('触发历史管理', () => {
    it('应该记录触发历史', async () => {
      const request1: SamplingTriggerRequest = {
        sessionId: 'test-session-7',
        triggerType: 'consecutive_failures',
        confidence: 0.8,
        context: { attemptCount: 3 },
        recommendedRole: {
          id: 'military-warrior',
          name: '战士',
          systemPrompt: '战士设定...'
        }
      };

      await client.executeSampling(request1);

      const history = client.getTriggerHistory('test-session-7');
      expect(history).toHaveLength(1);
      expect(history[0].triggerType).toBe('consecutive_failures');
    });

    it('应该限制历史记录数量', async () => {
      const sessionId = 'test-session-8';
      
      // 模拟12次触发（超过限制）
      for (let i = 0; i < 12; i++) {
        const request: SamplingTriggerRequest = {
          sessionId,
          triggerType: i % 2 === 0 ? 'consecutive_failures' : 'giving_up',
          confidence: 0.8,
          context: { attemptCount: i + 1 },
          recommendedRole: {
            id: 'military-warrior',
            name: '战士',
            systemPrompt: '战士设定...'
          }
        };

        // 每次触发间隔冷却时间
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1100));
        }
        await client.executeSampling(request);
      }

      const history = client.getTriggerHistory(sessionId);
      expect(history.length).toBeLessThanOrEqual(10);  // 限制为10条
    });

    it('应该正确清除会话状态', async () => {
      const sessionId = 'test-session-9';
      
      const request: SamplingTriggerRequest = {
        sessionId,
        triggerType: 'consecutive_failures',
        confidence: 0.8,
        context: { attemptCount: 3 },
        recommendedRole: {
          id: 'military-warrior',
          name: '战士',
          systemPrompt: '战士设定...'
        }
      };

      await client.executeSampling(request);
      expect(client.getTriggerHistory(sessionId)).toHaveLength(1);

      client.clearSession(sessionId);
      expect(client.getTriggerHistory(sessionId)).toHaveLength(0);
    });
  });

  describe('统计信息', () => {
    it('应该正确统计触发分布', async () => {
      // 会话1：连续失败
      await client.executeSampling({
        sessionId: 'session-1',
        triggerType: 'consecutive_failures',
        confidence: 0.8,
        context: { attemptCount: 3 },
        recommendedRole: {
          id: 'military-warrior',
          name: '战士',
          systemPrompt: '战士设定...'
        }
      });

      // 会话2：放弃
      await client.executeSampling({
        sessionId: 'session-2',
        triggerType: 'giving_up',
        confidence: 0.9,
        context: { attemptCount: 2 },
        recommendedRole: {
          id: 'shaman-musk',
          name: '马斯克',
          systemPrompt: '马斯克设定...'
        }
      });

      // 会话3：连续失败
      await new Promise(resolve => setTimeout(resolve, 1100));
      await client.executeSampling({
        sessionId: 'session-3',
        triggerType: 'consecutive_failures',
        confidence: 0.85,
        context: { attemptCount: 4 },
        recommendedRole: {
          id: 'military-warrior',
          name: '战士',
          systemPrompt: '战士设定...'
        }
      });

      const stats = client.getTriggerStats();
      expect(stats.totalSessions).toBe(3);
      expect(stats.totalTriggers).toBe(3);
      expect(stats.triggerTypeDistribution['consecutive_failures']).toBe(2);
      expect(stats.triggerTypeDistribution['giving_up']).toBe(1);
    });

    it('应该获取活跃会话列表', async () => {
      await client.executeSampling({
        sessionId: 'active-session-1',
        triggerType: 'consecutive_failures',
        confidence: 0.8,
        context: { attemptCount: 3 },
        recommendedRole: {
          id: 'military-warrior',
          name: '战士',
          systemPrompt: '战士设定...'
        }
      });

      await client.executeSampling({
        sessionId: 'active-session-2',
        triggerType: 'giving_up',
        confidence: 0.9,
        context: { attemptCount: 2 },
        recommendedRole: {
          id: 'shaman-musk',
          name: '马斯克',
          systemPrompt: '马斯克设定...'
        }
      });

      const activeSessions = client.getActiveSessions();
      expect(activeSessions).toContain('active-session-1');
      expect(activeSessions).toContain('active-session-2');
    });
  });

  describe('配置选项', () => {
    it('应该使用默认配置', () => {
      const defaultClient = new SamplingClient(mockClient);
      expect(defaultClient).toBeDefined();
    });

    it('应该接受自定义配置', () => {
      const customClient = new SamplingClient(mockClient, {
        maxTokensPerRequest: 1000,
        defaultTemperature: 0.5,
        cooldownMs: 5000
      });
      expect(customClient).toBeDefined();
    });
  });
});
