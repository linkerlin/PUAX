import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ErrorCode,
    McpError
} from '@modelcontextprotocol/sdk/types.js';
import { Tools } from './tools.js';
import { promptManager } from './prompts/index.js';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { Readable } from 'stream';

export class PuaxMcpServer {
    private server: Server;
    private transports: Map<string, SSEServerTransport> = new Map();
    private httpServer: any;

    constructor() {
        this.server = new Server(
            {
                name: 'puax-mcp-server',
                version: '1.0.0'
            },
            {
                capabilities: {
                    tools: {}
                }
            }
        );

        this.setupToolHandlers();
        this.setupErrorHandling();
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
        
        // 创建 HTTP 服务器
        this.httpServer = createServer(this.handleRequest.bind(this));
        
        // 监听 23333 端口
        this.httpServer.listen(23333, 'localhost', () => {
            console.error('PUAX MCP Server started successfully');
            console.error('Listening on http://localhost:23333');
        });
        
        // 处理服务器关闭
        process.on('SIGINT', () => {
            console.error('\nShutting down server...');
            this.httpServer.close();
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            console.error('\nShutting down server...');
            this.httpServer.close();
            process.exit(0);
        });
    }
    
    private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
        try {
            const url = new URL(req.url || '/', `http://${req.headers.host}`);
            const pathname = url.pathname;
            
            // 处理直接 JSON-RPC over HTTP 请求 (POST /)
            // 这是大多数 MCP 客户端使用的标准模式
            if (req.method === 'POST' && pathname === '/') {
                await this.handleDirectHTTPRequest(req, res);
            }
            // 处理 SSE 连接请求 (GET /)
            else if (req.method === 'GET' && pathname === '/') {
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
                    version: '1.0.0',
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
                } else {
                    // 其他通知也接受但不处理
                    console.error('Unhandled notification:', message.method);
                    res.writeHead(204);
                    res.end();
                }
            }
            // 检查是否是请求（有 id）
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
                            resources: {},
                            prompts: {}
                        },
                        serverInfo: {
                            name: 'puax-mcp-server',
                            version: '1.1.1'
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
