import type { AuthTokens } from '../entities/auth-tokens.entity';

// Injection token for the identity provider port (implemented by Cognito in infra).
export const IDENTITY_PROVIDER = Symbol('IDENTITY_PROVIDER');

export interface CreateProviderUserInput {
  readonly email: string;
  readonly name: string;
}

export interface CreateProviderUserResult {
  // The provider's unique subject id (Cognito "sub").
  readonly providerId: string;
}

export type FederatedProvider = 'Google';

// A user signed in through an external provider, as known by the identity
// provider (the federated user also lives in the user pool).
export interface FederatedIdentity {
  // The provider's unique subject id (Cognito "sub").
  readonly providerId: string;
  // Provider-generated username (e.g. "google_1234"), required by admin calls.
  readonly username: string;
  readonly email: string;
  readonly name: string;
  readonly pictureUrl: string | null;
}

export interface FederatedSession {
  readonly tokens: AuthTokens;
  readonly identity: FederatedIdentity;
}

// Known account lifecycle states relevant to the login flow.
export type ProviderUserStatus =
  | 'CONFIRMED'
  | 'UNCONFIRMED'
  | 'FORCE_CHANGE_PASSWORD'
  | (string & {});

// Port abstracting the external identity provider. Application/use cases depend
// on this interface only; the Cognito specifics (secret hash, temp password,
// SDK commands, error translation) live in the infra adapter.
export interface IIdentityProvider {
  createUser(input: CreateProviderUserInput): Promise<CreateProviderUserResult>;
  deleteUser(username: string): Promise<void>;
  getUserStatus(email: string): Promise<ProviderUserStatus>;
  authenticate(email: string, password: string): Promise<AuthTokens>;
  respondToNewPasswordChallenge(
    email: string,
    temporaryPassword: string,
    newPassword: string,
  ): Promise<AuthTokens>;
  confirmSignUp(email: string, code: string): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void>;
  // Exchanges a refresh token for new access/id tokens. Fails with
  // SessionExpiredError when the refresh token is expired or revoked.
  refreshSession(email: string, refreshToken: string): Promise<AuthTokens>;
  // Revokes the refresh token and every access token issued from it.
  revokeRefreshToken(refreshToken: string): Promise<void>;
  // Asks the provider whether the access token is still active (not revoked
  // by logout/global sign-out and the user still exists/is enabled).
  isAccessTokenActive(accessToken: string): Promise<boolean>;
  // URL of the provider's hosted sign-in that redirects straight to the
  // external provider. `state` is echoed back to the redirect URI (CSRF check).
  getFederatedAuthorizationUrl(provider: FederatedProvider, state: string): string;
  // Exchanges the authorization code received on the redirect URI for tokens
  // and the signed-in user's identity.
  exchangeAuthorizationCode(code: string): Promise<FederatedSession>;
}
