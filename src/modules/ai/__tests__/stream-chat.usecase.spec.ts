import { ProductPresenter } from '../../products/application/product.presenter';
import { FakeFileStorage } from '../../products/__tests__/fake-file-storage';
import { FakeProductRepository } from '../../products/__tests__/fake-product.repository';
import { buildProduct } from '../../products/__tests__/product.builder';
import { StreamChatUseCase } from '../application/use-cases/stream-chat.usecase';
import { ChatSession } from '../domain/entities/chat-session.entity';
import { ChatSessionNotFoundError } from '../domain/errors/ai.error';
import type { AgentEvent, ChatInput } from '../domain/ports/ai-agent.port';
import { FakeChatSessionRepository } from './fake-chat-session.repository';

async function collect(events: AsyncIterable<AgentEvent>): Promise<AgentEvent[]> {
  const result: AgentEvent[] = [];
  for await (const event of events) result.push(event);
  return result;
}

describe('StreamChatUseCase', () => {
  const sentToAgent: ChatInput[] = [];
  let sessions: FakeChatSessionRepository;

  const setup = (agentEvents: AgentEvent[] = []) => {
    sentToAgent.length = 0;
    sessions = new FakeChatSessionRepository();
    const zara = buildProduct({ codigoIdentificacao: 'sku-zara', marca: 'Zara' });
    const levis = buildProduct({ codigoIdentificacao: 'sku-levis', marca: 'Levis' });
    const repository = new FakeProductRepository([zara, levis]);
    const presenter = new ProductPresenter(new FakeFileStorage());
    const aiAgent = {
      createItem: jest.fn(),
      updateItem: jest.fn(),
      streamChat: async (input: ChatInput) => {
        sentToAgent.push(input);
        return (async function* () {
          yield* agentEvents;
        })();
      },
    };
    return new StreamChatUseCase(aiAgent, repository, presenter, sessions);
  };

  const signal = new AbortController().signal;
  const base = { message: 'oi', userId: 1 };

  it('passes intermediate events through untouched', async () => {
    const token = { event: 'token', data: '{"text":"oi"}' };
    const useCase = setup([token]);

    const events = await collect(await useCase.execute(base, signal));

    expect(events).toEqual([token]);
  });

  it('replaces the done payload with the response and the matching products', async () => {
    const useCase = setup([
      {
        event: 'done',
        data: JSON.stringify({
          response: 'Leve a Calça Levis',
          skus: ['sku-levis', 'unknown', 'sku-zara', 'sku-levis'],
          intents: ['style_consulting'],
        }),
      },
    ]);

    const [done] = await collect(await useCase.execute(base, signal));
    const payload = JSON.parse(done.data);

    expect(done.event).toBe('done');
    expect(Object.keys(payload)).toEqual(['response', 'items']);
    expect(payload.response).toBe('Leve a Calça Levis');
    expect(
      payload.items.map((i: { codigoIdentificacao: string }) => i.codigoIdentificacao),
    ).toEqual(['sku-levis', 'sku-zara']);
  });

  it('returns an empty item list when the agent sends no skus', async () => {
    const useCase = setup([{ event: 'done', data: JSON.stringify({ response: 'Olá!' }) }]);

    const [done] = await collect(await useCase.execute(base, signal));

    expect(JSON.parse(done.data)).toEqual({ response: 'Olá!', items: [] });
  });

  describe('sessions', () => {
    const sessionId = '6f1c2d4e-8a9b-4c3d-9e2f-1a2b3c4d5e6f';

    it('creates a session bound to the user on the first interaction', async () => {
      const useCase = setup([{ event: 'token', data: '{}' }]);

      const events = await collect(
        await useCase.execute({ ...base, first_interaction: true, session_id: 'ignored' }, signal),
      );

      expect(events[0].event).toBe('session');
      const { session_id } = JSON.parse(events[0].data);
      expect(session_id).toMatch(/^[0-9a-f-]{36}$/);
      expect(session_id).not.toBe('ignored');
      expect(sessions.sessions).toHaveLength(1);
      expect(sessions.sessions[0]).toMatchObject({ sessionId: session_id, userId: 1 });
      expect(sentToAgent[0].session_id).toBe(session_id);
      expect(events[1].event).toBe('token');
    });

    it('reuses a session owned by the user', async () => {
      const useCase = setup();
      await sessions.create(ChatSession.create({ sessionId, userId: 1 }));

      const events = await collect(
        await useCase.execute({ ...base, session_id: sessionId }, signal),
      );

      expect(JSON.parse(events[0].data)).toEqual({ session_id: sessionId });
      expect(sentToAgent[0].session_id).toBe(sessionId);
    });

    it("rejects another user's session without calling the agent", async () => {
      const useCase = setup();
      await sessions.create(ChatSession.create({ sessionId, userId: 2 }));

      await expect(useCase.execute({ ...base, session_id: sessionId }, signal)).rejects.toThrow(
        ChatSessionNotFoundError,
      );
      expect(sentToAgent).toHaveLength(0);
    });

    it('rejects an unknown session', async () => {
      const useCase = setup();

      await expect(useCase.execute({ ...base, session_id: sessionId }, signal)).rejects.toThrow(
        ChatSessionNotFoundError,
      );
      expect(sentToAgent).toHaveLength(0);
    });

    it('sends a one-off message without session when none is given', async () => {
      const useCase = setup();

      const events = await collect(await useCase.execute(base, signal));

      expect(events).toEqual([]);
      expect(sentToAgent[0].session_id).toBeUndefined();
      expect(sentToAgent[0]).not.toHaveProperty('userId');
      expect(sentToAgent[0]).not.toHaveProperty('first_interaction');
    });
  });
});
