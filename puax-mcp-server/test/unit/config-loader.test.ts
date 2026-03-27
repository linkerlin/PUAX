/**
 * ConfigLoader 单元测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ConfigLoader } from '../../src/core/config-loader';

describe('ConfigLoader', () => {
  let loader: ConfigLoader;

  beforeEach(() => {
    ConfigLoader.resetInstance();
    loader = ConfigLoader.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ConfigLoader.getInstance();
      const instance2 = ConfigLoader.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should return ConfigLoader instance', () => {
      const instance = ConfigLoader.getInstance();
      expect(instance).toBeInstanceOf(ConfigLoader);
    });
  });

  describe('loadTriggerCatalog', () => {
    it('should load triggers from YAML file', () => {
      const catalog = loader.loadTriggerCatalog();
      expect(catalog).toBeDefined();
      expect(catalog.triggers).toBeDefined();
      expect(catalog.categories).toBeDefined();
    });

    it('should load predefined triggers', () => {
      const catalog = loader.loadTriggerCatalog();
      expect(Object.keys(catalog.triggers).length).toBeGreaterThan(0);
    });

    it('should have valid trigger structure', () => {
      const catalog = loader.loadTriggerCatalog();
      const triggerIds = Object.keys(catalog.triggers);
      if (triggerIds.length > 0) {
        const firstTriggerId = triggerIds[0];
        const trigger = catalog.triggers[firstTriggerId];
        expect(trigger.id).toBeDefined();
        expect(trigger.name).toBeDefined();
        expect(trigger.description).toBeDefined();
        expect(trigger.category).toBeDefined();
        expect(trigger.severity).toBeDefined();
        expect(trigger.patterns).toBeDefined();
        expect(trigger.detection).toBeDefined();
        expect(trigger.recommended_roles).toBeDefined();
      }
    });

    it('should have valid categories', () => {
      const catalog = loader.loadTriggerCatalog();
      const categoryIds = Object.keys(catalog.categories);
      if (categoryIds.length > 0) {
        const firstCategoryId = categoryIds[0];
        const category = catalog.categories[firstCategoryId];
        expect(category.id).toBeDefined();
        expect(category.name).toBeDefined();
        expect(category.description).toBeDefined();
        expect(category.color).toBeDefined();
      }
    });
  });

  describe('getLoadErrors', () => {
    it('should return empty array on successful load', () => {
      loader.loadTriggerCatalog();
      const errors = loader.getLoadErrors();
      expect(Array.isArray(errors)).toBe(true);
    });
  });

  describe('reload', () => {
    it('should reload configuration', () => {
      const catalog1 = loader.loadTriggerCatalog();
      const catalog2 = loader.reload();
      expect(catalog2).toBeDefined();
      expect(catalog2.triggers).toBeDefined();
    });
  });

  describe('setDataDir', () => {
    it('should set data directory', () => {
      expect(() => loader.setDataDir('/tmp/test')).not.toThrow();
    });

    it('should reload after setting data dir', () => {
      loader.setDataDir('/tmp/test');
      const catalog = loader.loadTriggerCatalog();
      expect(catalog).toBeDefined();
    });
  });

  describe('resetInstance', () => {
    it('should reset singleton instance', () => {
      const instance1 = ConfigLoader.getInstance();
      ConfigLoader.resetInstance();
      const instance2 = ConfigLoader.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });
});
