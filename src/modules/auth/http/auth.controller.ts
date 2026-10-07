import { Body, Controller } from '@nestjs/common';
import { RegisterUseCase } from '../application/use-cases/register.usecase';
import { LoginUseCase } from '../application/use-cases/login.usecase';
import { ConfirmSignUpUseCase } from '../application/use-cases/confirm-signup.usecase';
import { ForgotPasswordUseCase } from '../application/use-cases/forgot-password.usecase';
import { ResetPasswordUseCase } from '../application/use-cases/reset-password.usecase';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.usecase';
import { LogoutUseCase } from '../application/use-cases/logout.usecase';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfirmSignUpDto } from './dto/confirm-signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import {
  AuthTag,
  ConfirmSignUpRoute,
  ForgotPasswordRoute,
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
