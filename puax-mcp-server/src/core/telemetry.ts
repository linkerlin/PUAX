/**
 * 轻量 OpenTelemetry 兼容追踪
 * - 默认写入 ~/.puax/telemetry.jsonl
 * - 设置 PUAX_OTEL_ENDPOINT 时批量 POST OTLP/JSON
 */

import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { randomBytes } from 'crypto';

export interface SpanRecord {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  attributes: Record<string, string | number | boolean>;
  status: { code: 'OK' | 'ERROR'; message?: string };
}

function generateId(bytes: number): string {
  return randomBytes(bytes).toString('hex');
}

function nowNano(): string {
  return String(process.hrtime.bigint());
}

function telemetryDir(): string {
  return process.env.PUAX_TELEMETRY_DIR ?? join(homedir(), '.puax');
}

function telemetryFile(): string {
  return join(telemetryDir(), 'telemetry.jsonl');
}

export function isTelemetryEnabled(): boolean {
  if (process.env.PUAX_OTEL_ENABLED === '0') return false;
  return (
    process.env.PUAX_OTEL_ENABLED === '1' ||
    Boolean(process.env.PUAX_OTEL_ENDPOINT) ||
    process.env.PUAX_TELEMETRY_FILE === '1'
  );
}

function writeSpan(span: SpanRecord): void {
  if (!isTelemetryEnabled()) return;
  try {
    const dir = telemetryDir();
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    appendFileSync(telemetryFile(), JSON.stringify(span) + '\n', 'utf-8');
  } catch {
    /* non-fatal */
  }
}

async function exportOtlp(spans: SpanRecord[]): Promise<void> {
  const endpoint = process.env.PUAX_OTEL_ENDPOINT;
  if (!endpoint || spans.length === 0) return;

  const body = {
    resourceSpans: [{
      resource: { attributes: [{ key: 'service.name', value: { stringValue: 'puax-mcp-server' } }] },
      scopeSpans: [{
        scope: { name: 'puax' },
        spans: spans.map(s => ({
          traceId: s.traceId,
          spanId: s.spanId,
          parentSpanId: s.parentSpanId,
          name: s.name,
          startTimeUnixNano: s.startTimeUnixNano,
          endTimeUnixNano: s.endTimeUnixNano,
          attributes: Object.entries(s.attributes).map(([key, value]) => ({
            key,
            value: typeof value === 'string'
              ? { stringValue: value }
              : { intValue: value },
          })),
          status: { code: s.status.code === 'OK' ? 1 : 2, message: s.status.message },
        })),
      }],
    }],
  };

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    /* collector unavailable — file log remains */
  }
}

const pendingExport: SpanRecord[] = [];
const FLUSH_THRESHOLD = 10;

function scheduleExport(span: SpanRecord): void {
  pendingExport.push(span);
  if (pendingExport.length >= FLUSH_THRESHOLD) {
    void flushTelemetry();
  }
}

export async function flushTelemetry(): Promise<number> {
  if (pendingExport.length === 0) return 0;
  const batch = pendingExport.splice(0, pendingExport.length);
  await exportOtlp(batch);
  return batch.length;
}

export function withSpan<T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  fn: () => T
): T {
  if (!isTelemetryEnabled()) return fn();

  const traceId = generateId(16);
  const spanId = generateId(8);
  const start = nowNano();
  let status: SpanRecord['status'] = { code: 'OK' };

  try {
    return fn();
  } catch (err) {
    status = {
      code: 'ERROR',
      message: err instanceof Error ? err.message : String(err),
    };
    throw err;
  } finally {
    const span: SpanRecord = {
      traceId,
      spanId,
      name,
      startTimeUnixNano: start,
      endTimeUnixNano: nowNano(),
      attributes,
      status,
    };
    writeSpan(span);
    scheduleExport(span);
  }
}

export async function withSpanAsync<T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  fn: () => Promise<T>
): Promise<T> {
  if (!isTelemetryEnabled()) return fn();

  const traceId = generateId(16);
  const spanId = generateId(8);
  const start = nowNano();
  let status: SpanRecord['status'] = { code: 'OK' };

  try {
    return await fn();
  } catch (err) {
    status = {
      code: 'ERROR',
      message: err instanceof Error ? err.message : String(err),
    };
    throw err;
  } finally {
    const span: SpanRecord = {
      traceId,
      spanId,
      name,
      startTimeUnixNano: start,
      endTimeUnixNano: nowNano(),
      attributes,
      status,
    };
    writeSpan(span);
    scheduleExport(span);
  }
}

export function getTelemetrySummary(): {
  enabled: boolean;
  file: string;
  endpoint: string | null;
  pending_export: number;
} {
  return {
    enabled: isTelemetryEnabled(),
    file: telemetryFile(),
    endpoint: process.env.PUAX_OTEL_ENDPOINT ?? null,
    pending_export: pendingExport.length,
  };
}

/** 测试专用：默认开启文件遥测 */
export function enableTelemetryForTesting(dir: string): void {
  process.env.PUAX_TELEMETRY_DIR = dir;
  process.env.PUAX_OTEL_ENABLED = '1';
}

export function disableTelemetryForTesting(): void {
  delete process.env.PUAX_TELEMETRY_DIR;
  delete process.env.PUAX_OTEL_ENABLED;
}
