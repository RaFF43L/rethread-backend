import { Readable, pipeline } from 'node:stream';
import type { AgentEvent } from '../domain/ports/ai-agent.port';
import { SseParser } from '../infra/agent/sse-parser';

async function parse(chunks: string[]): Promise<AgentEvent[]> {
  const parser = new SseParser();
  pipeline(Readable.from(chunks.map((c) => Buffer.from(c))), parser, () => {});
  const events: AgentEvent[] = [];
  for await (const event of parser) events.push(event);
  return events;
}

describe('SseParser', () => {
  it('parses named events and defaults to "message"', async () => {
    const events = await parse(['event: node\ndata: {"a":1}\n\ndata: plain\n\n']);
    expect(events).toEqual([
      { event: 'node', data: '{"a":1}' },
      { event: 'message', data: 'plain' },
    ]);
  });

  it('joins multi-line data and keeps the id', async () => {
    const events = await parse(['id: 7\ndata: one\ndata: two\n\n']);
    expect(events).toEqual([{ event: 'message', data: 'one\ntwo', id: '7' }]);
  });

  it('handles events and CRLF split across chunks', async () => {
    const events = await parse(['event: tok', 'en\r', '\ndata: he', 'llo\r\n', '\r\n']);
    expect(events).toEqual([{ event: 'token', data: 'hello' }]);
  });

  it('ignores comments and events without data', async () => {
    const events = await parse([': ping\n\nevent: empty\n\ndata: ok\n\n']);
    expect(events).toEqual([{ event: 'message', data: 'ok' }]);
  });

  it('decodes multi-byte characters split across chunks', async () => {
    const bytes = Buffer.from('data: calça\n\n');
    const parser = new SseParser();
    pipeline(Readable.from([bytes.subarray(0, 10), bytes.subarray(10)]), parser, () => {});
    const events: AgentEvent[] = [];
    for await (const event of parser) events.push(event);
    expect(events).toEqual([{ event: 'message', data: 'calça' }]);
  });

  it('flushes a final event without trailing blank line', async () => {
    const events = await parse(['data: last']);
    expect(events).toEqual([{ event: 'message', data: 'last' }]);
  });
});
