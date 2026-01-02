import { RoleInfo } from '../tools.js';
import { getAllBundledRoles, getBundledRoleById, BundledRole as BundledRoleType } from './prompts-bundle.js';

export class PromptManager {
  private roles: RoleInfo[] = [];
  private promptsCache = new Map<string, string>();
  private bundledMode: boolean = true; // 默认使用内嵌模式
  private projectRoot?: string;

  constructor(useBundledMode: boolean = true) {
    this.bundledMode = useBundledMode;
    
    if (this.bundledMode) {
      console.error('[PromptManager] Running in bundled mode (embedded prompts)');
      const roles = getAllBundledRoles();
      console.error(`[PromptManager] Loaded ${roles.length} roles from bundle`);
    } else {
      console.error('[PromptManager] Running in filesystem mode (external files) - DEPRECATED');
    }
  }

  public async initialize(): Promise<void> {
    if (this.bundledMode) {
      // 新方式：从 bundle 加载角色
      this.loadRolesFromBundle();
    } else {
      // 旧方式：从文件系统加载（保持兼容）
      // 此模式已不再推荐，仅用于调试
      console.error('[PromptManager] WARNING: Filesystem mode is deprecated and may be removed in future versions');
    }
  }

  /**
   * 从 bundle 加载角色（新方式）
   */
  private loadRolesFromBundle(): void {
    console.error('[PromptManager] Loading roles from bundle...');
    
    const bundledRoles = getAllBundledRoles();
    
    this.roles = bundledRoles.map(bundledRole => ({
      id: bundledRole.id,
      name: bundledRole.name,
      category: bundledRole.category,
      description: bundledRole.description,
      filePath: bundledRole.filePath
    }));
    
    // 加载到缓存
    for (const bundledRole of bundledRoles) {
      this.promptsCache.set(bundledRole.id, bundledRole.content);
    }
    
    console.error(`[PromptManager] Successfully loaded ${this.roles.length} roles from bundle`);
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
    if (this.bundledMode) {
      // 从 bundle 获取
      const role = getBundledRoleById(roleId);
      return role?.content;
    } else {
      // 从缓存获取（filesystem 模式）
      return this.promptsCache.get(roleId);
    }
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
