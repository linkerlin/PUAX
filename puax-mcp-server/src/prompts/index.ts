import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';
import { RoleInfo } from '../tools.js';

// __dirname 在 CommonJS 模块中自动可用（由 tsconfig.json 配置）
// 无需手动定义

export class PromptManager {
  private roles: RoleInfo[] = [];
  private promptsCache = new Map<string, string>();
  private projectRoot: string;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || this.findProjectRoot();
    
    // 规范化路径（跨平台）
    this.projectRoot = path.normalize(this.projectRoot);
    
    console.error(`[PromptManager] Initialized with project root: ${this.projectRoot}`);
  }

  public async initialize(): Promise<void> {
    await this.loadRoles();
  }

  /**
   * 智能查找项目根目录（跨平台支持）
   * 
   * 优先级：
   * 1. 环境变量 PUAX_PROJECT_PATH
   * 2. 相对于当前模块的路径（src/prompts/index.ts）
   * 3. process.cwd() 及其父目录
   * 4. 默认值：当前工作目录
   */
  private findProjectRoot(): string {
    // 方法 1: 环境变量（最高优先级）
    const envPath = process.env.PUAX_PROJECT_PATH;
    if (envPath) {
      const normalizedPath = path.normalize(envPath);
      if (fs.existsSync(normalizedPath)) {
        console.error(`[PromptManager] Using PUAX_PROJECT_PATH: ${normalizedPath}`);
        return normalizedPath;
      }
      console.error(`[PromptManager] Warning: PUAX_PROJECT_PATH (${envPath}) does not exist`);
    }

    // 方法 2: 相对于当前模块的路径（最可靠）
    // 当前文件: src/prompts/index.ts
    // 项目根目录: 向上两级
    const relativeToModule = path.resolve(__dirname, '../../..');
    if (this.isValidProjectRoot(relativeToModule)) {
      console.error(`[PromptManager] Found project root relative to module: ${relativeToModule}`);
      return relativeToModule;
    }

    // 方法 3: process.cwd() 及其父目录
    const currentDir = process.cwd();
    console.error(`[PromptManager] Checking process.cwd(): ${currentDir}`);
    
    // 检查当前目录是否是项目根（包含 .git 或 package.json）
    if (this.isValidProjectRoot(currentDir)) {
      return currentDir;
    }
    
    // 检查父目录
    const parentDir = path.resolve(currentDir, '..');
    if (this.isValidProjectRoot(parentDir)) {
      return parentDir;
    }
    
    // 检查祖父母目录
    const grandParentDir = path.resolve(currentDir, '../..');
    if (this.isValidProjectRoot(grandParentDir)) {
      return grandParentDir;
    }

    // 方法 4: 默认值（警告）
    console.error(`[PromptManager] Warning: Could not find project root, using: ${currentDir}`);
    console.error(`[PromptManager] Set PUAX_PROJECT_PATH env variable for explicit configuration`);
    return currentDir;
  }

  /**
   * 验证目录是否是有效的 PUAX 项目根目录
   */
  private isValidProjectRoot(dir: string): boolean {
    const gitPath = path.join(dir, '.git');
    const packageJsonPath = path.join(dir, 'package.json');
    const readmePath = path.join(dir, 'README.md');
    
    try {
      const hasGit = fs.existsSync(gitPath) && fs.statSync(gitPath).isDirectory();
      const hasPackageJson = fs.existsSync(packageJsonPath);
      const hasReadme = fs.existsSync(readmePath);
      
      const isValid = hasGit || hasPackageJson || hasReadme;
      
      if (isValid) {
        console.error(`[PromptManager] Valid project root found: ${dir}`);
        console.error(`[PromptManager]   - Has .git: ${hasGit}`);
        console.error(`[PromptManager]   - Has package.json: ${hasPackageJson}`);
        console.error(`[PromptManager]   - Has README.md: ${hasReadme}`);
      }
      
      return isValid;
    } catch (error) {
      console.error(`[PromptManager] Error checking directory ${dir}:`, error);
      return false;
    }
  }

  private async loadRoles(): Promise<void> {
    try {
      const pattern = '**/*.md';
      const files = await glob(pattern, { 
        cwd: this.projectRoot,
        absolute: true,
        ignore: [
          '**/node_modules/**',
          '**/.git/**',
          '**/puax-mcp-server/**',
          '**/build/**'
        ]
      });

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const relativePath = path.relative(this.projectRoot, file);
        const category = this.extractCategory(relativePath);
        const title = this.extractTitle(content, file);
        const roleId = this.generateRoleId(title, relativePath);

        const role: RoleInfo = {
          id: roleId,
          name: title,
          category: category,
          description: this.extractDescription(content),
          filePath: relativePath
        };

        this.roles.push(role);
        this.promptsCache.set(roleId, content);
      }

      this.roles.sort((a, b) => {
        if (a.category === b.category) {
          return a.name.localeCompare(b.name, 'zh-CN');
        }
        return a.category.localeCompare(b.category, 'zh-CN');
      });

    } catch (error) {
      console.error('加载角色失败:', error);
    }
  }

  private extractCategory(filePath: string): string {
    const parts = filePath.split(path.sep);
    if (parts.length > 1) {
      const category = parts[0];
      const categoryMap: { [key: string]: string } = {
        '萨满系列': '萨满系列',
        '军事化组织': '军事化组织',
        'SillyTavern系列': 'SillyTavern系列',
        '主题场景': '主题场景',
        '自我激励': '自我激励',
        '特色角色与工具': '特色角色与工具',
        '通用文档': '通用文档'
      };
      return categoryMap[category] || '其他';
    }
    return '其他';
  }

  private extractTitle(content: string, filePath: string): string {
    const fileName = path.basename(filePath, '.md');
    const hasChinese = new RegExp('[\\u4e00-\\u9fa5]').test(fileName);
    if (hasChinese) {
      return fileName;
    }
    
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      return titleMatch[1].trim();
    }
    
    return fileName;
  }

  private generateRoleId(title: string, filePath: string): string {
    const category = this.extractCategory(filePath);
    const fileName = path.basename(filePath, '.md');
    // 移除文件名中的类别前缀（如果有）
    const cleanFileName = fileName.replace(new RegExp(`^${category}·?`), '');
    return `${category}_${cleanFileName}`.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_');
  }

  private extractDescription(content: string): string {
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    if (lines.length > 0) {
      return lines[0].substring(0, 200);
    }
    return '暂无描述';
  }

  public async reload(): Promise<void> {
    this.roles = [];
    this.promptsCache.clear();
    await this.loadRoles();
  }

  public getAllRoles(): RoleInfo[] {
    return this.roles;
  }

  public getRolesByCategory(category: string): RoleInfo[] {
    if (category === '全部') {
      return this.roles;
    }
    return this.roles.filter(role => role.category === category);
  }

  public getRoleById(roleId: string): RoleInfo | undefined {
    return this.roles.find(role => role.id === roleId);
  }

  public getPromptContent(roleId: string): string | undefined {
    return this.promptsCache.get(roleId);
  }

  public searchRoles(keyword: string): RoleInfo[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.roles.filter(role => 
      role.name.toLowerCase().includes(lowerKeyword) ||
      role.description.toLowerCase().includes(lowerKeyword) ||
      role.category.toLowerCase().includes(lowerKeyword)
    );
  }

  public activateRole(roleId: string, task?: string, customParams?: Record<string, any>): string | null {
    const prompt = this.getPromptContent(roleId);
    if (!prompt) {
      return null;
    }

    let activatedPrompt = prompt;

    if (task) {
      activatedPrompt = activatedPrompt.replace(/{{任务描述}}/g, task);
      activatedPrompt = activatedPrompt.replace(/{{占位符}}/g, task);
      activatedPrompt = activatedPrompt.replace(/{{task}}/gi, task);
    }

    if (customParams) {
      for (const [key, value] of Object.entries(customParams)) {
        activatedPrompt = activatedPrompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }
    }

    return activatedPrompt;
  }

  public getCategories(): string[] {
    const categories = new Set(this.roles.map(role => role.category));
    return Array.from(categories).sort();
  }

  public listPrompts(): any[] {
    return this.roles.map(role => ({
      name: role.id,
      description: `${role.name} - ${role.description}`,
      arguments: [
        {
          name: 'task',
          description: '可选，具体任务描述，会替换模板中的占位符',
          required: false
        }
      ]
    }));
  }

  public getPrompt(name: string, args?: Record<string, string>): { description?: string; messages: any[] } | null {
    const role = this.getRoleById(name);
    if (!role) {
      return null;
    }

    const promptContent = this.getPromptContent(name);
    if (!promptContent) {
      return null;
    }

    // 处理参数替换
    let processedContent = promptContent;
    if (args) {
      for (const [key, value] of Object.entries(args)) {
        processedContent = processedContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
    }

    // 返回符合 MCP 格式的 prompt
    return {
      description: `${role.name} - ${role.description}`,
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text',
            text: processedContent
          }
        }
      ]
    };
  }
}

export const promptManager = new PromptManager();
