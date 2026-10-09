import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ProductPresenter } from '../../../products/application/product.presenter';
import {
  type IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../products/domain/ports/product.repository';
import {
  AI_AGENT,
  type AgentEvent,
  type ChatInput,
  type IAiAgent,
} from '../../domain/ports/ai-agent.port';
import { ChatSession } from '../../domain/entities/chat-session.entity';
import { ChatSessionNotFoundError } from '../../domain/errors/ai.error';
import {
  CHAT_SESSION_REPOSITORY,
  type IChatSessionRepository,
} from '../../domain/ports/chat-session.repository';

export interface StreamChatInput extends Omit<ChatInput, 'session_id'> {
  readonly userId: number;
  readonly first_interaction?: boolean;
  readonly session_id?: string;
}

interface AgentDonePayload {
  readonly response?: string;
  readonly skus?: string[];
}

@Injectable()
export class StreamChatUseCase {
  constructor(
    @Inject(AI_AGENT)
    private readonly aiAgent: IAiAgent,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly presenter: ProductPresenter,
    @Inject(CHAT_SESSION_REPOSITORY)
    private readonly chatSessionRepository: IChatSessionRepository,
  ) {}

  async execute(input: StreamChatInput, signal: AbortSignal): Promise<AsyncIterable<AgentEvent>> {
    const { userId, first_interaction, session_id, ...chat } = input;
    const sessionId = await this.resolveSession(userId, first_interaction, session_id);

    const events = await this.aiAgent.streamChat({ ...chat, session_id: sessionId }, signal);
    return this.withSessionAndItems(events, sessionId);
  }

  private async resolveSession(
    userId: number,
    firstInteraction: boolean | undefined,
    sessionId: string | undefined,
  ): Promise<string | undefined> {
    if (firstInteraction) {
      const session = ChatSession.create({ sessionId: randomUUID(), userId });
      return (await this.chatSessionRepository.create(session)).sessionId;
    }
    if (sessionId === undefined) return undefined;

    // Same error for unknown and foreign sessions, so ids of other users can't be probed.
    const session = await this.chatSessionRepository.findBySessionId(sessionId);
    if (!session?.isOwnedBy(userId)) {
      throw new ChatSessionNotFoundError();
    }
    return session.sessionId;
  }

  private async *withSessionAndItems(
    events: AsyncIterable<AgentEvent>,
    sessionId: string | undefined,
  ): AsyncIterable<AgentEvent> {
    if (sessionId) {
      yield { event: 'session', data: JSON.stringify({ session_id: sessionId }) };
    }
    for await (const event of events) {
      yield event.event === 'done' ? await this.toDoneEvent(event) : event;
    }
  }

  private async toDoneEvent(event: AgentEvent): Promise<AgentEvent> {
    const { response, skus = [] } = JSON.parse(event.data) as AgentDonePayload;
    const uniqueSkus = [...new Set(skus)];

    const products = await this.productRepository.findByCodigosIdentificacao(uniqueSkus);
    const bySku = new Map(products.map((product) => [product.codigoIdentificacao, product]));
    const items = uniqueSkus.flatMap((sku) => {
      const product = bySku.get(sku);
      return product ? [this.presenter.toOutput(product)] : [];
    });

    return { ...event, data: JSON.stringify({ response, items }) };
  }
}
