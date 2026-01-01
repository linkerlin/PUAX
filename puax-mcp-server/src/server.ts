import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ErrorCode,
    McpError
} from '@modelcontextprotocol/sdk/types.js';
import { Tools } from './tools.js';
import { promptManager } from './prompts/index.js';

export class PuaxMcpServer {
    private server: Server;

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
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        
        // 初始化时加载角色数据
        await promptManager.initialize();
        
        console.error('PUAX MCP Server started successfully');
    }
}
