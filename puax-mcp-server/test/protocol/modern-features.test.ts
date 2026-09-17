/**
 * MCP 现代特性：仅测试服务端真实实现的方法。
 * roots/list 与 elicitation/create 属客户端方法，不再伪装 handler。
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { PuaxMcpServer } from '../../src/server/core.js';
import {
  ListResourceTemplatesResultSchema,
  EmptyResultSchema,
  CompleteResultSchema,
} from '@modelcontextprotocol/sdk/types.js';

describe('MCP Modern Protocol Features', () => {
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

  test('0. capabilities: 不谎报 subscribe；保留 logging / completions', () => {
    const caps = client.getServerCapabilities();
    expect(caps).toBeDefined();
    expect(caps?.resources?.subscribe).toBeFalsy();
    expect(caps?.logging).toBeDefined();
    expect(caps?.completions).toBeDefined();
    expect(caps?.tools).toBeDefined();
    expect(caps?.prompts).toBeDefined();
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

});
