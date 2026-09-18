/**
 * 心跳后 tools/list_changed：默认 13 动词，inject 后揭示随访工具。
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ListToolsResultSchema, ToolListChangedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';
import { PuaxMcpServer } from '../../src/server/core.js';
import { V4_PUBLIC_VERBS } from '../../src/core/v4-dashboard.js';

describe('tools/list_changed 渐进暴露', () => {
  const original = process.env.PUAX_TOOL_SURFACE;
  let serverInstance: PuaxMcpServer;
  let client: Client;

  beforeAll(async () => {
    delete process.env.PUAX_TOOL_SURFACE;
    serverInstance = new PuaxMcpServer({ quiet: true });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    client = new Client({ name: 'tool-surface-test', version: '1.0.0' }, { capabilities: {} });
    await Promise.all([
      serverInstance.getMcpServer().connect(serverTransport),
      client.connect(clientTransport),
    ]);
  });

  afterAll(async () => {
    await client.close();
    await serverInstance.getMcpServer().close();
    if (original === undefined) delete process.env.PUAX_TOOL_SURFACE;
    else process.env.PUAX_TOOL_SURFACE = original;
  });

  it('initialize 只声明 tools.listChanged，不谎报 prompts/resources', () => {
    const caps = client.getServerCapabilities();
    expect(caps?.tools?.listChanged).toBe(true);
    expect(caps?.prompts?.listChanged).toBeFalsy();
    expect(caps?.resources?.listChanged).toBeFalsy();
  });

  it('默认 tools/list 仅 13 黄金动词；inject 心跳后通知并增补随访工具', async () => {
    const before = await client.request({ method: 'tools/list', params: {} }, ListToolsResultSchema);
    expect(before.tools.map((t) => t.name)).toEqual([...V4_PUBLIC_VERBS]);

    let notified = 0;
    client.setNotificationHandler(ToolListChangedNotificationSchema, () => {
      notified += 1;
    });

    await client.callTool({
      name: 'puax_tick',
      arguments: {
        session_id: `surface-${Date.now()}`,
        event: 'UserPromptSubmit',
        message: '为什么还不行？我要放弃了',
        force: true,
        skip_detect: true,
        detected_triggers: ['user_frustration', 'giving_up_language'],
      },
    });

    expect(notified).toBeGreaterThanOrEqual(1);
    const after = await client.request({ method: 'tools/list', params: {} }, ListToolsResultSchema);
    const names = after.tools.map((t) => t.name);
    expect(names.slice(0, V4_PUBLIC_VERBS.length)).toEqual([...V4_PUBLIC_VERBS]);
    expect(names).toContain('puax_detect_trigger');
    expect(names).toContain('get_role_with_methodology');
    expect(names.length).toBeGreaterThan(V4_PUBLIC_VERBS.length);
    expect(names.length).toBeLessThan((before.tools.length) + 20);
  });
});
