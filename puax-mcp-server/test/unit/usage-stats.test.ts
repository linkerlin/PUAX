import { mkdtempSync, rmSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { UsageStatsCollector } from '../../src/core/usage-stats.js';

describe('UsageStatsCollector', () => {
  let tempDir: string;
  let collector: UsageStatsCollector;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'puax-stats-'));
    collector = new UsageStatsCollector();
    collector.resetForTesting(tempDir);
    process.env.PUAX_USAGE_STATS = '1';
  });

  afterEach(() => {
    delete process.env.PUAX_USAGE_STATS;
    try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  it('应记录工具调用并持久化', () => {
    collector.recordToolCall('recommend_role');
    collector.recordToolCall('recommend_role');

    const summary = collector.getSummary();
    expect(summary.totals.tool_calls).toBe(2);
    expect(summary.top_tools[0]).toEqual({ name: 'recommend_role', count: 2 });

    const raw = JSON.parse(readFileSync(join(tempDir, 'usage-stats.json'), 'utf-8'));
    expect(raw.anonymous_id).toBeDefined();
  });

  it('opt_out 后停止记录', () => {
    collector.setOptOut(true);
    collector.recordToolCall('detect_trigger');
    expect(collector.getSummary().totals.tool_calls).toBe(0);
  });

  it('不含对话内容字段', () => {
    collector.recordTriggerDetection('user_frustration');
    const file = readFileSync(join(tempDir, 'usage-stats.json'), 'utf-8');
    expect(file).not.toContain('conversation');
    expect(file).not.toContain('content');
  });
});
