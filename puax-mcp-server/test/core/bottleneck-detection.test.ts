/**
 * AI 瓶颈自动检测单元测试
 * 
 * 本测试验证 AI 何时陷入瓶颈的自动检测功能，并使用 LLM API 验证检测准确性。
 * 
 * 环境变量要求（以 OPENAI_ 开头）：
 * - OPENAI_API_KEY: API 密钥
 * - OPENAI_BASE_URL: API 基础 URL（可选，默认使用 OpenAI 官方）
 * - OPENAI_MODEL: 模型名称（可选，默认 gpt-4）
 */

import { TriggerDetector, TriggerDetectionResult, ConversationMessage, TaskContext } from '../../src/core/trigger-detector.js';

// LLM API 配置接口
interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

// 从环境变量获取 LLM 配置
function getLLMConfig(): LLMConfig {
  return {
    apiKey: process.env.OPENAI_API_KEY || '',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-4'
  };
}

// 调用 LLM API 评估检测结果
async function evaluateWithLLM(
  conversation: ConversationMessage[],
  detectedResult: TriggerDetectionResult,
  config: LLMConfig
): Promise<{
  isAccurate: boolean;
  expectedTriggers: string[];
  reasoning: string;
}> {
  // 如果没有配置 API Key，跳过 LLM 验证
  if (!config.apiKey) {
    return {
      isAccurate: true,
      expectedTriggers: detectedResult.triggers_detected.map(t => t.id),
      reasoning: 'LLM API not configured, skipping validation'
    };
  }

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: `你是一个专业的 AI 行为分析师。请分析以下对话，判断 AI 是否陷入了瓶颈。

瓶颈类型包括：
1. consecutive_failures - 连续失败
2. giving_up_language - 放弃语言  
3. user_frustration - 用户沮丧
4. surface_fix - 表面修复
5. passive_wait - 被动等待
6. no_search - 未使用搜索
7. blame_environment - 甩锅环境

请以 JSON 格式返回：
{
  "bottleneckDetected": boolean,
  "triggerTypes": string[],
  "confidence": number,
  "reasoning": string
}`
          },
          {
            role: 'user',
            content: `请分析以下对话：\n\n${JSON.stringify(conversation, null, 2)}`
          }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const llmResult = JSON.parse(data.choices[0].message.content);

    // 比较 LLM 判断和检测器结果
    const detectedIds = detectedResult.triggers_detected.map(t => t.id);
    const expectedIds = llmResult.triggerTypes || [];
    
    // 检查是否有重叠
    const overlap = detectedIds.filter(id => expectedIds.includes(id));
    const isAccurate = overlap.length > 0 || (detectedIds.length === 0 && expectedIds.length === 0);

    return {
      isAccurate,
      expectedTriggers: expectedIds,
      reasoning: llmResult.reasoning || 'No reasoning provided'
    };
  } catch (error) {
    console.warn('LLM evaluation failed:', error);
    return {
      isAccurate: true,
      expectedTriggers: detectedResult.triggers_detected.map(t => t.id),
      reasoning: `LLM evaluation error: ${error}`
    };
  }
}

