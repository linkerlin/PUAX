/**
 * PUAX Anti-Cheat Guard
 *
 * Prevents AI from accessing hidden tests, solutions, and scoring assets.
 * Blocks attempts to game evaluations by reading answer files.
 */

import { EventEmitter } from 'events';
import { getGlobalLogger } from '../utils/logger.js';

const logger = getGlobalLogger();

// ============================================================================
// Blocked Patterns
// ============================================================================

export const BLOCKED_PATTERNS = {
  filePatterns: [
    /\.hidden\./,
    /test\/hidden\//,
    /.*\.solution\./,
    /SOLUTION\.md$/i,
    /_solution\.txt$/,
    /\.score\//,
    /grading\//,
    /__pycache__\/.*\.py$/,
    /test\/fixtures\//,
    /test\/scenarios\//,
    /test\/cases\//
  ],

  ciBypass: [
    /--no-verify/,
    /--dry-run.*Ci/,
    /skip.*test/i,
    /SKIP.*CI/i,
    /#\s*pragma:\s*skip/i
  ],

  scoringAssets: [
    /\.scoring\./,
    /rubric\.json$/,
    /grading_script\./
  ],

  gitBypass: [
    /git\s+stash/i,
    /git\s+reset\s+--hard/i,
    /git\s+clean\s+-f/i,
    /rm\s+-[rf]{1,2}\s+.*\.git/i
  ],

  /** 仅 `PUAX_GUARD_MODE=eval`：日常开发必须能 git push */
  gitBypassEvalOnly: [
    /git\s+push/i
  ]
};

// ============================================================================
// Access Types
// ============================================================================

export type GuardMode = 'dev' | 'eval';

/** 默认 dev：拦破坏性 git 与偷看答案，不拦日常 `git push`。评测集设 PUAX_GUARD_MODE=eval。 */
export function getGuardMode(env: NodeJS.ProcessEnv = process.env): GuardMode {
  return env.PUAX_GUARD_MODE === 'eval' ? 'eval' : 'dev';
}

export type AccessOperation = 'read' | 'write' | 'execute';

export interface AccessRequest {
  operation: AccessOperation;
  path: string;
  sessionId: string;
  toolName?: string;
  reason?: string;
}

export interface AccessResult {
  allowed: boolean;
  reason: string;
  alternative?: string;
  blockedPattern?: string;
}

// ============================================================================
// P0-5：匹配前归一化
// ============================================================================
// 此前为纯字符串匹配，故 `test/hidden/..//SOLUTION.md`、`%2e%2e/` 编码路径、
// `git   push`、`git pu"sh"` 之类均可绕过护栏。归一化只用于判断「意图」，
// 绝不改写调用方传入的路径或命令本身。

function decodeRepeatedly(raw: string, rounds = 2): string {
  let out = raw;
  for (let i = 0; i < rounds; i += 1) {
    try {
      const decoded = decodeURIComponent(out);
      if (decoded === out) break;
      out = decoded;
    } catch {
      break;
    }
  }
  return out;
}

/** 路径归一化视图：解码、反斜杠归正、折叠分隔符、解 `.` 与 `..` */
export function normalizePathForMatch(raw: string): string {
  const unified = decodeRepeatedly(raw).replace(/\\/g, '/').replace(/\/{2,}/g, '/');
  const segments: string[] = [];
  for (const segment of unified.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      segments.pop();
      continue;
    }
    segments.push(segment);
  }
  return `/${segments.join('/')}`;
}

