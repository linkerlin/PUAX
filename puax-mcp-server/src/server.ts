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

export class PuaxMcpServer {
    private server: Server;
    private transports: Map<string, SSEServerTransport> = new Map();
    private httpServer: any;

    constructor() {
        this.server = new Server({
            name: 'puax-mcp-server',
            version: '1.0.0',
            capabilities: {
                tools: {}
            }
        });

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
            
            // 处理 SSE 连接请求 (GET /)
            if (req.method === 'GET' && pathname === '/') {
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
