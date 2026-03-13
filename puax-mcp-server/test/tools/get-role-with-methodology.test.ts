#!/usr/bin/env node
/**
 * Get Role with Methodology Tool Unit Tests
 */

import { getRoleWithMethodologyTool } from '../../src/tools/get-role-with-methodology.js';

describe('get_role_with_methodology Tool', () => {
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
      expect(getRoleWithMethodologyTool.inputSchema.type).toBe('object');
    });
  });

  describe('Input Schema', () => {
    it('should require role_id', () => {
      const schema = getRoleWithMethodologyTool.inputSchema;
      expect(schema.properties.role_id).toBeDefined();
      expect(schema.properties.role_id.type).toBe('string');
    });

    it('should have optional options', () => {
      const schema = getRoleWithMethodologyTool.inputSchema;
      expect(schema.properties.options).toBeDefined();
      expect(schema.properties.options.type).toBe('object');
    });
  });

  describe('Options Schema', () => {
    it('should have include_methodology boolean', () => {
      const options = getRoleWithMethodologyTool.inputSchema.properties.options;
      expect(options.properties.include_methodology).toBeDefined();
      expect(options.properties.include_methodology.type).toBe('boolean');
    });

    it('should have include_checklist boolean', () => {
      const options = getRoleWithMethodologyTool.inputSchema.properties.options;
      expect(options.properties.include_checklist).toBeDefined();
      expect(options.properties.include_checklist.type).toBe('boolean');
    });

    it('should have include_flavor string', () => {
      const options = getRoleWithMethodologyTool.inputSchema.properties.options;
      expect(options.properties.include_flavor).toBeDefined();
      expect(options.properties.include_flavor.type).toBe('string');
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
          expect(example.input.role_id).toBeDefined();
          expect(typeof example.input.role_id).toBe('string');
        });
      }
    });
  });
});
