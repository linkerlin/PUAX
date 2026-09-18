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
    ListResourceTemplatesRequestSchema,
    SetLevelRequestSchema,
    CompleteRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { allTools, Tools, buildToolHandlerMap, normalizeToolResponse, type ToolHandler } from '../tools/index.js';
import { toProtocolTool } from '../tools/json-schema.js';
import { z } from 'zod';
import { promptManager } from '../prompts/index.js';
import { guardToolCall } from '../core/tool-guard.js';
import { randomUUID } from 'crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { Logger } from '../utils/logger.js';
import { loadVersion } from '../utils/version.js';
import { withSpanAsync } from '../core/telemetry.js';
import { usageStatsCollector } from '../core/usage-stats.js';
import type { ServerConfig } from '../types.js';
import { V4_PUBLIC_VERBS, getToolSurface, selectListedTools } from '../core/v4-dashboard.js';
import { listedExtraNames, runWithToolSurfaceOwner } from '../core/tool-surface.js';
import { KERNEL_ROLE_IDS, EXPERIMENTAL_ROLE_IDS, SHAMAN_ROLE_IDS } from '../core/role-kernel.js';
import { ampSpecDoc } from '../core/amp.js';
import { planSiliconTheater } from '../core/silicon-theater.js';
import { dispatchV4 } from './v4-http.js';
import { MemoryEventStore } from './event-store.js';
import {
    setSamplingRequester,
    bindSamplingRequester,
    samplingRequesterOf,
    runWithSamplingRequester,
} from '../core/intervention.js';

const toolHandlerMap = buildToolHandlerMap(
  allTools as ReadonlyArray<{ name: string; handler?: ToolHandler }>
);

/**
 * 工具入参 schema 索引（P0-1）
 * 供 CallTool 做运行时入参校验——Zod 此前只用于类型推断，从不实际 parse，
 * 等于"声明了契约却不执行"。此处补上执行侧。
 */
const toolSchemaMap = new Map<string, z.ZodTypeAny>(
  (allTools as ReadonlyArray<{ name: string; inputSchema?: z.ZodTypeAny }>)
    .filter((t) => Boolean(t.inputSchema))
    .map((t) => [t.name, t.inputSchema as z.ZodTypeAny])
);

/**
 * P0-2：CORS 只对**环回来源**授权。
 * 此前 `Access-Control-Allow-Origin: *` 全开，任意网页均可跨域调 `/v4/*`
 * （含可写宿主配置的 `doctor/fix`）。本地工具与 MCP 客户端通常不发 Origin
 * 头，故收紧后不影响正常调用。
 */
function loopbackOrigin(origin?: string): string | undefined {
    if (!origin) return undefined;
    try {
        const host = new URL(origin).hostname.toLowerCase();
        const isLoopback =
            host === 'localhost' ||
            host === '::1' ||
            host === '[::1]' ||
            host.endsWith('.localhost') ||
            /^127\.\d+\.\d+\.\d+$/.test(host);
        return isLoopback ? origin : undefined;
    } catch {
        return undefined;
    }
}

interface SessionContext {
    transport: StreamableHTTPServerTransport;
    server: Server;
}

export class PuaxMcpServer {
    private server: Server;
    private transports: Map<string, StreamableHTTPServerTransport> = new Map();
    private sessions: Map<string, SessionContext> = new Map();
    private httpServer: ReturnType<typeof createServer> | null = null;
    private stdioTransport: StdioServerTransport | null = null;
    private version: string;
    private config: Required<ServerConfig>;
    private logger: Logger;
    private currentLogLevel: string = 'info';
    private eventStore = new MemoryEventStore();

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
        usageStatsCollector.recordSessionStart();
        
