/**
 * Unit tests for Enterprise Flavors System
 */

import {
  ENTERPRISE_FLAVORS,
  FlavorRegistry,
  globalFlavorRegistry,
  FlavorKey,
  FlavorDefinition
} from '../../../../src/core/flavors/enterprise-flavors.js';

describe('Enterprise Flavors', () => {
  describe('All 14 flavors present', () => {
    const expectedFlavors = [
      'alibaba', 'bytedance', 'huawei', 'tencent', 'baidu',
      'meituan', 'pinduoduo', 'jd', 'xiaomi', 'netflix',
      'musk', 'jobs', 'amazon', 'microsoft'
    ];

    expectedFlavors.forEach(flavorId => {
      it(`should have ${flavorId} flavor`, () => {
        expect(ENTERPRISE_FLAVORS[flavorId]).toBeDefined();
        expect(ENTERPRISE_FLAVORS[flavorId].id).toBe(flavorId);
      });
    });
  });

  describe('Flavor structure validation', () => {
    Object.entries(ENTERPRISE_FLAVORS).forEach(([id, flavor]) => {
      it(`should have valid structure for ${id}`, () => {
        expect(flavor.id).toBe(id);
        expect(flavor.name).toBeDefined();
        expect(flavor.nameEn).toBeDefined();
        expect(flavor.description).toBeDefined();
        expect(flavor.pressure).toBeDefined();
        expect(flavor.pressure.base).toBeGreaterThanOrEqual(0);
        expect(flavor.pressure.max).toBeLessThanOrEqual(1);
        expect(flavor.rhetoric).toBeDefined();
        expect(flavor.rhetoric.encouragement.length).toBeGreaterThan(0);
        expect(flavor.rhetoric.pressure.length).toBeGreaterThan(0);
        expect(flavor.methodology).toBeDefined();
        expect(flavor.methodology.name).toBeDefined();
        expect(flavor.methodology.steps.length).toBeGreaterThan(0);
        expect(flavor.methodology.checklist.length).toBeGreaterThan(0);
        expect(flavor.taskAffinities.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Flavor pressure ranges', () => {
    it('should have base pressure between 0 and 1', () => {
      Object.values(ENTERPRISE_FLAVORS).forEach(flavor => {
        expect(flavor.pressure.base).toBeGreaterThanOrEqual(0);
        expect(flavor.pressure.base).toBeLessThanOrEqual(1);
      });
    });

    it('should have max pressure between 0 and 1', () => {
      Object.values(ENTERPRISE_FLAVORS).forEach(flavor => {
        expect(flavor.pressure.max).toBeGreaterThanOrEqual(0);
        expect(flavor.pressure.max).toBeLessThanOrEqual(1);
      });
    });

    it('should have escalation rate between 0 and 0.1', () => {
      Object.values(ENTERPRISE_FLAVORS).forEach(flavor => {
        expect(flavor.pressure.escalation).toBeGreaterThanOrEqual(0);
        expect(flavor.pressure.escalation).toBeLessThanOrEqual(0.1);
      });
    });
  });

  describe('Flavor methodology', () => {
    it('should have unique methodology names', () => {
      const names = new Set(Object.values(ENTERPRISE_FLAVORS).map(f => f.methodology.name));
      expect(names.size).toBe(Object.keys(ENTERPRISE_FLAVORS).length);
    });

    it('should have at least 3 steps in each methodology', () => {
      Object.values(ENTERPRISE_FLAVORS).forEach(flavor => {
        expect(flavor.methodology.steps.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should have at least 2 checklist items', () => {
      Object.values(ENTERPRISE_FLAVORS).forEach(flavor => {
        expect(flavor.methodology.checklist.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Flavor rhetoric', () => {
    it('should have encouragement phrases', () => {
      Object.values(ENTERPRISE_FLAVORS).forEach(flavor => {
        expect(flavor.rhetoric.encouragement.length).toBeGreaterThan(0);
      });
    });

    it('should have pressure phrases', () => {
      Object.values(ENTERPRISE_FLAVORS).forEach(flavor => {
        expect(flavor.rhetoric.pressure.length).toBeGreaterThan(0);
      });
    });

    it('should have extreme phrases', () => {
      Object.values(ENTERPRISE_FLAVORS).forEach(flavor => {
        expect(flavor.rhetoric.extreme.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Task affinities', () => {
    const validTaskTypes = ['debug', 'build', 'research', 'architecture', 'performance', 'security', 'planning', 'review'];

    it('should only have valid task types in affinities', () => {
      Object.values(ENTERPRISE_FLAVORS).forEach(flavor => {
        flavor.taskAffinities.forEach(task => {
          expect(validTaskTypes).toContain(task);
        });
      });
    });

    it('should have at least one task affinity', () => {
      Object.values(ENTERPRISE_FLAVORS).forEach(flavor => {
        expect(flavor.taskAffinities.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});

describe('FlavorRegistry', () => {
  let registry: FlavorRegistry;

  beforeEach(() => {
    registry = new FlavorRegistry();
  });

  describe('get', () => {
    it('should return flavor by id', () => {
      const flavor = registry.get('alibaba');
      expect(flavor).toBeDefined();
      expect(flavor?.id).toBe('alibaba');
    });

    it('should return undefined for invalid id', () => {
      const flavor = registry.get('invalid-flavor');
      expect(flavor).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all 14 flavors', () => {
      const flavors = registry.getAll();
      expect(Object.keys(flavors).length).toBe(14);
    });

    it('should return a copy (not mutate-able)', () => {
      const flavors1 = registry.getAll();
      const flavors2 = registry.getAll();
      expect(flavors1).not.toBe(flavors2);
    });
  });

  describe('getActive', () => {
    it('should return active flavor', () => {
      const flavor = registry.getActive();
      expect(flavor).toBeDefined();
    });

    it('should default to alibaba', () => {
      const flavor = registry.getActive();
      expect(flavor.id).toBe('alibaba');
    });
  });

  describe('setActive', () => {
    it('should set active flavor', () => {
      registry.setActive('huawei');
      const flavor = registry.getActive();
      expect(flavor.id).toBe('huawei');
    });

    it('should not change for invalid flavor id', () => {
      registry.setActive('invalid-flavor' as FlavorKey);
      expect(registry.getActive().id).toBe('alibaba');
    });
  });

  describe('getByTaskType', () => {
    it('should return flavors that have the task type in affinities', () => {
      const debugFlavors = registry.getByTaskType('debug');
      expect(debugFlavors.length).toBeGreaterThan(0);

      debugFlavors.forEach(flavor => {
        expect(flavor.taskAffinities).toContain('debug');
      });
    });

    it('should return flavors that have architecture in affinities', () => {
      const archFlavors = registry.getByTaskType('architecture');
      expect(archFlavors.length).toBeGreaterThan(0);

      archFlavors.forEach(flavor => {
        expect(flavor.taskAffinities).toContain('architecture');
      });
    });
  });

  describe('getFlavorsByPressure', () => {
    it('should return flavors below max pressure', () => {
      const lowPressureFlavors = registry.getFlavorsByPressure(0.7);
      lowPressureFlavors.forEach(flavor => {
        expect(flavor.pressure.max).toBeLessThanOrEqual(0.7);
      });
    });
  });
});

describe('Global Flavor Registry', () => {
  it('should be instance of FlavorRegistry', () => {
    expect(globalFlavorRegistry).toBeInstanceOf(FlavorRegistry);
  });

  it('should have 14 flavors', () => {
    expect(Object.keys(globalFlavorRegistry.getAll()).length).toBe(14);
  });
});