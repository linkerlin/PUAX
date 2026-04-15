/**
 * PUAX MCP Server - Core Server Logic
 * Simplified server core with modular handler imports
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
    ErrorCode,
    McpError,
    type TextContent
} from '@modelcontextprotocol/sdk/types.js';
import { allTools, Tools } from '../tools/index.js';
import { promptManager } from '../prompts/index.js';
import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { Logger } from '../utils/logger.js';
import { loadVersion } from '../utils/version.js';
import type { ServerConfig } from '../types.js';
import { hookToolHandlers } from '../handlers/hook-handlers.js';

// 构建 tool name → handler 的查找表（用于快速分发）
const toolHandlerMap = new Map<string, (args: Record<string, unknown>) => unknown>();
for (const tool of allTools) {
    if ('handler' in tool && typeof tool.handler === 'function') {
        toolHandlerMap.set(tool.name, tool.handler as (args: Record<string, unknown>) => unknown);
    }
}

// MCP Tool response type
interface McpToolResponse {
    content: TextContent[];
    [key: string]: unknown;
}

export class PuaxMcpServer {
    private server: Server;
    private transports: Map<string, StreamableHTTPServerTransport> = new Map();
    private httpServer: ReturnType<typeof createServer> | null = null;
    private stdioTransport: StdioServerTransport | null = null;
    private version: string;
    private config: Required<ServerConfig>;
    private logger: Logger;

    constructor(config: ServerConfig = {}) {
        // Merge configuration
        this.config = {
            port: config.port ?? 2333,
            host: config.host ?? '127.0.0.1',
            quiet: config.quiet ?? false,
            transport: config.transport ?? 'http'
        };
        
        this.logger = new Logger(this.config.quiet);
        
        // Read version from package.json
        this.version = loadVersion();
        
        this.logger.info(`Starting PUAX MCP Server v${this.version}...`);
        
        this.server = new Server(
            {
                name: 'puax-mcp-server',
                version: this.version
            },
            {
                capabilities: {
                    tools: {},
                    prompts: {},
                    resources: {}
                }
            }
        );

        // Register capabilities
        this.server.registerCapabilities({
            prompts: {},
            resources: {}
        });
        
        this.setupToolHandlers();
        this.setupPromptHandlers();
        this.setupResourceHandlers();
        this.setupErrorHandling();
    }

    private setupToolHandlers(): void {
        // List tools handler
        this.server.setRequestHandler(ListToolsRequestSchema, () => ({
            tools: Tools
        }));

        // Tool execution dispatcher：遍历 allTools，通过嵌入 handler 分发
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                const { name, arguments: args } = request.params;
                const safeArgs = (args as Record<string, unknown>) || {};

                // 优先从 allTools 的嵌入 handler 分发
                const handler = toolHandlerMap.get(name);
                if (handler) {
                    const result = handler(safeArgs);
                    if (result instanceof Promise) {
                        return await result as McpToolResponse;
                    }
                    return result as McpToolResponse;
                }

                // 兼容：仍从 hookToolHandlers 查找（已废弃路径）
                const legacyHandler = hookToolHandlers[name];
                if (legacyHandler) {
                    return await legacyHandler(safeArgs) as McpToolResponse;
                }

                throw new McpError(
                    ErrorCode.MethodNotFound,
                    `Unknown tool: ${name}`
                );
            } catch (error) {
                if (error instanceof McpError) {
                    throw error;
                }
                throw new McpError(
                    ErrorCode.InternalError,
                    `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        });
    }

    private setupPromptHandlers(): void {
        this.server.setRequestHandler(ListPromptsRequestSchema, () => ({
            prompts: promptManager.listPrompts()
        }));

        this.server.setRequestHandler(GetPromptRequestSchema, (request) => {
            const { name, arguments: args } = request.params;
            
            const result = promptManager.getPrompt(name, args);
            if (!result) {
                throw new McpError(
                    ErrorCode.InvalidParams,
                    `Prompt not found: ${name}`
                );
            }
            
            return result;
        });
    }

    private setupResourceHandlers(): void {
        this.server.setRequestHandler(ListResourcesRequestSchema, () => {
            const resources = promptManager.getAllSkills().map(skill => ({
                uri: `puax://skills/${skill.id}`,
                description: `${skill.name} - ${skill.category}`,
                mimeType: 'text/markdown'
            }));

            return { resources };
        });

        this.server.setRequestHandler(ReadResourceRequestSchema, (request) => {
            const { uri } = request.params;
            const match = uri.match(/^puax:\/\/skills\/(.+)$/);
            
            if (!match) {
                throw new McpError(
                    ErrorCode.InvalidParams,
                    `Invalid resource URI: ${uri}`
                );
            }

            const skillId = match[1];
            const skill = promptManager.getSkillById(skillId);
            const content = promptManager.getPromptContent(skillId);

            if (!skill || !content) {
                throw new McpError(
                    ErrorCode.InvalidParams,
                    `Resource not found: ${uri}`
                );
            }

            return {
                contents: [{
                    uri,
                    mimeType: 'text/markdown',
                    text: content
                }]
            };
        });
    }

    private setupErrorHandling(): void {
        this.server.onerror = (error) => {
            this.logger.error('[MCP Error]', error);
        };
    }

    public run(): void {
        promptManager.initialize();
        
        const skillCount = promptManager.getAllSkills().length;
        this.logger.info(`Loaded ${skillCount} SKILLs from bundle`);
        
        if (this.config.transport === 'stdio') {
            void this.runStdioMode();
        } else {
            this.runHttpMode();
        }
    }

    private runHttpMode(): void {
        this.httpServer = createServer((req, res) => {
            void this.handleRequest(req, res);
        });
        
        this.httpServer.on('error', (error: NodeJS.ErrnoException) => {
            if (error.code === 'EADDRINUSE') {
                const { port } = this.config;
                this.logger.error('');
                this.logger.error(`Port ${port} is already in use!`);
                this.logger.warn('Options:');
                this.logger.warn(`  1. Stop the process using port ${port}`);
                this.logger.warn(`  2. Use a different port: node build/index.js --port <PORT>`);
                this.logger.warn(`  3. Find process: netstat -ano | findstr :${port}`);
                console.log('');
                process.exit(1);
            } else if (error.code === 'EACCES') {
                this.logger.error(`Permission denied to bind to port ${this.config.port}`);
                this.logger.warn('Try using a port number greater than 1024');
                process.exit(1);
            } else {
                this.logger.error(`Server error: ${error.message}`);
                process.exit(1);
            }
        });
        
        const { port, host } = this.config;
        
        this.httpServer.listen(port, host, () => {
            this.logger.info('');
            this.logger.success('Server started successfully!');
            this.logger.success('Mode: HTTP (Streamable HTTP / SSE)');
            this.logger.success(`Listening on http://${host}:${port}`);
            console.log('');
            this.logger.info('──────────────────────────────────────────');
            this.logger.info('Endpoints:');
            this.logger.info(`  Health:  http://${host}:${port}/health`);
            this.logger.info(`  MCP:     http://${host}:${port}/mcp`);
            this.logger.info(`  SSE:     http://${host}:${port}/`);
            this.logger.info(`  Message: http://${host}:${port}/message`);
            this.logger.info('──────────────────────────────────────────');
            this.logger.info('Press Ctrl+C to stop the server');
        });
        
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
    }

    private async runStdioMode(): Promise<void> {
        this.stdioTransport = new StdioServerTransport();
        await this.server.connect(this.stdioTransport);
        
        if (!this.config.quiet) {
            this.logger.info('');
            this.logger.success('Server started successfully!');
            this.logger.info('Mode: STDIO');
            this.logger.info('Server is running and waiting for MCP messages...');
        }
        
        process.on('SIGINT', () => this.shutdownStdio());
        process.on('SIGTERM', () => this.shutdownStdio());
        process.stdin.on('end', () => this.shutdownStdio());
    }

    private shutdown(): void {
        this.logger.warn('');
        this.logger.warn('Shutting down server...');
        if (this.httpServer) {
            this.httpServer.close(() => {
                this.logger.info('Server stopped gracefully');
                process.exit(0);
            });
        }
        
        setTimeout(() => {
            this.logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 5000);
    }

    private shutdownStdio(): void {
        if (!this.config.quiet) {
            this.logger.warn('Shutting down stdio server...');
        }
        
        if (this.stdioTransport) {
            this.stdioTransport.close().then(() => {
                process.exit(0);
            }).catch(() => {
                process.exit(1);
            });
        } else {
            process.exit(0);
        }
        
        setTimeout(() => {
            this.logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 5000);
    }

    private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
        try {
            const url = new URL(req.url || '/', `http://${req.headers.host}`);
            const pathname = url.pathname;
            
            // Handle streamable-http POST requests
            if (req.method === 'POST' && (pathname === '/' || pathname === '/mcp')) {
                const sessionId = req.headers['mcp-session-id'] as string | undefined;
                let transport = sessionId ? this.transports.get(sessionId) : undefined;
                
                if (!transport) {
                    transport = new StreamableHTTPServerTransport({
                        sessionIdGenerator: () => crypto.randomUUID(),
                        onsessioninitialized: (sid: string) => {
                            this.transports.set(sid, transport!);
                            this.logger.debug(`Session initialized: ${sid}`);
                        }
                    });
                    
                    transport.onclose = () => {
                        if (transport?.sessionId) {
                            this.logger.debug(`Session closed: ${transport.sessionId}`);
                            this.transports.delete(transport.sessionId);
                        }
                    };
                    
                    await this.server.connect(transport);
                }
                
                await transport.handleRequest(req, res);
            }
            // Handle GET requests (SSE/streamable)
            else if (req.method === 'GET' && (pathname === '/' || pathname === '/mcp')) {
                const sessionId = req.headers['mcp-session-id'] as string | undefined;
                const transport = sessionId ? this.transports.get(sessionId) : undefined;
                
                if (transport) {
                    await transport.handleRequest(req, res);
                } else {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end('Missing session ID for GET request');
                }
            }
            // Health check
            else if (req.method === 'GET' && pathname === '/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'ok',
                    service: 'puax-mcp-server',
                    version: this.version,
                    activeSessions: this.transports.size
                }));
            }
            // 404 for everything else
            else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            }
        } catch (error) {
            this.logger.error('Request handling error:', error);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            }
        }
    }
}
