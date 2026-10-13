import { ProductPresenter } from '../../products/application/product.presenter';
import { FakeFileStorage } from '../../products/__tests__/fake-file-storage';
import { FakeProductRepository } from '../../products/__tests__/fake-product.repository';
import { buildProduct } from '../../products/__tests__/product.builder';
import { ChatItemsResolver } from '../application/chat-items.resolver';
import { ChatSessionResolver } from '../application/chat-session.resolver';
import { CreateVoiceTokenUseCase } from '../application/use-cases/create-voice-token.usecase';
import { ResolveChatItemsUseCase } from '../application/use-cases/resolve-chat-items.usecase';
import { ChatSession } from '../domain/entities/chat-session.entity';
import { ChatSessionNotFoundError } from '../domain/errors/ai.error';
import { FakeChatSessionRepository } from './fake-chat-session.repository';
import { FakeVoiceTokenIssuer } from './fake-voice-token.issuer';

describe('CreateVoiceTokenUseCase', () => {
  const sessionId = '6f1c2d4e-8a9b-4c3d-9e2f-1a2b3c4d5e6f';
  let sessions: FakeChatSessionRepository;
  let issuer: FakeVoiceTokenIssuer;
  let useCase: CreateVoiceTokenUseCase;

  beforeEach(() => {
    sessions = new FakeChatSessionRepository();
    issuer = new FakeVoiceTokenIssuer();
    useCase = new CreateVoiceTokenUseCase(new ChatSessionResolver(sessions), issuer);
  });

  it('continues a session owned by the user', async () => {
    await sessions.create(ChatSession.create({ sessionId, userId: 1 }));

    const output = await useCase.execute({ userId: 1, session_id: sessionId, item_id: 'item-1' });

    expect(output).toEqual({ url: 'wss://voice.test', token: 'token-1', session_id: sessionId });
    expect(issuer.issued).toEqual([{ identity: '1', sessionId, itemId: 'item-1' }]);
    expect(sessions.sessions).toHaveLength(1);
  });

  it('starts a session bound to the user when none is given', async () => {
    const output = await useCase.execute({ userId: 1 });

    expect(output.session_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(sessions.sessions[0]).toMatchObject({ sessionId: output.session_id, userId: 1 });
    expect(issuer.issued[0].sessionId).toBe(output.session_id);
  });

  it("rejects another user's session without issuing a token", async () => {
    await sessions.create(ChatSession.create({ sessionId, userId: 2 }));

    await expect(useCase.execute({ userId: 1, session_id: sessionId })).rejects.toThrow(
      ChatSessionNotFoundError,
    );
    expect(issuer.issued).toHaveLength(0);
  });

  it('rejects an unknown session without issuing a token', async () => {
    await expect(useCase.execute({ userId: 1, session_id: sessionId })).rejects.toThrow(
      ChatSessionNotFoundError,
    );
    expect(issuer.issued).toHaveLength(0);
  });
});

describe('ResolveChatItemsUseCase', () => {
  const zara = buildProduct({ codigoIdentificacao: 'sku-zara', marca: 'Zara' });
  const levis = buildProduct({ codigoIdentificacao: 'sku-levis', marca: 'Levis' });
  const repository = new FakeProductRepository([zara, levis]);
  const useCase = new ResolveChatItemsUseCase(
    new ChatItemsResolver(repository, new ProductPresenter(new FakeFileStorage())),
  );

  it('returns the cards in the order of the SKUs, deduped, dropping unknown ones', async () => {
    const { items } = await useCase.execute({
      skus: ['sku-levis', 'unknown', 'sku-zara', 'sku-levis'],
    });

    expect(items.map((i) => i.codigoIdentificacao)).toEqual(['sku-levis', 'sku-zara']);
  });

  it('returns no cards for no SKUs', async () => {
    await expect(useCase.execute({ skus: [] })).resolves.toEqual({ items: [] });
  });
});
