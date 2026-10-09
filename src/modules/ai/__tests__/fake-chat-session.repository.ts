import type { ChatSession } from '../domain/entities/chat-session.entity';
import type { IChatSessionRepository } from '../domain/ports/chat-session.repository';

export class FakeChatSessionRepository implements IChatSessionRepository {
  readonly sessions: ChatSession[] = [];

  create(session: ChatSession): Promise<ChatSession> {
    session.setId(this.sessions.length + 1).setCreatedAt(new Date());
    this.sessions.push(session);
    return Promise.resolve(session);
  }

  findBySessionId(sessionId: string): Promise<ChatSession | null> {
    return Promise.resolve(this.sessions.find((s) => s.sessionId === sessionId) ?? null);
  }
}
