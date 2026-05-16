/**
 * Unit tests for Flavor Router
 */

import { FlavorRouter, TaskSignature } from '../../../../src/core/flavors/flavor-router.js';
import { FlavorRegistry, globalFlavorRegistry } from '../../../../src/core/flavors/enterprise-flavors.js';

describe('FlavorRouter', () => {
  let router: FlavorRouter;
  let registry: FlavorRegistry;

  beforeEach(() => {
    registry = new FlavorRegistry();
    router = new FlavorRouter(registry);
  });

  describe('route', () => {
    it('should route debug tasks to huawei by default', () => {
      const task: TaskSignature = {
        type: 'debug',
        complexity: 'medium',
        constraints: []
      };

      const flavor = router.route(task);
      expect(flavor.id).toBe('huawei');
    });

    it('should route build tasks to musk by default', () => {
      const task: TaskSignature = {
        type: 'build',
        complexity: 'medium',
        constraints: []
      };

      const flavor = router.route(task);
      expect(flavor.id).toBe('musk');
    });

    it('should route research tasks to baidu by default', () => {
      const task: TaskSignature = {
        type: 'research',
        complexity: 'medium',
        constraints: []
      };

      const flavor = router.route(task);
      expect(flavor.id).toBe('baidu');
    });

    it('should route architecture tasks to amazon by default', () => {
      const task: TaskSignature = {
        type: 'architecture',
        complexity: 'medium',
        constraints: []
      };

      const flavor = router.route(task);
      expect(flavor.id).toBe('amazon');
    });

    it('should route performance tasks to bytedance by default', () => {
      const task: TaskSignature = {
        type: 'performance',
        complexity: 'medium',
        constraints: []
      };

      const flavor = router.route(task);
      expect(flavor.id).toBe('bytedance');
    });

    it('should route critical urgency to huawei regardless of task type', () => {
      const task: TaskSignature = {
        type: 'build',
        complexity: 'high',
        constraints: [],
        urgency: 'critical'
      };

      const flavor = router.route(task);
      expect(flavor.id).toBe('huawei');
    });
  });

  describe('getFlavorsForTaskType', () => {
    it('should return multiple flavors for debug', () => {
      const flavors = router.getFlavorsForTaskType('debug');
      expect(flavors.length).toBeGreaterThan(1);
      expect(flavors.some(f => f.id === 'huawei')).toBe(true);
    });

    it('should return multiple flavors for architecture', () => {
      const flavors = router.getFlavorsForTaskType('architecture');
      expect(flavors.length).toBeGreaterThan(1);
      expect(flavors.some(f => f.id === 'amazon')).toBe(true);
    });
  });

  describe('getMethodology', () => {
    it('should return methodology for task', () => {
      const task: TaskSignature = {
        type: 'debug',
        complexity: 'medium',
        constraints: []
      };

      const methodology = router.getMethodology(task);
      expect(methodology).toBeDefined();
      expect(methodology.name).toBeDefined();
      expect(methodology.steps).toBeDefined();
      expect(methodology.steps.length).toBeGreaterThan(0);
    });
  });

  describe('getRhetoric', () => {
    it('should return rhetoric for task', () => {
      const task: TaskSignature = {
        type: 'debug',
        complexity: 'medium',
        constraints: []
      };

      const rhetoric = router.getRhetoric(task);
      expect(rhetoric).toBeDefined();
      expect(rhetoric.encouragement).toBeDefined();
      expect(rhetoric.pressure).toBeDefined();
    });
  });

  describe('calculatePressure', () => {
    it('should calculate pressure for alibaba flavor', () => {
      const pressure = router.calculatePressure('alibaba', 2, 'medium');
      expect(pressure).toBeGreaterThan(0);
      expect(pressure).toBeLessThanOrEqual(1);
    });

    it('should calculate higher pressure for more failures', () => {
      const pressure1 = router.calculatePressure('alibaba', 1, 'medium');
      const pressure2 = router.calculatePressure('alibaba', 3, 'medium');
      expect(pressure2).toBeGreaterThan(pressure1);
    });

    it('should calculate higher pressure for higher complexity', () => {
      const pressureLow = router.calculatePressure('alibaba', 2, 'low');
      const pressureHigh = router.calculatePressure('alibaba', 2, 'high');
      expect(pressureHigh).toBeGreaterThan(pressureLow);
    });

    it('should cap pressure at flavor max', () => {
      const pressure = router.calculatePressure('alibaba', 100, 'high');
      const flavor = registry.get('alibaba');
      expect(pressure).toBeLessThanOrEqual(flavor!.pressure.max);
    });

    it('should return 0 for invalid flavor', () => {
      const pressure = router.calculatePressure('invalid' as any, 2, 'medium');
      expect(pressure).toBe(1);
    });
  });
});