import { Inject, Injectable } from '@nestjs/common';
import {
  type IVoiceTokenIssuer,
  VOICE_TOKEN_ISSUER,
  type VoiceAccess,
} from '../../domain/ports/voice-token.port';
import { ChatSessionResolver } from '../chat-session.resolver';

export interface CreateVoiceTokenInput {
  readonly userId: number;
  // Session to continue (same memory as the text chat); omitted, a new one is created.
  readonly session_id?: string;
  readonly item_id?: string;
}

export interface VoiceTokenOutput extends VoiceAccess {
  readonly session_id: string;
}

/**
 * Authorizes a voice conversation. The audio goes straight from the client to
 * the real-time server and the voice agent; the backend only decides who may
 * talk and in which session, through the token it signs.
 */
@Injectable()
export class CreateVoiceTokenUseCase {
  constructor(
    private readonly sessions: ChatSessionResolver,
    @Inject(VOICE_TOKEN_ISSUER)
    private readonly tokenIssuer: IVoiceTokenIssuer,
  ) {}

  async execute({ userId, session_id, item_id }: CreateVoiceTokenInput): Promise<VoiceTokenOutput> {
    const sessionId = await this.sessions.resolveOrCreate(userId, session_id);
    const access = await this.tokenIssuer.issue({
      identity: String(userId),
      sessionId,
      itemId: item_id,
    });
    return { ...access, session_id: sessionId };
  }
}
