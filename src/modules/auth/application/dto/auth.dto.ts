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

export interface MessageOutput {
  readonly message: string;
}
