import type { ConfigService } from '@nestjs/config';
import { TokenVerifier } from 'livekit-server-sdk';
import { LiveKitVoiceTokenIssuer } from '../infra/voice/livekit-voice-token.adapter';

const ENV: Record<string, string> = {
  LIVEKIT_URL: 'wss://rethread.livekit.test',
  LIVEKIT_API_KEY: 'test-key',
  LIVEKIT_API_SECRET: 'test-secret-with-at-least-32-characters',
};

const config = {
  getOrThrow: (key: string) => {
    if (!(key in ENV)) throw new Error(`Missing ${key}`);
    return ENV[key];
  },
} as unknown as ConfigService;

describe('LiveKitVoiceTokenIssuer', () => {
  const issuer = new LiveKitVoiceTokenIssuer(config);
  const verifier = new TokenVerifier(ENV.LIVEKIT_API_KEY, ENV.LIVEKIT_API_SECRET);
  const sessionId = '6f1c2d4e-8a9b-4c3d-9e2f-1a2b3c4d5e6f';

  it('signs a token for the session room carrying the session for the voice agent', async () => {
    const access = await issuer.issue({ identity: '7', sessionId, itemId: 'item-1' });
    const claims = await verifier.verify(access.token);

    expect(access.url).toBe(ENV.LIVEKIT_URL);
    expect(claims.sub).toBe('7');
    expect(claims.attributes).toEqual({ session_id: sessionId, item_id: 'item-1' });
    expect(claims.video).toMatchObject({
      roomJoin: true,
      room: `voice-${sessionId}`,
      canPublish: true,
      canSubscribe: true,
    });
  });

  it('expires in 10 minutes', async () => {
    const { token } = await issuer.issue({ identity: '7', sessionId });
    const claims = (await verifier.verify(token)) as { exp?: number; nbf?: number };

    expect((claims.exp ?? 0) - (claims.nbf ?? 0)).toBe(600);
  });

  it('omits the item when there is none', async () => {
    const { token } = await issuer.issue({ identity: '7', sessionId });

    expect((await verifier.verify(token)).attributes).toEqual({ session_id: sessionId });
  });

  it('cannot be verified with another secret', async () => {
    const { token } = await issuer.issue({ identity: '7', sessionId });

    await expect(new TokenVerifier('test-key', 'another-secret').verify(token)).rejects.toThrow();
  });
});
