import { TriggerDetector } from '../../src/core/trigger-detector.js';

describe('TriggerDetector hybrid matching', () => {
  let detector: TriggerDetector;

  beforeEach(() => {
    detector = new TriggerDetector({ sensitivity: 'medium', language: 'auto' });
  });

  it('语义路径应检测 paraphrase 放弃语句', () => {
    const result = detector.detect([
      { role: 'assistant', content: '这问题超出了我的能力范围，没法继续了' },
    ]);
    const givingUp = result.triggers_detected.find(t => t.id === 'giving_up_language');
    expect(givingUp).toBeDefined();
    const hasSemantic = givingUp?.matched_patterns.some(p => p.startsWith('semantic:'));
    expect(hasSemantic || givingUp!.confidence >= 0.5).toBe(true);
  });

  it('正则路径仍正常工作', () => {
    const result = detector.detect([
      { role: 'user', content: '为什么还不行？' },
    ]);
    expect(result.triggers_detected.some(t => t.id === 'user_frustration')).toBe(true);
  });
});
