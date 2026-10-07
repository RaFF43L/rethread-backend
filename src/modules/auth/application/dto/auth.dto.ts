import type { AuthTokens } from '../../domain/entities/auth-tokens.entity';

// Application-layer input contracts for auth. Pure TypeScript, no decorators.

export interface RegisterInput {
  readonly email: string;
  readonly name: string;
}

export interface LoginInput {
  readonly email: string;
  readonly password: string;
  readonly newPassword?: string;
}

export interface ConfirmSignUpInput {
  readonly email: string;
  readonly code: string;
}

export interface ForgotPasswordInput {
  readonly email: string;
}

export interface ResetPasswordInput {
  readonly email: string;
  readonly code: string;
  readonly newPassword: string;
}

export interface RefreshTokenInput {
  readonly email: string;
  readonly refreshToken: string;
}

export interface LogoutInput {
  readonly refreshToken: string;
}

export interface FederatedSignInInput {
  readonly code: string;
}

export interface AuthorizationUrlOutput {
  readonly url: string;
  readonly state: string;
}

export interface AuthenticatedUserOutput {
  readonly id: number | undefined;
  readonly name: string;
  readonly email: string;
  readonly pictureUrl: string | null;
  // Cognito groups (e.g. "@admin"), for the client to decide which screens to
  // show. Access control itself is enforced by the auth guard.
  readonly groups: string[];
}

export type SessionTokensOutput = Omit<AuthTokens, 'groups'>;

export interface LoginOutput extends SessionTokensOutput {
  readonly user: AuthenticatedUserOutput;
}

export interface FederatedSignInOutput extends LoginOutput {
  readonly isNewUser: boolean;
}

export interface MessageOutput {
  readonly message: string;
}
