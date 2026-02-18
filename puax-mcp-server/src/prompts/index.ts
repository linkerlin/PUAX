import { SkillInfo } from '../tools.js';
import {
  getAllBundledSkills,
  getBundledSkillById,
  getBundledSkillsByCategory,
  searchBundledSkills,
  getSkillCategories,
  BundledSkill,
  CATEGORIES,
  CATEGORY_NAMES
} from './prompts-bundle.js';

// Type alias for section parameter
export type SkillSection = 'full' | 'metadata' | 'capabilities' | 'systemPrompt';

export class PromptManager {
  private skills: SkillInfo[] = [];
  private promptsCache = new Map<string, string>();
  private bundledMode: boolean = true;
  private projectRoot?: string;

  constructor(useBundledMode: boolean = true) {
    this.bundledMode = useBundledMode;

    if (this.bundledMode) {
      console.error('[PromptManager] Running in bundled mode (embedded SKILLs)');
      const skills = getAllBundledSkills();
      console.error(`[PromptManager] Loaded ${skills.length} SKILLs from bundle`);
    } else {
      console.error('[PromptManager] Running in filesystem mode (external files) - DEPRECATED');
    }
  }

  public async initialize(): Promise<void> {
    if (this.bundledMode) {
      this.loadSkillsFromBundle();
    } else {
      console.error('[PromptManager] WARNING: Filesystem mode is deprecated and may be removed in future versions');
    }
  }

  private loadSkillsFromBundle(): void {
    console.error('[PromptManager] Loading SKILLs from bundle...');

    const bundledSkills = getAllBundledSkills();

    this.skills = bundledSkills.map(skill => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      description: skill.description,
      tags: skill.tags,
      author: skill.author,
      version: skill.version,
      filePath: skill.filePath,
      capabilities: skill.capabilities,
      howToUse: skill.howToUse,
      inputFormat: skill.inputFormat,
      outputFormat: skill.outputFormat,
      exampleUsage: skill.exampleUsage,
      content: skill.content
    }));

    for (const skill of bundledSkills) {
      this.promptsCache.set(skill.id, skill.content);
    }

    console.error(`[PromptManager] Successfully loaded ${this.skills.length} SKILLs from bundle`);
  }

  public getAllSkills(): SkillInfo[] {
    return this.skills;
  }

  public getSkillsByCategory(category: string): SkillInfo[] {
    if (category === 'all') {
      return this.skills;
    }
    return this.skills.filter(skill => skill.category === category);
  }

  public getSkillById(skillId: string): SkillInfo | undefined {
    return this.skills.find(skill => skill.id === skillId);
  }

  public getBundledSkill(skillId: string): BundledSkill | undefined {
    return getBundledSkillById(skillId);
  }

  public getPromptContent(skillId: string): string | undefined {
    if (this.bundledMode) {
      const skill = getBundledSkillById(skillId);
      return skill?.content;
    } else {
      return this.promptsCache.get(skillId);
    }
  }

  public searchSkills(keyword: string): SkillInfo[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.skills.filter(skill =>
      skill.name.toLowerCase().includes(lowerKeyword) ||
      skill.description.toLowerCase().includes(lowerKeyword) ||
      skill.category.toLowerCase().includes(lowerKeyword) ||
      skill.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)) ||
      skill.capabilities.some(cap => cap.toLowerCase().includes(lowerKeyword))
    );
  }

  public activateSkill(skillId: string, task?: string, customParams?: Record<string, any>): string | null {
    const prompt = this.getPromptContent(skillId);
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
    return CATEGORIES.filter(c => c !== 'all');
  }

  public getCategoriesWithInfo(): { name: string; displayName: string; count: number }[] {
    const categories = this.getCategories();
    return categories.map(cat => ({
      name: cat,
      displayName: CATEGORY_NAMES[cat] || cat,
      count: this.skills.filter(s => s.category === cat).length
    }));
  }

  public getSkillMetadata(skillId: string): { id: string; name: string; category: string; description: string; tags: string[]; author: string; version: string } | null {
    const skill = this.getBundledSkill(skillId);
    if (!skill) return null;
    return {
      id: skill.id,
      name: skill.name,
      category: skill.category,
      description: skill.description,
      tags: skill.tags,
      author: skill.author,
      version: skill.version
    };
  }

  public getSkillCapabilities(skillId: string): string[] | null {
    const skill = this.getBundledSkill(skillId);
    return skill?.capabilities || null;
  }

  public getSkillBySection(skillId: string, section: SkillSection): any | null {
    const skill = this.getBundledSkill(skillId);
    if (!skill) return null;

    switch (section) {
      case 'full':
        return skill;
      case 'metadata':
        return {
          id: skill.id,
          name: skill.name,
          category: skill.category,
          description: skill.description,
          tags: skill.tags,
          author: skill.author,
          version: skill.version
        };
      case 'capabilities':
        return {
          id: skill.id,
          name: skill.name,
          capabilities: skill.capabilities,
          howToUse: skill.howToUse,
          inputFormat: skill.inputFormat,
          outputFormat: skill.outputFormat,
          exampleUsage: skill.exampleUsage
        };
      case 'systemPrompt':
        return {
          id: skill.id,
          name: skill.name,
          content: skill.content
        };
      default:
        return skill;
    }
  }

  public listPrompts(): any[] {
    return this.skills.map(skill => ({
      name: skill.id,
      description: `${skill.name} - ${skill.description}`,
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
    const skill = this.getSkillById(name);
    if (!skill) {
      return null;
    }

    const promptContent = this.getPromptContent(name);
    if (!promptContent) {
      return null;
    }

    let processedContent = promptContent;
    if (args) {
      for (const [key, value] of Object.entries(args)) {
        processedContent = processedContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
    }

    return {
      description: `${skill.name} - ${skill.description}`,
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

  // Legacy aliases for backward compatibility
  public getAllRoles(): SkillInfo[] {
    return this.getAllSkills();
  }

  public getRolesByCategory(category: string): SkillInfo[] {
    return this.getSkillsByCategory(category);
  }

  public getRoleById(roleId: string): SkillInfo | undefined {
    return this.getSkillById(roleId);
  }

  public searchRoles(keyword: string): SkillInfo[] {
    return this.searchSkills(keyword);
  }

  public activateRole(roleId: string, task?: string, customParams?: Record<string, any>): string | null {
    return this.activateSkill(roleId, task, customParams);
  }
}

export const promptManager = new PromptManager();
