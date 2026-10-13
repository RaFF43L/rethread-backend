export const VOICE_TOKEN_ISSUER = Symbol('VOICE_TOKEN_ISSUER');

export interface VoiceTokenInput {
  // Who joins the voice room (the signed-in user).
  readonly identity: string;
  // Chat session the voice agent continues: same memory as the text chat.
  readonly sessionId: string;
  // Piece the customer is looking at, if any.
  readonly itemId?: string;
}

export interface VoiceAccess {
  // Real-time server the client connects to.
  readonly url: string;
  // Short-lived token that lets the client join the session's voice room.
  readonly token: string;
}

export interface IVoiceTokenIssuer {
  issue(input: VoiceTokenInput): Promise<VoiceAccess>;
}
