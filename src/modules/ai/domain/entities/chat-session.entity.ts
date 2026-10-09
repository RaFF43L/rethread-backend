import { BaseEntity } from '../../../../shared/kernel/base-entity';

export interface ChatSessionRow {
  id?: number;
  session_id: string;
  user_id: number;
  created_at?: Date;
}

interface CreateChatSessionProps {
  sessionId: string;
  userId: number;
}

export class ChatSession extends BaseEntity {
  private constructor(
    public sessionId: string,
    public userId: number,
  ) {
    super();
  }

  static create(props: CreateChatSessionProps): ChatSession {
    return new ChatSession(props.sessionId, props.userId);
  }

  static restore(row: ChatSessionRow): ChatSession {
    return new ChatSession(row.session_id, row.user_id).setId(row.id).setCreatedAt(row.created_at);
  }

  isOwnedBy(userId: number): boolean {
    return this.userId === userId;
  }
}
