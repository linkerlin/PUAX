/**
 * Cursor 平台适配器单元测试
 */

import { CursorAdapter } from '../cursor-adapter.js';
import { RoleExportData, FlavorExportData } from '../base-adapter.js';

describe('CursorAdapter', () => {
  let adapter: CursorAdapter;

  beforeEach(() => {
    adapter = new CursorAdapter();
  });

  const mockRole: RoleExportData = {
    id: 'military-commander',
    name: '指挥员',
    description: '战术指挥和资源调度',
    category: 'military',
    systemPrompt: '你是军事指挥员...',
    triggerConditions: ['任务失败', '需要统筹'],
    taskTypes: ['planning', 'coordination'],
    compatibleFlavors: ['alibaba', 'huawei'],
    metadata: {
      tone: 'aggressive',
      intensity: 'high',
      version: '2.0.0'
    }
  };

  const mockFlavor: FlavorExportData = {
    id: 'alibaba',
    name: '阿里味',
    description: '阿里巴巴企业文化',
    keywords: ['底层逻辑', '抓手', '闭环'],
    rhetoric: {
      opening: ['对齐目标'],
      closing: ['拿到结果'],
      emphasis: ['因为信任所以简单']
    }
  };

  describe('基本信息', () => {
    it('应该返回 cursor 平台名称', () => {
      expect(adapter.getPlatformName()).toBe('cursor');
    });

    it('应该支持中文和英文', () => {
      expect(adapter.supportsLanguage('zh')).toBe(true);
      expect(adapter.supportsLanguage('en')).toBe(true);
    });
  });

  describe('角色导出', () => {
    it('应该生成正确的 .mdc 格式', () => {
      const content = adapter.exportRole(mockRole, { outputPath: './test' });

      // 检查 YAML frontmatter
      expect(content).toContain('---');
      expect(content).toContain('description: 战术指挥和资源调度');
      expect(content).toContain('globs: "**/*"');
      expect(content).toContain('alwaysApply: false');

      // 检查内容
      expect(content).toContain('# PUAX Role: 指挥员');
      expect(content).toContain('## 角色定位');
      expect(content).toContain('## 触发条件');
      expect(content).toContain('- 任务失败');
      expect(content).toContain('- 需要统筹');
    });

    it('应该包含系统提示词', () => {
      const content = adapter.exportRole(mockRole, { outputPath: './test' });
      expect(content).toContain('## 系统提示词');
      expect(content).toContain('你是军事指挥员...');
    });

    it('应该包含元数据', () => {
      const content = adapter.exportRole(mockRole, { outputPath: './test' });
      expect(content).toContain('## 元数据');
      expect(content).toContain('语气: aggressive');
      expect(content).toContain('强度: high');
      expect(content).toContain('版本: 2.0.0');
    });

    it('应该包含风味叠加信息', () => {
      const content = adapter.exportRole(mockRole, { outputPath: './test' });
      expect(content).toContain('## 兼容风味叠加');
      expect(content).toContain('- alibaba');
      expect(content).toContain('- huawei');
    });

    it('应该正确处理无兼容风味的角色', () => {
      const roleWithoutFlavors: RoleExportData = {
        ...mockRole,
        compatibleFlavors: []
      };
      const content = adapter.exportRole(roleWithoutFlavors, { outputPath: './test' });
      expect(content).toContain('兼容风味叠加');
    });
  });

  describe('风味导出', () => {
    it('应该生成风味 .mdc 文件', () => {
      const content = adapter.exportFlavor(mockFlavor, { outputPath: './test' });

      expect(content).toContain('---');
      expect(content).toContain('description: "PUAX Flavor: 阿里味"');
      expect(content).toContain('# 阿里味 风味叠加');
    });

    it('应该包含风味关键词', () => {
      const content = adapter.exportFlavor(mockFlavor, { outputPath: './test' });
      expect(content).toContain('## 关键词');
      expect(content).toContain('- 底层逻辑');
      expect(content).toContain('- 抓手');
      expect(content).toContain('- 闭环');
    });

    it('应该包含开场白和强调词汇', () => {
      const content = adapter.exportFlavor(mockFlavor, { outputPath: './test' });
      expect(content).toContain('## 开场白');
      expect(content).toContain('> 对齐目标');
      expect(content).toContain('## 强调词汇');
      expect(content).toContain('- **因为信任所以简单**');
    });
  });

  describe('配置生成', () => {
    it('应该生成有效的 JSON 配置', () => {
      const content = adapter.generateConfig([mockRole], { outputPath: './test' });
      const config = JSON.parse(content);

      expect(config.name).toBe('PUAX for Cursor');
      expect(config.version).toBe('2.0.0');
      expect(config.roles).toHaveLength(1);
      expect(config.roles[0].id).toBe('military-commander');
      expect(config.roles[0].file).toBe('military-commander.mdc');
    });

    it('应该包含安装说明', () => {
      const content = adapter.generateConfig([mockRole], { outputPath: './test' });
      const config = JSON.parse(content);

      expect(config.installation.description).toContain('.cursor/rules/');
      expect(config.installation.autoApply).toBe(false);
    });

    it('应该处理多个角色', () => {
      const roles: RoleExportData[] = [
        mockRole,
        { ...mockRole, id: 'shaman-musk', name: '马斯克' }
      ];

      const content = adapter.generateConfig(roles, { outputPath: './test' });
      const config = JSON.parse(content);

      expect(config.roles).toHaveLength(2);
      expect(config.roles[0].id).toBe('military-commander');
      expect(config.roles[1].id).toBe('shaman-musk');
    });
  });

  describe('文件扩展名', () => {
    it('应该使用 .mdc 扩展名', () => {
      // 通过检查生成的配置中的文件引用
      const content = adapter.generateConfig([mockRole], { outputPath: './test' });
      const config = JSON.parse(content);
      expect(config.roles[0].file).toMatch(/\.mdc$/);
    });
  });

  describe('支持的功能', () => {
    it('应该支持风味导出', () => {
      // CursorAdapter 重写了 supportsFlavorExport 返回 true
      const content = adapter.exportFlavor(mockFlavor, { outputPath: './test' });
      expect(content).toBeTruthy();
    });
  });
});
