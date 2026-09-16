/**
 * 原子写：先写同目录临时文件，再 rename 整体替换。
 *
 * 背景：Hook 形态是「宿主每事件 spawn 一个 puax hook 进程」，与 HTTP 常驻进程
 * 并发读改写 ~/.puax/*.json。裸 writeFileSync 崩溃时会留下半截 JSON，随后被各
 * store 的 try/catch 当空数据静默吞掉（进化数据无声清零）。rename 在 POSIX 与
 * Windows（libuv MoveFileEx + REPLACE_EXISTING）上对已存在目标均为原子替换，
 * 读者永远不会观察到半截文件。
 */
import { writeFileSync, renameSync, unlinkSync } from 'fs';
import { randomUUID } from 'crypto';

/** Windows 上杀软/编辑器短暂占用目标文件时 rename 可能报这些码，稍候重试 */
const RETRIABLE_RENAME_CODES = new Set(['EPERM', 'EBUSY', 'EACCES']);

function briefSleep(ms: number): void {
  // Node 主线程允许 Atomics.wait（区别于浏览器），无依赖的精准短睡
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export function atomicWriteFileSync(filePath: string, data: string, encoding: BufferEncoding = 'utf-8'): void {
  const tmp = `${filePath}.tmp-${process.pid}-${randomUUID()}`;
  try {
    writeFileSync(tmp, data, encoding);
    for (let attempt = 0; ; attempt++) {
      try {
        renameSync(tmp, filePath);
        return;
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (attempt < 2 && code && RETRIABLE_RENAME_CODES.has(code)) {
          briefSleep(25);
          continue;
        }
        throw err;
      }
    }
  } finally {
    try {
      unlinkSync(tmp);
    } catch {
      // 成功 rename 后 tmp 已不存在；创建失败时也无须清理
    }
  }
}
