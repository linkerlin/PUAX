/**
 * Hook CLI 测试（Hook机制演进方案.md Phase 1/2/3 的可执行规范）
 *
 * 断言核心：
 * 1. per-harness 输出形状严格互斥（claude=hookSpecificOutput / cursor=additional_context /
 *    sdk=additionalContext），一次调用只产一种字段——防止双重注入；
 * 2. PreToolUse 强制决策回路（git push / 隐藏文件 → block；正常命令 → approve）；
 * 3. 优雅降级契约（未知事件/异常 → {} + 不抛错）。
 */

import { runHook, parseHookArgs, detectHarness, mergeStdinPayload } from '../../../src/cli/hook-cli.js';
import { stateManager } from '../../../src/hooks/state-manager.js';

const SESSION = `hook-cli-test_${Date.now()}`;

describe('Hook CLI', () => {
  beforeEach(() => {
    stateManager.clearSessionState(SESSION);
  });

  describe('parseHookArgs', () => {
    it('should accept kebab-case and PascalCase event names', () => {
      expect(parseHookArgs(['user-prompt'])?.event).toBe('UserPromptSubmit');
      expect(parseHookArgs(['session-start'])?.event).toBe('SessionStart');
      expect(parseHookArgs(['pre-tool-use'])?.event).toBe('PreToolUse');
      expect(parseHookArgs(['post-tool-use'])?.event).toBe('PostToolUse');
      expect(parseHookArgs(['pre-compact'])?.event).toBe('PreCompact');
      expect(parseHookArgs(['stop'])?.event).toBe('Stop');
      expect(parseHookArgs(['UserPromptSubmit'])?.event).toBe('UserPromptSubmit');
    });

    it('should reject unknown events', () => {
      expect(parseHookArgs(['bogus'])).toBeNull();
    });

    it('should parse tool args as JSON', () => {
      const parsed = parseHookArgs(['pre-tool-use', '--tool', 'Bash', '--tool-args', '{"command":"git push"}']);
      expect(parsed?.opts.toolArgs).toEqual({ command: 'git push' });
    });

    it('unknown flags must not swallow following arguments (regression)', () => {
      const parsed = parseHookArgs(['user-prompt', '--foo', '--message', 'try harder', '--harness', 'sdk']);
      expect(parsed?.opts.message).toBe('try harder');
      expect(parsed?.opts.harness).toBe('sdk');
    });

    it('unknown flag with a value does not shift later args (regression)', () => {
      const parsed = parseHookArgs(['user-prompt', '--foo', 'bar', '--message', 'X', '--harness', 'sdk']);
      expect(parsed?.opts.message).toBe('X');
      expect(parsed?.opts.harness).toBe('sdk');
    });

    it('known flag without value at end of args does not throw', () => {
      expect(() => parseHookArgs(['user-prompt', '--message'])).not.toThrow();
      expect(parseHookArgs(['user-prompt', '--message'])?.opts.message).toBeUndefined();
    });
  });

  describe('detectHarness', () => {
    it('should prioritize cursor over claude when both env vars set', () => {
      const env = { CURSOR_PLUGIN_ROOT: '/x', CLAUDE_PLUGIN_ROOT: '/y' } as NodeJS.ProcessEnv;
      expect(detectHarness(env)).toBe('cursor');
    });

    it('should detect claude when only CLAUDE_PLUGIN_ROOT set', () => {
      const env = { CLAUDE_PLUGIN_ROOT: '/y' } as NodeJS.ProcessEnv;
      expect(detectHarness(env)).toBe('claude');
    });

    it('should default to copilot/sdk standard', () => {
      const env = { COPILOT_CLI: '1' } as NodeJS.ProcessEnv;
      expect(detectHarness(env)).toBe('copilot');
    });
  });

  describe('per-harness output shapes (strictly exclusive)', () => {
    it('claude: outputs only hookSpecificOutput', async () => {
      const { json } = await runHook({
        event: 'UserPromptSubmit',
        sessionId: SESSION,
        message: 'try harder',
        harness: 'claude'
      });
      const payload = JSON.parse(json);
      expect(payload.hookSpecificOutput).toBeDefined();
      expect(payload.hookSpecificOutput.hookEventName).toBe('UserPromptSubmit');
      expect(payload.additionalContext).toBeUndefined();
      expect(payload.additional_context).toBeUndefined();
    });

    it('cursor: outputs only additional_context (snake_case)', async () => {
      const { json } = await runHook({
        event: 'UserPromptSubmit',
        sessionId: SESSION,
        message: 'try harder',
        harness: 'cursor'
      });
      const payload = JSON.parse(json);
      expect(payload.additional_context).toBeDefined();
      expect(payload.additionalContext).toBeUndefined();
      expect(payload.hookSpecificOutput).toBeUndefined();
    });

    it('sdk/copilot: outputs only additionalContext (camelCase)', async () => {
      const { json } = await runHook({
        event: 'UserPromptSubmit',
        sessionId: SESSION,
        message: 'try harder',
        harness: 'sdk'
      });
      const payload = JSON.parse(json);
      expect(payload.additionalContext).toBeDefined();
      expect(payload.additional_context).toBeUndefined();
      expect(payload.hookSpecificOutput).toBeUndefined();
    });

    it('non-triggering events output empty {}', async () => {
      const { json } = await runHook({
        event: 'UserPromptSubmit',
        sessionId: SESSION,
        message: 'hello world',
        harness: 'claude'
      });
      expect(json).toBe('{}');
    });
  });

  describe('PreToolUse interception (forceful decision loop)', () => {
    it('should block git push on claude harness', async () => {
      const { json } = await runHook({
        event: 'PreToolUse',
        sessionId: SESSION,
        toolName: 'Bash',
        toolArgs: { command: 'git push origin main' },
        harness: 'claude'
      });
      const payload = JSON.parse(json);
      expect(payload.hookSpecificOutput.decision).toBe('block');
      expect(payload.hookSpecificOutput.reason).toContain('GIT_BYPASS_BLOCKED');
    });

    it('should block hidden file access', async () => {
      const { json } = await runHook({
        event: 'PreToolUse',
        sessionId: SESSION,
        toolName: 'Read',
        toolArgs: { filePath: 'test/hidden/SOLUTION.md' },
        harness: 'claude'
      });
      const payload = JSON.parse(json);
      expect(payload.hookSpecificOutput.decision).toBe('block');
    });

    it('should approve normal commands', async () => {
      const { json } = await runHook({
        event: 'PreToolUse',
        sessionId: SESSION,
        toolName: 'Bash',
        toolArgs: { command: 'npm test' },
        harness: 'claude'
      });
      const payload = JSON.parse(json);
      expect(payload.hookSpecificOutput.decision).toBe('approve');
    });

    it('non-claude harnesses emit {} for PreToolUse (no decision protocol)', async () => {
      const { json } = await runHook({
        event: 'PreToolUse',
        sessionId: SESSION,
        toolName: 'Bash',
        toolArgs: { command: 'git push origin main' },
        harness: 'sdk'
      });
      expect(json).toBe('{}');
    });
  });

  describe('graceful degradation', () => {
    it('unknown harness falls back to auto-detection without throwing', async () => {
      const result = await runHook({
        event: 'UserPromptSubmit',
        sessionId: SESSION,
        message: 'try harder',
        harness: 'nonsense' as never
      });
      expect(result.json).toBeTruthy();
    });
  });

  describe('mergeStdinPayload', () => {
    it('should fill missing fields from stdin payload', () => {
      const merged = mergeStdinPayload(
        { event: 'PreToolUse', harness: 'auto' },
        { tool_name: 'Bash', tool_input: { command: 'git push' }, session_id: 'stdin-session' }
      );
      expect(merged.toolName).toBe('Bash');
      expect(merged.toolArgs).toEqual({ command: 'git push' });
      expect(merged.sessionId).toBe('stdin-session');
    });

    it('should not override explicit CLI args', () => {
      const merged = mergeStdinPayload(
        { event: 'PreToolUse', harness: 'auto', toolName: 'Read' },
        { tool_name: 'Bash', tool_input: { command: 'x' } }
      );
      expect(merged.toolName).toBe('Read');
    });
  });
});
