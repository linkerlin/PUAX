/**
 * VSCode Copilot 平台适配器
 * 生成 .github/copilot-instructions.md 和 prompts
 */
import { PlatformAdapter, RoleExportData, FlavorExportData, PlatformExportConfig } from './base-adapter.js';
export declare class VSCodeAdapter extends PlatformAdapter {
    constructor();
    /**
     * 导出角色为 Markdown 格式
     */
    exportRole(role: RoleExportData, config: PlatformExportConfig): string;
    /**
     * 导出风味
     */
    exportFlavor(flavor: FlavorExportData, config: PlatformExportConfig): string;
    /**
     * 生成 VSCode Copilot 配置
     */
    generateConfig(roles: RoleExportData[], config: PlatformExportConfig): string;
    /**
     * 生成主 instructions 文件内容
     */
    private generateMainInstructions;
    /**
     * 根据任务类型获取 glob 模式
     */
    private getGlobForTaskType;
    /**
     * VSCode 导出需要特殊处理，创建多个文件
     */
    export(roles: RoleExportData[], flavors: FlavorExportData[], config: PlatformExportConfig): Promise<{
        success: boolean;
        exportedFiles: string[];
        errors: string[];
        warnings: string[];
    }>;
    /**
     * 生成 prompt 版本（简化版，用于快捷触发）
     */
    private generatePromptVersion;
    protected getFileExtension(): string;
    protected getConfigFileName(): string;
    protected supportsFlavorExport(): boolean;
    protected getRoleFileName(role: RoleExportData): string;
}
//# sourceMappingURL=vscode-adapter.d.ts.map