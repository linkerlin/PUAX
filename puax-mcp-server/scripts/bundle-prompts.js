#!/usr/bin/env node

/**
 * 构建脚本：将所有 PUAX prompt 文件打包成内嵌的 TypeScript 模块
 * 
 * 扫描 PUAX 项目中的所有 .md 文件，生成 prompts-bundle.ts
 * 这样服务器运行时不再依赖外部 prompt 文件
 */

const { glob } = require('glob');
const fs = require('fs');
const path = require('path');

// 项目根目录（puax-mcp-server 的父目录）
const projectRoot = path.resolve(__dirname, '../../..');
console.log(`[Bundle Prompts] Project root: ${projectRoot}`);

/**
 * 扫描所有 .md 文件并生成 bundle
 */
async function bundlePrompts() {
  try {
    console.log('[Bundle Prompts] Scanning for .md files...');
    
    // 查找所有 .md 文件（除 puax-mcp-server 目录外）
    const pattern = '**/*.md';
    const files = await glob(pattern, {
      cwd: projectRoot,
      absolute: true,
      ignore: [
        '**/node_modules/**',
        '**/.git/**',
        '**/puax-mcp-server/**',
        '**/build/**',
        '**/*.min.md',
        '**/dist/**',
        '**/coverage/**'
      ]
    });

    console.log(`[Bundle Prompts] Found ${files.length} .md files`);
    
    // 生成 bundle 数据
    const bundle = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      roles: []
    };

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const relativePath = path.relative(projectRoot, file);
        const category = extractCategory(relativePath);
        const title = extractTitle(content, file);
        const roleId = generateRoleId(title, relativePath);
        const description = extractDescription(content);
        
        bundle.roles.push({
          id: roleId,
          name: title,
          category,
          description,
          filePath: relativePath,
          content
        });
        
        console.log(`  ✓ ${roleId} (${category})`);
      } catch (error) {
        console.error(`  ✗ Error processing ${file}:`, error.message);
      }
    }

    // 生成 TypeScript 模块
    const outputPath = path.join(__dirname, '../src/prompts/prompts-bundle.ts');
    const tsContent = generateTypeScriptModule(bundle);
    
    fs.writeFileSync(outputPath, tsContent, 'utf-8');
    console.log(`[Bundle Prompts] Generated: ${outputPath}`);
    console.log(`[Bundle Prompts] Total roles: ${bundle.roles.length}`);
    
  } catch (error) {
    console.error('[Bundle Prompts] Fatal error:', error);
    process.exit(1);
  }
}

/**
 * 生成 TypeScript 模块
 */
function generateTypeScriptModule(bundle) {
  const { version, generatedAt, roles } = bundle;
  
  return `/**
 * PUAX Prompts Bundle - Auto-generated
 * 
 * Generated at: ${generatedAt}
 * Version: ${version}
 * 
 * This file contains all PUAX prompts embedded in the code.
 * DO NOT EDIT MANUALLY - Run 'npm run bundle-prompts' to regenerate.
 */

export interface BundledRole {
  id: string;
  name: string;
  category: string;
  description: string;
  filePath: string;
  content: string;
}

export interface PromptsBundle {
  version: string;
  generatedAt: string;
  roles: BundledRole[];
}

export const promptsBundle: PromptsBundle = {
  version: '${version}',
  generatedAt: '${generatedAt}',
  roles: ${JSON.stringify(roles, null, 2)}
};

// Helper function to get role by ID
export function getBundledRoleById(roleId: string): BundledRole | undefined {
  return promptsBundle.roles.find(role => role.id === roleId);
}

// Helper function to get all roles
export function getAllBundledRoles(): BundledRole[] {
  return [...promptsBundle.roles];
}

// Helper function to get roles by category
export function getBundledRolesByCategory(category: string): BundledRole[] {
  return promptsBundle.roles.filter(role => role.category === category);
}
`;
}

/**
 * Extract category from file path
 */
function extractCategory(filePath) {
  const parts = filePath.split(/[/\\]/);
  
  // 如果是在分类目录中
  if (parts.length >= 2) {
    const parentDir = parts[parts.length - 2];
    const categoryMap = {
      '萨满系列': '萨满系列',
      '军事化组织': '军事化组织',
      'SillyTavern系列': 'SillyTavern系列',
      '主题场景': '主题场景',
      '自我激励': '自我激励',
      '特色角色与工具': '特色角色与工具'
    };
    
    return categoryMap[parentDir] || '其他';
  }
  
  return '其他';
}

/**
 * Extract title from markdown content
 */
function extractTitle(content, filePath) {
  const fileName = path.basename(filePath, '.md');
  const hasChinese = new RegExp('[\u4e00-\u9fa5]').test(fileName);
  
  if (hasChinese) {
    return fileName;
  }
  
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    return titleMatch[1].trim();
  }
  
  return fileName;
}

/**
 * Generate role ID
 */
function generateRoleId(title, filePath) {
  const category = extractCategory(filePath);
  const fileName = path.basename(filePath, '.md');
  const cleanFileName = fileName.replace(new RegExp(`^${category}·?`), '');
  return `${category}_${cleanFileName}`.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_');
}

/**
 * Extract description from content
 */
function extractDescription(content) {
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    return firstLine.substring(0, 200);
  }
  return '暂无描述';
}

// Run bundler
bundlePrompts().catch(console.error);
