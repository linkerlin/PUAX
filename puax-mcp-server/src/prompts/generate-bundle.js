const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '..', '..', '..', 'skills');
const OUTPUT_FILE = path.join(__dirname, 'prompts-bundle.ts');

/**
 * Parse YAML frontmatter from SKILL.md content
 */
function parseYAMLFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  
  const frontmatter = match[1];
  const data = {};
  
  frontmatter.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Handle inline arrays
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(s => s.trim().replace(/['"]/g, ''));
      }
      
      data[key] = value;
    }
  });
  
  // Handle multi-line tags (YAML list format)
  if (!Array.isArray(data.tags) && frontmatter.includes('tags:')) {
    const tagsMatch = frontmatter.match(/tags:\s*\n((?:\s+-.*\n?)+)/);
    if (tagsMatch) {
      data.tags = tagsMatch[1].split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-'))
        .map(line => line.slice(1).trim());
    }
  }
  
  return data;
}

/**
 * Parse markdown sections from SKILL body
 */
function parseSections(body) {
  const sections = {
    capabilities: [],
    howToUse: '',
    inputFormat: '',
    outputFormat: '',
    exampleUsage: '',
    systemPrompt: ''
  };
  
  // Split by ## headers
  const sectionPattern = /^##\s+(.+)$/gm;
  const parts = body.split(sectionPattern);
  
  // First part is before any ## header (usually the title/intro)
  let currentSection = 'intro';
  let sectionContent = '';
  
  const sectionMap = {};
  
  for (let i = 1; i < parts.length; i += 2) {
    const sectionName = parts[i].trim().toLowerCase();
    const sectionBody = parts[i + 1] || '';
    sectionMap[sectionName] = sectionBody.trim();
  }
  
  // Extract capabilities (支持英文和中文)
  const capSection = sectionMap['capabilities'] || sectionMap['核心能力'];
  if (capSection) {
    // 匹配列表项：- xxx 或 1. **xxx**: xxx
    const capMatch = capSection.match(/(^- .+$|^\d+\. \*\*.+\*\*: .+$)/gm);
    if (capMatch) {
      sections.capabilities = capMatch.map(line => 
        line.replace(/^-\s*/, '')
            .replace(/^\d+\. \*\*(.+?)\*\*:\s*/, '$1: ')
            .trim()
      );
    }
  }
  
  // Extract how to use (支持英文和中文)
  sections.howToUse = sectionMap['how to use'] || sectionMap['如何使用'] || sectionMap['使用方法'] || '';
  
  // Extract input format
  sections.inputFormat = sectionMap['input format'] || sectionMap['输入格式'] || '';
  
  // Extract output format
  sections.outputFormat = sectionMap['output format'] || sectionMap['输出格式'] || '';
  
  // Extract example usage
  sections.exampleUsage = sectionMap['example usage'] || sectionMap['使用示例'] || '';
  
  // Extract system prompt from markdown code block
  const systemPromptMatch = body.match(/## System Prompt\s*\n\s*```[\s\S]*?\n([\s\S]*?)\n```/);
  if (systemPromptMatch) {
    sections.systemPrompt = systemPromptMatch[1].trim();
  } else {
    // Fallback: use entire body
    sections.systemPrompt = body.trim();
  }
  
  return sections;
}

/**
 * Escape string for JavaScript template literal
 */
function escapeString(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
}

/**
 * Scan all SKILL directories and parse SKILL.md files
 */
function scanSkills() {
  const skills = [];
  
  const categories = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  for (const categoryDir of categories) {
    const skillDir = path.join(SKILLS_DIR, categoryDir);
    // 优先使用SKILL.v2.md，如果不存在则使用SKILL.md
    const v2File = path.join(skillDir, 'SKILL.v2.md');
    const v1File = path.join(skillDir, 'SKILL.md');
    
    const skillFile = fs.existsSync(v2File) ? v2File : v1File;
    
    if (fs.existsSync(skillFile)) {
      const content = fs.readFileSync(skillFile, 'utf-8');
      const frontmatter = parseYAMLFrontmatter(content);
      
      if (frontmatter) {
        // Remove frontmatter to get body
        const body = content.replace(/^---\n[\s\S]*?\n---\n?/, '');
        const sections = parseSections(body);
        
        // 根据使用的文件版本设置filePath
        const isV2 = skillFile === v2File;
        const version = isV2 ? (frontmatter.version || '2.0') : (frontmatter.version || '1.0');
        
        skills.push({
          // Metadata from frontmatter
          id: frontmatter.name || categoryDir,
          name: frontmatter.name || categoryDir,
          category: frontmatter.category || 'unknown',
          description: frontmatter.description || '',
          tags: frontmatter.tags || [],
          author: frontmatter.author || 'PUAX',
          version: version,
          filePath: isV2 ? `skills/${categoryDir}/SKILL.v2.md` : `skills/${categoryDir}/SKILL.md`,
          
          // Parsed sections
          capabilities: sections.capabilities,
          howToUse: sections.howToUse,
          inputFormat: sections.inputFormat,
          outputFormat: sections.outputFormat,
          exampleUsage: sections.exampleUsage,
          
          // Full content (system prompt)
          content: sections.systemPrompt
        });
      }
    }
  }
  
  return skills;
}

/**
 * Generate TypeScript bundle file
 */
function generateBundle(skills) {
  const bundledRoles = skills.map(skill => {
    return `  {
    id: "${skill.id}",
    name: "${skill.name}",
    category: "${skill.category}",
    description: ${JSON.stringify(skill.description)},
    tags: ${JSON.stringify(skill.tags)},
    author: "${skill.author}",
    version: "${skill.version}",
    filePath: "${skill.filePath}",
    capabilities: ${JSON.stringify(skill.capabilities)},
    howToUse: ${JSON.stringify(skill.howToUse)},
    inputFormat: ${JSON.stringify(skill.inputFormat)},
    outputFormat: ${JSON.stringify(skill.outputFormat)},
    exampleUsage: ${JSON.stringify(skill.exampleUsage)},
    content: \`${escapeString(skill.content)}\`
  }`;
  }).join(',\n');
  
  return `// Auto-generated by generate-bundle.js
// Do not edit manually - run 'npm run generate-bundle' to regenerate
// Total SKILLs: ${skills.length}

export interface BundledSkill {
  // Metadata from YAML frontmatter
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  author: string;
  version: string;
  filePath: string;
  
  // Parsed sections
  capabilities: string[];
  howToUse: string;
  inputFormat: string;
  outputFormat: string;
  exampleUsage: string;
  
  // Full system prompt content
  content: string;
}

// Category constants
export const CATEGORIES = [
  'all',
  'shaman',
  'military',
  'sillytavern',
  'theme',
  'self-motivation',
  'special'
] as const;

export type Category = typeof CATEGORIES[number];

// Category display names (for UI)
export const CATEGORY_NAMES: Record<string, string> = {
  'all': 'All',
  'shaman': 'Shaman Series',
  'military': 'Military Organization',
  'sillytavern': 'SillyTavern Series',
  'theme': 'Theme Scenarios',
  'self-motivation': 'Self-Motivation',
  'special': 'Special Roles & Tools'
};

const bundledSkills: BundledSkill[] = [
${bundledRoles}
];

export function getAllBundledSkills(): BundledSkill[] {
  return bundledSkills;
}

export function getBundledSkillById(id: string): BundledSkill | undefined {
  return bundledSkills.find(skill => skill.id === id);
}

export function getBundledSkillsByCategory(category: string): BundledSkill[] {
  if (category === 'all') {
    return bundledSkills;
  }
  return bundledSkills.filter(skill => skill.category === category);
}

export function searchBundledSkills(keyword: string): BundledSkill[] {
  const lowerKeyword = keyword.toLowerCase();
  return bundledSkills.filter(skill =>
    skill.name.toLowerCase().includes(lowerKeyword) ||
    skill.description.toLowerCase().includes(lowerKeyword) ||
    skill.category.toLowerCase().includes(lowerKeyword) ||
    skill.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)) ||
    skill.capabilities.some(cap => cap.toLowerCase().includes(lowerKeyword))
  );
}

export function getSkillCategories(): string[] {
  const categories = new Set(bundledSkills.map(skill => skill.category));
  return Array.from(categories).sort();
}

export function getSkillCountByCategory(): Record<string, number> {
  const count: Record<string, number> = {};
  bundledSkills.forEach(skill => {
    count[skill.category] = (count[skill.category] || 0) + 1;
  });
  return count;
}

// Backward compatibility aliases
export const getAllBundledRoles = getAllBundledSkills;
export const getBundledRoleById = getBundledSkillById;
export const getBundledRolesByCategory = getBundledSkillsByCategory;
export const searchBundledRoles = searchBundledSkills;
export type BundledRole = BundledSkill;
`;
}

// Main execution
console.log('Scanning skills directory...');
console.log(`Skills directory: ${SKILLS_DIR}`);

const skills = scanSkills();
console.log(`Found ${skills.length} skills`);

console.log('Generating bundle...');
const bundleContent = generateBundle(skills);

fs.writeFileSync(OUTPUT_FILE, bundleContent, 'utf-8');
console.log(`Bundle written to ${OUTPUT_FILE}`);

// Summary by category
const byCategory = {};
skills.forEach(s => {
  byCategory[s.category] = (byCategory[s.category] || 0) + 1;
});
console.log('\nSkills by category:');
Object.entries(byCategory).sort().forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count}`);
});

// Validate
const missingCapabilities = skills.filter(s => s.capabilities.length === 0);
if (missingCapabilities.length > 0) {
  console.log(`\nWarning: ${missingCapabilities.length} skills missing capabilities section:`);
  missingCapabilities.slice(0, 5).forEach(s => console.log(`  - ${s.id}`));
  if (missingCapabilities.length > 5) {
    console.log(`  ... and ${missingCapabilities.length - 5} more`);
  }
}
