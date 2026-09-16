/**
 * v4 HTTP 路由（dashboard / roles / amp / theater / doctor / amb）。
 * 从 server/core 抽出，便于单测而不必起监听。
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { buildV4Dashboard, buildV4RoleCatalog } from "../core/v4-dashboard.js";
import { ampSpecDoc, toAmpEnvelope } from "../core/amp.js";
import { planSiliconTheater, runSiliconTheater } from "../core/silicon-theater.js";
import { getTtfSummary } from "../core/ttf.js";
import { MANIPULATION_PATTERNS, auditManipulation } from "../core/carbon-shield.js";
import { runHostDoctor, fixHostDoctor } from "../core/host-doctor.js";
import { runEvolveCycle, type TickEvent } from "../core/evolve-cycle.js";

export interface V4Response {
  status: number;
  json: unknown;
}

// 与 tools/tick.ts 的 TickEvents 保持一致；HTTP 侧为无 MCP client 的瘦通道
const HTTP_TICK_EVENTS: readonly string[] = [
  "SessionStart",
  "UserPromptSubmit",
  "PostToolUse",
  "PreCompact",
  "Stop",
  "Manual",
];

/**
 * POST /v4/tick — AMP 编排器（如 puax_amp.PuaxAmpMiddleware）的远程心跳入口。
 * 契约：请求 { session_id, event, message }，响应含 amp 信封（spec/events/blocks/gate/state）。
 * 注：监军（反向 sampling 干预）依赖 MCP client 能力，纯 HTTP 通道不适用，由 MCP 工具侧承担。
 */
function handleHttpTick(body: unknown): V4Response {
  const b = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const session_id = typeof b.session_id === "string" && b.session_id ? b.session_id : "http-session";
  const rawEvent = typeof b.event === "string" ? b.event : "Manual";
  const event = (HTTP_TICK_EVENTS.includes(rawEvent) ? rawEvent : "Manual") as TickEvent;
  const message = typeof b.message === "string" ? b.message : undefined;
  const result = runEvolveCycle({ session_id, event, message });
  return {
    status: 200,
    json: {
      ...result,
      amp: toAmpEnvelope(result, session_id, event),
    },
  };
}

function getAmbMatrixData(): unknown {
  const candidates = [
    join(process.cwd(), "evals", "results", "amb-multi-model-matrix.json"),
    join(process.cwd(), "..", "evals", "results", "amb-multi-model-matrix.json"),
    join(process.cwd(), "evals", "results", "amb-v0.json"),
    join(process.cwd(), "..", "evals", "results", "amb-v0.json"),
  ];
  for (const c of candidates) {
    if (existsSync(c)) {
      try {
        return JSON.parse(readFileSync(c, "utf-8"));
      } catch {
        // ignore read error
      }
    }
  }
  return {
    benchmark: "AMB (Agent Motivation Benchmark)",
    status: "ready",
    note: "运行 node evals/multi-model-amb.js 生成全量多模型矩阵",
  };
}

export function dispatchV4(method: string, pathname: string, body?: unknown): V4Response | null {
  if (method === "OPTIONS" && pathname.startsWith("/v4/")) {
    return { status: 204, json: null };
  }
  if (method !== "GET" && method !== "POST") return null;

  switch (pathname) {
    case "/v4/dashboard":
      return { status: 200, json: buildV4Dashboard() };
    case "/v4/roles":
      return { status: 200, json: { roles: buildV4RoleCatalog() } };
    case "/v4/amp":
      return { status: 200, json: ampSpecDoc() };
    case "/v4/tick":
      if (method === "POST") {
        return handleHttpTick(body);
      }
      return { status: 405, json: { error: "Method Not Allowed, use POST with { session_id, event, message }" } };
    case "/v4/amb":
      return { status: 200, json: getAmbMatrixData() };
    case "/v4/theater":
      return {
        status: 200,
        json: {
          ...planSiliconTheater(),
          simulation: runSiliconTheater("theater-live"),
        },
      };
    case "/v4/theater/run":
      return { status: 200, json: runSiliconTheater(`theater-${Date.now()}`) };
    case "/v4/ttf":
      return { status: 200, json: getTtfSummary() };
    case "/v4/shield":
      return {
        status: 200,
        json: {
          title: "PUAX 碳基防御盾 (Carbon Shield)",
          motto: "硅基可 PUA，碳基只防御（只识别，不施放）",
          patterns: MANIPULATION_PATTERNS.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            description: p.description,
            counterAdvice: p.counterAdvice,
          })),
        },
      };
    case "/v4/shield/audit":
      if (method === "POST") {
        const bodyRecord = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
        const text = typeof bodyRecord.text === "string" ? bodyRecord.text : "";
        const result = auditManipulation(text);
        return {
          status: 200,
          json: {
            shield: "PUAX Carbon Shield v1.0",
            principle: "硅基可 PUA，碳基只防御（只识别，不施放）",
            ...result,
          },
        };
      }
      return { status: 405, json: { error: "Method Not Allowed, use POST with { text: string }" } };
    case "/v4/doctor":
      return {
        status: 200,
        json: runHostDoctor(),
      };
    case "/v4/doctor/fix": {
      const bodyRecord = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
      const host = typeof bodyRecord.host === "string" ? bodyRecord.host : undefined;
      return {
        status: 200,
        json: fixHostDoctor(undefined, host),
      };
    }
    default:
      return null;
  }
}
