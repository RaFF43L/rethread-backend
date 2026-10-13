import { Inject, Injectable } from '@nestjs/common';
import {
  AI_AGENT,
  type AgentEvent,
  type ChatInput,
  type IAiAgent,
} from '../../domain/ports/ai-agent.port';
import { ChatItemsResolver } from '../chat-items.resolver';
import { ChatSessionResolver } from '../chat-session.resolver';

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
    private readonly sessions: ChatSessionResolver,
    private readonly items: ChatItemsResolver,
  ) {}

  async execute(input: StreamChatInput, signal: AbortSignal): Promise<AsyncIterable<AgentEvent>> {
    const { userId, first_interaction, session_id, ...chat } = input;
    const sessionId = await this.sessions.resolve({
      userId,
      firstInteraction: first_interaction,
      sessionId: session_id,
    });

    const events = await this.aiAgent.streamChat({ ...chat, session_id: sessionId }, signal);
    return this.withSessionAndItems(events, sessionId);
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
    const items = await this.items.resolve(skus);
    return { ...event, data: JSON.stringify({ response, items }) };
  }
}
