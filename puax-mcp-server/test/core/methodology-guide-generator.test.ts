import { readFileSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';
import {
  generateCategoryGuideMarkdown,
  generateAllCategoryGuides,
  listGuideCategories,
  type MethodologyYamlForGuide,
} from '../../src/core/methodology-guide-generator.js';

describe('methodology-guide-generator', () => {
  let data: MethodologyYamlForGuide;

  beforeAll(() => {
    const yamlPath = join(__dirname, '../../src/data/methodologies.yaml');
    data = YAML.parse(readFileSync(yamlPath, 'utf-8')) as MethodologyYamlForGuide;
  });

  it('应列出全部 8 个类别', () => {
    expect(listGuideCategories(data)).toEqual([
      'military',
      'p10',
      'self-motivation',
      'shaman',
      'silicon',
      'sillytavern',
      'special',
      'theme',
    ]);
  });

  it('军事类指南应含五步法与话术库', () => {
    const md = generateCategoryGuideMarkdown('military', data);
    expect(md).toContain('AUTO-GENERATED');
    expect(md).toContain('作战指挥框架');
    expect(md).toContain('Step 1: 侦察');
    expect(md).toContain('全体注意，作战指挥部');
    expect(md).toContain('读失败信号');
  });

  it('generateAllCategoryGuides 应覆盖每个类别', () => {
    const all = generateAllCategoryGuides(data, '2026-01-01T00:00:00.000Z');
    expect(Object.keys(all)).toHaveLength(8);
    expect(all.shaman).toContain('洞察-启示框架');
  });
});
