/**
 * PUAX 本地存储路径（单一来源）
 *
 * 所有 ~/.puax 持久化路径统一经此解析，支持环境变量 PUAX_HOME 覆盖：
 *   - 生产：默认 ~/.puax
 *   - 测试：jest setup 设置 PUAX_HOME 到临时目录，杜绝污染真实用户数据
 *   - 自定义部署：设置 PUAX_HOME 重定向全部本地状态
 */

import { homedir } from 'os';
import { join } from 'path';

export function getPuaxHome(): string {
  return process.env.PUAX_HOME || join(homedir(), '.puax');
}

export function getPuaxPath(...parts: string[]): string {
  return join(getPuaxHome(), ...parts);
}
