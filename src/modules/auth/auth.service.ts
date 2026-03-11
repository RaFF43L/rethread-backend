import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuthFlowType,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  InitiateAuthCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { mapCognitoError } from '../../common/helpers/cognito-error.helper';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfirmSignUpDto } from './dto/confirm-signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly cognito: CognitoIdentityProviderClient;
  private readonly clientId: string;

  constructor(private readonly config: ConfigService) {
    this.cognito = new CognitoIdentityProviderClient({});
    this.clientId = this.config.getOrThrow<string>('COGNITO_CLIENT_ID');
  }

  async register(dto: RegisterDto) {
    try {
      const result = await this.cognito.send(
        new SignUpCommand({
          ClientId: this.clientId,
          Username: dto.email,
          Password: dto.password,
          UserAttributes: [
            { Name: 'email', Value: dto.email },
            { Name: 'name', Value: dto.name },
          ],
        }),
      );

      return {
        message: 'Registration successful. Please check your email to confirm your account.',
        userId: result.UserSub,
      };
    } catch (error) {
      throw mapCognitoError(error);
    }
  }

  async login(dto: LoginDto) {
    try {
      const result = await this.cognito.send(
        new InitiateAuthCommand({
          AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
          ClientId: this.clientId,
          AuthParameters: {
            USERNAME: dto.email,
            PASSWORD: dto.password,
          },
        }),
      );

      return {
        accessToken: result.AuthenticationResult?.AccessToken,
        idToken: result.AuthenticationResult?.IdToken,
        refreshToken: result.AuthenticationResult?.RefreshToken,
        expiresIn: result.AuthenticationResult?.ExpiresIn,
      };
    } catch (error) {
      throw mapCognitoError(error);
    }
  }

  async confirmSignUp(dto: ConfirmSignUpDto) {
    try {
      await this.cognito.send(
        new ConfirmSignUpCommand({
          ClientId: this.clientId,
          Username: dto.email,
          ConfirmationCode: dto.code,
        }),
      );

      return { message: 'Account confirmed successfully.' };
    } catch (error) {
      throw mapCognitoError(error);
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    try {
      await this.cognito.send(
        new ForgotPasswordCommand({
          ClientId: this.clientId,
          Username: dto.email,
        }),
      );

      return {
        message: 'If this email is registered, you will receive a code to reset your password.',
      };
    } catch (error) {
      throw mapCognitoError(error);
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    try {
      await this.cognito.send(
        new ConfirmForgotPasswordCommand({
          ClientId: this.clientId,
          Username: dto.email,
          ConfirmationCode: dto.code,
          Password: dto.newPassword,
        }),
      );

      return { message: 'Password reset successfully.' };
    } catch (error) {
      throw mapCognitoError(error);
    }
  }
}
