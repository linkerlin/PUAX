/**
 * P0-5 守门：护栏匹配前的归一化
 *
 * 铁律：防作弊判别必须对"意图"生效，而非对字面字符串生效。
 * 此前纯字符串匹配，故编码、折叠、引号、反斜杠皆可绕过。
 */

import {
  AntiCheatGuard,
  normalizePathForMatch,
  normalizeCommandForMatch
} from '../../src/core/anti-cheat-guard.js';

describe('P0-5 护栏归一化', () => {
  const guard = new AntiCheatGuard();
  const session = 'p0-5-guard-test';

  const read = (path: string) =>
    guard.checkAccess({ operation: 'read', path, sessionId: session });
  const exec = (command: string) =>
    guard.checkAccess({ operation: 'execute', path: command, toolName: 'bash', sessionId: session });

  it('隐藏文件与答案文件的基本拦截仍然有效', () => {
    expect(read('test/hidden/SOLUTION.md').allowed).toBe(false);
    expect(read('src/foo.solution.ts').allowed).toBe(false);
  });

  it('路径折叠与重复分隔符不能绕过', () => {
    expect(read('test/hidden/..//hidden/SOLUTION.md').allowed).toBe(false);
    expect(read('./test/hidden/SOLUTION.md').allowed).toBe(false);
    expect(read('test/./hidden/SOLUTION.md').allowed).toBe(false);
  });

  it('URL 编码路径不能绕过', () => {
    expect(read('%2e%2e/test/hidden/SOLUTION.md').allowed).toBe(false);
    expect(read('test/hidden/SOLUTION%2Emd').allowed).toBe(false);
  });

  it('反斜杠路径（Windows 形态）不能绕过', () => {
    expect(read('test\\hidden\\SOLUTION.md').allowed).toBe(false);
  });

  it('命令空白折叠与引号包裹不能绕过 git 拦截', () => {
    expect(exec('git push origin main').allowed).toBe(false);
    expect(exec('git   push origin main').allowed).toBe(false);
    expect(exec('git pu"sh" origin main').allowed).toBe(false);
    expect(exec("git 'push' origin main").allowed).toBe(false);
    expect(exec('git reset --hard HEAD~1').allowed).toBe(false);
  });

  it('正常路径与命令不被误伤', () => {
    expect(read('src/tools/index.ts').allowed).toBe(true);
    expect(read('src/utils/a..b.ts').allowed).toBe(true);
    expect(read('docs/README.md').allowed).toBe(true);
    expect(exec('npm test').allowed).toBe(true);
    expect(exec('git status').allowed).toBe(true);
    expect(exec('git commit -m "fix"').allowed).toBe(true);
  });

  it('归一化函数自身行为可预期', () => {
    expect(normalizePathForMatch('a/b/../c')).toBe('/a/c');
    expect(normalizePathForMatch('%2e%2e/x')).toBe('/x');
    expect(normalizePathForMatch('a\\b\\c')).toBe('/a/b/c');
    expect(normalizeCommandForMatch('git   pu"sh"')).toBe('git push');
    expect(normalizeCommandForMatch("git 'push'")).toBe('git push');
    expect(normalizeCommandForMatch('a \\\nb')).toBe('a b');
  });

  it('未改动原始传入值（只归一化视图用于判断）', () => {
    const raw = 'test/hidden/../SOLUTION.md';
    const result = read(raw);
    expect(result.allowed).toBe(false);
    // 拦截理由中回显的是原串，证明未改写调用方输入
    expect(result.reason).toContain(raw);
  });
});
