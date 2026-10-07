import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes } from 'node:crypto';
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
  GetUserCommand,
  RevokeTokenCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { decodeJwt, type JWTPayload } from 'jose';
import type { AuthTokens } from '../../domain/entities/auth-tokens.entity';
import {
  AccountNotConfirmedError,
  AuthenticationFailedError,
  AuthInternalError,
  CodeExpiredError,
  EmailAlreadyRegisteredError,
  InvalidCodeError,
  InvalidAuthorizationCodeError,
  InvalidCredentialsError,
  InvalidPasswordError,
  SessionExpiredError,
  TooManyAttemptsError,
  UnexpectedChallengeError,
  UserNotFoundError,
} from '../../domain/errors/auth.error';
import {
  CreateProviderUserInput,
  CreateProviderUserResult,
  FederatedIdentity,
  FederatedProvider,
  FederatedSession,
  IIdentityProvider,
  ProviderUserStatus,
} from '../../domain/ports/identity-provider.port';

interface OAuthTokenResponse {
  access_token?: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
}

interface CognitoIdTokenClaims extends JWTPayload {
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  'cognito:username'?: string;
}

// Informational copy for the client (e.g. to show admin screens); authorization
// itself is enforced by the auth guard on the signed access token.
function groupsFromAccessToken(accessToken: string | undefined): string[] {
  if (!accessToken) return [];
  const groups = decodeJwt(accessToken)['cognito:groups'];
  return Array.isArray(groups) ? groups.filter((g): g is string => typeof g === 'string') : [];
}

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
    const endpoint = this.config.get<string>('AWS_ENDPOINT_URL');
    this.cognito = new CognitoIdentityProviderClient({
      region: this.config.getOrThrow<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('AWS_ACCESS_KEY_ID_COGNITO'),
        secretAccessKey: this.config.getOrThrow<string>('AWS_SECRET_ACCESS_KEY_COGNITO'),
      },
      ...(endpoint && { endpoint, forcePathStyle: true }),
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

      const providerId = result.User?.Attributes?.find((a) => a.Name === 'sub')?.Value;
      if (!providerId) {
        throw new AuthInternalError('Identity provider did not return a user id.');
      }
      return { providerId };
    } catch (error) {
      throw translateCognitoError(error);
    }
  }

  async deleteUser(username: string): Promise<void> {
    await this.cognito.send(
      new AdminDeleteUserCommand({ UserPoolId: this.userPoolId, Username: username }),
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
        groups: groupsFromAccessToken(result.AuthenticationResult.AccessToken),
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

  async refreshSession(email: string, refreshToken: string): Promise<AuthTokens> {
    try {
      const result = await this.cognito.send(
        new AdminInitiateAuthCommand({
          AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
          UserPoolId: this.userPoolId,
          ClientId: this.clientId,
          AuthParameters: {
            REFRESH_TOKEN: refreshToken,
            SECRET_HASH: this.generateSecretHash(email),
          },
        }),
      );

      if (!result.AuthenticationResult) {
        throw new SessionExpiredError();
      }

      return {
        accessToken: result.AuthenticationResult.AccessToken,
        idToken: result.AuthenticationResult.IdToken,
        refreshToken: result.AuthenticationResult.RefreshToken,
        expiresIn: result.AuthenticationResult.ExpiresIn,
        groups: groupsFromAccessToken(result.AuthenticationResult.AccessToken),
      };
    } catch (error) {
      if (error instanceof SessionExpiredError) throw error;
      // Expired/revoked refresh token (or one belonging to another user).
      if ((error as { name?: string }).name === 'NotAuthorizedException') {
        throw new SessionExpiredError();
      }
      throw translateCognitoError(error);
    }
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      await this.cognito.send(
        new RevokeTokenCommand({
          ClientId: this.clientId,
          ClientSecret: this.clientSecret,
          Token: refreshToken,
        }),
      );
    } catch (error) {
      throw translateCognitoError(error);
    }
  }

  async isAccessTokenActive(accessToken: string): Promise<boolean> {
    try {
      // GetUser is evaluated by Cognito against its revocation list, unlike a
      // local JWT signature check.
      await this.cognito.send(new GetUserCommand({ AccessToken: accessToken }));
      return true;
    } catch (error) {
      const name = (error as { name?: string }).name;
      if (name === 'NotAuthorizedException' || name === 'UserNotFoundException') {
        return false;
      }
      throw translateCognitoError(error);
    }
  }

  getFederatedAuthorizationUrl(provider: FederatedProvider, state: string): string {
    const url = new URL(`${this.oauthDomain()}/oauth2/authorize`);
    url.search = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.oauthRedirectUri(),
      identity_provider: provider,
      // aws.cognito.signin.user.admin lets the auth guard validate the access
      // token through GetUser (revocation check).
      scope: 'openid email profile aws.cognito.signin.user.admin',
      state,
    }).toString();
    return url.toString();
  }

  async exchangeAuthorizationCode(code: string): Promise<FederatedSession> {
    let response: Response;
    try {
      response = await fetch(`${this.oauthDomain()}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.clientId,
          code,
          redirect_uri: this.oauthRedirectUri(),
        }),
      });
    } catch {
      throw new AuthInternalError();
    }

    const body = (await response.json().catch(() => ({}))) as OAuthTokenResponse;
    if (!response.ok || !body.id_token) {
      if (body.error === 'invalid_grant') throw new InvalidAuthorizationCodeError();
      throw new AuthInternalError();
    }

    return {
      tokens: {
        accessToken: body.access_token,
        idToken: body.id_token,
        refreshToken: body.refresh_token,
        expiresIn: body.expires_in,
        groups: groupsFromAccessToken(body.access_token),
      },
      identity: this.identityFromIdToken(body.id_token),
    };
  }

  private identityFromIdToken(idToken: string): FederatedIdentity {
    // The token was received directly from the Cognito token endpoint over TLS
    // using the client secret, so OIDC allows skipping signature validation.
    const claims = decodeJwt<CognitoIdTokenClaims>(idToken);
    if (!claims.sub || !claims['cognito:username'] || !claims.email) {
      // Usually a missing attribute mapping (Google email -> email) in the pool.
      throw new AuthInternalError('Identity provider did not return the user email.');
    }
    const fullName = [claims.given_name, claims.family_name].filter(Boolean).join(' ');
    return {
      providerId: claims.sub,
      username: claims['cognito:username'],
      email: claims.email,
      name: claims.name || fullName || claims.email,
      pictureUrl: claims.picture || null,
    };
  }

  private oauthDomain(): string {
    return this.config.getOrThrow<string>('COGNITO_DOMAIN').replace(/\/+$/, '');
  }

  private oauthRedirectUri(): string {
    return this.config.getOrThrow<string>('COGNITO_OAUTH_REDIRECT_URI');
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
