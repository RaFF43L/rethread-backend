import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { AiAgentModule } from './ai-agent.module';
import { StreamChatUseCase } from './application/use-cases/stream-chat.usecase';
import { CHAT_SESSION_REPOSITORY } from './domain/ports/chat-session.repository';
import { AiController } from './http/ai.controller';
import { ChatSessionSchema } from './infra/database/typeorm/chat-session.schema';
import { TypeOrmChatSessionRepository } from './infra/database/typeorm-chat-session.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSessionSchema]),
    AiAgentModule,
    ProductsModule,
    UsersModule,
  ],
  controllers: [AiController],
  providers: [
    StreamChatUseCase,
    { provide: CHAT_SESSION_REPOSITORY, useClass: TypeOrmChatSessionRepository },
  ],
})
export class AiModule {}
