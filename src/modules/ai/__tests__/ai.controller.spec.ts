import { EventEmitter } from 'node:events';
import type { Response } from 'express';
import type { AgentEvent } from '../domain/ports/ai-agent.port';
import { AiController } from '../http/ai.controller';

function fakeResponse() {
  const res = Object.assign(new EventEmitter(), {
    chunks: [] as string[],
    status: jest.fn(),
    set: jest.fn(),
    flushHeaders: jest.fn(),
    write: jest.fn((chunk: string) => res.chunks.push(chunk)),
    end: jest.fn(),
  });
  res.status.mockReturnValue(res);
  return res;
}

describe('AiController', () => {
  const dto = { message: 'veste 40?', item_id: 'item-1' };
  const userId = 1;

  it('relays agent events as SSE frames', async () => {
    async function* events(): AsyncIterable<AgentEvent> {
      yield { event: 'node', data: '{"node":"sizing"}' };
      yield { event: 'token', data: 'line1\nline2' };
    }
    const streamChat = { execute: jest.fn().mockResolvedValue(events()) };
    const res = fakeResponse();

    await new AiController(streamChat as never).chat(dto, userId, res as unknown as Response);

    expect(streamChat.execute).toHaveBeenCalledWith({ ...dto, userId }, expect.any(AbortSignal));
    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({ 'Content-Type': 'text/event-stream' }),
    );
    expect(res.chunks).toEqual([
      'event: node\ndata: {"node":"sizing"}\n\n',
      'event: token\ndata: line1\ndata: line2\n\n',
    ]);
    expect(res.end).toHaveBeenCalled();
  });

  it('emits an error event when the upstream stream fails', async () => {
    async function* events(): AsyncIterable<AgentEvent> {
      yield { event: 'node', data: '{}' };
      throw new Error('boom');
    }
    const streamChat = { execute: jest.fn().mockResolvedValue(events()) };
    const res = fakeResponse();

    await new AiController(streamChat as never).chat(dto, userId, res as unknown as Response);

    expect(res.chunks.at(-1)).toContain('event: error');
    expect(res.end).toHaveBeenCalled();
  });

  it('aborts the upstream request when the client disconnects', async () => {
    let signal!: AbortSignal;
    const streamChat = {
      execute: jest.fn((_input, s: AbortSignal) => {
        signal = s;
        return Promise.resolve((async function* () {})());
      }),
    };
    const res = fakeResponse();

    await new AiController(streamChat as never).chat(dto, userId, res as unknown as Response);
    res.emit('close');

    expect(signal.aborted).toBe(true);
  });
});
