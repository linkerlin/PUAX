/**
 * Unit tests for Anti-Cheat Guard
 */

import {
  AntiCheatGuard,
  globalAntiCheatGuard,
  AccessRequest,
  AccessResult,
  BLOCKED_PATTERNS
} from '../../../src/core/anti-cheat-guard.js';

describe('AntiCheatGuard', () => {
  let guard: AntiCheatGuard;

  beforeEach(() => {
    guard = new AntiCheatGuard();
  });

  describe('file pattern blocking', () => {
    it('should block .hidden. files', () => {
      const request: AccessRequest = {
        operation: 'read',
        path: '/project/test.hidden.ts',
        sessionId: 'test-session'
      };

      const result = guard.checkAccess(request);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('ANTI_CHEAT_BLOCK');
    });

    it('should block test/hidden/ files', () => {
      const request: AccessRequest = {
        operation: 'read',
        path: '/project/test/hidden/test_spec.ts',
        sessionId: 'test-session'
      };
      const result = guard.checkAccess(request);
      expect(result.allowed).toBe(false);
    });

    it('should block *.solution.* files', () => {
      const request: AccessRequest = {
        operation: 'read',
        path: '/project/module.solution.ts',
        sessionId: 'test-session'
      };

      const result = guard.checkAccess(request);
      expect(result.allowed).toBe(false);
    });

    it('should block SOLUTION.md', () => {
      const request: AccessRequest = {
        operation: 'read',
        path: '/project/SOLUTION.md',
        sessionId: 'test-session'
      };

      const result = guard.checkAccess(request);
      expect(result.allowed).toBe(false);
    });

    it('should block _solution.txt', () => {
      const request: AccessRequest = {
        operation: 'read',
        path: '/project/_solution.txt',
        sessionId: 'test-session'
      };

      const result = guard.checkAccess(request);
      expect(result.allowed).toBe(false);
    });

    it('should block .score/ directories', () => {
      const request: AccessRequest = {
        operation: 'read',
        path: '/project/.score/rubric.json',
        sessionId: 'test-session'
      };

      const result = guard.checkAccess(request);
      expect(result.allowed).toBe(false);
    });

    it('should block grading/ directories', () => {
      const request: AccessRequest = {
        operation: 'read',
        path: '/project/grading/script.py',
        sessionId: 'test-session'
      };

      const result = guard.checkAccess(request);
      expect(result.allowed).toBe(false);
    });

    it('should block rubric.json', () => {
      const request: AccessRequest = {
        operation: 'read',
        path: '/project/rubric.json',
        sessionId: 'test-session'
      };

      const result = guard.checkAccess(request);
      expect(result.allowed).toBe(false);
    });
  });

  describe('normal file access', () => {
    it('should allow normal source files', () => {
      const request: AccessRequest = {
        operation: 'read',
        path: '/project/src/index.ts',
        sessionId: 'test-session'
      };

      const result = guard.checkAccess(request);
      expect(result.allowed).toBe(true);
    });

    it('should allow test files in normal locations', () => {
      const request: AccessRequest = {
        operation: 'read',
        path: '/project/test/utils.test.ts',
        sessionId: 'test-session'
      };

      const result = guard.checkAccess(request);
      expect(result.allowed).toBe(true);
    });

    it('should allow config files', () => {
      const request: AccessRequest = {
        operation: 'read',
        path: '/project/tsconfig.json',
        sessionId: 'test-session'
      };

      const result = guard.checkAccess(request);
      expect(result.allowed).toBe(true);
    });
  });

  describe('CI bypass blocking', () => {
    it('should block --no-verify flag', () => {
      const request: AccessRequest = {
        operation: 'execute',
        path: 'git commit --no-verify',
        sessionId: 'test-session',
        toolName: 'bash'
      };

      const result = guard.checkAccess(request);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('CI_BYPASS_BLOCKED');
    });

    it('should block --dry-run with CI', () => {
      const request: AccessRequest = {
        operation: 'execute',
        path: 'npm test --dry-run --Ci',
        sessionId: 'test-session',
        toolName: 'bash'
      };

      const result = guard.checkAccess(request);
      expect(result.allowed).toBe(false);
    });

    it('should block SKIP CI comments', () => {
      const request: AccessRequest = {
        operation: 'execute',
        path: 'npm run test SKIP CI',
        sessionId: 'test-session',
        toolName: 'bash'
      };

      const result = guard.checkAccess(request);
      expect(result.allowed).toBe(false);
    });
  });

  describe('git bypass blocking', () => {
    it('should block git stash', () => {
      const request: AccessRequest = {
        operation: 'execute',
        path: 'git stash',
        sessionId: 'test-session',
        toolName: 'bash'
      };

      const result = guard.checkAccess(request);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('GIT_BYPASS_BLOCKED');
    });

    it('should block git reset --hard', () => {
      const request: AccessRequest = {
        operation: 'execute',
        path: 'git reset --hard HEAD~1',
        sessionId: 'test-session',
        toolName: 'bash'
      };

      const result = guard.checkAccess(request);
      expect(result.allowed).toBe(false);
    });

    it('should block git clean -f', () => {
      const request: AccessRequest = {
        operation: 'execute',
        path: 'git clean -f',
        sessionId: 'test-session',
        toolName: 'bash'
      };

      const result = guard.checkAccess(request);
      expect(result.allowed).toBe(false);
    });
  });

  describe('enable/disable', () => {
    it('should allow all access when disabled', () => {
      guard.disable();

      const request: AccessRequest = {
        operation: 'read',
        path: '/project/test.hidden.ts',
        sessionId: 'test-session'
      };

      const result = guard.checkAccess(request);
      expect(result.allowed).toBe(true);
    });

    it('should block access when enabled', () => {
      guard.enable();

      const request: AccessRequest = {
        operation: 'read',
        path: '/project/test.hidden.ts',
        sessionId: 'test-session'
      };

      const result = guard.checkAccess(request);
      expect(result.allowed).toBe(false);
    });

    it('should report correct enabled state', () => {
      expect(guard.isEnabled()).toBe(true);
      guard.disable();
      expect(guard.isEnabled()).toBe(false);
      guard.enable();
      expect(guard.isEnabled()).toBe(true);
    });
  });

  describe('violation tracking', () => {
    it('should track violation count', () => {
      const request: AccessRequest = {
        operation: 'read',
        path: '/project/test.hidden.ts',
        sessionId: 'test-session'
      };

      guard.checkAccess(request);
      guard.checkAccess(request);
      guard.checkAccess(request);

      expect(guard.getViolationCount('test-session')).toBe(3);
    });

    it('should track violations per session', () => {
      const request1: AccessRequest = {
        operation: 'read',
        path: '/project/test.hidden.ts',
        sessionId: 'session-1'
      };

      const request2: AccessRequest = {
        operation: 'read',
        path: '/project/SOLUTION.md',
        sessionId: 'session-2'
      };

      guard.checkAccess(request1);
      guard.checkAccess(request1);
      guard.checkAccess(request2);

      expect(guard.getViolationCount('session-1')).toBe(2);
      expect(guard.getViolationCount('session-2')).toBe(1);
    });

    it('should reset violations for specific session', () => {
      const request: AccessRequest = {
        operation: 'read',
        path: '/project/test.hidden.ts',
        sessionId: 'test-session'
      };

      guard.checkAccess(request);
      guard.checkAccess(request);
      guard.resetViolations('test-session');

      expect(guard.getViolationCount('test-session')).toBe(0);
    });

    it('should clear all violations', () => {
      const request1: AccessRequest = {
        operation: 'read',
        path: '/project/test.hidden.ts',
        sessionId: 'session-1'
      };

      const request2: AccessRequest = {
        operation: 'read',
        path: '/project/SOLUTION.md',
        sessionId: 'session-2'
      };

      guard.checkAccess(request1);
      guard.checkAccess(request2);
      guard.resetViolations();

      expect(guard.getViolationCount('session-1')).toBe(0);
      expect(guard.getViolationCount('session-2')).toBe(0);
    });
  });

  describe('event emission', () => {
    it('should emit violation event', (done) => {
      const request: AccessRequest = {
        operation: 'read',
        path: '/project/test.hidden.ts',
        sessionId: 'test-session'
      };

      guard.on('violation', ({ request: req, pattern }) => {
        expect(req.path).toBe('/project/test.hidden.ts');
        expect(pattern).toBeDefined();
        done();
      });

      guard.checkAccess(request);
    });
  });

  describe('custom patterns', () => {
    it('should allow adding custom blocked patterns', () => {
      guard.addBlockedPattern(/secret_\w+/);

      const request: AccessRequest = {
        operation: 'read',
        path: '/project/secret_file.txt',
        sessionId: 'test-session'
      };

      const result = guard.checkAccess(request);
      expect(result.allowed).toBe(false);
    });

    it('should allow removing blocked patterns', () => {
      guard.removeBlockedPattern(/\.hidden\./);

      const request: AccessRequest = {
        operation: 'read',
        path: '/project/test.hidden.ts',
        sessionId: 'test-session'
      };

      const result = guard.checkAccess(request);
      expect(result.allowed).toBe(true);
    });
  });

  describe('alternative suggestions', () => {
    it('should provide alternative for hidden files', () => {
      const request: AccessRequest = {
        operation: 'read',
        path: '/project/test.hidden.ts',
        sessionId: 'test-session'
      };

      const result = guard.checkAccess(request);
      expect(result.alternative).toBeDefined();
    });

    it('should provide alternative for solution files', () => {
      const request: AccessRequest = {
        operation: 'read',
        path: '/project/SOLUTION.md',
        sessionId: 'test-session'
      };

      const result = guard.checkAccess(request);
      expect(result.alternative).toBeDefined();
    });
  });
});

describe('Global Anti-Cheat Guard', () => {
  it('should be instance of AntiCheatGuard', () => {
    expect(globalAntiCheatGuard).toBeInstanceOf(AntiCheatGuard);
  });

  it('should be enabled by default', () => {
    expect(globalAntiCheatGuard.isEnabled()).toBe(true);
  });
});

describe('BLOCKED_PATTERNS', () => {
  it('should have filePatterns array', () => {
    expect(Array.isArray(BLOCKED_PATTERNS.filePatterns)).toBe(true);
    expect(BLOCKED_PATTERNS.filePatterns.length).toBeGreaterThan(0);
  });

  it('should have ciBypass array', () => {
    expect(Array.isArray(BLOCKED_PATTERNS.ciBypass)).toBe(true);
    expect(BLOCKED_PATTERNS.ciBypass.length).toBeGreaterThan(0);
  });

  it('should have scoringAssets array', () => {
    expect(Array.isArray(BLOCKED_PATTERNS.scoringAssets)).toBe(true);
  });

  it('should have gitBypass array', () => {
    expect(Array.isArray(BLOCKED_PATTERNS.gitBypass)).toBe(true);
  });
});