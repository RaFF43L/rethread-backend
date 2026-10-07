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
import { GetGoogleAuthorizationUrlUseCase } from './application/use-cases/get-google-authorization-url.usecase';
import { GoogleSignInUseCase } from './application/use-cases/google-sign-in.usecase';
import { AuthController } from './http/auth.controller';

const useCases = [
  RegisterUseCase,
  LoginUseCase,
  ConfirmSignUpUseCase,
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
  RefreshTokenUseCase,
  LogoutUseCase,
  GetGoogleAuthorizationUrlUseCase,
  GoogleSignInUseCase,
];

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [...useCases, { provide: IDENTITY_PROVIDER, useClass: CognitoIdentityProvider }],
  exports: [IDENTITY_PROVIDER],
})
export class AuthModule {}
