/**
 * HTTP 多会话 Streamable HTTP 集成测试
 * 验证：
 * 1. 多个客户端通过 Streamable HTTP 并发/先后连接时，分别被分配独立的 MCP Server 实例与 Session ID；
 * 2. 杜绝 SDK 单 Server 实例重复 connect 导致的第二个连接 500 崩溃；
 * 3. 各客户端均能独立完成 initialize, listTools 与 callTool 操作；
 * 4. 客户端 terminateSession 显式注销后不影响其他活跃会话。
 */

import { createServer, type Server as HttpServer } from 'http';
import { type AddressInfo } from 'net';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { PuaxMcpServer } from '../../src/server/core.js';

describe('HTTP Multi-Session Streamable HTTP Integration', () => {
  let puaxServer: PuaxMcpServer;
  let httpServer: HttpServer;
  let serverUrl: URL;

  beforeAll(async () => {
    puaxServer = new PuaxMcpServer({ quiet: true, transport: 'http' });
    httpServer = createServer((req, res) => {
      void puaxServer.handleHttpRequest(req, res);
    });

    await new Promise<void>((resolve) => {
      httpServer.listen(0, '127.0.0.1', () => resolve());
    });

    const addr = httpServer.address() as AddressInfo;
    serverUrl = new URL(`http://127.0.0.1:${addr.port}/mcp`);
  });

  afterAll(async () => {
    await puaxServer.close();
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  test('支持两个独立客户端并发初始化且互不干扰（无 500 崩溃）', async () => {
    // 客户端 1
    const transport1 = new StreamableHTTPClientTransport(serverUrl);
    const client1 = new Client(
      { name: 'test-client-1', version: '1.0.0' },
      { capabilities: {} }
    );

    // 客户端 2
    const transport2 = new StreamableHTTPClientTransport(serverUrl);
    const client2 = new Client(
      { name: 'test-client-2', version: '1.0.0' },
      { capabilities: {} }
    );

    try {
      // 两个客户端同时或先后建立连接
      await client1.connect(transport1);
      await client2.connect(transport2);

      // 会话 ID 必须独立且非空
      expect(transport1.sessionId).toBeDefined();
      expect(transport2.sessionId).toBeDefined();
      expect(transport1.sessionId).not.toBe(transport2.sessionId);

      // 两个客户端均可独立列出工具
      const [tools1, tools2] = await Promise.all([
        client1.listTools(),
        client2.listTools(),
      ]);
      expect(tools1.tools.length).toBeGreaterThan(0);
      expect(tools2.tools.length).toBeGreaterThan(0);
      expect(tools1.tools.map(t => t.name)).toEqual(tools2.tools.map(t => t.name));

      // 两个客户端分别执行 callTool (puax_tick)
      const res1 = await client1.callTool({
        name: 'puax_tick',
        arguments: { session_id: 'session-client-1', event: 'Manual', message: 'client-1-ping' },
      });
      expect(res1.content).toBeDefined();

      const res2 = await client2.callTool({
        name: 'puax_tick',
        arguments: { session_id: 'session-client-2', event: 'Manual', message: 'client-2-ping' },
      });
      expect(res2.content).toBeDefined();

      // Client 1 终止会话，不影响 Client 2 仍可通信
      await transport1.terminateSession();

      const res2After = await client2.callTool({
        name: 'puax_tick',
        arguments: { session_id: 'session-client-2', event: 'Manual', message: 'client-2-still-alive' },
      });
      expect(res2After.content).toBeDefined();
    } finally {
      try { await client1.close(); } catch {}
      try { await client2.close(); } catch {}
    }
  });

  test('未占用 GET 的会话可建立 SSE 流（eventStore 续传入口）', async () => {
    const init = await fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'sse-probe', version: '0' },
        },
      }),
    });
    expect(init.status).toBe(200);
    const sid = init.headers.get('mcp-session-id');
    expect(sid).toBeTruthy();
    await init.body?.cancel();

    const sse = await fetch(serverUrl, {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
        'mcp-session-id': sid as string,
      },
    });
    expect(sse.status).toBe(200);
    expect(sse.headers.get('content-type') || '').toMatch(/text\/event-stream/);
    sse.body?.cancel();
  });
});
