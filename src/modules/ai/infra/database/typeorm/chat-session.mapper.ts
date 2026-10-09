import { ChatSession } from '../../../domain/entities/chat-session.entity';
import { ChatSessionSchema } from './chat-session.schema';

export function toDomain(schema: ChatSessionSchema): ChatSession {
  return ChatSession.restore({
    id: schema.id,
    session_id: schema.sessionId,
    user_id: schema.userId,
    created_at: schema.createdAt,
  });
}

export function toPersistence(entity: ChatSession): Partial<ChatSessionSchema> {
  return {
    sessionId: entity.sessionId,
    userId: entity.userId,
  };
}
