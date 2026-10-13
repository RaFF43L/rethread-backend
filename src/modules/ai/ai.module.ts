import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { AiAgentModule } from './ai-agent.module';
import { ChatItemsResolver } from './application/chat-items.resolver';
import { ChatSessionResolver } from './application/chat-session.resolver';
import { CreateVoiceTokenUseCase } from './application/use-cases/create-voice-token.usecase';
import { ResolveChatItemsUseCase } from './application/use-cases/resolve-chat-items.usecase';
import { StreamChatUseCase } from './application/use-cases/stream-chat.usecase';
import { CHAT_SESSION_REPOSITORY } from './domain/ports/chat-session.repository';
import { VOICE_TOKEN_ISSUER } from './domain/ports/voice-token.port';
import { AiController } from './http/ai.controller';
import { ChatSessionSchema } from './infra/database/typeorm/chat-session.schema';
import { TypeOrmChatSessionRepository } from './infra/database/typeorm-chat-session.repository';
import { LiveKitVoiceTokenIssuer } from './infra/voice/livekit-voice-token.adapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSessionSchema]),
    AiAgentModule,
    ProductsModule,
    UsersModule,
  ],
  controllers: [AiController],
  providers: [
    ChatSessionResolver,
    ChatItemsResolver,
    StreamChatUseCase,
    CreateVoiceTokenUseCase,
    ResolveChatItemsUseCase,
    { provide: CHAT_SESSION_REPOSITORY, useClass: TypeOrmChatSessionRepository },
    { provide: VOICE_TOKEN_ISSUER, useClass: LiveKitVoiceTokenIssuer },
  ],
})
export class AiModule {}
