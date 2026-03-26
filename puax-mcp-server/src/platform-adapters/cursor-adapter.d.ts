/**
 * Cursor 平台适配器
 * 生成 .cursor/rules/*.mdc 文件
 */
import { PlatformAdapter, RoleExportData, FlavorExportData, PlatformExportConfig } from './base-adapter.js';
export declare class CursorAdapter extends PlatformAdapter {
    constructor();
    /**
     * 导出角色为 .mdc 格式
     */
    exportRole(role: RoleExportData, config: PlatformExportConfig): string;
    /**
     * Cursor 不直接支持风味文件，将风味叠加到角色中
     */
    exportFlavor(flavor: FlavorExportData, config: PlatformExportConfig): string;
    /**
     * 生成 Cursor 配置
     */
    generateConfig(roles: RoleExportData[], config: PlatformExportConfig): string;
    /**
     * 构建风味叠加文本
     */
    private buildFlavorOverlay;
    protected getFileExtension(): string;
    protected getConfigFileName(): string;
    protected supportsFlavorExport(): boolean;
    protected getFlavorFileName(flavor: FlavorExportData): string;
}
//# sourceMappingURL=cursor-adapter.d.ts.map