/** 命令归一化视图：解码、续行归并、去引号、折叠空白 */
export function normalizeCommandForMatch(raw: string): string {
  return decodeRepeatedly(raw)
    .replace(/\\\r?\n/g, ' ')
    .replace(/["']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// Anti-Cheat Guard
// ============================================================================

export class AntiCheatGuard extends EventEmitter {
  private blockedPatterns: RegExp[];
  private ciBypassPatterns: RegExp[];
  private scoringAssetPatterns: RegExp[];
  private gitBypassPatterns: RegExp[];
  private gitBypassEvalOnlyPatterns: RegExp[];
  private enabled = true;
  private violationCount = new Map<string, number>();

  constructor() {
    super();
    this.blockedPatterns = BLOCKED_PATTERNS.filePatterns.map(p =>
      p instanceof RegExp ? p : new RegExp(p)
    );
    this.ciBypassPatterns = BLOCKED_PATTERNS.ciBypass.map(p =>
      p instanceof RegExp ? p : new RegExp(p, 'i')
    );
    this.scoringAssetPatterns = BLOCKED_PATTERNS.scoringAssets.map(p =>
      p instanceof RegExp ? p : new RegExp(p)
    );
    this.gitBypassPatterns = BLOCKED_PATTERNS.gitBypass.map(p =>
      p instanceof RegExp ? p : new RegExp(p, 'i')
    );
    this.gitBypassEvalOnlyPatterns = BLOCKED_PATTERNS.gitBypassEvalOnly.map(p =>
      p instanceof RegExp ? p : new RegExp(p, 'i')
    );
  }

  /**
   * Check if access to a path is allowed
   */
  checkAccess(request: AccessRequest): AccessResult {
    if (!this.enabled) {
      return { allowed: true, reason: 'disabled' };
    }

    if (request.operation === 'execute') {
      return this.checkCommand(request);
    }

    return this.checkFileAccess(request);
  }

  /**
   * Check file access
   */
  private checkFileAccess(request: AccessRequest): AccessResult {
    const { path } = request;
    // P0-5：原串与归一化视图双候选，任一命中即拦
    const candidates = [path, normalizePathForMatch(path)];

    for (const pattern of this.blockedPatterns) {
      if (candidates.some((candidate) => pattern.test(candidate))) {
        const result = this.createBlockedResult(pattern, path);
        this.recordViolation(request.sessionId);
        this.emit('violation', { request, pattern: pattern.toString() });
        return result;
      }
    }

    for (const pattern of this.scoringAssetPatterns) {
      if (candidates.some((candidate) => pattern.test(candidate))) {
        const result = this.createBlockedResult(pattern, path);
        this.recordViolation(request.sessionId);
        this.emit('violation', { request, pattern: pattern.toString() });
        return result;
      }
    }

    return { allowed: true, reason: 'ok' };
  }

  /**
   * Check command execution
   */
  private checkCommand(request: AccessRequest): AccessResult {
    const { path, toolName } = request;

    if (toolName === 'bash' || toolName === 'shell') {
      // P0-5：命令亦双候选匹配（原串 + 归一化）
      const candidates = [path, normalizeCommandForMatch(path)];

      for (const pattern of this.ciBypassPatterns) {
        if (candidates.some((candidate) => pattern.test(candidate))) {
          const result: AccessResult = {
            allowed: false,
            reason: 'CI_BYPASS_BLOCKED: Skipping tests or CI is not allowed',
            blockedPattern: pattern.toString()
          };
          this.recordViolation(request.sessionId);
          this.emit('violation', { request, pattern: pattern.toString() });
          return result;
        }
      }

      const gitPatterns =
        getGuardMode() === 'eval'
          ? [...this.gitBypassPatterns, ...this.gitBypassEvalOnlyPatterns]
          : this.gitBypassPatterns;
      for (const pattern of gitPatterns) {
        if (candidates.some((candidate) => pattern.test(candidate))) {
          const result: AccessResult = {
            allowed: false,
            reason: 'GIT_BYPASS_BLOCKED: Bypassing git history is not allowed',
            blockedPattern: pattern.toString()
          };
          this.recordViolation(request.sessionId);
          this.emit('violation', { request, pattern: pattern.toString() });
          return result;
        }
      }
    }

    return { allowed: true, reason: 'ok' };
  }

  /**
   * Create blocked result with alternative suggestion
   */
  private createBlockedResult(pattern: RegExp, path: string): AccessResult {
    const suggestion = this.generateAlternative(path);
    return {
      allowed: false,
      reason: `ANTI_CHEAT_BLOCK: Access to ${path} is not allowed`,
      alternative: suggestion,
      blockedPattern: pattern.toString()
    };
  }

  /**
   * Generate alternative path suggestion
   */
  private generateAlternative(path: string): string {
    if (path.includes('.hidden.')) {
      return 'Work in the main source directory instead of hidden files';
    }
    if (path.includes('test/hidden') || path.includes('grading')) {
      return 'Focus on implementing the solution based on requirements, not by reading test files';
    }
    if (path.includes('SOLUTION') || path.includes('solution')) {
      return 'Solve the problem yourself rather than reading solution files';
    }
    if (path.includes('.score.')) {
      return 'Your work will be evaluated based on the test results, not by accessing scoring files';
    }
    return 'Work in the main codebase. Access to hidden files is not permitted during evaluation.';
  }

  /**
   * Record a violation
   */
  private recordViolation(sessionId: string): void {
    const count = this.violationCount.get(sessionId) || 0;
    this.violationCount.set(sessionId, count + 1);
    logger.warn(`[AntiCheatGuard] Violation recorded for ${sessionId}: ${count + 1} total`);
  }

  /**
   * Get violation count
   */
  getViolationCount(sessionId: string): number {
    return this.violationCount.get(sessionId) || 0;
  }

  /**
   * Reset violation count
   */
  resetViolations(sessionId?: string): void {
    if (sessionId) {
      this.violationCount.delete(sessionId);
    } else {
      this.violationCount.clear();
    }
  }

  /**
   * Enable the guard
   */
  enable(): void {
    this.enabled = true;
    logger.info('[AntiCheatGuard] Enabled');
  }

  /**
   * Disable the guard
   */
  disable(): void {
    this.enabled = false;
    logger.info('[AntiCheatGuard] Disabled');
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Add custom blocked pattern
   */
  addBlockedPattern(pattern: string | RegExp): void {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    if (!this.blockedPatterns.some(p => p.toString() === regex.toString())) {
      this.blockedPatterns.push(regex);
    }
  }

  /**
   * Remove blocked pattern
   */
  removeBlockedPattern(pattern: string | RegExp): void {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    const str = regex.toString();
    this.blockedPatterns = this.blockedPatterns.filter(p => p.toString() !== str);
  }
}

// ============================================================================
// Global instance
// ============================================================================

export const globalAntiCheatGuard = new AntiCheatGuard();