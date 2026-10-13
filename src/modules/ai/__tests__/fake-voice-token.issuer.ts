import type {
  IVoiceTokenIssuer,
  VoiceAccess,
  VoiceTokenInput,
} from '../domain/ports/voice-token.port';

export class FakeVoiceTokenIssuer implements IVoiceTokenIssuer {
  readonly issued: VoiceTokenInput[] = [];

  issue(input: VoiceTokenInput): Promise<VoiceAccess> {
    this.issued.push(input);
    return Promise.resolve({
      url: 'wss://voice.test',
      token: `token-${this.issued.length}`,
    });
  }
}
