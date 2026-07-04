/**
 * 轻量核心服务注册表
 * 生产环境复用单例（推荐缓存跨 MCP 调用生效）；测试可注入 mock。
 */

import { triggerDetector } from './trigger-detector.js';
import { roleRecommender } from './role-recommender.js';
import { methodologyEngine } from './methodology-engine.js';
import { methodologyRouter } from './methodology-router.js';
import { TriggerDetector } from './trigger-detector.js';
import { RoleRecommender } from './role-recommender.js';
import { MethodologyEngine } from './methodology-engine.js';
import { MethodologyRouter } from './methodology-router.js';
import type { DetectionOptions } from '../types.js';

export interface CoreServices {
  triggerDetector: TriggerDetector;
  roleRecommender: RoleRecommender;
  methodologyEngine: MethodologyEngine;
  methodologyRouter: MethodologyRouter;
}

const defaultCoreServices: CoreServices = {
  triggerDetector,
  roleRecommender,
  methodologyEngine,
  methodologyRouter,
};

let testingOverrides: Partial<CoreServices> | null = null;

const triggerDetectorByOptions = new Map<string, TriggerDetector>();

function optionsCacheKey(options: DetectionOptions): string {
  return JSON.stringify({
    sensitivity: options.sensitivity ?? 'medium',
    language: options.language ?? 'auto',
  });
}

/** 获取核心服务包（默认单例） */
export function getCoreServices(): CoreServices {
  if (!testingOverrides) return defaultCoreServices;
  return { ...defaultCoreServices, ...testingOverrides };
}

/** 按选项获取触发检测器；无选项时复用默认单例 */
export function getTriggerDetector(options?: DetectionOptions): TriggerDetector {
  if (!options || (options.sensitivity === undefined && options.language === undefined)) {
    return getCoreServices().triggerDetector;
  }
  const key = optionsCacheKey(options);
  let detector = triggerDetectorByOptions.get(key);
  if (!detector) {
    detector = new TriggerDetector(options);
    triggerDetectorByOptions.set(key, detector);
  }
  return detector;
}

export function getRoleRecommender(): RoleRecommender {
  return getCoreServices().roleRecommender;
}

export function getMethodologyEngine(): MethodologyEngine {
  return getCoreServices().methodologyEngine;
}

export function getMethodologyRouter(): MethodologyRouter {
  return getCoreServices().methodologyRouter;
}

/** 测试专用：注入或清除 mock 依赖 */
export function setCoreServicesForTesting(overrides: Partial<CoreServices> | null): void {
  testingOverrides = overrides;
}

/** 测试专用：清除按选项缓存的检测器 */
export function resetTriggerDetectorCache(): void {
  triggerDetectorByOptions.clear();
}
