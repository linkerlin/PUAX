/**
 * Streamable HTTP 事件仓：支持 Last-Event-ID 续传。
 *
 * 不复用 SDK examples 的 InMemoryEventStore——其 eventId 用 `_` 拼接 streamId，
 * streamId 自身含下划线时 replay 会解错（typescript-sdk#943）。
 * 此处 eventId 与 streamId 分存，永不从 id 里解析 stream。
 */

import type { EventStore, EventId, StreamId } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'crypto';

const MAX_EVENTS = 4096;

interface StoredEvent {
  streamId: StreamId;
  message: JSONRPCMessage;
}

export class MemoryEventStore implements EventStore {
  private events = new Map<EventId, StoredEvent>();

  storeEvent(streamId: StreamId, message: JSONRPCMessage): Promise<EventId> {
    while (this.events.size >= MAX_EVENTS) {
      const oldest = this.events.keys().next().value;
      if (oldest === undefined) break;
      this.events.delete(oldest);
    }
    const eventId = `${Date.now().toString(36)}-${randomUUID()}`;
    this.events.set(eventId, { streamId, message });
    return Promise.resolve(eventId);
  }

  getStreamIdForEventId(eventId: EventId): Promise<StreamId | undefined> {
    return Promise.resolve(this.events.get(eventId)?.streamId);
  }

  async replayEventsAfter(
    lastEventId: EventId,
    { send }: { send: (eventId: EventId, message: JSONRPCMessage) => Promise<void> }
  ): Promise<StreamId> {
    const anchor = this.events.get(lastEventId);
    if (!anchor) return '';
    const streamId = anchor.streamId;
    let passed = false;
    for (const [eventId, stored] of this.events) {
      if (eventId === lastEventId) {
        passed = true;
        continue;
      }
      if (passed && stored.streamId === streamId) {
        await send(eventId, stored.message);
      }
    }
    return streamId;
  }

  size(): number {
    return this.events.size;
  }
}
