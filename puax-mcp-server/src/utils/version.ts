/**
 * PUAX MCP Server - Version utility
 * Single source of truth for version loading
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const FALLBACK_VERSION = '3.1.3';

/**
 * Load version from package.json
 * Searches multiple possible locations to handle different deployment scenarios
 */
export function loadVersion(): string {
    const paths = [
        join(__dirname, '..', '..', 'package.json'),  // build/src/ -> root
        join(__dirname, '..', 'package.json'),         // build/ -> root
        join(__dirname, 'package.json'),               // direct in root
        join(process.cwd(), 'package.json')            // fallback to cwd
    ];

    for (const pkgPath of paths) {
        if (existsSync(pkgPath)) {
            try {
                const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
                return pkg.version || FALLBACK_VERSION;
            } catch {
                continue;
            }
        }
    }
    return FALLBACK_VERSION;
}
