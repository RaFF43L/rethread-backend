import { Inject, Injectable } from '@nestjs/common';
import {
  IDENTITY_PROVIDER,
  type IIdentityProvider,
} from '../../domain/ports/identity-provider.port';
import type { LogoutInput, MessageOutput } from '../dto/auth.dto';

// Ends the session by revoking the refresh token. The provider also revokes
// every access token issued from it, so the auth guard starts rejecting them.
@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(IDENTITY_PROVIDER)
    private readonly identityProvider: IIdentityProvider,
  ) {}

  async execute(input: LogoutInput): Promise<MessageOutput> {
    await this.identityProvider.revokeRefreshToken(input.refreshToken);
    return { message: 'Logged out successfully.' };
  }
}
