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
  const createVoiceToken = { execute: jest.fn() };
  const resolveChatItems = { execute: jest.fn() };

  const controller = (streamChat: unknown = { execute: jest.fn() }) =>
    new AiController(streamChat as never, createVoiceToken as never, resolveChatItems as never);

  it('relays agent events as SSE frames', async () => {
    async function* events(): AsyncIterable<AgentEvent> {
      yield { event: 'node', data: '{"node":"sizing"}' };
      yield { event: 'token', data: 'line1\nline2' };
    }
    const streamChat = { execute: jest.fn().mockResolvedValue(events()) };
    const res = fakeResponse();

    await controller(streamChat).chat(dto, userId, res as unknown as Response);

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

    await controller(streamChat).chat(dto, userId, res as unknown as Response);

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

    await controller(streamChat).chat(dto, userId, res as unknown as Response);
    res.emit('close');

    expect(signal.aborted).toBe(true);
  });

  it('issues a voice token for the signed-in user', () => {
    const body = { session_id: '6f1c2d4e-8a9b-4c3d-9e2f-1a2b3c4d5e6f', item_id: 'item-1' };

    void controller().voiceToken(body, userId);

    expect(createVoiceToken.execute).toHaveBeenCalledWith({ ...body, userId });
  });

  it('delegates SKU resolution', () => {
    void controller().items({ skus: ['sku-1'] });

    expect(resolveChatItems.execute).toHaveBeenCalledWith({ skus: ['sku-1'] });
  });
});
