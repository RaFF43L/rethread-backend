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
  deleteUser(email: string): Promise<void>;
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
}
