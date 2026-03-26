/**
 * Methodology Engine Edge Cases and Error Handling Tests
 */

import { MethodologyEngine } from '../../src/core/methodology-engine.js';

describe('MethodologyEngine Edge Cases', () => {
  let engine: MethodologyEngine;

  beforeEach(() => {
    engine = new MethodologyEngine();
  });

  describe('Invalid Role IDs', () => {
    it('should handle empty string role ID', () => {
      const methodology = engine.getMethodology('');
      expect(methodology).toBeDefined();
      expect(methodology.steps).toHaveLength(5);
    });

    it('should handle null role ID', () => {
      const methodology = engine.getMethodology(null as any);
      expect(methodology).toBeDefined();
      expect(methodology.steps).toHaveLength(5);
    });

    it('should handle undefined role ID', () => {
      const methodology = engine.getMethodology(undefined as any);
      expect(methodology).toBeDefined();
      expect(methodology.steps).toHaveLength(5);
    });

    it('should handle non-existent role ID', () => {
      const methodology = engine.getMethodology('non-existent-role-12345');
      expect(methodology).toBeDefined();
      expect(methodology.steps).toHaveLength(5);
    });

    it('should handle special characters in role ID', () => {
      const methodology = engine.getMethodology('role@#$%^&*()');
      expect(methodology).toBeDefined();
    });

    it('should handle very long role ID', () => {
      const longId = 'a'.repeat(1000);
      const methodology = engine.getMethodology(longId);
      expect(methodology).toBeDefined();
    });
  });

  describe('Checklist Edge Cases', () => {
    it('should handle empty role ID for checklist', () => {
      const checklist = engine.getChecklist('');
      expect(checklist).toBeDefined();
      expect(Array.isArray(checklist)).toBe(true);
    });

    it('should handle non-existent role ID for checklist', () => {
      const checklist = engine.getChecklist('non-existent');
      expect(checklist).toBeDefined();
      expect(Array.isArray(checklist)).toBe(true);
    });

    it('should return consistent checklist for same role', () => {
      const checklist1 = engine.getChecklist('military-commander');
      const checklist2 = engine.getChecklist('military-commander');
      expect(checklist1).toEqual(checklist2);
    });
  });

  describe('Validate Checklist Edge Cases', () => {
    it('should handle empty completed items', () => {
      const result = engine.validateChecklist('military-commander', []);
      expect(result).toBeDefined();
      expect(result.completion_rate).toBe(0);
      expect(result.can_proceed).toBe(false);
    });

    it('should handle all items completed', () => {
      const checklist = engine.getChecklist('military-commander');
      const allIds = checklist.map(item => item.id);
      const result = engine.validateChecklist('military-commander', allIds);
      expect(result).toBeDefined();
      expect(result.completion_rate).toBe(100);
      expect(result.can_proceed).toBe(true);
    });

    it('should handle invalid item IDs', () => {
      const result = engine.validateChecklist('military-commander', [
        'invalid-item-1',
        'invalid-item-2'
      ]);
      expect(result).toBeDefined();
      expect(result.completion_rate).toBe(0);
    });

    it('should handle mix of valid and invalid item IDs', () => {
      const checklist = engine.getChecklist('military-commander');
      const validId = checklist[0]?.id;
      const result = engine.validateChecklist('military-commander', [
        validId,
        'invalid-item'
      ]);
      expect(result).toBeDefined();
    });

    it('should handle duplicate item IDs', () => {
      const checklist = engine.getChecklist('military-commander');
      const validId = checklist[0]?.id;
      const result = engine.validateChecklist('military-commander', [
        validId,
        validId,
        validId
      ]);
      expect(result).toBeDefined();
    });

    it('should handle exactly 80% completion', () => {
      const checklist = engine.getChecklist('military-commander');
      const requiredItems = checklist.filter(i => i.required);
      const eightyPercentCount = Math.ceil(requiredItems.length * 0.8);
      const ids = requiredItems.slice(0, eightyPercentCount).map(i => i.id);
      
      const result = engine.validateChecklist('military-commander', ids);
      expect(result.can_proceed).toBe(true);
    });

    it('should handle just below 80% completion', () => {
      const checklist = engine.getChecklist('military-commander');
      const requiredItems = checklist.filter(i => i.required);
      const belowEightyCount = Math.floor(requiredItems.length * 0.79);
      const ids = requiredItems.slice(0, belowEightyCount).map(i => i.id);
      
      const result = engine.validateChecklist('military-commander', ids);
      expect(result.can_proceed).toBe(false);
    });
  });

  describe('Apply Flavor Edge Cases', () => {
    it('should handle empty flavor', () => {
      const methodology = engine.getMethodology('military-commander');
      const flavored = engine.applyFlavor(methodology, '' as any);
      expect(flavored).toBeDefined();
    });

    it('should handle null flavor', () => {
      const methodology = engine.getMethodology('military-commander');
      const flavored = engine.applyFlavor(methodology, null as any);
      expect(flavored).toBeDefined();
    });

    it('should handle undefined flavor', () => {
      const methodology = engine.getMethodology('military-commander');
      const flavored = engine.applyFlavor(methodology, undefined as any);
      expect(flavored).toBeDefined();
    });

    it('should handle unknown flavor', () => {
      const methodology = engine.getMethodology('military-commander');
      const flavored = engine.applyFlavor(methodology, 'unknown-flavor' as any);
      expect(flavored).toBeDefined();
      expect(flavored.steps).toHaveLength(methodology.steps.length);
    });

    it('should handle all valid flavors', () => {
      const flavors = ['alibaba', 'huawei', 'bytedance', 'tencent', 'meituan', 'netflix', 'musk', 'jobs'];
      const methodology = engine.getMethodology('military-commander');
      
      for (const flavor of flavors) {
        const flavored = engine.applyFlavor(methodology, flavor as any);
        expect(flavored).toBeDefined();
        expect(flavored.steps).toHaveLength(methodology.steps.length);
      }
    });

    it('should not modify original methodology', () => {
      const methodology = engine.getMethodology('military-commander');
      const originalName = methodology.name;
      engine.applyFlavor(methodology, 'alibaba');
      expect(methodology.name).toBe(originalName);
    });
  });

  describe('Generate Execution Plan Edge Cases', () => {
    it('should handle empty task', () => {
      const plan = engine.generateExecutionPlan('military-commander', '');
      expect(plan).toBeDefined();
      expect(typeof plan).toBe('string');
    });

    it('should handle very long task', () => {
      const longTask = 'A'.repeat(10000);
      const plan = engine.generateExecutionPlan('military-commander', longTask);
      expect(plan).toBeDefined();
      expect(plan).toContain(longTask);
    });

    it('should handle task with special characters', () => {
      const specialTask = 'Task with @#$%^&*() special chars and 中文';
      const plan = engine.generateExecutionPlan('military-commander', specialTask);
      expect(plan).toBeDefined();
    });

    it('should handle non-existent role ID', () => {
      const plan = engine.generateExecutionPlan('non-existent', 'Some task');
      expect(plan).toBeDefined();
      expect(typeof plan).toBe('string');
    });
  });

  describe('Get Full Methodology Edge Cases', () => {
    it('should handle empty role ID', () => {
      const full = engine.getFullMethodology('');
      expect(full).toBeDefined();
      expect(full.methodology).toBeDefined();
      expect(full.checklist).toBeDefined();
    });

    it('should handle non-existent role ID', () => {
      const full = engine.getFullMethodology('non-existent');
      expect(full).toBeDefined();
      expect(full.role_id).toBe('non-existent');
      expect(full.methodology).toBeDefined();
      expect(full.checklist).toBeDefined();
    });
  });

  describe('Step Structure Validation', () => {
    it('should have valid step structure for all military roles', () => {
      const militaryRoles = ['military-commander', 'military-warrior', 'military-commissar'];
      for (const roleId of militaryRoles) {
        const methodology = engine.getMethodology(roleId);
        expect(methodology.steps).toHaveLength(5);
        methodology.steps.forEach(step => {
          expect(step.name).toBeDefined();
          expect(step.description).toBeDefined();
          expect(step.actions).toBeInstanceOf(Array);
        });
      }
    });

    it('should have valid step structure for all shaman roles', () => {
      const shamanRoles = ['shaman-musk', 'shaman-jobs', 'shaman-einstein'];
      for (const roleId of shamanRoles) {
        const methodology = engine.getMethodology(roleId);
        expect(methodology.steps).toHaveLength(5);
        methodology.steps.forEach(step => {
          expect(step.name).toBeDefined();
          expect(step.description).toBeDefined();
        });
      }
    });
  });

  describe('Performance', () => {
    it('should complete methodology retrieval quickly', () => {
      const start = Date.now();
      engine.getMethodology('military-commander');
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should handle rapid successive calls', () => {
      for (let i = 0; i < 1000; i++) {
        engine.getMethodology('military-commander');
      }
      expect(true).toBe(true); // Should not crash
    });

    it('should handle many different roles quickly', () => {
      const roleIds = Array(100).fill(null).map((_, i) => `role-${i}`);
      const start = Date.now();
      for (const roleId of roleIds) {
        engine.getMethodology(roleId);
      }
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });
});
