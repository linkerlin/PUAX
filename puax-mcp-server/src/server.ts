import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
    ErrorCode,
    McpError
} from '@modelcontextprotocol/sdk/types.js';
import { Tools } from './tools.js';
import { promptManager } from './prompts/index.js';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { Readable } from 'stream';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// 配置接口
export interface ServerConfig {
    port?: number;
    host?: string;
    quiet?: boolean;
}

// 日志工具
class Logger {
    private quiet: boolean;
    
    constructor(quiet: boolean = false) {
        this.quiet = quiet;
    }
    
    info(message: string, ...args: any[]): void {
        if (!this.quiet) {
            console.error(`\x1b[36m[PUAX]\x1b[0m ${message}`, ...args);
        }
    }
    
    success(message: string, ...args: any[]): void {
        console.error(`\x1b[32m[PUAX]\x1b[0m ${message}`, ...args);
    }
    
    warn(message: string, ...args: any[]): void {
        console.error(`\x1b[33m[PUAX]\x1b[0m ${message}`, ...args);
    }
    
    error(message: string, ...args: any[]): void {
        console.error(`\x1b[31m[PUAX]\x1b[0m ${message}`, ...args);
    }
    
    debug(message: string, ...args: any[]): void {
        if (!this.quiet) {
            console.error(`\x1b[90m[PUAX]\x1b[0m ${message}`, ...args);
        }
    }
}

export class PuaxMcpServer {
    private server: Server;
    private transports: Map<string, SSEServerTransport> = new Map();
    private httpServer: any;
    private version: string;
    private config: Required<ServerConfig>;
    private logger: Logger;

    constructor(config: ServerConfig = {}) {
        // 合并配置
        this.config = {
            port: config.port ?? 23333,
            host: config.host ?? '127.0.0.1',
            quiet: config.quiet ?? false
        };
        
        this.logger = new Logger(this.config.quiet);
        
        // 从 package.json 读取版本号
        this.version = this.loadVersion();
        
        this.logger.info(`Starting PUAX MCP Server v${this.version}...`);
        
        this.server = new Server(
            {
                name: 'puax-mcp-server',
                version: this.version
            },
            {
                capabilities: {
                    tools: {},
                    prompts: {},  // 支持 prompts/list
                    resources: {}  // 支持 resources/list 和 resources/read
                }
            }
        );

        // 注册 prompts 和 resources 能力，必须在设置处理器之前
        this.server.registerCapabilities({
            prompts: {},
            resources: {}
        });
        
        this.setupToolHandlers();
        this.setupPromptHandlers();
        this.setupResourceHandlers();
        this.setupErrorHandling();
    }

    /**
     * 加载版本号
     */
    private loadVersion(): string {
        const paths = [
            join(__dirname, '..', 'package.json'),     // build/ -> root
            join(__dirname, 'package.json'),            // 直接在 root
            join(process.cwd(), 'package.json')         // 回退到 cwd
        ];
        
        for (const pkgPath of paths) {
            if (existsSync(pkgPath)) {
                try {
                    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
                    return pkg.version || '1.5.0';
                } catch {
                    continue;
                }
            }
        }
        return '1.5.0';
    }

