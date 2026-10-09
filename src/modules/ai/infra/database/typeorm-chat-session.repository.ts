import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from '../../domain/entities/chat-session.entity';
import { IChatSessionRepository } from '../../domain/ports/chat-session.repository';
import { ChatSessionSchema } from './typeorm/chat-session.schema';
import { toDomain, toPersistence } from './typeorm/chat-session.mapper';

@Injectable()
export class TypeOrmChatSessionRepository implements IChatSessionRepository {
  constructor(
    @InjectRepository(ChatSessionSchema)
    private readonly sessions: Repository<ChatSessionSchema>,
  ) {}

  async create(session: ChatSession): Promise<ChatSession> {
    const saved = await this.sessions.save(this.sessions.create(toPersistence(session)));
    return toDomain(saved);
  }

  async findBySessionId(sessionId: string): Promise<ChatSession | null> {
    const row = await this.sessions.findOne({ where: { sessionId } });
    return row === null ? null : toDomain(row);
  }
}
