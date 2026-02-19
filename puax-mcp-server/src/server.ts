import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
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
    private transports: Map<string, StreamableHTTPServerTransport> = new Map();
    private httpServer: any;
    private version: string;
    private config: Required<ServerConfig>;
    private logger: Logger;

    constructor(config: ServerConfig = {}) {
        // 合并配置
        this.config = {
            port: config.port ?? 2333,
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
                    // New SKILL tools
                    case 'list_skills':
                        return await this.handleListSkills(args);
                    case 'get_skill':
                        return await this.handleGetSkill(args);
                    case 'search_skills':
                        return await this.handleSearchSkills(args);
                    case 'activate_skill':
                        return await this.handleActivateSkill(args);
                    case 'get_categories':
                        return await this.handleGetCategories(args);
                    // Legacy role tools (aliases)
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
            // 返回所有技能文件作为资源
            const resources = promptManager.getAllSkills().map(skill => ({
                uri: `puax://skills/${skill.id}`,
                description: `${skill.name} - ${skill.category}`,
                mimeType: 'text/markdown'
            }));

            return { resources };
        });

        // 设置 resources/read 处理器
        this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            const { uri } = request.params;

            // 解析 URI：puax://skills/{skillId}
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
            console.error('[MCP Error]', error);
        };
    }

    private async handleListSkills(args: any): Promise<any> {
        const category = args?.category || 'all';
        const includeCapabilities = args?.includeCapabilities || false;

        // 如果还没加载技能，先加载
        if (promptManager.getAllSkills().length === 0) {
            await promptManager.initialize();
        }

        const skills = promptManager.getSkillsByCategory(category);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        total: skills.length,
                        category: category,
                        skills: skills.map(skill => {
                            const base = {
                                id: skill.id,
                                name: skill.name,
                                category: skill.category,
                                description: skill.description
                            };
                            if (includeCapabilities) {
                                return { ...base, capabilities: skill.capabilities, tags: skill.tags };
                            }
                            return base;
                        })
                    }, null, 2)
                }
            ]
        };
    }

    private async handleGetSkill(args: any): Promise<any> {
        const { skillId, task, section } = args;

        if (!skillId) {
            throw new McpError(
                ErrorCode.InvalidParams,
                'skillId is required'
            );
        }

        const skill = promptManager.getSkillById(skillId);
        if (!skill) {
            throw new McpError(
                ErrorCode.InvalidParams,
                `Skill not found: ${skillId}`
            );
        }

        // 如果指定了 section，返回对应部分的数据
        if (section && section !== 'full') {
            const sectionData = promptManager.getSkillBySection(skillId, section);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            skill: sectionData
                        }, null, 2)
                    }
                ]
            };
        }

        // 返回完整数据
        const bundledSkill = promptManager.getBundledSkill(skillId);
        let content = promptManager.getPromptContent(skillId) || '内容不可用';

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
                        skill: {
                            id: skill.id,
                            name: skill.name,
                            category: skill.category,
                            description: skill.description,
                            tags: skill.tags,
                            author: skill.author,
                            version: skill.version,
                            capabilities: skill.capabilities,
                            howToUse: bundledSkill?.howToUse,
                            inputFormat: bundledSkill?.inputFormat,
                            outputFormat: bundledSkill?.outputFormat,
                            exampleUsage: bundledSkill?.exampleUsage,
                            filePath: skill.filePath
                        },
                        content: content
                    }, null, 2)
                }
            ]
        };
    }

    private async handleSearchSkills(args: any): Promise<any> {
        const { keyword } = args;

        if (!keyword) {
            throw new McpError(
                ErrorCode.InvalidParams,
                'keyword is required'
            );
        }

        const skills = promptManager.searchSkills(keyword);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        keyword: keyword,
                        total: skills.length,
                        skills: skills.map(skill => ({
                            id: skill.id,
                            name: skill.name,
                            category: skill.category,
                            description: skill.description,
                            capabilities: skill.capabilities,
                            tags: skill.tags
                        }))
                    }, null, 2)
                }
            ]
        };
    }

    private async handleActivateSkill(args: any): Promise<any> {
        const { skillId, task, customParams } = args;

        if (!skillId) {
            throw new McpError(
                ErrorCode.InvalidParams,
                'skillId is required'
            );
        }

        const result = promptManager.activateSkill(skillId, task, customParams);

        if (!result) {
            throw new McpError(
                ErrorCode.InvalidParams,
                `Failed to activate skill: ${skillId}`
            );
        }

        const skill = promptManager.getSkillById(skillId);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        skill: {
                            id: skill?.id,
                            name: skill?.name,
                            category: skill?.category,
                            capabilities: skill?.capabilities
                        },
                        systemPrompt: result,
                        note: task ? 'Prompt 中的任务占位符已替换' : '使用原始 Prompt'
                    }, null, 2)
                }
            ]
        };
    }

    private async handleGetCategories(args: any): Promise<any> {
        const categories = promptManager.getCategoriesWithInfo();

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        total: categories.length,
                        categories: categories
                    }, null, 2)
                }
            ]
        };
    }

    // Legacy handlers - now delegate to SKILL handlers
    private async handleListRoles(args: any): Promise<any> {
        const category = args?.category || 'all';
        const includeCapabilities = args?.includeCapabilities || false;

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
                        roles: roles.map(role => {
                            const base = {
                                id: role.id,
                                name: role.name,
                                category: role.category,
                                description: role.description
                            };
                            if (includeCapabilities) {
                                return { ...base, capabilities: role.capabilities, tags: role.tags };
                            }
                            return base;
                        })
                    }, null, 2)
                }
            ]
        };
    }

    private async handleGetRole(args: any): Promise<any> {
        const { roleId, task, section } = args;

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

        // 如果指定了 section，返回对应部分的数据
        if (section && section !== 'full') {
            const sectionData = promptManager.getSkillBySection(roleId, section);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            role: sectionData
                        }, null, 2)
                    }
                ]
            };
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
                            capabilities: role.capabilities,
                            tags: role.tags,
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
                            description: role.description,
                            capabilities: role.capabilities,
                            tags: role.tags
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
                            category: role?.category,
                            capabilities: role?.capabilities
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
        
        const skillCount = promptManager.getAllSkills().length;
        this.logger.info(`Loaded ${skillCount} SKILLs from bundle`);
        
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
            
            // 处理 streamable-http 请求
            if (req.method === 'POST' && (pathname === '/' || pathname === '/mcp')) {
                // 获取或创建传输实例
                const sessionId = req.headers['mcp-session-id'] as string | undefined;
                
                let transport = sessionId ? this.transports.get(sessionId) : undefined;
                
                if (!transport) {
                    // 创建新的传输实例
                    const transportOptions: any = {
                        sessionIdGenerator: () => crypto.randomUUID(),
                        onsessioninitialized: (sid: string) => {
                            // Session 初始化完成后存储 transport
                            this.transports.set(sid, transport!);
                            console.error(`Session initialized and stored: ${sid}`);
                        }
                    };
                    
                    transport = new StreamableHTTPServerTransport(transportOptions);
                    
                    transport.onclose = () => {
                        console.error(`Session closed: ${transport?.sessionId}`);
                        if (transport?.sessionId) {
                            this.transports.delete(transport.sessionId);
                        }
                    };
                    
                    await this.server.connect(transport);
                }
                
                await transport.handleRequest(req, res);
            }
            // 处理 GET 请求 (SSE/streamable)
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
            // 健康检查
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
}
