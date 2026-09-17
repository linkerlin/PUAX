import { runHostDoctor, fixHostDoctor } from "../../src/core/host-doctor.js";
import { dispatchV4 } from "../../src/server/v4-http.js";
import { readFileSync, mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("PUAX Host Doctor & TTF Engine", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "puax-doctor-test-"));
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup error
    }
  });

  test("runHostDoctor 返回完整诊断报告", () => {
    const report = runHostDoctor();
    // 版本号取自 package.json 单一事实源，杜绝每次发版手改此断言
    const pkgVersion = JSON.parse(
      readFileSync(join(__dirname, "../../package.json"), "utf-8")
    ).version as string;
    expect(report.version).toBe(pkgVersion);
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

  test("fixHostDoctor 能够执行指定宿主修复并返回更新报告（隔离在临时目录）", () => {
    const fixReport = fixHostDoctor(tempDir, "cursor");
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

  test("dispatchV4 POST /v4/doctor/fix 必须要求写授权（防未授权破坏）", () => {
    // 1. 无授权时必须返回 403 Forbidden
    const unauthRes = dispatchV4("POST", "/v4/doctor/fix", { host: "cursor", targetDir: tempDir });
    expect(unauthRes).not.toBeNull();
    expect(unauthRes?.status).toBe(403);
    const unauthBody = unauthRes?.json as any;
    expect(unauthBody.error).toContain("Forbidden");

    // 2. 显式声明 allow_write: true 时允许执行并在隔离目录写入
    const authRes = dispatchV4("POST", "/v4/doctor/fix", {
      allow_write: true,
      host: "cursor",
      targetDir: tempDir,
    });
    expect(authRes).not.toBeNull();
    expect(authRes?.status).toBe(200);
    const authBody = authRes?.json as any;
    expect(typeof authBody.totalFixed).toBe("number");
    expect(Array.isArray(authBody.results)).toBe(true);
  });
});
