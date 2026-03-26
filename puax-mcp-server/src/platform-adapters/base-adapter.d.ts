/**
 * 平台适配器基类
 * 定义所有平台适配器的通用接口和行为
 */
export interface RoleExportData {
    id: string;
    name: string;
    description: string;
    category: string;
    systemPrompt: string;
    triggerConditions: string[];
    taskTypes: string[];
    compatibleFlavors: string[];
    metadata: {
        tone: string;
        intensity: string;
        version: string;
    };
}
export interface FlavorExportData {
    id: string;
    name: string;
    description: string;
    keywords: string[];
    rhetoric: {
        opening: string[];
        closing: string[];
        emphasis: string[];
    };
}
export interface PlatformExportConfig {
    outputPath: string;
    roleFilter?: string[];
    flavorFilter?: string[];
    includeMethodology?: boolean;
    language?: 'zh' | 'en' | 'all';
}
export interface ExportResult {
    success: boolean;
    exportedFiles: string[];
    errors: string[];
    warnings: string[];
}
export declare abstract class PlatformAdapter {
    protected platformName: string;
    protected supportedLanguages: string[];
    constructor(platformName: string, supportedLanguages?: string[]);
    /**
     * 获取平台名称
     */
    getPlatformName(): string;
    /**
     * 检查是否支持某语言
     */
    supportsLanguage(language: string): boolean;
    /**
     * 导出角色到目标平台格式（抽象方法）
     */
    abstract exportRole(role: RoleExportData, config: PlatformExportConfig): string;
    /**
     * 导出风味叠加（抽象方法）
     */
    abstract exportFlavor(flavor: FlavorExportData, config: PlatformExportConfig): string;
    /**
     * 生成平台配置文件（抽象方法）
     */
    abstract generateConfig(roles: RoleExportData[], config: PlatformExportConfig): string;
    /**
     * 执行导出流程
     */
    export(roles: RoleExportData[], flavors: FlavorExportData[], config: PlatformExportConfig): Promise<ExportResult>;
    /**
     * 过滤角色
     */
    protected filterRoles(roles: RoleExportData[], filter?: string[]): RoleExportData[];
    /**
     * 过滤风味
     */
    protected filterFlavors(flavors: FlavorExportData[], filter?: string[]): FlavorExportData[];
    /**
     * 获取角色文件名（可覆盖）
     */
    protected getRoleFileName(role: RoleExportData): string;
    /**
     * 获取风味文件名（可覆盖）
     */
    protected getFlavorFileName(flavor: FlavorExportData): string;
    /**
     * 获取配置文件名（可覆盖）
     */
    protected getConfigFileName(): string;
    /**
     * 获取文件扩展名（抽象方法）
     */
    protected abstract getFileExtension(): string;
    /**
     * 是否支持风味导出（可覆盖）
     */
    protected supportsFlavorExport(): boolean;
    /**
     * 验证导出配置
     */
    validateConfig(config: PlatformExportConfig): {
        valid: boolean;
        errors: string[];
    };
}
export declare class AdapterRegistry {
    private adapters;
    register(adapter: PlatformAdapter): void;
    get(platformName: string): PlatformAdapter | undefined;
    getAll(): PlatformAdapter[];
    getSupportedPlatforms(): string[];
}
export declare const globalAdapterRegistry: AdapterRegistry;
//# sourceMappingURL=base-adapter.d.ts.map