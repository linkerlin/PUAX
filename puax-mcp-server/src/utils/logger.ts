/**
 * PUAX MCP Server - Logger Utility
 * Centralized logging with color support
 */

export class Logger {
    private quiet: boolean;
    
    constructor(quiet: boolean = false) {
        this.quiet = quiet;
    }
    
    info(message: string, ...args: unknown[]): void {
        if (!this.quiet) {
            console.error(`\x1b[36m[PUAX]\x1b[0m ${message}`, ...args);
        }
    }
    
    success(message: string, ...args: unknown[]): void {
        console.error(`\x1b[32m[PUAX]\x1b[0m ${message}`, ...args);
    }
    
    warn(message: string, ...args: unknown[]): void {
        console.error(`\x1b[33m[PUAX]\x1b[0m ${message}`, ...args);
    }
    
    error(message: string, ...args: unknown[]): void {
        console.error(`\x1b[31m[PUAX]\x1b[0m ${message}`, ...args);
    }
    
    debug(message: string, ...args: unknown[]): void {
        if (!this.quiet) {
            console.error(`\x1b[90m[PUAX]\x1b[0m ${message}`, ...args);
        }
    }
}

// Global logger instance for handlers
let globalLogger: Logger | null = null;

export function initGlobalLogger(quiet: boolean): void {
    globalLogger = new Logger(quiet);
}

export function getGlobalLogger(): Logger {
    if (!globalLogger) {
        globalLogger = new Logger(false);
    }
    return globalLogger;
}
