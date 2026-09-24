import { AppError } from '../../../../shared/kernel/app-error';

// Business/authentication errors, mapped to HTTP by the shared AppErrorFilter.
// The identity provider adapter translates provider-specific failures into these.

export class InvalidCredentialsError extends AppError {
  readonly statusCode = 401;
  readonly code = 'INVALID_CREDENTIALS';
  constructor() {
    super('Invalid email or password.');
  }
}

export class AuthenticationFailedError extends AppError {
  readonly statusCode = 401;
  readonly code = 'AUTHENTICATION_FAILED';
  constructor() {
    super('Authentication failed.');
  }
}

export class AccountNotConfirmedError extends AppError {
  readonly statusCode = 403;
  readonly code = 'ACCOUNT_NOT_CONFIRMED';
  constructor() {
    super('Account not confirmed. Please verify your email.');
  }
}

export class EmailAlreadyRegisteredError extends AppError {
  readonly statusCode = 409;
  readonly code = 'EMAIL_ALREADY_REGISTERED';
  constructor() {
    super('This email is already registered.');
  }
}

export class InvalidPasswordError extends AppError {
  readonly statusCode = 400;
  readonly code = 'INVALID_PASSWORD';
  constructor() {
    super('Password does not meet the minimum security requirements.');
  }
}

export class InvalidCodeError extends AppError {
  readonly statusCode = 400;
  readonly code = 'INVALID_CODE';
  constructor() {
    super('Invalid code.');
  }
}

export class CodeExpiredError extends AppError {
  readonly statusCode = 400;
  readonly code = 'CODE_EXPIRED';
  constructor() {
    super('Code has expired. Please request a new one.');
  }
}

export class UserNotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'USER_NOT_FOUND';
  constructor() {
    super('User not found.');
  }
}

export class TooManyAttemptsError extends AppError {
  readonly statusCode = 429;
  readonly code = 'TOO_MANY_ATTEMPTS';
  constructor() {
    super('Too many attempts. Please wait and try again.');
  }
}

export class NewPasswordRequiredError extends AppError {
  readonly statusCode = 422;
  readonly code = 'NEW_PASSWORD_REQUIRED';
  constructor() {
    super('New password is required.');
  }
}

export class UnexpectedChallengeError extends AppError {
  readonly statusCode = 400;
  readonly code = 'UNEXPECTED_CHALLENGE';
  constructor() {
    super('Unexpected authentication challenge.');
  }
}

export class AuthInternalError extends AppError {
  readonly statusCode = 500;
  readonly code = 'AUTH_INTERNAL_ERROR';
  constructor(message = 'Internal server error. Please try again later.') {
    super(message);
  }
}
