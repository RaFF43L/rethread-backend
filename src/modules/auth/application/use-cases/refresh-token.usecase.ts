import { Inject, Injectable } from '@nestjs/common';
import {
  IDENTITY_PROVIDER,
  type IIdentityProvider,
} from '../../domain/ports/identity-provider.port';
import { toSessionTokens } from '../auth.presenter';
import type { RefreshTokenInput, SessionTokensOutput } from '../dto/auth.dto';

// Issues new access/id tokens from a still-valid refresh token. A revoked or
// expired refresh token results in SessionExpiredError (401).
@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(IDENTITY_PROVIDER)
    private readonly identityProvider: IIdentityProvider,
  ) {}

  async execute(input: RefreshTokenInput): Promise<SessionTokensOutput> {
    const tokens = await this.identityProvider.refreshSession(input.email, input.refreshToken);
    return {
      ...toSessionTokens(tokens),
      refreshToken: tokens.refreshToken ?? input.refreshToken,
    };
  }
}
