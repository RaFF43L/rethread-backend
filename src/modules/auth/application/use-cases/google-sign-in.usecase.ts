import { Inject, Injectable, Logger } from '@nestjs/common';
import { User } from '../../../users/domain/entities/user.entity';
import { type IUserRepository, USER_REPOSITORY } from '../../../users/domain/ports/user.repository';
import { AuthInternalError, FederatedEmailConflictError } from '../../domain/errors/auth.error';
import {
  type FederatedIdentity,
  IDENTITY_PROVIDER,
  type IIdentityProvider,
} from '../../domain/ports/identity-provider.port';
import { toAuthenticatedUser, toSessionTokens } from '../auth.presenter';
import type { FederatedSignInInput, FederatedSignInOutput } from '../dto/auth.dto';

@Injectable()
export class GoogleSignInUseCase {
  private readonly logger = new Logger(GoogleSignInUseCase.name);

  constructor(
    @Inject(IDENTITY_PROVIDER)
    private readonly identityProvider: IIdentityProvider,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: FederatedSignInInput): Promise<FederatedSignInOutput> {
    const { tokens, identity } = await this.identityProvider.exchangeAuthorizationCode(input.code);

    const existingUser = await this.userRepository.findByProviderId(identity.providerId);
    if (existingUser) {
      await this.refreshProfile(existingUser, identity);
      return {
        ...toSessionTokens(tokens),
        isNewUser: false,
        user: toAuthenticatedUser(existingUser, tokens.groups),
      };
    }

    if (await this.userRepository.findByEmail(identity.email)) {
      await this.identityProvider
        .deleteUser(identity.username)
        .catch((error: unknown) =>
          this.logger.error(
            `Failed to remove conflicting federated user. username=${identity.username}`,
            error instanceof Error ? error.stack : String(error),
          ),
        );
      throw new FederatedEmailConflictError();
    }

    let createdUser: User;
    try {
      createdUser = await this.userRepository.create(
        User.create({
          email: identity.email,
          name: identity.name,
          providerId: identity.providerId,
          pictureUrl: identity.pictureUrl,
        }),
      );
    } catch (error) {
      // The federated user is kept in the provider: the next sign-in retries
      // the local registration.
      this.logger.error(
        `DB persistence failed for federated user. email=${identity.email}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new AuthInternalError();
    }

    return {
      ...toSessionTokens(tokens),
      isNewUser: true,
      user: toAuthenticatedUser(createdUser, tokens.groups),
    };
  }

  private async refreshProfile(user: User, identity: FederatedIdentity): Promise<void> {
    const pictureChanged = !!identity.pictureUrl && identity.pictureUrl !== user.pictureUrl;
    const nameResolved = user.name === user.email && identity.name !== identity.email;
    if (!pictureChanged && !nameResolved) return;

    if (pictureChanged) user.pictureUrl = identity.pictureUrl;
    if (nameResolved) user.name = identity.name;
    await this.userRepository
      .update(user)
      .catch((error: unknown) =>
        this.logger.error(
          `Failed to update user profile. userId=${user.id}`,
          error instanceof Error ? error.stack : String(error),
        ),
      );
  }
}
