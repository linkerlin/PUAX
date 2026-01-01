#!/usr/bin/env node

import { PuaxMcpServer } from './server.js';

async function main(): Promise<void> {
    const server = new PuaxMcpServer();
    
    try {
        await server.run();
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

main();
