/**
 * 平台适配器基类单元测试
 */

import { 
  PlatformAdapter, 
  RoleExportData, 
  FlavorExportData, 
  PlatformExportConfig,
  AdapterRegistry,
  ExportResult
} from '../base-adapter.js';
import { readFileSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

// 测试用的具体适配器实现
class TestAdapter extends PlatformAdapter {
  constructor() {
    super('test-platform', ['zh', 'en', 'ja']);
  }

  exportRole(role: RoleExportData, config: PlatformExportConfig): string {
    return `# Test Role: ${role.name}\n${role.systemPrompt}`;
  }

  exportFlavor(flavor: FlavorExportData, config: PlatformExportConfig): string {
    return `# Test Flavor: ${flavor.name}`;
  }

  generateConfig(roles: RoleExportData[], config: PlatformExportConfig): string {
    return JSON.stringify({ platform: 'test', roleCount: roles.length });
  }

  protected getFileExtension(): string {
    return 'test.md';
  }

  protected supportsFlavorExport(): boolean {
    return true;
  }
}

describe('PlatformAdapter', () => {
  let adapter: TestAdapter;
  const testOutputPath = join(__dirname, 'test-output');

  const mockRole: RoleExportData = {
    id: 'test-role',
    name: '测试角色',
    description: '这是一个测试角色',
    category: 'test',
    systemPrompt: '你是测试角色...',
    triggerConditions: ['condition1', 'condition2'],
    taskTypes: ['debugging'],
    compatibleFlavors: ['alibaba', 'huawei'],
    metadata: {
      tone: 'aggressive',
      intensity: 'high',
      version: '2.0.0'
    }
  };

  const mockFlavor: FlavorExportData = {
    id: 'test-flavor',
    name: '测试风味',
    description: '测试风味描述',
    keywords: ['关键词1', '关键词2'],
    rhetoric: {
      opening: ['开场白1'],
      closing: ['结束语1'],
      emphasis: ['强调词1']
    }
  };

  beforeEach(() => {
    adapter = new TestAdapter();
    
    // 清理测试目录
    if (existsSync(testOutputPath)) {
      rmSync(testOutputPath, { recursive: true });
    }
  });

  afterAll(() => {
    // 清理测试目录
    if (existsSync(testOutputPath)) {
      rmSync(testOutputPath, { recursive: true });
    }
  });

  describe('基本信息', () => {
    it('应该返回正确的平台名称', () => {
      expect(adapter.getPlatformName()).toBe('test-platform');
    });

    it('应该支持指定语言', () => {
      expect(adapter.supportsLanguage('zh')).toBe(true);
      expect(adapter.supportsLanguage('en')).toBe(true);
      expect(adapter.supportsLanguage('ja')).toBe(true);
      expect(adapter.supportsLanguage('fr')).toBe(false);
    });
  });

  describe('角色导出', () => {
    it('应该导出角色为正确格式', () => {
      const config: PlatformExportConfig = { outputPath: testOutputPath };
      const content = adapter.exportRole(mockRole, config);
      
      expect(content).toContain('Test Role: 测试角色');
      expect(content).toContain('你是测试角色...');
    });
  });

  describe('风味导出', () => {
    it('应该导出风味为正确格式', () => {
      const config: PlatformExportConfig = { outputPath: testOutputPath };
      const content = adapter.exportFlavor(mockFlavor, config);
      
      expect(content).toContain('Test Flavor: 测试风味');
    });
  });

  describe('配置生成', () => {
    it('应该生成正确的配置', () => {
      const config: PlatformExportConfig = { outputPath: testOutputPath };
      const content = adapter.generateConfig([mockRole], config);
      const parsed = JSON.parse(content);
      
      expect(parsed.platform).toBe('test');
      expect(parsed.roleCount).toBe(1);
    });
  });

  describe('完整导出流程', () => {
    it('应该成功导出所有文件', async () => {
      const config: PlatformExportConfig = { 
        outputPath: testOutputPath,
        includeMethodology: true
      };

      const result = await adapter.export(
        [mockRole],
        [mockFlavor],
        config
      );

      expect(result.success).toBe(true);
      expect(result.exportedFiles.length).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
    });

    it('应该根据过滤器导出指定角色', async () => {
      const anotherRole: RoleExportData = {
        ...mockRole,
        id: 'another-role',
        name: '另一个角色'
      };

      const config: PlatformExportConfig = {
        outputPath: testOutputPath,
        roleFilter: ['test-role']  // 只导出 test-role
      };

      const result = await adapter.export(
        [mockRole, anotherRole],
        [],
        config
      );

      // 只应该导出 test-role + config
      const roleFiles = result.exportedFiles.filter(f => f.includes('test-role'));
      const anotherFiles = result.exportedFiles.filter(f => f.includes('another-role'));
      
      expect(roleFiles.length).toBeGreaterThan(0);
      expect(anotherFiles).toHaveLength(0);
    });

    it('应该创建不存在的输出目录', async () => {
      const newOutputPath = join(testOutputPath, 'nested', 'directory');
      
      const config: PlatformExportConfig = { outputPath: newOutputPath };
      
      const result = await adapter.export([mockRole], [], config);
      
      expect(result.success).toBe(true);
      expect(existsSync(newOutputPath)).toBe(true);
    });

    it('应该在导出失败时记录错误', async () => {
      // 创建一个无效的适配器来模拟错误
      class ErrorAdapter extends TestAdapter {
        exportRole(): string {
          throw new Error('导出失败');
        }
      }

      const errorAdapter = new ErrorAdapter();
      const config: PlatformExportConfig = { outputPath: testOutputPath };

      const result = await errorAdapter.export([mockRole], [], config);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('配置验证', () => {
    it('应该验证有效的配置', () => {
      const config: PlatformExportConfig = { outputPath: testOutputPath };
      const validation = adapter.validateConfig(config);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('应该检测到缺少输出路径', () => {
      const config = {} as PlatformExportConfig;
      const validation = adapter.validateConfig(config);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('outputPath is required');
    });

    it('应该检测到不支持的语言', () => {
      const config = {
        outputPath: testOutputPath,
        language: 'fr' as any  // 不支持
      };
      const validation = adapter.validateConfig(config);

      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain('fr');
    });

    it('应该接受支持的语言', () => {
      const config: PlatformExportConfig = {
        outputPath: testOutputPath,
        language: 'zh'
      };
      const validation = adapter.validateConfig(config);

      expect(validation.valid).toBe(true);
    });
  });
});

describe('AdapterRegistry', () => {
  let registry: AdapterRegistry;

  beforeEach(() => {
    registry = new AdapterRegistry();
  });

  it('应该注册适配器', () => {
    const adapter = new TestAdapter();
    registry.register(adapter);

    expect(registry.get('test-platform')).toBe(adapter);
  });

  it('应该忽略大小写获取适配器', () => {
    const adapter = new TestAdapter();
    registry.register(adapter);

    expect(registry.get('TEST-PLATFORM')).toBe(adapter);
    expect(registry.get('Test-Platform')).toBe(adapter);
  });

  it('应该返回所有适配器', () => {
    const adapter1 = new TestAdapter();
    const adapter2 = new TestAdapter();
    
    // 修改名称以区分
    Object.defineProperty(adapter2, 'platformName', { value: 'test-platform-2' });

    registry.register(adapter1);
    registry.register(adapter2);

    const all = registry.getAll();
    expect(all).toContain(adapter1);
  });

  it('应该返回支持的平台列表', () => {
    const adapter = new TestAdapter();
    registry.register(adapter);

    expect(registry.getSupportedPlatforms()).toContain('test-platform');
  });

  it('应该在获取不存在的适配器时返回undefined', () => {
    expect(registry.get('non-existent')).toBeUndefined();
  });
});
