import type { AuthTokens } from '../domain/entities/auth-tokens.entity';
import {
  AccountNotConfirmedError,
  EmailAlreadyRegisteredError,
  InvalidCodeError,
  InvalidCredentialsError,
} from '../domain/errors/auth.error';
import type {
  CreateProviderUserInput,
  CreateProviderUserResult,
  IIdentityProvider,
  ProviderUserStatus,
} from '../domain/ports/identity-provider.port';

interface FakeProviderRecord {
  email: string;
  name: string;
  providerId: string;
  status: ProviderUserStatus;
  password?: string;
  confirmationCode?: string;
  resetCode?: string;
}

// In-memory fake for the identity provider boundary. Encapsulates the account
// lifecycle so auth use cases can be exercised without AWS Cognito.
export class FakeIdentityProvider implements IIdentityProvider {
  readonly records: FakeProviderRecord[] = [];
  private sequence = 0;
  failCreate = false;

  seed(record: Partial<FakeProviderRecord> & { email: string }): FakeProviderRecord {
    this.sequence += 1;
    const full: FakeProviderRecord = {
      name: 'Seed User',
      providerId: `provider-${this.sequence}`,
      status: 'CONFIRMED',
      ...record,
    };
    this.records.push(full);
    return full;
  }

  private find(email: string): FakeProviderRecord | undefined {
    return this.records.find((r) => r.email === email);
  }

  createUser(input: CreateProviderUserInput): Promise<CreateProviderUserResult> {
    if (this.failCreate) {
      return Promise.reject(new Error('provider failure'));
    }
    if (this.find(input.email)) {
      return Promise.reject(new EmailAlreadyRegisteredError());
    }
    this.sequence += 1;
    const providerId = `provider-${this.sequence}`;
    this.records.push({
      email: input.email,
      name: input.name,
      providerId,
      status: 'FORCE_CHANGE_PASSWORD',
    });
    return Promise.resolve({ providerId });
  }

  deleteUser(email: string): Promise<void> {
    const index = this.records.findIndex((r) => r.email === email);
    if (index >= 0) {
      this.records.splice(index, 1);
    }
    return Promise.resolve();
  }

  getUserStatus(email: string): Promise<ProviderUserStatus> {
    const record = this.find(email);
    if (!record) {
      return Promise.reject(new InvalidCredentialsError());
    }
    return Promise.resolve(record.status);
  }

  authenticate(email: string, password: string): Promise<AuthTokens> {
    const record = this.find(email);
    if (!record || record.status === 'UNCONFIRMED') {
      return Promise.reject(new AccountNotConfirmedError());
    }
    if (record.password !== undefined && record.password !== password) {
      return Promise.reject(new InvalidCredentialsError());
    }
    return Promise.resolve(this.tokens());
  }

  respondToNewPasswordChallenge(
    email: string,
    _temporaryPassword: string,
    newPassword: string,
  ): Promise<AuthTokens> {
    const record = this.find(email);
    if (!record) {
      return Promise.reject(new InvalidCredentialsError());
    }
    record.status = 'CONFIRMED';
    record.password = newPassword;
    return Promise.resolve(this.tokens());
  }

  confirmSignUp(email: string, code: string): Promise<void> {
    const record = this.find(email);
    if (!record || record.confirmationCode !== code) {
      return Promise.reject(new InvalidCodeError());
    }
    record.status = 'CONFIRMED';
    return Promise.resolve();
  }

  forgotPassword(email: string): Promise<void> {
    const record = this.find(email);
    if (record) {
      record.resetCode = '654321';
    }
    return Promise.resolve();
  }

  confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void> {
    const record = this.find(email);
    if (!record || record.resetCode !== code) {
      return Promise.reject(new InvalidCodeError());
    }
    record.password = newPassword;
    return Promise.resolve();
  }

  private tokens(): AuthTokens {
    return {
      accessToken: 'access-token',
      idToken: 'id-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
    };
  }
}
