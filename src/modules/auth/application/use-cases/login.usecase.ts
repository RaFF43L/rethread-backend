import { Inject, Injectable } from '@nestjs/common';
import type { AuthTokens } from '../../domain/entities/auth-tokens.entity';
import {
  AccountNotConfirmedError,
  AuthInternalError,
  NewPasswordRequiredError,
} from '../../domain/errors/auth.error';
import {
  IDENTITY_PROVIDER,
  type IIdentityProvider,
} from '../../domain/ports/identity-provider.port';
import type { LoginInput } from '../dto/auth.dto';

// Authenticates a user, branching on the provider account status. Handles the
// FORCE_CHANGE_PASSWORD challenge when a new password is supplied.
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(IDENTITY_PROVIDER)
    private readonly identityProvider: IIdentityProvider,
  ) {}

  async execute(input: LoginInput): Promise<AuthTokens> {
    const { email, password, newPassword } = input;
    const status = await this.identityProvider.getUserStatus(email);

    switch (status) {
      case 'CONFIRMED':
        return this.identityProvider.authenticate(email, password);
      case 'UNCONFIRMED':
        throw new AccountNotConfirmedError();
      case 'FORCE_CHANGE_PASSWORD':
        if (!newPassword) {
          throw new NewPasswordRequiredError();
        }
        return this.identityProvider.respondToNewPasswordChallenge(email, password, newPassword);
      default:
        throw new AuthInternalError(`Unexpected user status: ${status}.`);
    }
  }
}
