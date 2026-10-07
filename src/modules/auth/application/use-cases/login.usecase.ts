import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../../users/domain/entities/user.entity';
import { type IUserRepository, USER_REPOSITORY } from '../../../users/domain/ports/user.repository';
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
import { toAuthenticatedUser, toSessionTokens } from '../auth.presenter';
import type { LoginInput, LoginOutput } from '../dto/auth.dto';

// Authenticates a user, branching on the provider account status. Handles the
// FORCE_CHANGE_PASSWORD challenge when a new password is supplied.
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(IDENTITY_PROVIDER)
    private readonly identityProvider: IIdentityProvider,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const tokens = await this.authenticate(input);

    const user =
      (await this.userRepository.findByEmail(input.email)) ??
      User.create({ email: input.email, name: input.email, cognitoId: '' });

    return { ...toSessionTokens(tokens), user: toAuthenticatedUser(user, tokens.groups) };
  }

  private async authenticate(input: LoginInput): Promise<AuthTokens> {
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
