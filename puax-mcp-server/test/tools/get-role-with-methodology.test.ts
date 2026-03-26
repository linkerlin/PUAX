/**
 * Get Role with Methodology Tool Unit Tests
 */

import { getRoleWithMethodologyTool } from '../../src/tools/get-role-with-methodology.js';

describe('get_role_with_methodology Tool', () => {
  const parseInput = (input: unknown) => getRoleWithMethodologyTool.inputSchema.safeParse(input);

  describe('Tool Definition', () => {
    it('should have correct tool name', () => {
      expect(getRoleWithMethodologyTool.name).toBe('get_role_with_methodology');
    });

    it('should have description', () => {
      expect(getRoleWithMethodologyTool.description).toBeDefined();
      expect(getRoleWithMethodologyTool.description.length).toBeGreaterThan(0);
    });

    it('should have input schema', () => {
      expect(getRoleWithMethodologyTool.inputSchema).toBeDefined();
      expect(parseInput({ role_id: 'military-commander' }).success).toBe(true);
    });
  });

  describe('Input Schema', () => {
    it('should require role_id', () => {
      expect(parseInput({}).success).toBe(false);
    });

    it('should have optional options', () => {
      expect(parseInput({
        role_id: 'military-commander',
        options: { include_methodology: true, include_checklist: false }
      }).success).toBe(true);
    });
  });

  describe('Options Schema', () => {
    it('should have include_methodology boolean', () => {
      expect(parseInput({
        role_id: 'military-commander',
        options: { include_methodology: true }
      }).success).toBe(true);
      expect(parseInput({
        role_id: 'military-commander',
        options: { include_methodology: 'yes' }
      }).success).toBe(false);
    });

    it('should have include_checklist boolean', () => {
      expect(parseInput({
        role_id: 'military-commander',
        options: { include_checklist: true }
      }).success).toBe(true);
      expect(parseInput({
        role_id: 'military-commander',
        options: { include_checklist: 'yes' }
      }).success).toBe(false);
    });

    it('should have include_flavor string', () => {
      expect(parseInput({
        role_id: 'military-warrior',
        options: { include_flavor: 'huawei', format: 'full' }
      }).success).toBe(true);
      expect(parseInput({
        role_id: 'military-warrior',
        options: { include_flavor: 123 }
      }).success).toBe(false);
    });
  });

  describe('Examples', () => {
    it('should have examples', () => {
      expect(getRoleWithMethodologyTool.examples).toBeDefined();
      expect(Array.isArray(getRoleWithMethodologyTool.examples)).toBe(true);
    });

    it('should have example with role_id', () => {
      if (getRoleWithMethodologyTool.examples) {
        getRoleWithMethodologyTool.examples.forEach(example => {
          expect(parseInput(example.input).success).toBe(true);
        });
      }
    });
  });
});
