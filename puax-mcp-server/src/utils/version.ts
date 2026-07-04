/**
 * PUAX MCP Server - Version utility
 * Single source of truth for version loading
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface PackageJson {
    name?: string;
    version?: string;
}

const PACKAGE_JSON_PATH = join(__dirname, '..', '..', 'package.json');

/**
 * Load version from package.json at the package root (build/utils -> root).
 */
export function loadVersion(): string {
    try {
        const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf-8')) as PackageJson;
        if (pkg.name === 'puax-mcp-server' && pkg.version) {
            return pkg.version;
        }
    } catch {
        // fall through
    }

    if (process.env.npm_package_version) {
        return process.env.npm_package_version;
    }

    return '0.0.0-dev';
}
