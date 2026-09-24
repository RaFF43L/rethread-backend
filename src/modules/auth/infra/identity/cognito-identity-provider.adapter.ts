import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes } from 'crypto';
import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
  AdminSetUserPasswordCommand,
  AuthFlowType,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import type { AuthTokens } from '../../domain/entities/auth-tokens.entity';
import {
  AccountNotConfirmedError,
  AuthenticationFailedError,
  AuthInternalError,
  CodeExpiredError,
  EmailAlreadyRegisteredError,
  InvalidCodeError,
  InvalidCredentialsError,
  InvalidPasswordError,
  TooManyAttemptsError,
  UnexpectedChallengeError,
  UserNotFoundError,
} from '../../domain/errors/auth.error';
import {
  CreateProviderUserInput,
  CreateProviderUserResult,
  IIdentityProvider,
  ProviderUserStatus,
} from '../../domain/ports/identity-provider.port';

// Translates a provider-specific (Cognito) failure into a domain AppError.
function translateCognitoError(error: unknown): Error {
  const err = error as { name?: string };
  switch (err.name) {
    case 'NotAuthorizedException':
      return new InvalidCredentialsError();
    case 'UserNotConfirmedException':
      return new AccountNotConfirmedError();
    case 'UsernameExistsException':
      return new EmailAlreadyRegisteredError();
    case 'InvalidPasswordException':
      return new InvalidPasswordError();
    case 'CodeMismatchException':
      return new InvalidCodeError();
    case 'ExpiredCodeException':
      return new CodeExpiredError();
    case 'UserNotFoundException':
      return new UserNotFoundError();
    case 'LimitExceededException':
      return new TooManyAttemptsError();
    default:
      return new AuthInternalError();
  }
}

// Cognito implementation of the identity provider port. Owns all AWS SDK
// specifics (secret hash, temporary password generation, command dispatch) and
// error translation, keeping the application layer provider-agnostic.
@Injectable()
export class CognitoIdentityProvider implements IIdentityProvider {
  private readonly cognito: CognitoIdentityProviderClient;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly userPoolId: string;

  constructor(private readonly config: ConfigService) {
    this.cognito = new CognitoIdentityProviderClient({
      region: this.config.getOrThrow<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('AWS_ACCESS_KEY_ID_COGNITO'),
        secretAccessKey: this.config.getOrThrow<string>('AWS_SECRET_ACCESS_KEY_COGNITO'),
      },
    });
    this.clientId = this.config.getOrThrow<string>('COGNITO_CLIENT_ID');
    this.clientSecret = this.config.getOrThrow<string>('COGNITO_CLIENT_SECRET');
    this.userPoolId = this.config.getOrThrow<string>('COGNITO_USER_POOL_ID');
  }

  async createUser(input: CreateProviderUserInput): Promise<CreateProviderUserResult> {
    try {
      const result = await this.cognito.send(
        new AdminCreateUserCommand({
          UserPoolId: this.userPoolId,
          Username: input.email,
          TemporaryPassword: this.generateTemporaryPassword(),
          UserAttributes: [
            { Name: 'email', Value: input.email },
            { Name: 'email_verified', Value: 'true' },
            { Name: 'name', Value: input.name },
          ],
        }),
      );

      const providerId = result.User!.Attributes!.find((a) => a.Name === 'sub')!.Value!;
      return { providerId };
    } catch (error) {
      throw translateCognitoError(error);
    }
  }

  async deleteUser(email: string): Promise<void> {
    await this.cognito.send(
      new AdminDeleteUserCommand({ UserPoolId: this.userPoolId, Username: email }),
    );
  }

  async getUserStatus(email: string): Promise<ProviderUserStatus> {
    try {
      const response = await this.cognito.send(
        new AdminGetUserCommand({ UserPoolId: this.userPoolId, Username: email }),
      );
      return response.UserStatus ?? 'UNKNOWN';
    } catch (error) {
      throw translateCognitoError(error);
    }
  }

  async authenticate(email: string, password: string): Promise<AuthTokens> {
    try {
      const result = await this.cognito.send(
        new AdminInitiateAuthCommand({
          AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
          UserPoolId: this.userPoolId,
          ClientId: this.clientId,
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
            SECRET_HASH: this.generateSecretHash(email),
          },
        }),
      );

      if (!result.AuthenticationResult) {
        throw new AuthenticationFailedError();
      }

      return {
        accessToken: result.AuthenticationResult.AccessToken,
        idToken: result.AuthenticationResult.IdToken,
        refreshToken: result.AuthenticationResult.RefreshToken,
        expiresIn: result.AuthenticationResult.ExpiresIn,
      };
    } catch (error) {
      if (error instanceof AuthenticationFailedError) throw error;
      throw translateCognitoError(error);
    }
  }

  async respondToNewPasswordChallenge(
    email: string,
    temporaryPassword: string,
    newPassword: string,
  ): Promise<AuthTokens> {
    try {
      const initResult = await this.cognito.send(
        new AdminInitiateAuthCommand({
          AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
          UserPoolId: this.userPoolId,
          ClientId: this.clientId,
          AuthParameters: {
            USERNAME: email,
            PASSWORD: temporaryPassword,
            SECRET_HASH: this.generateSecretHash(email),
          },
        }),
      );

      if (initResult.ChallengeName !== 'NEW_PASSWORD_REQUIRED') {
        throw new UnexpectedChallengeError();
      }

      await this.cognito.send(
        new AdminSetUserPasswordCommand({
          UserPoolId: this.userPoolId,
          Username: email,
          Password: newPassword,
          Permanent: true,
        }),
      );

      return this.authenticate(email, newPassword);
    } catch (error) {
      if (error instanceof UnexpectedChallengeError || error instanceof AuthenticationFailedError) {
        throw error;
      }
      throw translateCognitoError(error);
    }
  }

  async confirmSignUp(email: string, code: string): Promise<void> {
    try {
      await this.cognito.send(
        new ConfirmSignUpCommand({
          ClientId: this.clientId,
          Username: email,
          ConfirmationCode: code,
        }),
      );
    } catch (error) {
      throw translateCognitoError(error);
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      await this.cognito.send(
        new ForgotPasswordCommand({ ClientId: this.clientId, Username: email }),
      );
    } catch (error) {
      throw translateCognitoError(error);
    }
  }

  async confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void> {
    try {
      await this.cognito.send(
        new ConfirmForgotPasswordCommand({
          ClientId: this.clientId,
          Username: email,
          ConfirmationCode: code,
          Password: newPassword,
        }),
      );
    } catch (error) {
      throw translateCognitoError(error);
    }
  }

  private generateSecretHash(username: string): string {
    return createHmac('sha256', this.clientSecret)
      .update(username + this.clientId)
      .digest('base64');
  }

  private generateTemporaryPassword(): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const symbols = '!@#$%&*';
    const all = upper + lower + digits + symbols;

    const rand = (charset: string) => charset[randomBytes(1)[0] % charset.length];

    const required = [rand(upper), rand(lower), rand(digits), rand(symbols)];
    const rest = Array.from({ length: 8 }, () => rand(all));

    return [...required, ...rest].sort(() => randomBytes(1)[0] - 128).join('');
  }
}
