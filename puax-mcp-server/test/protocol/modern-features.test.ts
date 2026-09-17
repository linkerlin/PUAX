/**
 * MCP 现代特性协议测试（v4.5 通脉 / 4.5.6）
 * 覆盖 roots/list, resources/templates/list, resources/subscribe+unsubscribe,
 * logging/setLevel, completion/complete, elicitation/create 与 capabilities
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { PuaxMcpServer } from '../../src/server/core.js';
import {
  ListRootsResultSchema,
  ListResourceTemplatesResultSchema,
  EmptyResultSchema,
  CompleteResultSchema,
  ElicitResultSchema,
} from '@modelcontextprotocol/sdk/types.js';

describe('MCP Modern Protocol Features (v4.5)', () => {
  let serverInstance: PuaxMcpServer;
  let client: Client;
  let clientTransport: InMemoryTransport;
  let serverTransport: InMemoryTransport;

  beforeAll(async () => {
    serverInstance = new PuaxMcpServer({ quiet: true });
    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    client = new Client(
      { name: 'mcp-modern-test-client', version: '1.0.0' },
      {
        capabilities: {
          roots: { listChanged: true },
          sampling: {},
        },
      }
    );

    await Promise.all([
      serverInstance.getMcpServer().connect(serverTransport),
      client.connect(clientTransport),
    ]);
  });

  afterAll(async () => {
    await client.close();
    await serverInstance.getMcpServer().close();
  });

  test('0. capabilities: Server 声明了 modern 协议能力', () => {
    const caps = client.getServerCapabilities();
    expect(caps).toBeDefined();
    expect(caps?.resources?.subscribe).toBe(true);
    expect(caps?.logging).toBeDefined();
    expect(caps?.completions).toBeDefined();
    expect(caps?.tools).toBeDefined();
    expect(caps?.prompts).toBeDefined();
  });

  test('1. roots/list: 服务端返回工作区根路径', async () => {
    const result = await client.request(
      { method: 'roots/list', params: {} },
      ListRootsResultSchema
    );
    expect(result.roots).toBeDefined();
    expect(result.roots.length).toBeGreaterThanOrEqual(1);
    expect(result.roots[0].uri).toMatch(/^file:\/\//);
    expect(result.roots[0].name).toBe('workspace');
  });

  test('2. resources/templates/list: 服务端声明资源 URI 模板', async () => {
    const result = await client.request(
      { method: 'resources/templates/list', params: {} },
      ListResourceTemplatesResultSchema
    );
    expect(result.resourceTemplates).toBeDefined();
    expect(result.resourceTemplates.length).toBeGreaterThanOrEqual(2);
    const uris = result.resourceTemplates.map((t: { uriTemplate: string }) => t.uriTemplate);
    expect(uris).toContain('puax://skills/{skillId}');
    expect(uris).toContain('puax://situations/{level}');
  });

  test('3. resources/subscribe & unsubscribe: 订阅与退订状态追踪', async () => {
    const testUri = 'puax://skills/military-warrior';

    // 订阅
    await client.request(
      { method: 'resources/subscribe', params: { uri: testUri } },
      EmptyResultSchema
    );
    expect(serverInstance.getSubscribedResources()).toContain(testUri);

    // 退订
    await client.request(
      { method: 'resources/unsubscribe', params: { uri: testUri } },
      EmptyResultSchema
    );
    expect(serverInstance.getSubscribedResources()).not.toContain(testUri);
  });

  test('4. logging/setLevel: 客户端可调节日志级别', async () => {
    await client.request(
      { method: 'logging/setLevel', params: { level: 'debug' } },
      EmptyResultSchema
    );
    expect(serverInstance.getLogLevel()).toBe('debug');

    await client.request(
      { method: 'logging/setLevel', params: { level: 'warning' } },
      EmptyResultSchema
    );
    expect(serverInstance.getLogLevel()).toBe('warning');
  });

  test('5. completion/complete: 客户端 Prompt 参数与 Resource URI 补全', async () => {
    // 补全 prompt 角色参数
    const promptComp = await client.request(
      {
        method: 'completion/complete',
        params: {
          ref: { type: 'ref/prompt', name: 'role' },
          argument: { name: 'id', value: 'buffett' },
        },
      },
      CompleteResultSchema
    );
    expect(promptComp.completion.values).toContain('shaman-buffett');

    // 补全 resource uri
    const resComp = await client.request(
      {
        method: 'completion/complete',
        params: {
          ref: { type: 'ref/resource', uri: 'puax://' },
          argument: { name: 'uri', value: 'verbs' },
        },
      },
      CompleteResultSchema
    );
    expect(resComp.completion.values).toContain('puax://v4/verbs');
  });

  test('6. elicitation/create: 服务端接收并处理 elicitation 请求', async () => {
    const elicitResult = await client.request(
      {
        method: 'elicitation/create',
        params: {
          mode: 'form',
          message: 'Please specify runtime goals',
          requestedSchema: {
            type: 'object',
            properties: {
              goal: { type: 'string', description: 'Primary goal' },
            },
          },
        },
      },
      ElicitResultSchema
    );
    expect(elicitResult.action).toBe('accept');
    expect(elicitResult.content).toBeDefined();
  });
});
