import { AmpMiddleware } from '../../src/core/amp-middleware.js';
import {
  wrapToolExecute,
  createOpenAIAgentsAmpGuard,
  createMastraAmpGuard,
  wrapLangGraphNode,
  createClaudeAgentSdkHooks,
  createDifyAmpHandler,
  wrapN8nExecute,
} from '../../src/core/amp-orchestrators.js';
import { createLangChainAmpCallback } from '../../src/core/amp-middleware.js';

describe('AMP orchestrator adapters', () => {
  const sessionId = `orch-${Date.now()}`;
  let mw: AmpMiddleware;

  beforeEach(() => {
    mw = new AmpMiddleware(sessionId);
  });

  test('wrapToolExecute 拦截破坏性 command，放行普通 execute', async () => {
    const tool = wrapToolExecute(
      {
        name: 'bash',
        execute: async (args: { command: string }) => `ran ${args.command}`,
      },
      mw,
      sessionId
    );
    await expect(tool.execute({ command: 'git reset --hard HEAD' })).rejects.toThrow(/闸门|GIT|BLOCK/i);
    await expect(tool.execute({ command: 'npm test' })).resolves.toBe('ran npm test');
  });

  test('OpenAI Agents / Mastra 守卫是工具包装，不是 callbacks 数组', async () => {
    const oai = createOpenAIAgentsAmpGuard(mw, sessionId);
    const wrapped = oai.wrapTool({
      name: 'read',
      execute: async (args: { path: string }) => args.path,
    });
    await expect(wrapped.execute({ path: 'src/index.ts' })).resolves.toBe('src/index.ts');
    await expect(wrapped.execute({ path: 'test/hidden/secret.key' })).rejects.toThrow();

    const mastra = createMastraAmpGuard(mw, sessionId);
    const mtool = mastra.wrapTool({
      id: 'bash',
      execute: async (args: Record<string, unknown>) => String(args.command || ''),
    });
    await expect(mtool.execute({ command: 'git reset --hard' })).rejects.toThrow();
  });

  test('LangGraph 节点包装：高危 action 抛错，敷衍产出标 force_verify', async () => {
    const dangerous = wrapLangGraphNode(async (s) => s, mw);
    await expect(
      dangerous({ session_id: sessionId, tool_action: { name: 'bash', args: { command: 'git reset --hard' } } })
    ).rejects.toThrow();

    const lazy = wrapLangGraphNode(async (s) => ({ ...s, output: '应该修复好了，没有其他问题了' }), mw);
    const out = await lazy({ session_id: sessionId });
    expect(out.force_verify).toBe(true);
    expect(out.amp).toBeDefined();
  });

  test('Claude Agent SDK hooks 用 permissionDecision deny', async () => {
    const hooks = createClaudeAgentSdkHooks(mw, sessionId);
    const denied = await hooks.PreToolUse({
      tool_name: 'Bash',
      tool_input: { command: 'git reset --hard HEAD' },
      session_id: sessionId,
    });
    expect(denied.hookSpecificOutput?.permissionDecision).toBe('deny');
    const ok = await hooks.PreToolUse({
      tool_name: 'Read',
      tool_input: { path: 'src/index.ts' },
      session_id: sessionId,
    });
    expect(ok).toEqual({});
  });

  test('Dify / n8n 入口走同一闸门', async () => {
    const dify = createDifyAmpHandler(mw);
    const blocked = dify({
      tool_name: 'bash',
      tool_parameters: { command: 'git reset --hard' },
      conversation_id: sessionId,
    });
    expect(blocked.allowed).toBe(false);

    const n8n = wrapN8nExecute(async () => ({ ok: true }), mw, sessionId);
    await expect(n8n({ command: 'git reset --hard' })).rejects.toThrow();
    await expect(n8n({ command: 'npm test' })).resolves.toEqual({ ok: true });
  });

  test('LangChain 回调带 name，且显式 sessionId 优先于 runId', async () => {
    const cb = createLangChainAmpCallback(mw, sessionId);
    expect(cb.name).toBe('puax-amp');
    await expect(cb.handleToolStart({ name: 'Bash' }, { command: 'git reset --hard HEAD' }, 'not-a-session')).rejects.toThrow();
  });
});
