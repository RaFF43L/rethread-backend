import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserSchema } from '../../../../users/infra/database/typeorm/user.schema';

@Entity('chat_sessions')
@Unique('UQ_chat_sessions_session_id', ['sessionId'])
export class ChatSessionSchema {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'PK_chat_sessions' })
  id!: number;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId!: string;

  @Column({ name: 'user_id' })
  userId!: number;

  @ManyToOne(() => UserSchema, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_chat_sessions_user' })
  user!: UserSchema;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
