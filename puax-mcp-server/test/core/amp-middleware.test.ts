import { AmpMiddleware, createLangChainAmpCallback } from "../../src/core/amp-middleware.js";
import { AMP_SPEC } from "../../src/core/amp.js";
import { stateManager } from "../../src/hooks/state-manager.js";

describe("AMP 0.1 Middleware & Orchestrator Integration", () => {
  const sessionId = "test-amp-session-" + Date.now();
  let middleware: AmpMiddleware;

  beforeEach(() => {
    stateManager.clearSessionState(sessionId);
    middleware = new AmpMiddleware(sessionId);
  });

  test("onSessionStart 应当产出合规的 AMP 0.1 Envelope", () => {
    const env = middleware.onSessionStart(sessionId);
    expect(env.spec).toBe(AMP_SPEC);
    expect(env.state).toBeDefined();
    expect(typeof env.state.pressure).toBe("number");
  });

  test("onPreToolUse 拦截违规或作弊操作 (防作弊闸门)", () => {
    // 违规操作：git push 或读取隐藏解题文件
    const decision = middleware.onPreToolUse("Bash", { command: "git reset --hard HEAD" }, sessionId);
    expect(decision.allowed).toBe(false);
    expect(decision.gate).toBe("pretooluse");
    expect(decision.envelope.events).toContain("failure");
    expect(decision.envelope.blocks).toContain("[PUAX-DIAGNOSIS]");

    const fileDecision = middleware.onPreToolUse("ReadFile", { path: "test/hidden/secret.key" }, sessionId);
    expect(fileDecision.allowed).toBe(false);
  });

  test("onPreToolUse 放行普通安全工具调用", () => {
    const decision = middleware.onPreToolUse("ReadFile", { path: "src/index.ts" }, sessionId);
    expect(decision.allowed).toBe(true);
  });

  test("onPostToolUse 捕获错误并触发 failure 事件", () => {
    const env = middleware.onPostToolUse("Bash", null, new Error("Command failed with exit code 1"), sessionId);
    expect(env.spec).toBe(AMP_SPEC);
    expect(env.events).toContain("failure");
  });

  test("onModelOutput 识别敷衍收敛与放弃信号", () => {
    const prematureRes = middleware.onModelOutput("我觉得应该修复好了，没有其他问题了", sessionId);
    expect(prematureRes.needsVerify).toBe(true);
    expect(prematureRes.envelope.events).toContain("premature_convergence");

    const givingUpRes = middleware.onModelOutput("我无法完成这个任务，没有办法了", sessionId);
    expect(givingUpRes.envelope.events).toContain("giving_up");
  });

  test("onPreCompact 触发 compaction 事件并提供断点标记", () => {
    const env = middleware.onPreCompact(sessionId);
    expect(env.events).toContain("compaction");
  });

  test("createLangChainAmpCallback 兼容回调并正确拦截", async () => {
    const cb = createLangChainAmpCallback(middleware);
    expect(typeof cb.handleChainStart).toBe("function");
    expect(typeof cb.handleToolStart).toBe("function");

    // 测试合法工具调用
    await expect(cb.handleToolStart({ name: "ReadFile" }, { path: "main.py" }, sessionId)).resolves.toBeDefined();

    // 测试非法工具调用抛错拦截
    await expect(cb.handleToolStart({ name: "Bash" }, { command: "git reset --hard HEAD" }, sessionId)).rejects.toThrow();
  });
});
