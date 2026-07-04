const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const SKILLS_DIR = path.join(__dirname, '..', '..', '..', 'skills');
const PROMPTS_DIR = path.join(__dirname);
const BUNDLES_DIR = path.join(PROMPTS_DIR, 'bundles');

const CATEGORIES = [
  'shaman',
  'military',
  'p10',
  'silicon',
  'sillytavern',
  'theme',
  'self-motivation',
  'special'
];

const CATEGORY_NAMES = {
  all: 'All',
  shaman: 'Shaman Series',
  military: 'Military Organization',
  p10: 'P10 Strategic Roles',
  silicon: 'Silicon Civilization',
  sillytavern: 'SillyTavern Series',
  theme: 'Theme Scenarios',
  'self-motivation': 'Self-Motivation',
  special: 'Special Roles & Tools'
};

function parseYAMLFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  return YAML.parse(match[1]) || null;
}

function parseSections(body) {
  const sections = {
    capabilities: [],
    howToUse: '',
    inputFormat: '',
    outputFormat: '',
    exampleUsage: '',
    systemPrompt: ''
  };

  const sectionPattern = /^##\s+(.+)$/gm;
  const parts = body.split(sectionPattern);
  const sectionMap = {};

  for (let i = 1; i < parts.length; i += 2) {
    const sectionName = parts[i].trim().toLowerCase();
    const sectionBody = parts[i + 1] || '';
    sectionMap[sectionName] = sectionBody.trim();
  }

  const capSection = sectionMap['capabilities'] || sectionMap['核心能力'];
  if (capSection) {
    const capMatch = capSection.match(/(^- .+$|^\d+\. \*\*.+\*\*: .+$)/gm);
    if (capMatch) {
      sections.capabilities = capMatch.map(line =>
        line.replace(/^-\s*/, '')
          .replace(/^\d+\. \*\*(.+?)\*\*:\s*/, '$1: ')
          .trim()
      );
    }
  }

  sections.howToUse = sectionMap['how to use'] || sectionMap['如何使用'] || sectionMap['使用方法'] || '';
  sections.inputFormat = sectionMap['input format'] || sectionMap['输入格式'] || '';
  sections.outputFormat = sectionMap['output format'] || sectionMap['输出格式'] || '';
  sections.exampleUsage = sectionMap['example usage'] || sectionMap['使用示例'] || '';

  const systemPromptMatch = body.match(/## System Prompt\s*\r?\n\s*```[\s\S]*?\r?\n([\s\S]*?)\r?\n```/);
  sections.systemPrompt = systemPromptMatch ? systemPromptMatch[1].trim() : body.trim();

  return sections;
}

function escapeString(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
}

function formatSkillObject(skill, { includeContent }) {
  const lines = [
    '  {',
    `    id: ${JSON.stringify(skill.id)},`,
    `    name: ${JSON.stringify(skill.name)},`,
    `    category: ${JSON.stringify(skill.category)},`,
    `    description: ${JSON.stringify(skill.description)},`,
    `    tags: ${JSON.stringify(skill.tags)},`,
    `    author: ${JSON.stringify(skill.author)},`,
    `    version: ${JSON.stringify(skill.version)},`,
    `    filePath: ${JSON.stringify(skill.filePath)},`,
    `    triggerConditions: ${JSON.stringify(skill.triggerConditions)},`,
    `    taskTypes: ${JSON.stringify(skill.taskTypes)},`,
    `    compatibleFlavors: ${JSON.stringify(skill.compatibleFlavors)},`,
    `    metadata: ${JSON.stringify(skill.metadata)},`,
    `    capabilities: ${JSON.stringify(skill.capabilities)},`,
    `    howToUse: ${JSON.stringify(skill.howToUse)},`,
    `    inputFormat: ${JSON.stringify(skill.inputFormat)},`,
    `    outputFormat: ${JSON.stringify(skill.outputFormat)},`,
    `    exampleUsage: ${JSON.stringify(skill.exampleUsage)}`
  ];

  if (includeContent) {
    lines[lines.length - 1] = `${lines[lines.length - 1]},`;
    lines.push(`    content: \`${escapeString(skill.content)}\``);
  }

  lines.push('  }');
  return lines.join('\n');
}

function scanSkills() {
  const skills = [];

  const categories = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const categoryDir of categories) {
    const skillFile = path.join(SKILLS_DIR, categoryDir, 'SKILL.md');
    if (!fs.existsSync(skillFile)) continue;

    const content = fs.readFileSync(skillFile, 'utf-8');
    const frontmatter = parseYAMLFrontmatter(content);
    if (!frontmatter) continue;

    const body = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
    const sections = parseSections(body);

    skills.push({
      id: frontmatter.name || categoryDir,
      name: frontmatter.name || categoryDir,
      category: frontmatter.category || 'unknown',
      description: frontmatter.description || '',
      tags: frontmatter.tags || [],
      author: frontmatter.author || 'PUAX',
      version: frontmatter.version || '1.0',
      filePath: `skills/${categoryDir}/SKILL.md`,
      triggerConditions: frontmatter.trigger_conditions || [],
      taskTypes: frontmatter.task_types || [],
      compatibleFlavors: frontmatter.compatible_flavors || [],
      metadata: {
        tone: frontmatter.metadata?.tone || 'analytical',
        intensity: frontmatter.metadata?.intensity || 'medium'
      },
      capabilities: sections.capabilities,
      howToUse: sections.howToUse,
      inputFormat: sections.inputFormat,
      outputFormat: sections.outputFormat,
      exampleUsage: sections.exampleUsage,
      content: sections.systemPrompt
    });
  }

  return skills;
}

