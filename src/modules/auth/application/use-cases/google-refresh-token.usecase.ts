import { Inject, Injectable } from '@nestjs/common';
import {
  IDENTITY_PROVIDER,
  type IIdentityProvider,
} from '../../domain/ports/identity-provider.port';
import { toSessionTokens } from '../auth.presenter';
import type { FederatedRefreshTokenInput, SessionTokensOutput } from '../dto/auth.dto';

@Injectable()
export class GoogleRefreshTokenUseCase {
  constructor(
    @Inject(IDENTITY_PROVIDER)
    private readonly identityProvider: IIdentityProvider,
  ) {}

  async execute(input: FederatedRefreshTokenInput): Promise<SessionTokensOutput> {
    const tokens = await this.identityProvider.refreshFederatedSession(input.refreshToken);
    return {
      ...toSessionTokens(tokens),
      refreshToken: tokens.refreshToken ?? input.refreshToken,
    };
  }
}
