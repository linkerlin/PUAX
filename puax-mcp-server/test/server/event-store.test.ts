import { MemoryEventStore } from '../../src/server/event-store.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

const msg = (id: number): JSONRPCMessage => ({ jsonrpc: '2.0', id, method: 'ping', params: {} });

describe('MemoryEventStore', () => {
  it('storeEvent 返回独立 eventId，getStreamIdForEventId 能找回 stream', async () => {
    const store = new MemoryEventStore();
    const id = await store.storeEvent('stream-alpha', msg(1));
    expect(id.includes('_')).toBe(false);
    expect(await store.getStreamIdForEventId(id)).toBe('stream-alpha');
  });

  it('replayEventsAfter 只重放同 stream 且在锚点之后的事件', async () => {
    const store = new MemoryEventStore();
    const a1 = await store.storeEvent('A', msg(1));
    await store.storeEvent('B', msg(99));
    const a2 = await store.storeEvent('A', msg(2));
    const a3 = await store.storeEvent('A', msg(3));

    const replayed: Array<{ id: string; n: number }> = [];
    const stream = await store.replayEventsAfter(a1, {
      send: async (eventId, message) => {
        replayed.push({ id: eventId, n: (message as { id: number }).id });
      },
    });
    expect(stream).toBe('A');
    expect(replayed.map((e) => e.n)).toEqual([2, 3]);
    expect(replayed.map((e) => e.id)).toEqual([a2, a3]);
  });

  it('未知 lastEventId 返回空 stream、不发送', async () => {
    const store = new MemoryEventStore();
    await store.storeEvent('A', msg(1));
    const sent: string[] = [];
    const stream = await store.replayEventsAfter('no-such-id', {
      send: async (eventId) => {
        sent.push(eventId);
      },
    });
    expect(stream).toBe('');
    expect(sent).toEqual([]);
  });
});
