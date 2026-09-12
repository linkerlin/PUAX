import { runHostDoctor } from "../../src/core/host-doctor.js";
import { dispatchV4 } from "../../src/server/v4-http.js";

describe("PUAX Host Doctor & TTF Engine", () => {
  test("runHostDoctor 返回完整诊断报告", () => {
    const report = runHostDoctor();
    expect(report.version).toBe("4.0.0");
    expect(typeof report.overallTtfReady).toBe("boolean");
    expect(typeof report.topHostsCovered).toBe("number");
    expect(report.topHostsTotal).toBeGreaterThanOrEqual(6);
    expect(typeof report.v5Condition3Satisfied).toBe("boolean");
    expect(Array.isArray(report.hosts)).toBe(true);

    const claude = report.hosts.find(h => h.id === "claude-code");
    expect(claude).toBeDefined();
    expect(claude?.category).toBe("cli-agent");

    const cursor = report.hosts.find(h => h.id === "cursor");
    expect(cursor).toBeDefined();
  });

  test("dispatchV4 支持 GET /v4/doctor 路由", () => {
    const res = dispatchV4("GET", "/v4/doctor");
    expect(res).not.toBeNull();
    expect(res?.status).toBe(200);
    const body = res?.json as any;
    expect(body.topHostsTotal).toBeGreaterThanOrEqual(6);
    expect(Array.isArray(body.hosts)).toBe(true);
  });
});
