import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { IDENTITY_PROVIDER } from './domain/ports/identity-provider.port';
import { CognitoIdentityProvider } from './infra/identity/cognito-identity-provider.adapter';
import { RegisterUseCase } from './application/use-cases/register.usecase';
import { LoginUseCase } from './application/use-cases/login.usecase';
import { ConfirmSignUpUseCase } from './application/use-cases/confirm-signup.usecase';
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password.usecase';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.usecase';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.usecase';
import { LogoutUseCase } from './application/use-cases/logout.usecase';
import { AuthController } from './http/auth.controller';

const useCases = [
  RegisterUseCase,
  LoginUseCase,
  ConfirmSignUpUseCase,
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
  RefreshTokenUseCase,
  LogoutUseCase,
];

// Composition root for the auth module: binds the identity provider port to the
// Cognito adapter and registers the authentication use cases. The user
// repository port is provided by UsersModule. The identity provider is exported
// so the global auth guard can check token revocation.
@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [...useCases, { provide: IDENTITY_PROVIDER, useClass: CognitoIdentityProvider }],
  exports: [IDENTITY_PROVIDER],
})
export class AuthModule {}