        // 4.5.6 / 架构收口：初始化基础 server 实例（用于 stdio 与单例引用）
        this.server = this.createMcpServerInstance();
    }

    /**
     * MCP Server 实例工厂：每个 HTTP transport 会话独立一个 Server 实例，
     * 根治"同一 Server 实例被多个 HTTP transport connect 导致第二会话 500"的致命缺陷。
     */
    public createMcpServerInstance(): Server {
        const server = new Server(
            {
                name: 'puax-mcp-server',
                version: this.version
            },
            {
                capabilities: {
                    tools: {
                        listChanged: true,
                    },
                    prompts: {},
                    resources: {},
                    logging: {},
                    completions: {},
                }
            }
        );

        this.setupToolHandlers(server);
        this.setupPromptHandlers(server);
        this.setupResourceHandlers(server);
        this.setupModernFeatureHandlers(server);
        this.setupErrorHandling(server);
        this.setupCommissarChannel(server);
        return server;
    }

    private setupToolHandlers(server: Server): void {
        // List tools handler
        server.setRequestHandler(ListToolsRequestSchema, () => {
            const publicSet = new Set<string>(V4_PUBLIC_VERBS as unknown as string[]);
            const extras = listedExtraNames(server);
            const ordered = selectListedTools(
                Tools as Array<{ name: string; description?: string; inputSchema?: z.ZodTypeAny }>,
                getToolSurface(),
                extras
            );
            // P0-1：inputSchema 必须编译为标准 JSON Schema 再下发，
            // 否则严格客户端在 listTools 阶段即失败（原为 Zod 对象透传）
            // 默认只列 13 黄金动词；心跳触发后 extras 并入，并通知 list_changed
            return {
                tools: ordered.map((t) =>
                    toProtocolTool({
                        name: t.name,
                        description: publicSet.has(t.name) && t.description && !t.description.startsWith('[v4]')
                            ? `[v4] ${t.description}`
                            : t.description,
                        inputSchema: t.inputSchema,
                    })
                ),
            };
        });

        // Tool execution dispatcher：遍历 allTools，通过嵌入 handler 分发
        server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const bound = samplingRequesterOf(server);
            const invoke = () => this.dispatchToolCall(request);
            const withSurface = () => runWithToolSurfaceOwner(server, invoke);
            if (bound === undefined) {
                return withSurface();
            }
            return runWithSamplingRequester(bound, withSurface);
        });
    }

    private async dispatchToolCall(request: { params: { name: string; arguments?: Record<string, unknown> } }): Promise<{ [x: string]: unknown }> {
            try {
                const { name, arguments: args } = request.params;
                const safeArgs = (args as Record<string, unknown>) || {};

                const handler = toolHandlerMap.get(name);
                if (handler) {
                    // P0-1（执行侧）：声明了入参 schema 就当真校验，
                    // 否则契约只是摆设。失败回 InvalidParams，不静默放行。
                    let effectiveArgs = safeArgs;
                    const schema = toolSchemaMap.get(name);
                    if (schema) {
                        const parsed = schema.safeParse(safeArgs);
                        if (!parsed.success) {
                            const detail = parsed.error.issues
                                .map((i) => `${i.path.length ? i.path.join('.') : '<root>'}: ${i.message}`)
                                .join('; ');
                            throw new McpError(
                                ErrorCode.InvalidParams,
                                `Invalid arguments for ${name}: ${detail}`
                            );
                        }
                        effectiveArgs = (parsed.data as Record<string, unknown>) || safeArgs;
                    }
                    // 工具守卫：PreToolUse 拦截（防作弊，见 core/tool-guard.ts）
                    const guard = guardToolCall(name, safeArgs);
                    if (guard.blocked) {
                        throw new McpError(
                            ErrorCode.InvalidParams,
                            `${guard.reason || 'Tool call blocked'}${guard.recommendations ? ` Suggestions: ${guard.recommendations.join('; ')}` : ''}`
                        );
                    }
                    return await withSpanAsync(
                        `puax.tool.${name}`,
                        { 'tool.name': name },
                        async () => {
                            usageStatsCollector.recordToolCall(name);
                            const result = handler(effectiveArgs);
                            if (result instanceof Promise) {
                                return normalizeToolResponse(await result);
                            }
                            return normalizeToolResponse(result);
                        }
                    );
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
    }

    private setupPromptHandlers(server: Server): void {
        server.setRequestHandler(ListPromptsRequestSchema, () => ({
            prompts: promptManager.listPrompts()
        }));

        server.setRequestHandler(GetPromptRequestSchema, (request) => {
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

    private setupResourceHandlers(server: Server): void {
        server.setRequestHandler(ListResourcesRequestSchema, () => {
            const resources = [
                {
                    uri: 'puax://v4/verbs',
                    description: 'v4 对外 13 动词（默认路径）',
                    mimeType: 'application/json',
                },
                {
                    uri: 'puax://v4/kernel',
                    description: '角色内核 / 萨满全留 / 实验池',
                    mimeType: 'application/json',
                },
                {
                    uri: 'puax://v4/amp',
                    description: 'AMP 0.1 规格（事件 / 块 / 闸门 / 状态）',
                    mimeType: 'application/json',
                },
                {
                    uri: 'puax://v4/theater',
                    description: '硅基剧场剧本（处境 / 闸门 / 梦）',
                    mimeType: 'application/json',
                },
                ...promptManager.getAllSkills().map(skill => ({
                    uri: `puax://skills/${skill.id}`,
                    description: `${skill.name} - ${skill.category}`,
                    mimeType: 'text/markdown'
                })),
            ];

            return { resources };
        });

        server.setRequestHandler(ReadResourceRequestSchema, (request) => {
            const { uri } = request.params;
            if (uri === 'puax://v4/verbs') {
                return {
                    contents: [{
                        uri,
                        mimeType: 'application/json',
                        text: JSON.stringify({ public_verbs: [...V4_PUBLIC_VERBS] }, null, 2),
                    }],
                };
            }
            if (uri === 'puax://v4/amp') {
                return {
                    contents: [{
                        uri,
                        mimeType: 'application/json',
                        text: JSON.stringify(ampSpecDoc(), null, 2),
                    }],
                };
            }
            if (uri === 'puax://v4/theater') {
                return {
                    contents: [{
                        uri,
                        mimeType: 'application/json',
                        text: JSON.stringify(planSiliconTheater(), null, 2),
                    }],
                };
            }
            if (uri === 'puax://v4/kernel') {
                return {
                    contents: [{
                        uri,
                        mimeType: 'application/json',
                        text: JSON.stringify({
                            kernel: [...KERNEL_ROLE_IDS],
                            shaman: [...SHAMAN_ROLE_IDS],
                            experimental: [...EXPERIMENTAL_ROLE_IDS],
                        }, null, 2),
                    }],
                };
            }
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

    /**
     * 服务端真正处理的 MCP 现代方法：templates / logging / completion。
     * roots/list 与 elicitation/create 是客户端方法（由服务端发请求），此处不再伪装 handler。
     * resources/subscribe 未实现通知，故不声明 subscribe 能力、不挂空 handler。
     */
    private setupModernFeatureHandlers(server: Server): void {
        server.setRequestHandler(ListResourceTemplatesRequestSchema, () => {
            return {
                resourceTemplates: [
                    {
                        uriTemplate: 'puax://skills/{skillId}',
                        name: 'PUAX Skill Template',
                        description: 'Access PUAX bundled or custom roles/skills by skill ID',
                        mimeType: 'text/markdown'
                    },
                    {
                        uriTemplate: 'puax://situations/{level}',
                        name: 'PUAX Situation Template',
                        description: 'Access PUAX situation prompts by pressure level (0-4)',
                        mimeType: 'text/plain'
                    }
                ]
            };
        });

        server.setRequestHandler(SetLevelRequestSchema, (request) => {
            const { level } = request.params;
            this.currentLogLevel = level;
            this.logger.info(`Log level updated to: ${level}`);
            return {};
        });

        server.setRequestHandler(CompleteRequestSchema, (request) => {
            const { ref, argument } = request.params;
            const val = (argument?.value || '').toLowerCase();
            const candidates: string[] = [];

            if (ref.type === 'ref/prompt') {
                const skills = promptManager.getAllSkills();
                for (const s of skills) {
                    if (s.id.toLowerCase().includes(val) || s.name.toLowerCase().includes(val)) {
                        candidates.push(s.id);
                    }
                }
            } else if (ref.type === 'ref/resource') {
                const staticUris = [
                    'puax://v4/verbs',
                    'puax://v4/kernel',
                    'puax://v4/amp',
                    'puax://v4/theater'
                ];
                for (const u of staticUris) {
                    if (u.toLowerCase().includes(val)) {
                        candidates.push(u);
                    }
                }
            }

            const values = candidates.slice(0, 10);
            return {
                completion: {
                    values,
                    total: candidates.length,
                    hasMore: candidates.length > 10
                }
            };
        });
    }

    public getLogLevel(): string {
        return this.currentLogLevel;
    }

    public getMcpServer(): Server {
        return this.server;
    }

    public async handleHttpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
        return this.handleRequest(req, res);
    }

    public async close(): Promise<void> {
        const active = Array.from(this.sessions.values());
        this.sessions.clear();
        this.transports.clear();
        for (const session of active) {
            try {
                await session.transport.close();
            } catch {
                // ignore
            }
        }
        if (this.httpServer) {
            await new Promise<void>((resolve) => {
                this.httpServer?.close(() => resolve());
            });
            this.httpServer = null;
        }
    }

    private setupErrorHandling(server: Server): void {
        server.onerror = (error) => {
            this.logger.error('[MCP Error]', error);
        };
    }

    private setupCommissarChannel(server: Server): void {
        server.oninitialized = () => {
            const caps = server.getClientCapabilities();
            if (caps?.sampling) {
                const requester = async ({ systemPrompt, userPrompt, maxTokens }: { systemPrompt: string; userPrompt: string; maxTokens: number }) => {
                    const result = await server.createMessage({
                        maxTokens,
                        systemPrompt,
                        messages: [{ role: 'user', content: { type: 'text', text: userPrompt } }],
                    });
                    return result.content.type === 'text' ? result.content.text : null;
                };
                bindSamplingRequester(server, requester);
                // stdio 单客户端：保留全局回退。HTTP 多会话不得写全局，否则后连者覆盖先连者。
                if (this.config.transport !== 'http') {
                    setSamplingRequester(requester);
                }
                this.logger.success('监军通道开启：Host 已授 sampling 能力（反向采样干预就绪）');
            } else {
                bindSamplingRequester(server, null);
                if (this.config.transport !== 'http') {
                    setSamplingRequester(null);
                }
                this.logger.info('Host 未授 sampling 能力：监军走本地棒喝降级通道');
            }
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
                this.logger.write('');
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
            this.logger.write('');
            this.logger.info('──────────────────────────────────────────');
            this.logger.info('Endpoints:');
            this.logger.info(`  Health:  http://${host}:${port}/health`);
            this.logger.info(`  v4:      http://${host}:${port}/v4/dashboard|/amp|/theater|/roles`);
            this.logger.info(`  MCP:     http://${host}:${port}/mcp  (Streamable HTTP：POST 发消息 / GET 建 SSE 流)`);
            this.logger.info(`  MCP alt: http://${host}:${port}/     (同上，兼容旧配置)`);
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

    /**
     * HTTP 会话表无 TTL，异常断开的会话只能靠 onclose 清理；设上限并逐出最老会话，
     * 防长跑 HTTP 模式内存缓慢增长（onclose 未触发的会话 close() 幂等，安全）。
     */
    private evictStaleTransports(): void {
        const MAX_SESSIONS = 128;
        while (this.sessions.size >= MAX_SESSIONS) {
            const oldest = this.sessions.keys().next().value;
            if (oldest === undefined) break;
            const ctx = this.sessions.get(oldest);
            this.sessions.delete(oldest);
            this.transports.delete(oldest);
            try {
                void ctx?.transport.close();
            } catch {
                // 已关闭/半关闭的传输，忽略
            }
            this.logger.debug(`Session evicted (cap ${MAX_SESSIONS}): ${oldest}`);
        }
    }

    private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
        try {
            const url = new URL(req.url || '/', `http://${req.headers.host}`);
            const pathname = url.pathname;
            
            // Handle Streamable HTTP: POST, GET, DELETE
            if ((req.method === 'POST' || req.method === 'GET' || req.method === 'DELETE') && (pathname === '/' || pathname === '/mcp')) {
                const sessionId = req.headers['mcp-session-id'] as string | undefined;
                let session = sessionId ? this.sessions.get(sessionId) : undefined;
                
                if (!session) {
                    if (req.method !== 'POST') {
                        res.writeHead(req.method === 'DELETE' ? 404 : 400, { 'Content-Type': 'text/plain' });
                        res.end(`Missing or invalid session ID for ${req.method} request`);
                        return;
                    }

                    const sessionServer = this.createMcpServerInstance();
                    let initializedSid: string | null = null;
                    let isClosing = false;
                    const transport = new StreamableHTTPServerTransport({
                        sessionIdGenerator: () => randomUUID(),
                        eventStore: this.eventStore,
                        onsessioninitialized: (sid: string) => {
                            initializedSid = sid;
                            this.evictStaleTransports();
                            this.sessions.set(sid, { transport, server: sessionServer });
                            this.transports.set(sid, transport);
                            this.logger.debug(`Session initialized: ${sid}`);
                        }
                    });
                    
                    transport.onclose = () => {
                        if (isClosing) return;
                        isClosing = true;
                        const sid = transport.sessionId || initializedSid;
                        if (sid) {
                            this.logger.debug(`Session closed: ${sid}`);
                            this.sessions.delete(sid);
                            this.transports.delete(sid);
                        }
                    };
                    
                    await sessionServer.connect(transport);
                    session = { transport, server: sessionServer };
                }
                
                await session.transport.handleRequest(req, res);
            }
            else if (pathname.startsWith('/v4/')) {
                let body: unknown = undefined;
                if (req.method === 'POST') {
                    const MAX_V4_BODY = 1_000_000;
                    body = await new Promise((resolve) => {
                        let data = '';
                        let oversized = false;
                        req.on('data', chunk => {
                            if (oversized) return;
                            data += chunk;
                            if (data.length > MAX_V4_BODY) {
                                oversized = true;
                                req.destroy();
                                resolve({ __tooLarge: true });
                            }
                        });
                        req.on('end', () => {
                            if (oversized) return;
                            try {
                                resolve(data ? JSON.parse(data) : {});
                            } catch {
                                resolve({});
                            }
                        });
                        req.on('error', () => resolve(oversized ? { __tooLarge: true } : {}));
                    });
                    if (body && typeof body === 'object' && (body as { __tooLarge?: boolean }).__tooLarge) {
                        res.writeHead(413, { 'Content-Type': 'text/plain' });
                        res.end('Payload Too Large');
                        return;
                    }
                }
                const routed = dispatchV4(req.method || 'GET', pathname, body);
                if (!routed) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Not Found');
                    return;
                }
                // P0-2：仅环回来源获 CORS 授权；非环回不发此头，浏览器同源策略自然拒绝
                const corsOrigin = loopbackOrigin(req.headers.origin);
                if (routed.status === 204) {
                    res.writeHead(
                        204,
                        corsOrigin
                            ? {
                                  'Access-Control-Allow-Origin': corsOrigin,
                                  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                                  'Access-Control-Allow-Headers': 'Content-Type',
                              }
                            : {}
                    );
                    res.end();
                    return;
                }
                res.writeHead(
                    routed.status,
                    corsOrigin
                        ? {
                              'Content-Type': 'application/json; charset=utf-8',
                              'Access-Control-Allow-Origin': corsOrigin,
                          }
                        : { 'Content-Type': 'application/json; charset=utf-8' }
                );
                res.end(JSON.stringify(routed.json));
            }
            // Health check
            else if (req.method === 'GET' && pathname === '/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'ok',
                    service: 'puax-mcp-server',
                    version: this.version,
                    product: '处境、闸门、梦',
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
