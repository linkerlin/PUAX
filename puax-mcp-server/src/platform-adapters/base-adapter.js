"use strict";
/**
 * 平台适配器基类
 * 定义所有平台适配器的通用接口和行为
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalAdapterRegistry = exports.AdapterRegistry = exports.PlatformAdapter = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
// ============================================================================
// 抽象基类
// ============================================================================
class PlatformAdapter {
    platformName;
    supportedLanguages;
    constructor(platformName, supportedLanguages = ['zh', 'en']) {
        this.platformName = platformName;
        this.supportedLanguages = supportedLanguages;
    }
    /**
     * 获取平台名称
     */
    getPlatformName() {
        return this.platformName;
    }
    /**
     * 检查是否支持某语言
     */
    supportsLanguage(language) {
        return this.supportedLanguages.includes(language);
    }
    /**
     * 执行导出流程
     */
    async export(roles, flavors, config) {
        const result = {
            success: true,
            exportedFiles: [],
            errors: [],
            warnings: []
        };
        try {
            // 创建输出目录
            if (!(0, fs_1.existsSync)(config.outputPath)) {
                (0, fs_1.mkdirSync)(config.outputPath, { recursive: true });
            }
            // 过滤角色
            const filteredRoles = this.filterRoles(roles, config.roleFilter);
            // 过滤风味
            const filteredFlavors = this.filterFlavors(flavors, config.flavorFilter);
            // 导出每个角色
            for (const role of filteredRoles) {
                try {
                    const content = this.exportRole(role, config);
                    const fileName = this.getRoleFileName(role);
                    const filePath = (0, path_1.join)(config.outputPath, fileName);
                    // 确保目录存在
                    const dir = (0, path_1.dirname)(filePath);
                    if (!(0, fs_1.existsSync)(dir)) {
                        (0, fs_1.mkdirSync)(dir, { recursive: true });
                    }
                    (0, fs_1.writeFileSync)(filePath, content, 'utf-8');
                    result.exportedFiles.push(filePath);
                }
                catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                    result.errors.push(`Failed to export role ${role.id}: ${errorMsg}`);
                }
            }
            // 导出风味（如果支持）
            if (this.supportsFlavorExport()) {
                for (const flavor of filteredFlavors) {
                    try {
                        const content = this.exportFlavor(flavor, config);
                        const fileName = this.getFlavorFileName(flavor);
                        const filePath = (0, path_1.join)(config.outputPath, fileName);
                        (0, fs_1.writeFileSync)(filePath, content, 'utf-8');
                        result.exportedFiles.push(filePath);
                    }
                    catch (error) {
                        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                        result.errors.push(`Failed to export flavor ${flavor.id}: ${errorMsg}`);
                    }
                }
            }
            // 生成配置文件
            try {
                const configContent = this.generateConfig(filteredRoles, config);
                const configFileName = this.getConfigFileName();
                const configPath = (0, path_1.join)(config.outputPath, configFileName);
                (0, fs_1.writeFileSync)(configPath, configContent, 'utf-8');
                result.exportedFiles.push(configPath);
            }
            catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                result.errors.push(`Failed to generate config: ${errorMsg}`);
            }
            // 更新成功状态
            result.success = result.errors.length === 0;
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push(`Export failed: ${errorMsg}`);
            result.success = false;
        }
        return result;
    }
    /**
     * 过滤角色
     */
    filterRoles(roles, filter) {
        if (!filter || filter.length === 0) {
            return roles;
        }
        return roles.filter(role => filter.includes(role.id));
    }
    /**
     * 过滤风味
     */
    filterFlavors(flavors, filter) {
        if (!filter || filter.length === 0) {
            return flavors;
        }
        return flavors.filter(flavor => filter.includes(flavor.id));
    }
    /**
     * 获取角色文件名（可覆盖）
     */
    getRoleFileName(role) {
        return `${role.id}.${this.getFileExtension()}`;
    }
    /**
     * 获取风味文件名（可覆盖）
     */
    getFlavorFileName(flavor) {
        return `flavor-${flavor.id}.${this.getFileExtension()}`;
    }
    /**
     * 获取配置文件名（可覆盖）
     */
    getConfigFileName() {
        return `puax-config.json`;
    }
    /**
     * 是否支持风味导出（可覆盖）
     */
    supportsFlavorExport() {
        return false;
    }
    /**
     * 验证导出配置
     */
    validateConfig(config) {
        const errors = [];
        if (!config.outputPath) {
            errors.push('outputPath is required');
        }
        if (config.language && !this.supportsLanguage(config.language)) {
            errors.push(`Language '${config.language}' is not supported by ${this.platformName}`);
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
}
exports.PlatformAdapter = PlatformAdapter;
// ============================================================================
// 适配器注册表
// ============================================================================
class AdapterRegistry {
    adapters = new Map();
    register(adapter) {
        this.adapters.set(adapter.getPlatformName().toLowerCase(), adapter);
    }
    get(platformName) {
        return this.adapters.get(platformName.toLowerCase());
    }
    getAll() {
        return Array.from(this.adapters.values());
    }
    getSupportedPlatforms() {
        return Array.from(this.adapters.keys());
    }
}
exports.AdapterRegistry = AdapterRegistry;
// 全局注册表实例
exports.globalAdapterRegistry = new AdapterRegistry();
//# sourceMappingURL=base-adapter.js.map