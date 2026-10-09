import type { ChatSession } from '../entities/chat-session.entity';

export const CHAT_SESSION_REPOSITORY = Symbol('CHAT_SESSION_REPOSITORY');

export interface IChatSessionRepository {
  create(session: ChatSession): Promise<ChatSession>;
  findBySessionId(sessionId: string): Promise<ChatSession | null>;
}
