/**
 * PUAX 服务容器
 * 集中管理所有核心服务的实例化和依赖注入
 * 
 * 用途：
 * - 生产环境：使用默认单例（自动延迟加载）
 * - 测试环境：注入 mock 依赖
 */

import { getCoreServices } from '../core/service-registry.js';
import type { TriggerDetector } from '../core/trigger-detector.js';
import type { RoleRecommender } from '../core/role-recommender.js';
import type { MethodologyEngine } from '../core/methodology-engine.js';
import type { MethodologyRouter } from '../core/methodology-router.js';
import { StateManager } from './state-manager.js';
import { PressureSystem } from './pressure-system.js';
import { HookManager } from './hook-manager.js';
import { FeedbackSystem } from './feedback-system.js';

export interface ServiceContainer {
  stateManager: StateManager;
  pressureSystem: PressureSystem;
  hookManager: HookManager;
  feedbackSystem: FeedbackSystem;
  triggerDetector: TriggerDetector;
  roleRecommender: RoleRecommender;
  methodologyEngine: MethodologyEngine;
  methodologyRouter: MethodologyRouter;
}

/** 创建完整的服务容器，所有依赖通过构造器注入 */
export function createServices(overrides?: Partial<ServiceContainer>): ServiceContainer {
  const stateManager = overrides?.stateManager ?? new StateManager();
  const pressureSystem = overrides?.pressureSystem ?? new PressureSystem({}, stateManager);
  const hookManager = overrides?.hookManager ?? new HookManager({}, { stateManager, pressureSystem });
  const feedbackSystem = overrides?.feedbackSystem ?? new FeedbackSystem(stateManager);
  const core = getCoreServices();
  const triggerDetector = overrides?.triggerDetector ?? core.triggerDetector;
  const roleRecommender = overrides?.roleRecommender ?? core.roleRecommender;
  const methodologyEngine = overrides?.methodologyEngine ?? core.methodologyEngine;
  const methodologyRouter = overrides?.methodologyRouter ?? core.methodologyRouter;

  return {
    stateManager,
    pressureSystem,
    hookManager,
    feedbackSystem,
    triggerDetector,
    roleRecommender,
    methodologyEngine,
    methodologyRouter
  };
}
