import { Inject, Injectable } from '@nestjs/common';
import {
  IDENTITY_PROVIDER,
  type IIdentityProvider,
} from '../../domain/ports/identity-provider.port';
import type { ForgotPasswordInput, MessageOutput } from '../dto/auth.dto';

// Starts the password reset flow. Always returns a generic message to avoid
// leaking whether the email exists.
@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(IDENTITY_PROVIDER)
    private readonly identityProvider: IIdentityProvider,
  ) {}

  async execute(input: ForgotPasswordInput): Promise<MessageOutput> {
    await this.identityProvider.forgotPassword(input.email);
    return {
      message: 'If this email is registered, you will receive a code to reset your password.',
    };
  }
}
