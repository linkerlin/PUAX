/**
 * PUAX Flavor Router
 *
 * Automatically selects the best enterprise flavor based on task type.
 * Routes tasks to appropriate corporate methodology.
 */

import { getGlobalLogger } from '../../utils/logger.js';
import {
  FlavorDefinition,
  FlavorKey,
  FlavorRegistry,
  globalFlavorRegistry,
  TaskType
} from './enterprise-flavors.js';

const logger = getGlobalLogger();

// ============================================================================
// Task Signature
// ============================================================================

export interface TaskSignature {
  type: TaskType;
  complexity: 'low' | 'medium' | 'high';
  domain?: string;
  constraints: string[];
  urgency?: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================================================
// Methodology Map
// ============================================================================

const METHODOLOGY_MAP: Record<TaskType, FlavorKey[]> = {
  debug: ['huawei', 'alibaba', 'bytedance', 'baidu'],
  build: ['musk', 'jobs', 'amazon', 'pinduoduo'],
  research: ['baidu', 'microsoft', 'amazon', 'huawei'],
  architecture: ['amazon', 'musk', 'jobs', 'microsoft'],
  performance: ['bytedance', 'alibaba', 'pinduoduo', 'meituan'],
  security: ['huawei', 'alibaba', 'amazon', 'tencent'],
  planning: ['amazon', 'jobs', 'microsoft', 'xiaomi'],
  review: ['tencent', 'jobs', 'netflix', 'jd']
};

// ============================================================================
// Flavor Router
// ============================================================================

export class FlavorRouter {
  private registry: FlavorRegistry;

  constructor(registry?: FlavorRegistry) {
    this.registry = registry || globalFlavorRegistry;
  }

  /**
   * Route a task to the best matching flavor
   */
  route(task: TaskSignature): FlavorDefinition {
    const candidates = METHODOLOGY_MAP[task.type] || ['alibaba'];
    logger.debug(`[FlavorRouter] Task type: ${task.type}, candidates: ${candidates.join(', ')}`);

    if (task.complexity === 'high' && task.urgency === 'critical') {
      const criticalFlavor = this.registry.get('huawei');
      if (criticalFlavor) {
        logger.info(`[FlavorRouter] High urgency, using Huawei`);
        return criticalFlavor;
      }
    }

    const selectedFlavor = this.selectBestFlavor(candidates, task);
    logger.info(`[FlavorRouter] Selected: ${selectedFlavor.id}`);

    return selectedFlavor;
  }

  /**
   * Select the best flavor from candidates based on task characteristics
   */
  private selectBestFlavor(candidates: FlavorKey[], task: TaskSignature): FlavorDefinition {
    for (const candidateId of candidates) {
      const flavor = this.registry.get(candidateId);
      if (!flavor) continue;

      if (task.urgency === 'critical' && candidateId === 'huawei') {
        return flavor;
      }

      if (task.domain && flavor.metadomain?.includes(task.domain)) {
        return flavor;
      }

      if (task.complexity === 'low' && flavor.pressure.base < 0.7) {
        return flavor;
      }
    }

    return this.registry.get(candidates[0]) || this.registry.getActive();
  }

  /**
   * Get all flavors for a task type
   */
  getFlavorsForTaskType(taskType: TaskType): FlavorDefinition[] {
    const flavorIds = METHODOLOGY_MAP[taskType] || [];
    return flavorIds
      .map(id => this.registry.get(id))
      .filter((f): f is FlavorDefinition => f !== undefined);
  }

  /**
   * Get the full methodology for a task
   */
  getMethodology(task: TaskSignature): FlavorDefinition['methodology'] {
    const flavor = this.route(task);
    return flavor.methodology;
  }

  /**
   * Get the rhetoric for pressure escalation
   */
  getRhetoric(task: TaskSignature): FlavorDefinition['rhetoric'] {
    const flavor = this.route(task);
    return flavor.rhetoric;
  }

  /**
   * Calculate pressure level based on flavor and task
   */
  calculatePressure(
    flavorId: FlavorKey,
    baseFailureCount: number,
    complexity: 'low' | 'medium' | 'high'
  ): number {
    const flavor = this.registry.get(flavorId);
    if (!flavor) return 1;

    const complexityMultiplier = {
      low: 1.0,
      medium: 1.3,
      high: 1.6
    };

    const base = flavor.pressure.base;
    const escalation = flavor.pressure.escalation * baseFailureCount;
    const multiplier = complexityMultiplier[complexity];

    const pressure = (base + escalation) * multiplier;
    return Math.min(flavor.pressure.max, Math.max(0, pressure));
  }
}

export const globalFlavorRouter = new FlavorRouter();