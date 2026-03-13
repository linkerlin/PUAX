#!/usr/bin/env node
/**
 * Methodology Engine Unit Tests
 */

import { MethodologyEngine } from '../../src/core/methodology-engine.js';

describe('MethodologyEngine', () => {
  let engine: MethodologyEngine;

  beforeEach(() => {
    engine = new MethodologyEngine();
  });

  describe('Get Methodology', () => {
    it('should return military methodology for military roles', () => {
      const methodology = engine.getMethodology('military-commander');

      expect(methodology.name).toContain('军事');
      expect(methodology.steps).toHaveLength(5);
      expect(methodology.steps[0].name).toBe('侦察');
    });

    it('should return shaman methodology for shaman roles', () => {
      const methodology = engine.getMethodology('shaman-musk');

      expect(methodology.name).toContain('先知');
      expect(methodology.steps).toHaveLength(5);
      expect(methodology.steps[0].name).toBe('质疑');
    });

    it('should return default methodology for unknown roles', () => {
      const methodology = engine.getMethodology('unknown-role');

      expect(methodology.steps).toHaveLength(5);
      expect(methodology.steps[0].name).toBeDefined();
    });

    it('should have complete step structure', () => {
      const methodology = engine.getMethodology('military-commander');

      methodology.steps.forEach(step => {
        expect(step.name).toBeDefined();
        expect(step.description).toBeDefined();
        expect(step.actions).toBeInstanceOf(Array);
        expect(step.actions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Get Checklist', () => {
    it('should return checklist for any role', () => {
      const checklist = engine.getChecklist('military-commander');

      expect(checklist).toBeInstanceOf(Array);
      expect(checklist.length).toBeGreaterThan(0);
    });

    it('should have required items', () => {
      const checklist = engine.getChecklist('shaman-musk');

      const requiredItems = checklist.filter(item => item.required);
      expect(requiredItems.length).toBeGreaterThan(0);
    });

    it('should have proper item structure', () => {
      const checklist = engine.getChecklist('military-commander');

      checklist.forEach(item => {
        expect(item.id).toBeDefined();
        expect(item.text).toBeDefined();
        expect(item.required).toBeDefined();
        expect(item.category).toBeDefined();
      });
    });

    it('should include 7 basic checklist items', () => {
      const checklist = engine.getChecklist('military-commander');

      // Should have at least 7 items (the basic checklist)
      expect(checklist.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('Full Methodology', () => {
    it('should return complete role methodology', () => {
      const full = engine.getFullMethodology('military-commander');

      expect(full.role_id).toBe('military-commander');
      expect(full.methodology).toBeDefined();
      expect(full.checklist).toBeDefined();
    });
  });

  describe('Apply Flavor', () => {
    it('should apply alibaba flavor', () => {
      const methodology = engine.getMethodology('military-commander');
      const flavored = engine.applyFlavor(methodology, 'alibaba');

      expect(flavored.name).toContain('阿里');
    });

    it('should apply huawei flavor', () => {
      const methodology = engine.getMethodology('military-commander');
      const flavored = engine.applyFlavor(methodology, 'huawei');

      expect(flavored.name).toContain('华为');
    });

    it('should apply musk flavor', () => {
      const methodology = engine.getMethodology('shaman-musk');
      const flavored = engine.applyFlavor(methodology, 'musk');

      expect(flavored.name).toContain('Musk');
    });

    it('should not modify original methodology', () => {
      const methodology = engine.getMethodology('military-commander');
      const originalName = methodology.name;
      
      engine.applyFlavor(methodology, 'alibaba');

      expect(methodology.name).toBe(originalName);
    });
  });

  describe('Generate Execution Plan', () => {
    it('should generate plan for role', () => {
      const plan = engine.generateExecutionPlan('military-commander', 'Fix API bug');

      expect(plan).toContain('Fix API bug');
      expect(plan).toContain('军事');
      expect(plan).toContain('检查清单');
    });

    it('should include all steps in plan', () => {
      const plan = engine.generateExecutionPlan('military-commander', 'Task');

      const methodology = engine.getMethodology('military-commander');
      methodology.steps.forEach(step => {
        expect(plan).toContain(step.name);
      });
    });

    it('should include checklist in plan', () => {
      const plan = engine.generateExecutionPlan('military-commander', 'Task');

      const checklist = engine.getChecklist('military-commander');
      checklist.filter(item => item.required).forEach(item => {
        expect(plan).toContain(item.text);
      });
    });
  });

  describe('Validate Checklist', () => {
    it('should validate completed items', () => {
      const checklist = engine.getChecklist('military-commander');
      const requiredIds = checklist
        .filter(item => item.required)
        .map(item => item.id);

      const result = engine.validateChecklist('military-commander', requiredIds);

      expect(result.completed.length).toBe(requiredIds.length);
      expect(result.missing.length).toBe(0);
      expect(result.completion_rate).toBe(100);
      expect(result.can_proceed).toBe(true);
    });

    it('should detect missing items', () => {
      const result = engine.validateChecklist('military-commander', []);

      expect(result.completed.length).toBe(0);
      expect(result.missing.length).toBeGreaterThan(0);
      expect(result.completion_rate).toBe(0);
      expect(result.can_proceed).toBe(false);
    });

    it('should calculate partial completion', () => {
      const checklist = engine.getChecklist('military-commander');
      const requiredItems = checklist.filter(item => item.required);
      const halfCount = Math.floor(requiredItems.length / 2);
      const partialIds = requiredItems.slice(0, halfCount).map(item => item.id);

      const result = engine.validateChecklist('military-commander', partialIds);

      expect(result.completion_rate).toBeLessThan(100);
      expect(result.completion_rate).toBeGreaterThan(0);
    });

    it('should require 80% completion to proceed', () => {
      const checklist = engine.getChecklist('military-commander');
      const requiredItems = checklist.filter(item => item.required);
      const eightyPercentCount = Math.ceil(requiredItems.length * 0.8);
      const ids = requiredItems.slice(0, eightyPercentCount).map(item => item.id);

      const result = engine.validateChecklist('military-commander', ids);

      expect(result.can_proceed).toBe(true);
    });

    it('should not allow proceeding with less than 80%', () => {
      const checklist = engine.getChecklist('military-commander');
      const requiredItems = checklist.filter(item => item.required);
      const fiftyPercentCount = Math.floor(requiredItems.length * 0.5);
      const ids = requiredItems.slice(0, fiftyPercentCount).map(item => item.id);

      const result = engine.validateChecklist('military-commander', ids);

      expect(result.can_proceed).toBe(false);
    });
  });

  describe('Step Names by Category', () => {
    it('should have military-style steps for military roles', () => {
      const methodology = engine.getMethodology('military-warrior');
      const stepNames = methodology.steps.map(s => s.name);

      expect(stepNames).toContain('侦察');
      expect(stepNames).toContain('进攻');
      expect(stepNames).toContain('巩固');
    });

    it('should have shaman-style steps for shaman roles', () => {
      const methodology = engine.getMethodology('shaman-einstein');
      const stepNames = methodology.steps.map(s => s.name);

      expect(stepNames).toContain('冥想');
      expect(stepNames).toContain('启示');
      expect(stepNames).toContain('神迹');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined role IDs gracefully', () => {
      const methodology = engine.getMethodology('');
      expect(methodology.steps).toHaveLength(5);
    });

    it('should handle empty checklist items', () => {
      const result = engine.validateChecklist('military-commander', ['non-existent-id']);
      expect(result.completion_rate).toBe(0);
    });

    it('should handle unknown flavors gracefully', () => {
      const methodology = engine.getMethodology('military-commander');
      const flavored = engine.applyFlavor(methodology, 'unknown-flavor' as any);

      // Should return original or slightly modified
      expect(flavored.steps).toHaveLength(5);
    });
  });
});
