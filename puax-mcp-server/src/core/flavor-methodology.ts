/**
 * 味道行为约束加载器
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';

export interface FlavorRhetoric {
  opening: string[];
  closing: string[];
  emphasis: string[];
}

export interface FlavorMethodology {
  name: string;
  description?: string;
  keywords?: string[];
  rhetoric_style: string;
  rhetoric?: FlavorRhetoric;
  behavior_constraints: string[];
  forbidden_behaviors: string[];
}

export interface FlavorExportData {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  rhetoric: FlavorRhetoric;
}

interface FlavorYaml {
  flavors: Record<string, Omit<FlavorMethodology, 'name'> & { name: string }>;
}

let cache: Record<string, FlavorMethodology> | null = null;

function loadFlavors(): Record<string, FlavorMethodology> {
  if (cache) return cache;
  const yamlPath = join(__dirname, '..', 'data', 'flavor-methodologies.yaml');
  try {
    const parsed = YAML.parse(readFileSync(yamlPath, 'utf-8')) as FlavorYaml;
    cache = parsed.flavors as Record<string, FlavorMethodology>;
    return cache;
  } catch {
    return {};
  }
}

export function getFlavorMethodology(flavorId: string): FlavorMethodology | undefined {
  return loadFlavors()[flavorId];
}

export function getFlavorBehaviorInjection(flavorId: string): string {
  const flavor = getFlavorMethodology(flavorId);
  if (!flavor) return '';

  return [
    `## [${flavor.name}] 行为约束`,
    `修辞风格：${flavor.rhetoric_style}`,
    '',
    '必须遵守：',
    ...flavor.behavior_constraints.map(c => `- ${c}`),
    '',
    '禁止：',
    ...flavor.forbidden_behaviors.map(f => `- ${f}`),
  ].join('\n');
}

export function getAllFlavorIds(): string[] {
  return Object.keys(loadFlavors());
}

/** 供 export-platform 使用的风味导出列表（单一数据源） */
export function getFlavorExportList(): FlavorExportData[] {
  return Object.entries(loadFlavors()).map(([id, flavor]) => ({
    id,
    name: flavor.name,
    description: flavor.description ?? flavor.rhetoric_style,
    keywords: flavor.keywords ?? [],
    rhetoric: flavor.rhetoric ?? {
      opening: [],
      closing: [],
      emphasis: flavor.rhetoric_style ? [flavor.rhetoric_style] : [],
    },
  }));
}

/** 重置缓存（测试用） */
export function resetFlavorCache(): void {
  cache = null;
}
