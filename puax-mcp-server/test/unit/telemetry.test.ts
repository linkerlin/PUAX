import { mkdtempSync, rmSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  withSpan,
  enableTelemetryForTesting,
  disableTelemetryForTesting,
  getTelemetrySummary,
} from '../../src/core/telemetry.js';

describe('telemetry', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'puax-otel-'));
    enableTelemetryForTesting(tempDir);
  });

  afterEach(() => {
    disableTelemetryForTesting();
    try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  it('withSpan 应写入 telemetry.jsonl', () => {
    withSpan('puax.test.span', { foo: 'bar' }, () => 42);
    const file = join(tempDir, 'telemetry.jsonl');
    expect(existsSync(file)).toBe(true);
    const line = readFileSync(file, 'utf-8').trim().split('\n')[0];
    const span = JSON.parse(line);
    expect(span.name).toBe('puax.test.span');
    expect(span.status.code).toBe('OK');
  });

  it('禁用时 withSpan 零开销', () => {
    disableTelemetryForTesting();
    const result = withSpan('puax.test', {}, () => 'ok');
    expect(result).toBe('ok');
    expect(getTelemetrySummary().enabled).toBe(false);
  });
});
