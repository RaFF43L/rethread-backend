import { Inject, Injectable } from '@nestjs/common';
import type { AuthTokens } from '../../domain/entities/auth-tokens.entity';
import {
  IDENTITY_PROVIDER,
  type IIdentityProvider,
} from '../../domain/ports/identity-provider.port';
import type { RefreshTokenInput } from '../dto/auth.dto';

// Issues new access/id tokens from a still-valid refresh token. A revoked or
// expired refresh token results in SessionExpiredError (401).
@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(IDENTITY_PROVIDER)
    private readonly identityProvider: IIdentityProvider,
  ) {}

  async execute(input: RefreshTokenInput): Promise<AuthTokens> {
    const tokens = await this.identityProvider.refreshSession(input.email, input.refreshToken);
    // Without refresh token rotation the provider does not return a new one;
    // the client keeps using the same refresh token.
    return { ...tokens, refreshToken: tokens.refreshToken ?? input.refreshToken };
  }
}
