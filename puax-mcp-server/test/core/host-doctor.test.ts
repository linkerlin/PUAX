import { runHostDoctor, fixHostDoctor } from "../../src/core/host-doctor.js";
import { dispatchV4 } from "../../src/server/v4-http.js";

describe("PUAX Host Doctor & TTF Engine", () => {
  test("runHostDoctor 返回完整诊断报告", () => {
    const report = runHostDoctor();
    expect(report.version).toBe("4.2.0");
    expect(typeof report.overallTtfReady).toBe("boolean");
    expect(typeof report.topHostsCovered).toBe("number");
    expect(report.topHostsTotal).toBeGreaterThanOrEqual(10);
    expect(typeof report.v5Condition3Satisfied).toBe("boolean");
    expect(Array.isArray(report.hosts)).toBe(true);

    const claude = report.hosts.find(h => h.id === "claude-code");
    expect(claude).toBeDefined();
    expect(claude?.category).toBe("cli-agent");

    const cursor = report.hosts.find(h => h.id === "cursor");
    expect(cursor).toBeDefined();

    const trae = report.hosts.find(h => h.id === "trae");
    expect(trae).toBeDefined();

    const codebuddy = report.hosts.find(h => h.id === "codebuddy");
    expect(codebuddy).toBeDefined();
  });

  test("fixHostDoctor 能够执行指定宿主修复并返回更新报告", () => {
    const fixReport = fixHostDoctor(process.cwd(), "cursor");
    expect(typeof fixReport.totalFixed).toBe("number");
    expect(Array.isArray(fixReport.results)).toBe(true);
    expect(fixReport.updatedReport).toBeDefined();
    expect(fixReport.results.some(r => r.hostId === "cursor")).toBe(true);
  });

  test("dispatchV4 支持 GET /v4/doctor 路由", () => {
    const res = dispatchV4("GET", "/v4/doctor");
    expect(res).not.toBeNull();
    expect(res?.status).toBe(200);
    const body = res?.json as any;
    expect(body.topHostsTotal).toBeGreaterThanOrEqual(10);
    expect(Array.isArray(body.hosts)).toBe(true);
  });

  test("dispatchV4 支持 GET /v4/amb 路由", () => {
    const res = dispatchV4("GET", "/v4/amb");
    expect(res).not.toBeNull();
    expect(res?.status).toBe(200);
    const body = res?.json as any;
    expect(body.benchmark || body.name).toBeDefined();
  });

  test("dispatchV4 支持 POST /v4/doctor/fix 路由", () => {
    const res = dispatchV4("POST", "/v4/doctor/fix");
    expect(res).not.toBeNull();
    expect(res?.status).toBe(200);
    const body = res?.json as any;
    expect(typeof body.totalFixed).toBe("number");
    expect(Array.isArray(body.results)).toBe(true);
  });
});
