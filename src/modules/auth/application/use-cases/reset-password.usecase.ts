import { Inject, Injectable } from '@nestjs/common';
import {
  IDENTITY_PROVIDER,
  type IIdentityProvider,
} from '../../domain/ports/identity-provider.port';
import type { MessageOutput, ResetPasswordInput } from '../dto/auth.dto';

// Completes the password reset using the verification code and a new password.
@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(IDENTITY_PROVIDER)
    private readonly identityProvider: IIdentityProvider,
  ) {}

  async execute(input: ResetPasswordInput): Promise<MessageOutput> {
    await this.identityProvider.confirmForgotPassword(input.email, input.code, input.newPassword);
    return { message: 'Password reset successfully.' };
  }
}
