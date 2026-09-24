import { Inject, Injectable } from '@nestjs/common';
import {
  IDENTITY_PROVIDER,
  type IIdentityProvider,
} from '../../domain/ports/identity-provider.port';
import type { ConfirmSignUpInput, MessageOutput } from '../dto/auth.dto';

// Confirms a user sign-up using the emailed verification code.
@Injectable()
export class ConfirmSignUpUseCase {
  constructor(
    @Inject(IDENTITY_PROVIDER)
    private readonly identityProvider: IIdentityProvider,
  ) {}

  async execute(input: ConfirmSignUpInput): Promise<MessageOutput> {
    await this.identityProvider.confirmSignUp(input.email, input.code);
    return { message: 'Account confirmed successfully.' };
  }
}
