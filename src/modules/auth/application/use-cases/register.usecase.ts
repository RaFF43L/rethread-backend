import { Inject, Injectable, Logger } from '@nestjs/common';
import { User } from '../../../users/domain/entities/user.entity';
import { type IUserRepository, USER_REPOSITORY } from '../../../users/domain/ports/user.repository';
import { AuthInternalError } from '../../domain/errors/auth.error';
import {
  IDENTITY_PROVIDER,
  type IIdentityProvider,
} from '../../domain/ports/identity-provider.port';
import type { MessageOutput, RegisterInput } from '../dto/auth.dto';

// Registers a user: creates it in the identity provider first, then persists a
// local record. If persistence fails, the provider user is rolled back.
@Injectable()
export class RegisterUseCase {
  private readonly logger = new Logger(RegisterUseCase.name);

  constructor(
    @Inject(IDENTITY_PROVIDER)
    private readonly identityProvider: IIdentityProvider,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: RegisterInput): Promise<MessageOutput> {
    const { providerId } = await this.identityProvider.createUser({
      email: input.email,
      name: input.name,
    });

    try {
      await this.userRepository.create(
        User.create({ email: input.email, name: input.name, cognitoId: providerId }),
      );
    } catch (error) {
      this.logger.error(
        `DB persistence failed after provider registration — rolling back provider user. email=${input.email}`,
        error instanceof Error ? error.stack : String(error),
      );
      await this.identityProvider
        .deleteUser(input.email)
        .catch((deleteError: unknown) =>
          this.logger.error(
            `Failed to roll back provider user. email=${input.email}`,
            deleteError instanceof Error ? deleteError.stack : String(deleteError),
          ),
        );
      throw new AuthInternalError();
    }

    return {
      message: 'Registration successful. A temporary password was sent to the provided email.',
    };
  }
}
