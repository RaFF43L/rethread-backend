import { BadRequestException, Body, Controller, Query } from '@nestjs/common';
import { RegisterUseCase } from '../application/use-cases/register.usecase';
import { LoginUseCase } from '../application/use-cases/login.usecase';
import { ConfirmSignUpUseCase } from '../application/use-cases/confirm-signup.usecase';
import { ForgotPasswordUseCase } from '../application/use-cases/forgot-password.usecase';
import { ResetPasswordUseCase } from '../application/use-cases/reset-password.usecase';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.usecase';
import { LogoutUseCase } from '../application/use-cases/logout.usecase';
import { GetGoogleAuthorizationUrlUseCase } from '../application/use-cases/get-google-authorization-url.usecase';
import { GoogleSignInUseCase } from '../application/use-cases/google-sign-in.usecase';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfirmSignUpDto } from './dto/confirm-signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { GoogleSignInDto } from './dto/google-sign-in.dto';
import { GoogleCallbackQueryDto } from './dto/google-callback-query.dto';
import {
  AuthTag,
  ConfirmSignUpRoute,
  ForgotPasswordRoute,
  GoogleAuthorizationUrlRoute,
  GoogleSignInRedirectRoute,
  GoogleSignInRoute,
  LoginRoute,
  LogoutRoute,
  RefreshTokenRoute,
  RegisterRoute,
  ResetPasswordRoute,
} from './decorators/auth-routes.decorator';

// Thin HTTP adapter: each handler delegates to a single use case.
@AuthTag()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly confirmSignUpUseCase: ConfirmSignUpUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getGoogleAuthorizationUrlUseCase: GetGoogleAuthorizationUrlUseCase,
    private readonly googleSignInUseCase: GoogleSignInUseCase,
  ) {}

  @RegisterRoute()
  register(@Body() dto: RegisterDto) {
    return this.registerUseCase.execute(dto);
  }

  @LoginRoute()
  login(@Body() dto: LoginDto) {
    return this.loginUseCase.execute(dto);
  }

  @RefreshTokenRoute()
  refresh(@Body() dto: RefreshTokenDto) {
    return this.refreshTokenUseCase.execute(dto);
  }

  @LogoutRoute()
  logout(@Body() dto: LogoutDto) {
    return this.logoutUseCase.execute(dto);
  }

  @GoogleAuthorizationUrlRoute()
  googleAuthorizationUrl() {
    return this.getGoogleAuthorizationUrlUseCase.execute();
  }

  @GoogleSignInRoute()
  googleSignIn(@Body() dto: GoogleSignInDto) {
    return this.googleSignInUseCase.execute(dto);
  }

  @GoogleSignInRedirectRoute()
  googleSignInRedirect(@Query() query: GoogleCallbackQueryDto) {
    if (query.error || !query.code) {
      throw new BadRequestException(
        `Google sign-in failed: ${query.error_description ?? query.error ?? 'missing authorization code'}`,
      );
    }
    return this.googleSignInUseCase.execute({ code: query.code });
  }

  @ConfirmSignUpRoute()
  confirmSignUp(@Body() dto: ConfirmSignUpDto) {
    return this.confirmSignUpUseCase.execute(dto);
  }

  @ForgotPasswordRoute()
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.forgotPasswordUseCase.execute(dto);
  }

  @ResetPasswordRoute()
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.resetPasswordUseCase.execute(dto);
  }
}
