/**
 * 路径遍历防护
 */

import { resolve, normalize, sep } from 'path';
import { homedir, tmpdir } from 'os';

export class PathTraversalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PathTraversalError';
  }
}

/**
 * 验证用户提供的输出路径安全（禁止 .. 逃逸、空字节）
 */
export function assertSafeOutputPath(outputPath: string, baseDir?: string): string {
  if (!outputPath || typeof outputPath !== 'string') {
    throw new PathTraversalError('outputPath 不能为空');
  }

  if (outputPath.includes('\0')) {
    throw new PathTraversalError('outputPath 包含非法空字节');
  }

  const normalized = normalize(outputPath);

  if (normalized.includes('..')) {
    throw new PathTraversalError('outputPath 不允许包含 .. 路径遍历');
  }

  const absolute = resolve(baseDir ?? process.cwd(), normalized);

  if (baseDir) {
    const base = resolve(baseDir);
    if (!isPathInside(absolute, base)) {
      throw new PathTraversalError('outputPath 超出允许的基础目录');
    }
  }

  return absolute;
}

/** 目录边界：`/tmp/out` 不得放行 `/tmp/out-evil` */
export function isPathInside(abs: string, base: string): boolean {
  const a = resolve(abs);
  const b = resolve(base);
  return a === b || a.startsWith(b.endsWith(sep) ? b : b + sep);
}

/**
 * doctor/fix 写宿主配置：只允许 cwd、系统临时目录、~/.puax。
 */
export function assertDoctorTargetDir(targetDir: string): string {
  const absolute = assertSafeOutputPath(targetDir);
  const allowed = [resolve(process.cwd()), resolve(tmpdir()), resolve(homedir(), '.puax')];
  if (!allowed.some((base) => isPathInside(absolute, base))) {
    throw new PathTraversalError('targetDir 超出允许范围（cwd / tmp / ~/.puax）');
  }
  return absolute;
}

/**
 * 验证 roleId / skillId 不含路径字符
 */
export function assertSafeIdentifier(id: string, label = 'id'): void {
  if (!id || typeof id !== 'string') {
    throw new PathTraversalError(`${label} 不能为空`);
  }
  if (/[./\\]/.test(id) || id.includes('\0')) {
    throw new PathTraversalError(`${label} 包含非法路径字符: ${id}`);
  }
}
