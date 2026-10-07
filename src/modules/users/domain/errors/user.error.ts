import { AppError } from '../../../../shared/kernel/app-error';

// 404: the token is valid but no local user row matches its subject.
export class UserNotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'USER_NOT_FOUND';

  constructor() {
    super('User not found.');
  }
}
