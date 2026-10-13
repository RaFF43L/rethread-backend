import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ChatSession } from '../domain/entities/chat-session.entity';
import { ChatSessionNotFoundError } from '../domain/errors/ai.error';
import {
  CHAT_SESSION_REPOSITORY,
  type IChatSessionRepository,
} from '../domain/ports/chat-session.repository';

export interface ResolveChatSessionInput {
  readonly userId: number;
  // Creates a new session bound to the user (any session_id is ignored).
  readonly firstInteraction?: boolean;
  readonly sessionId?: string;
}

/** Which chat session a request belongs to; shared by the text and voice chats. */
@Injectable()
export class ChatSessionResolver {
  constructor(
    @Inject(CHAT_SESSION_REPOSITORY)
    private readonly chatSessionRepository: IChatSessionRepository,
  ) {}

  /** Text chat: no session (one-off message) unless one is given or created. */
  async resolve({
    userId,
    firstInteraction,
    sessionId,
  }: ResolveChatSessionInput): Promise<string | undefined> {
    if (firstInteraction) return this.create(userId);
    if (sessionId === undefined) return undefined;
    return this.findOwned(userId, sessionId);
  }

  /** Voice chat: always has memory, so a new session when none is given. */
  async resolveOrCreate(userId: number, sessionId?: string): Promise<string> {
    return sessionId === undefined ? this.create(userId) : this.findOwned(userId, sessionId);
  }

  private async create(userId: number): Promise<string> {
    const session = ChatSession.create({ sessionId: randomUUID(), userId });
    return (await this.chatSessionRepository.create(session)).sessionId;
  }

  private async findOwned(userId: number, sessionId: string): Promise<string> {
    // Same error for unknown and foreign sessions, so ids of other users can't be probed.
    const session = await this.chatSessionRepository.findBySessionId(sessionId);
    if (!session?.isOwnedBy(userId)) {
      throw new ChatSessionNotFoundError();
    }
    return session.sessionId;
  }
}