    private setupToolHandlers(): void {
        // 设置工具列表处理器
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: Tools
            };
        });

        // 设置工具调用处理器
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                const { name, arguments: args } = request.params;

                switch (name) {
                    case 'list_roles':
                        return await this.handleListRoles(args);
                    case 'get_role':
                        return await this.handleGetRole(args);
                    case 'search_roles':
                        return await this.handleSearchRoles(args);
                    case 'activate_role':
                        return await this.handleActivateRole(args);
                    default:
                        throw new McpError(
                            ErrorCode.MethodNotFound,
                            `Unknown tool: ${name}`
                        );
                }
            } catch (error) {
                if (error instanceof McpError) {
                    throw error;
                }
                throw new McpError(
                    ErrorCode.InternalError,
                    `Tool execution failed: ${error}`
                );
            }
        });
    }

    private setupPromptHandlers(): void {
        // 设置 prompts/list 处理器
        this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
            return {
                prompts: promptManager.listPrompts()
            };
        });

        // 设置 prompts/get 处理器
        this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
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
        // 设置 resources/list 处理器
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
            // 返回所有角色文件作为资源
            const resources = promptManager.getAllRoles().map(role => ({
                uri: `puax://roles/${role.id}`,
                description: `${role.name} - ${role.category}`,
                mimeType: 'text/markdown'
            }));
            
            return { resources };
        });

        // 设置 resources/read 处理器
        this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            const { uri } = request.params;
            
            // 解析 URI：puax://roles/{roleId}
            const match = uri.match(/^puax:\/\/roles\/(.+)$/);
            if (!match) {
                throw new McpError(
                    ErrorCode.InvalidParams,
                    `Invalid resource URI: ${uri}`
                );
            }
            
            const roleId = match[1];
            const role = promptManager.getRoleById(roleId);
            const content = promptManager.getPromptContent(roleId);
            
            if (!role || !content) {
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
            console.error('[MCP Error]', error);
        };
    }

    private async handleListRoles(args: any): Promise<any> {
        const category = args?.category || '全部';
        
        // 如果还没加载角色，先加载
        if (promptManager.getAllRoles().length === 0) {
            await promptManager.initialize();
        }

        const roles = promptManager.getRolesByCategory(category);
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        total: roles.length,
                        category: category,
                        roles: roles.map(role => ({
                            id: role.id,
                            name: role.name,
                            category: role.category,
                            description: role.description
                        }))
                    }, null, 2)
                }
            ]
        };
    }

    private async handleGetRole(args: any): Promise<any> {
        const { roleId, task } = args;
        
        if (!roleId) {
            throw new McpError(
                ErrorCode.InvalidParams,
                'roleId is required'
            );
        }

        const role = promptManager.getRoleById(roleId);
        if (!role) {
            throw new McpError(
                ErrorCode.InvalidParams,
                `Role not found: ${roleId}`
            );
        }

        let content = promptManager.getPromptContent(roleId) || '内容不可用';

        // 如果有任务，替换占位符
        if (task) {
            content = content.replace(/{{任务描述}}/g, task);
            content = content.replace(/{{占位符}}/g, task);
            content = content.replace(/{{task}}/gi, task);
        }

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        role: {
                            id: role.id,
                            name: role.name,
                            category: role.category,
                            description: role.description,
                            filePath: role.filePath
                        },
                        content: content
                    }, null, 2)
                }
            ]
        };
    }

    private async handleSearchRoles(args: any): Promise<any> {
        const { keyword } = args;
        
        if (!keyword) {
            throw new McpError(
                ErrorCode.InvalidParams,
                'keyword is required'
            );
        }

        const roles = promptManager.searchRoles(keyword);
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        keyword: keyword,
                        total: roles.length,
                        roles: roles.map(role => ({
                            id: role.id,
                            name: role.name,
                            category: role.category,
                            description: role.description
                        }))
                    }, null, 2)
                }
            ]
        };
    }

    private async handleActivateRole(args: any): Promise<any> {
        const { roleId, task, customParams } = args;
        
        if (!roleId) {
            throw new McpError(
                ErrorCode.InvalidParams,
                'roleId is required'
            );
        }

        const result = promptManager.activateRole(roleId, task, customParams);
        
        if (!result) {
            throw new McpError(
                ErrorCode.InvalidParams,
                `Failed to activate role: ${roleId}`
            );
        }

        const role = promptManager.getRoleById(roleId);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        role: {
                            id: role?.id,
                            name: role?.name,
                            category: role?.category
                        },
                        systemPrompt: result,
                        note: task ? 'Prompt 中的任务占位符已替换' : '使用原始 Prompt'
                    }, null, 2)
                }
            ]
        };
    }

    public async run(): Promise<void> {
        // 初始化时加载角色数据
        await promptManager.initialize();
        
        const roleCount = promptManager.getAllRoles().length;
        this.logger.info(`Loaded ${roleCount} roles from bundle`);
        
        // 创建 HTTP 服务器
        this.httpServer = createServer(this.handleRequest.bind(this));
        
        // 添加错误处理
        this.httpServer.on('error', (error: NodeJS.ErrnoException) => {
            if (error.code === 'EADDRINUSE') {
                const { port, host } = this.config;
                console.log('');
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
        
        // 监听配置的端口和主机
        const { port, host } = this.config;
        
        this.httpServer.listen(port, host, () => {
            console.log('');
            this.logger.success(`Server started successfully!`);
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
        
        // 处理服务器关闭
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
    }
    
    private shutdown(): void {
        console.log('');
        this.logger.warn('Shutting down server...');
        this.httpServer.close(() => {
            this.logger.info('Server stopped gracefully');
            process.exit(0);
        });
        
        // 强制关闭超时
        setTimeout(() => {
            this.logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 5000);
    }
    
    private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
        try {
            const url = new URL(req.url || '/', `http://${req.headers.host}`);
            const pathname = url.pathname;
            
            // 处理直接 JSON-RPC over HTTP 请求 (POST / 或 POST /mcp)
            // 这是大多数 MCP 客户端使用的标准模式
            if (req.method === 'POST' && (pathname === '/' || pathname === '/mcp')) {
                await this.handleDirectHTTPRequest(req, res);
            }
            // 处理 SSE 连接请求 (GET / 或 GET /mcp)
            else if (req.method === 'GET' && (pathname === '/' || pathname === '/mcp')) {
                await this.handleSSEConnection(req, res);
            }
            // 处理消息 POST 请求 (POST /message?sessionId=xxx)
            else if (req.method === 'POST' && pathname === '/message') {
                const sessionId = url.searchParams.get('sessionId');
                if (!sessionId) {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end('Missing sessionId parameter');
                    return;
                }
                
                const transport = this.transports.get(sessionId);
                if (!transport) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Session not found');
                    return;
                }
                
                await transport.handlePostMessage(req, res);
            }
            // 健康检查或信息页面
            else if (req.method === 'GET' && pathname === '/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'ok',
                    service: 'puax-mcp-server',
                    version: this.version,
                    activeSessions: this.transports.size
                }));
            }
            // 处理其他请求
            else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            }
        } catch (error) {
            console.error('Request handling error:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
        }
    }
    
    private async handleDirectHTTPRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
        try {
            // 读取请求体
            const body = await this.readRequestBody(req);
            const message = JSON.parse(body);
            
            console.error('Received HTTP JSON-RPC message:', message.method, 'id:', message.id);
            console.log('Message:', message, 'Has ID:', message.id !== undefined);
            console.log('message.id type:', typeof message.id);
            console.log('message.id value:', message.id);
            
            // 检查是否是通知（没有 id）
            if (message.id === undefined || message.id === null) {
                // 这是一个通知，不需要响应
                console.error('Handling notification:', message.method);
                
                // 处理 notifications/initialized
                if (message.method === 'notifications/initialized') {
                    console.error('Client initialized notification received');
                    // 通知不需要响应，直接返回 204 No Content
                    res.writeHead(204);
                    res.end();
                }
                // 处理 notifications/cancelled
                else if (message.method === 'notifications/cancelled') {
                    console.error('Cancelled notification received:', JSON.stringify(message.params));
                    // 这是一个通知，表示客户端取消了某个请求
                    // 我们可以在这里添加清理逻辑，但不需要响应
                    res.writeHead(204);
                    res.end();
                }
                else {
                    // 其他通知也接受但不处理
                    console.error('Unhandled notification:', message.method);
                    res.writeHead(204);
                    res.end();
                }
            }
            // 检查是否是请求（有 id）
            else if (message.method === 'ping') {
                // 处理 ping 请求（MCP 标准）
                console.error('Handling ping request...');
                
                res.writeHead(200, { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                });
                
                const response = {
                    jsonrpc: '2.0',
                    id: message.id,
                    result: {}
                };
                
                res.end(JSON.stringify(response));
            }
            else if (message.method === 'initialize') {
                console.error('Handling initialize request...');
                
                // 发送初始化响应
                res.writeHead(200, { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                });
                
                const response = {
                    jsonrpc: '2.0',
                    id: message.id,
                    result: {
                        protocolVersion: '2024-11-05',
                        capabilities: {
                            tools: {},
                            prompts: {}  // 支持 prompts/list，但不支持 prompts/get
                        },
                        serverInfo: {
                            name: 'puax-mcp-server',
                            version: this.version
                        }
                    }
                };
                
                res.end(JSON.stringify(response));
            } else if (message.method === 'tools/list') {
                // 直接处理 tools/list 请求
                console.error('Handling tools/list request...');
                
                const tools = Tools;
                
                res.writeHead(200, { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                });
                
                const response = {
                    jsonrpc: '2.0',
                    id: message.id,
                    result: { tools }
                };
                
                res.end(JSON.stringify(response));
            } else if (message.method === 'prompts/list') {
                // 直接处理 prompts/list 请求
                console.error('Handling prompts/list request...');
                
                const prompts = promptManager.listPrompts();
                
                res.writeHead(200, { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                });
                
                const response = {
                    jsonrpc: '2.0',
                    id: message.id,
                    result: { prompts }
                };
                
                res.end(JSON.stringify(response));
            } else if (message.method === 'prompts/get') {
                // 直接处理 prompts/get 请求
                console.error('Handling prompts/get request...');
                
                const { name, arguments: args } = message.params;
                const result = promptManager.getPrompt(name, args);
                
                if (!result) {
                    res.writeHead(400, { 
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache'
                    });
                    
                    const errorResponse = {
                        jsonrpc: '2.0',
                        id: message.id,
                        error: {
                            code: -32602,
                            message: `Prompt not found: ${name}`
                        }
                    };
                    
                    res.end(JSON.stringify(errorResponse));
                    return;
                }
                
                res.writeHead(200, { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                });
                
                const response = {
                    jsonrpc: '2.0',
                    id: message.id,
                    result: result
                };
                
                res.end(JSON.stringify(response));
            } else if (message.method === 'resources/list') {
                // 直接处理 resources/list 请求
                console.error('Handling resources/list request...');
                
                const resources = promptManager.getAllRoles().map(role => ({
                    uri: `puax://roles/${role.id}`,
                    description: `${role.name} - ${role.category}`,
                    mimeType: 'text/markdown'
                }));
                
                res.writeHead(200, { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                });
                
                const response = {
                    jsonrpc: '2.0',
                    id: message.id,
                    result: { resources }
                };
                
                res.end(JSON.stringify(response));
            } else if (message.method === 'resources/read') {
                // 直接处理 resources/read 请求
                console.error('Handling resources/read request...');
                
                const { uri } = message.params;
                const match = uri.match(/^puax:\/\/roles\/(.+)$/);
                
                if (!match) {
                    res.writeHead(400, { 
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache'
                    });
                    
                    const errorResponse = {
                        jsonrpc: '2.0',
                        id: message.id,
                        error: {
                            code: -32602,
                            message: `Invalid resource URI: ${uri}`
                        }
                    };
                    
                    res.end(JSON.stringify(errorResponse));
                    return;
                }
                
                const roleId = match[1];
                const role = promptManager.getRoleById(roleId);
                const content = promptManager.getPromptContent(roleId);
                
                if (!role || !content) {
                    res.writeHead(400, { 
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache'
                    });
                    
                    const errorResponse = {
                        jsonrpc: '2.0',
                        id: message.id,
                        error: {
                            code: -32602,
                            message: `Resource not found: ${uri}`
                        }
                    };
                    
                    res.end(JSON.stringify(errorResponse));
                    return;
                }
                
                res.writeHead(200, { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                });
                
                const response = {
                    jsonrpc: '2.0',
                    id: message.id,
                    result: {
                        contents: [{
                            uri,
                            mimeType: 'text/markdown',
                            text: content
                        }]
                    }
                };
                
                res.end(JSON.stringify(response));
            } else {
                // 其他请求，返回错误
                console.error('Unsupported method:', message.method);
                res.writeHead(400, { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                });
                
                const errorResponse = {
                    jsonrpc: '2.0',
                    id: message.id,
                    error: {
                        code: -32601,
                        message: 'Method not found. Use SSE mode for full tool support.'
                    }
                };
                
                res.end(JSON.stringify(errorResponse));
            }
        } catch (error) {
            console.error('Direct HTTP request error:', error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                jsonrpc: '2.0',
                id: null,
                error: {
                    code: -32700,
                    message: 'Parse error'
                }
            }));
        }
    }
    
    private readRequestBody(req: IncomingMessage): Promise<string> {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                resolve(body);
            });
            req.on('error', reject);
        });
    }
    
    private async handleSSEConnection(req: IncomingMessage, res: ServerResponse): Promise<void> {
        // 创建 SSE 传输实例
        const transport = new SSEServerTransport('/message', res);
        
        // 存储传输实例
        this.transports.set(transport.sessionId, transport);
        
        // 设置关闭回调
        transport.onclose = () => {
            console.error(`Session closed: ${transport.sessionId}`);
            this.transports.delete(transport.sessionId);
        };
        
        // 连接到 MCP 服务器
        await this.server.connect(transport);
        
        console.error(`New session connected: ${transport.sessionId}`);
    }
}