function generateBundleTypes(totalSkills) {
  return `// Auto-generated by generate-bundle.js
// Do not edit manually - run 'npm run generate-bundle' to regenerate
// Total SKILLs: ${totalSkills}

export interface BundledSkill {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  author: string;
  version: string;
  filePath: string;
  triggerConditions: string[];
  taskTypes: string[];
  compatibleFlavors: string[];
  metadata: {
    tone: string;
    intensity: string;
  };
  capabilities: string[];
  howToUse: string;
  inputFormat: string;
  outputFormat: string;
  exampleUsage: string;
  content: string;
}

export type SkillManifestEntry = Omit<BundledSkill, 'content'>;

export const CATEGORIES = [
  'all',
  ${CATEGORIES.map(c => `'${c}'`).join(',\n  ')}
] as const;

export type Category = typeof CATEGORIES[number];

export const CATEGORY_NAMES: Record<string, string> = ${JSON.stringify(CATEGORY_NAMES, null, 2)};
`;
}

function generateSkillManifest(skills) {
  const entries = skills.map(skill => formatSkillObject(skill, { includeContent: false })).join(',\n');
  return `// Auto-generated by generate-bundle.js
// Metadata-only manifest for fast listing without loading prompt content

import { SkillManifestEntry } from './bundle-types.js';

export const SKILL_MANIFEST: SkillManifestEntry[] = [
${entries}
];
`;
}

function generateCategoryBundle(category, skills) {
  const entries = skills.map(skill => formatSkillObject(skill, { includeContent: true })).join(',\n');
  return `// Auto-generated by generate-bundle.js
// Category: ${category} (${skills.length} skills)

import { BundledSkill } from '../bundle-types.js';

export const bundledSkills: BundledSkill[] = [
${entries}
];
`;
}

