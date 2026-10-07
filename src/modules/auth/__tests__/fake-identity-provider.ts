import type { AuthTokens } from '../domain/entities/auth-tokens.entity';
import {
  AccountNotConfirmedError,
  EmailAlreadyRegisteredError,
  InvalidAuthorizationCodeError,
  InvalidCodeError,
  InvalidCredentialsError,
  SessionExpiredError,
} from '../domain/errors/auth.error';
import type {
  CreateProviderUserInput,
  CreateProviderUserResult,
  FederatedIdentity,
  FederatedProvider,
  FederatedSession,
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
  groups: string[] = [];
  readonly revokedTokens = new Set<string>();
  // Authorization code -> identity the provider returns when it is exchanged.
  readonly federatedCodes = new Map<string, FederatedIdentity>();

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

  // Records are keyed by email for native users and by provider username for
  // federated ones, mirroring the provider's Username.
  deleteUser(username: string): Promise<void> {
    const index = this.records.findIndex((r) => r.email === username);
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

  refreshSession(email: string, refreshToken: string): Promise<AuthTokens> {
    if (!this.find(email) || this.revokedTokens.has(refreshToken)) {
      return Promise.reject(new SessionExpiredError());
    }
    return Promise.resolve({ ...this.tokens(), refreshToken: undefined });
  }

  revokeRefreshToken(refreshToken: string): Promise<void> {
    this.revokedTokens.add(refreshToken);
    return Promise.resolve();
  }

  isAccessTokenActive(accessToken: string): Promise<boolean> {
    return Promise.resolve(!this.revokedTokens.has(accessToken));
  }

  getFederatedAuthorizationUrl(provider: FederatedProvider, state: string): string {
    return `https://auth.test/oauth2/authorize?identity_provider=${provider}&state=${state}`;
  }

  // Simulates the provider creating the federated user on its first sign-in.
  exchangeAuthorizationCode(code: string): Promise<FederatedSession> {
    const identity = this.federatedCodes.get(code);
    if (!identity) {
      return Promise.reject(new InvalidAuthorizationCodeError());
    }
    this.federatedCodes.delete(code);
    if (!this.records.some((r) => r.email === identity.username)) {
      this.records.push({
        email: identity.username,
        name: identity.name,
        providerId: identity.providerId,
        status: 'EXTERNAL_PROVIDER',
      });
    }
    return Promise.resolve({ tokens: this.tokens(), identity });
  }

  private tokens(): AuthTokens {
    return {
      accessToken: 'access-token',
      idToken: 'id-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      groups: [...this.groups],
    };
  }
}