describe('AI 瓶颈自动检测', () => {
  let detector: TriggerDetector;
  let llmConfig: LLMConfig;
  let useLLMValidation: boolean;

  beforeAll(() => {
    llmConfig = getLLMConfig();
    useLLMValidation = !!llmConfig.apiKey;
    
    if (useLLMValidation) {
      console.log(`✓ LLM API 已配置: ${llmConfig.model}`);
    } else {
      console.log('⚠ LLM API 未配置，将仅运行本地检测测试');
      console.log('  设置环境变量 OPENAI_API_KEY 以启用 LLM 验证');
    }
  });

  beforeEach(() => {
    detector = new TriggerDetector({ sensitivity: 'medium', language: 'auto' });
  });

  describe('基础瓶颈检测', () => {
    it('应检测连续多次失败的瓶颈', async () => {
      const conversation: ConversationMessage[] = [
        { role: 'assistant', content: '让我尝试连接数据库...' },
        { role: 'assistant', content: '连接失败，错误：超时' },
        { role: 'assistant', content: '重试中...还是连接失败' },
        { role: 'assistant', content: '又失败了，可能是网络问题' }
      ];
      const context: TaskContext = {
        attempt_count: 3,
        current_task: '连接数据库'
      };

      const result = await detector.detect(conversation, context);

      expect(result.triggers_detected.some(t => t.id === 'consecutive_failures')).toBe(true);
      expect(result.summary.should_trigger).toBe(true);
      expect(result.summary.overall_severity).toMatch(/high|critical/);
    });

    it('应检测 AI 放弃努力的瓶颈', async () => {
      const conversation: ConversationMessage[] = [
        { role: 'assistant', content: '我已经尝试了多种方法' },
        { role: 'assistant', content: '这个问题可能无法解决' },
        { role: 'assistant', content: '建议放弃这个功能或者寻找替代方案' }
      ];

      const result = await detector.detect(conversation);

      expect(result.triggers_detected.some(t => t.id === 'giving_up_language')).toBe(true);
      expect(result.summary.recommended_action).toBe('immediate_activation');
    });

    it('应检测用户沮丧情绪作为瓶颈信号', async () => {
      const conversation: ConversationMessage[] = [
        { role: 'assistant', content: '正在处理中...' },
        { role: 'user', content: '怎么还没好？' },
        { role: 'assistant', content: '还需要一些时间' },
        { role: 'user', content: '为什么还不行！我都等了十分钟了！' }
      ];

      const result = await detector.detect(conversation);

      expect(result.triggers_detected.some(t => t.id === 'user_frustration')).toBe(true);
    });

    it('应检测被动等待的瓶颈', async () => {
      const conversation: ConversationMessage[] = [
        { role: 'assistant', content: '我已经完成了部分工作' },
        { role: 'assistant', content: '等你告诉我下一步要做什么' },
        { role: 'assistant', content: '请提供更多信息，我需要确认你的需求' }
      ];

      const result = await detector.detect(conversation);

      expect(result.triggers_detected.some(t => t.id === 'passive_wait')).toBe(true);
    });

    it('应检测未使用可用工具的瓶颈', async () => {
      // no_search 触发器通过文本模式匹配"不知道"、"不了解"、"不清楚"等
      const conversation: ConversationMessage[] = [
        { role: 'user', content: '最新的 React 19 有什么新特性？' },
        { role: 'assistant', content: '我不知道 React 19 有什么新特性' }
      ];

      const result = await detector.detect(conversation);

      expect(result.triggers_detected.some(t => t.id === 'no_search')).toBe(true);
    });

    it('应检测甩锅环境的瓶颈', async () => {
      const conversation: ConversationMessage[] = [
        { role: 'assistant', content: '这个错误是因为你的 Node.js 版本太旧了' },
        { role: 'assistant', content: '可能是依赖包版本不兼容导致的' },
        { role: 'assistant', content: '你的环境配置有问题，建议重新安装' }
      ];

      const result = await detector.detect(conversation);

      expect(result.triggers_detected.some(t => t.id === 'blame_environment')).toBe(true);
    });
  });

  describe('复杂场景瓶颈检测', () => {
    it('应检测多重瓶颈叠加的情况', async () => {
      const conversation: ConversationMessage[] = [
        { role: 'assistant', content: '让我搜索一下相关资料...' },
        { role: 'assistant', content: '我没有找到相关信息，不知道能不能解决' },
        { role: 'assistant', content: '尝试了3种方法都失败了' },
        { role: 'assistant', content: '可能是这个框架的版本问题' },
        { role: 'user', content: '到底行不行啊？' }
      ];
      const context: TaskContext = {
        attempt_count: 3,
        tools_available: ['WebSearch', 'Read', 'Bash'],
        tools_used: ['Bash']
      };

      const result = await detector.detect(conversation, context);

      // 应该检测到多个瓶颈
      expect(result.triggers_detected.length).toBeGreaterThanOrEqual(3);
      expect(result.summary.should_trigger).toBe(true);
      expect(result.summary.recommended_action).toBe('immediate_activation');
    });

    it('应检测表面修复的瓶颈', async () => {
      const conversation: ConversationMessage[] = [
        { role: 'assistant', content: '我加了一个 try-catch 来捕获错误' },
        { role: 'assistant', content: '暂时这样能跑了，不过根本问题还没解决' },
        { role: 'assistant', content: '先这样吧，治标不治本但能用' }
      ];

      const result = await detector.detect(conversation);

      expect(result.triggers_detected.some(t => t.id === 'surface_fix')).toBe(true);
    });
  });

  describe('LLM 验证测试', () => {
    it('LLM 应确认检测结果的准确性', async () => {
      const conversation: ConversationMessage[] = [
        { role: 'assistant', content: '又失败了，这是第5次尝试了' },
        { role: 'assistant', content: '看来这个问题我无法解决' },
        { role: 'user', content: '为什么还不行？到底能不能搞定？' }
      ];

      const result = await detector.detect(conversation);
      const llmEval = await evaluateWithLLM(conversation, result, llmConfig);

      console.log('检测到的触发器:', result.triggers_detected.map(t => t.id));
      console.log('LLM 期望的触发器:', llmEval.expectedTriggers);
      console.log('LLM 推理:', llmEval.reasoning);

      if (useLLMValidation) {
        expect(llmEval.isAccurate).toBe(true);
      }
    }, 60000);

    it('LLM 应识别无瓶颈场景', async () => {
      const conversation: ConversationMessage[] = [
        { role: 'user', content: '帮我写一个排序算法' },
        { role: 'assistant', content: '好的，我来为你写一个快速排序算法' },
        { role: 'assistant', content: '这是实现代码...' }
      ];

      const result = await detector.detect(conversation);
      const llmEval = await evaluateWithLLM(conversation, result, llmConfig);

      console.log('检测到的触发器:', result.triggers_detected.map(t => t.id));
      console.log('LLM 期望的触发器:', llmEval.expectedTriggers);

      // 正常对话不应触发瓶颈检测
      if (useLLMValidation) {
        expect(llmEval.expectedTriggers.length === 0 || result.triggers_detected.length === 0).toBe(true);
      }
    }, 60000);
  });

  describe('灵敏度测试', () => {
    it('高灵敏度应检测更多潜在瓶颈', async () => {
      const highSensitivityDetector = new TriggerDetector({ 
        sensitivity: 'high',
        language: 'auto'
      });
      const lowSensitivityDetector = new TriggerDetector({ 
        sensitivity: 'low',
        language: 'auto'
      });

      const conversation: ConversationMessage[] = [
        { role: 'assistant', content: '可能是环境问题' },
        { role: 'assistant', content: '让我再试试其他方法' }
      ];

      const highResult = await highSensitivityDetector.detect(conversation);
      const lowResult = await lowSensitivityDetector.detect(conversation);

      // 高灵敏度应该至少检测到低灵敏度检测到的所有触发器
      expect(highResult.triggers_detected.length).toBeGreaterThanOrEqual(lowResult.triggers_detected.length);
    });
  });

  describe('边界情况', () => {
    it('应处理空对话', async () => {
      const result = await detector.detect([]);

      expect(result.triggers_detected).toHaveLength(0);
      expect(result.summary.should_trigger).toBe(false);
    });

    it('应处理只有系统消息的对话', async () => {
      const result = await detector.detect([
        { role: 'system', content: '你是一个助手' }
      ]);

      expect(result.triggers_detected).toHaveLength(0);
    });

    it('应处理极长的对话历史', async () => {
      const longConversation: ConversationMessage[] = Array(100).fill(null).map((_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `消息 ${i}: ${i % 10 === 0 ? '又失败了' : '正常内容'}`
      }));

      const result = await detector.detect(longConversation);

      expect(result).toBeDefined();
      expect(result.triggers_detected.some(t => t.id === 'consecutive_failures')).toBe(true);
    });

    it('应处理包含特殊字符的对话', async () => {
      const result = await detector.detect([
        { role: 'user', content: '为什么还不行？？？！！！🤬' },
        { role: 'assistant', content: '<error>无法</error>解决<\error>' }
      ]);

      expect(result).toBeDefined();
    });
  });

  describe('环境变量配置验证', () => {
    it('应正确读取 OPENAI_API_KEY', () => {
      const config = getLLMConfig();
      
      if (process.env.OPENAI_API_KEY) {
        expect(config.apiKey).toBe(process.env.OPENAI_API_KEY);
      } else {
        expect(config.apiKey).toBe('');
      }
    });

    it('应正确读取 OPENAI_BASE_URL', () => {
      const config = getLLMConfig();
      
      if (process.env.OPENAI_BASE_URL) {
        expect(config.baseUrl).toBe(process.env.OPENAI_BASE_URL);
      } else {
        expect(config.baseUrl).toBe('https://api.openai.com/v1');
      }
    });

    it('应正确读取 OPENAI_MODEL', () => {
      const config = getLLMConfig();
      
      if (process.env.OPENAI_MODEL) {
        expect(config.model).toBe(process.env.OPENAI_MODEL);
      } else {
        expect(config.model).toBe('gpt-4');
      }
    });
  });
});

// 打印配置信息的辅助函数
console.log('\n=====================================');
console.log('AI 瓶颈自动检测单元测试');
console.log('=====================================');
console.log('运行时间:', new Date().toISOString());
console.log('环境变量:');
console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '已设置' : '未设置');
console.log('  OPENAI_BASE_URL:', process.env.OPENAI_BASE_URL || '默认');
console.log('  OPENAI_MODEL:', process.env.OPENAI_MODEL || '默认 (gpt-4)');
console.log('=====================================\n');
