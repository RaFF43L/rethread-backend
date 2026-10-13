import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';
import type {
  IVoiceTokenIssuer,
  VoiceAccess,
  VoiceTokenInput,
} from '../../domain/ports/voice-token.port';

// Only needs to last until the client connects; a new one is issued per call.
const TOKEN_TTL = '10m';

export const voiceRoomName = (sessionId: string) => `voice-${sessionId}`;

/**
 * Signs LiveKit access tokens locally with the API secret (no network call).
 * The voice agent (rethread-agents) trusts the `session_id` attribute because
 * only the holder of the secret can issue it.
 */
@Injectable()
export class LiveKitVoiceTokenIssuer implements IVoiceTokenIssuer {
  constructor(private readonly config: ConfigService) {}

  async issue({ identity, sessionId, itemId }: VoiceTokenInput): Promise<VoiceAccess> {
    const accessToken = new AccessToken(
      this.config.getOrThrow<string>('LIVEKIT_API_KEY'),
      this.config.getOrThrow<string>('LIVEKIT_API_SECRET'),
      {
        identity,
        ttl: TOKEN_TTL,
        attributes: { session_id: sessionId, ...(itemId && { item_id: itemId }) },
      },
    );
    accessToken.addGrant({
      roomJoin: true,
      room: voiceRoomName(sessionId),
      canPublish: true,
      canSubscribe: true,
    });

    return {
      url: this.config.getOrThrow<string>('LIVEKIT_URL'),
      token: await accessToken.toJwt(),
    };
  }
}