function generatePromptsBundleLoader() {
  const loaderEntries = CATEGORIES.map(category => {
    const varName = category.replace(/-/g, '_');
    return `  ${JSON.stringify(category)}: () => require('./bundles/bundle-${category}').bundledSkills as BundledSkill[]`;
  }).join(',\n');

  return `// Auto-generated by generate-bundle.js
// Lazy-loading facade over per-category bundles

import {
  BundledSkill,
  CATEGORIES,
  CATEGORY_NAMES,
  Category,
  SkillManifestEntry
} from './bundle-types.js';
import { SKILL_MANIFEST } from './skill-manifest.js';

export type { BundledSkill, Category, SkillManifestEntry };
export { CATEGORIES, CATEGORY_NAMES, SKILL_MANIFEST };

const categoryLoaders: Record<string, () => BundledSkill[]> = {
${loaderEntries}
};

const loadedCategories = new Map<string, BundledSkill[]>();
const skillByIdCache = new Map<string, BundledSkill>();

function loadCategory(category: string): BundledSkill[] {
  if (loadedCategories.has(category)) {
    return loadedCategories.get(category)!;
  }

  const loader = categoryLoaders[category];
  if (!loader) {
    return [];
  }

  const skills = loader();
  loadedCategories.set(category, skills);
  for (const skill of skills) {
    skillByIdCache.set(skill.id, skill);
  }
  return skills;
}

function loadAllCategories(): void {
  for (const category of CATEGORIES) {
    loadCategory(category);
  }
}

export function getSkillManifest(): SkillManifestEntry[] {
  return SKILL_MANIFEST;
}

export function getManifestEntryById(id: string): SkillManifestEntry | undefined {
  return SKILL_MANIFEST.find(skill => skill.id === id);
}

export function getAllBundledSkills(): BundledSkill[] {
  loadAllCategories();
  return SKILL_MANIFEST.map(entry => skillByIdCache.get(entry.id)!);
}

export function getBundledSkillById(id: string): BundledSkill | undefined {
  if (skillByIdCache.has(id)) {
    return skillByIdCache.get(id);
  }

  const manifestEntry = getManifestEntryById(id);
  if (!manifestEntry) {
    return undefined;
  }

  loadCategory(manifestEntry.category);
  return skillByIdCache.get(id);
}

export function getBundledSkillsByCategory(category: string): BundledSkill[] {
  if (category === 'all') {
    return getAllBundledSkills();
  }
  return loadCategory(category);
}

export function searchBundledSkills(keyword: string): BundledSkill[] {
  const lowerKeyword = keyword.toLowerCase();
  const matches = SKILL_MANIFEST.filter(skill =>
    skill.name.toLowerCase().includes(lowerKeyword) ||
    skill.description.toLowerCase().includes(lowerKeyword) ||
    skill.category.toLowerCase().includes(lowerKeyword) ||
    skill.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)) ||
    skill.capabilities.some(cap => cap.toLowerCase().includes(lowerKeyword))
  );

  return matches
    .map(skill => getBundledSkillById(skill.id))
    .filter((skill): skill is BundledSkill => skill !== undefined);
}

export function getSkillCategories(): string[] {
  return [...new Set(SKILL_MANIFEST.map(skill => skill.category))].sort();
}

export function getSkillCountByCategory(): Record<string, number> {
  const count: Record<string, number> = {};
  for (const skill of SKILL_MANIFEST) {
    count[skill.category] = (count[skill.category] || 0) + 1;
  }
  return count;
}

export const getAllBundledRoles = getAllBundledSkills;
export const getBundledRoleById = getBundledSkillById;
export const getBundledRolesByCategory = getBundledSkillsByCategory;
export const searchBundledRoles = searchBundledSkills;
export type BundledRole = BundledSkill;
`;
}

function writeGeneratedBundles(skills) {
  fs.mkdirSync(BUNDLES_DIR, { recursive: true });

  const existing = fs.readdirSync(BUNDLES_DIR).filter(name => name.startsWith('bundle-') && name.endsWith('.ts'));
  const expected = new Set(CATEGORIES.map(c => `bundle-${c}.ts`));
  for (const file of existing) {
    if (!expected.has(file)) {
      fs.unlinkSync(path.join(BUNDLES_DIR, file));
    }
  }

  fs.writeFileSync(path.join(PROMPTS_DIR, 'bundle-types.ts'), generateBundleTypes(skills.length), 'utf-8');
  fs.writeFileSync(path.join(PROMPTS_DIR, 'skill-manifest.ts'), generateSkillManifest(skills), 'utf-8');
  fs.writeFileSync(path.join(PROMPTS_DIR, 'prompts-bundle.ts'), generatePromptsBundleLoader(), 'utf-8');

  for (const category of CATEGORIES) {
    const categorySkills = skills.filter(skill => skill.category === category);
    const outputPath = path.join(BUNDLES_DIR, `bundle-${category}.ts`);
    fs.writeFileSync(outputPath, generateCategoryBundle(category, categorySkills), 'utf-8');
  }
}

console.log('Scanning skills directory...');
console.log(`Skills directory: ${SKILLS_DIR}`);

const skills = scanSkills();
console.log(`Found ${skills.length} skills`);

const unknownCategories = [...new Set(skills.map(s => s.category))].filter(c => !CATEGORIES.includes(c));
if (unknownCategories.length > 0) {
  console.error(`Unknown categories found: ${unknownCategories.join(', ')}`);
  process.exit(1);
}

console.log('Generating split bundles...');
writeGeneratedBundles(skills);
console.log(`Generated ${CATEGORIES.length} category bundles in ${BUNDLES_DIR}`);

const byCategory = {};
skills.forEach(s => {
  byCategory[s.category] = (byCategory[s.category] || 0) + 1;
});
console.log('\nSkills by category:');
Object.entries(byCategory).sort().forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count}`);
});

const missingCapabilities = skills.filter(s => s.capabilities.length === 0);
if (missingCapabilities.length > 0) {
  console.log(`\nWarning: ${missingCapabilities.length} skills missing capabilities section:`);
  missingCapabilities.slice(0, 5).forEach(s => console.log(`  - ${s.id}`));
  if (missingCapabilities.length > 5) {
    console.log(`  ... and ${missingCapabilities.length - 5} more`);
  }
}
