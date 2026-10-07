import { RegisterUseCase } from '../application/use-cases/register.usecase';
import { LoginUseCase } from '../application/use-cases/login.usecase';
import { ConfirmSignUpUseCase } from '../application/use-cases/confirm-signup.usecase';
import { ForgotPasswordUseCase } from '../application/use-cases/forgot-password.usecase';
import { ResetPasswordUseCase } from '../application/use-cases/reset-password.usecase';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.usecase';
import { LogoutUseCase } from '../application/use-cases/logout.usecase';
import { GetGoogleAuthorizationUrlUseCase } from '../application/use-cases/get-google-authorization-url.usecase';
import { GoogleSignInUseCase } from '../application/use-cases/google-sign-in.usecase';
import { User } from '../../users/domain/entities/user.entity';
import {
  AccountNotConfirmedError,
  AuthInternalError,
  EmailAlreadyRegisteredError,
  FederatedEmailConflictError,
  InvalidAuthorizationCodeError,
  InvalidCodeError,
  NewPasswordRequiredError,
  SessionExpiredError,
} from '../domain/errors/auth.error';
import { FakeIdentityProvider } from './fake-identity-provider';
import { FakeUserRepository } from './fake-user.repository';

describe('Auth use cases', () => {
  let provider: FakeIdentityProvider;
  let users: FakeUserRepository;

  beforeEach(() => {
    provider = new FakeIdentityProvider();
    users = new FakeUserRepository();
  });

  describe('RegisterUseCase', () => {
    it('creates a provider user then persists a local record', async () => {
      const useCase = new RegisterUseCase(provider, users);

      const result = await useCase.execute({ email: 'a@test.com', name: 'Alice' });

      expect(result.message).toContain('Registration successful');
      expect(provider.records).toHaveLength(1);
      await expect(users.findByEmail('a@test.com')).resolves.not.toBeNull();
    });

    it('does not persist locally when the provider fails', async () => {
      provider.failCreate = true;
      const useCase = new RegisterUseCase(provider, users);

      await expect(useCase.execute({ email: 'a@test.com', name: 'Alice' })).rejects.toThrow();
      expect(users.users).toHaveLength(0);
    });

    it('rejects an email already registered locally (e.g. via Google)', async () => {
      await users.create(
        User.create({ email: 'a@test.com', name: 'Alice', cognitoId: 'google-sub' }),
      );
      const useCase = new RegisterUseCase(provider, users);

      await expect(useCase.execute({ email: 'a@test.com', name: 'Alice' })).rejects.toBeInstanceOf(
        EmailAlreadyRegisteredError,
      );
      expect(provider.records).toHaveLength(0);
    });

    it('rolls back the provider user when persistence fails', async () => {
      users.failCreate = true;
      const useCase = new RegisterUseCase(provider, users);

      await expect(useCase.execute({ email: 'a@test.com', name: 'Alice' })).rejects.toBeInstanceOf(
        AuthInternalError,
      );
      expect(provider.records).toHaveLength(0);
    });
  });

  describe('GetGoogleAuthorizationUrlUseCase', () => {
    it('returns a Google authorization URL carrying a random state', () => {
      const useCase = new GetGoogleAuthorizationUrlUseCase(provider);

      const first = useCase.execute();
      const second = useCase.execute();

      expect(first.url).toContain('identity_provider=Google');
      expect(first.url).toContain(`state=${first.state}`);
      expect(first.state).not.toBe(second.state);
    });
  });

  describe('GoogleSignInUseCase', () => {
    const identity = {
      providerId: 'google-sub-1',
      username: 'google_123',
      email: 'g@test.com',
      name: 'Grace',
      pictureUrl: 'https://pics.test/grace-new.jpg',
    };

    beforeEach(() => provider.federatedCodes.set('code-1', identity));

    it('registers the local user on the first sign-in', async () => {
      const useCase = new GoogleSignInUseCase(provider, users);

      const result = await useCase.execute({ code: 'code-1' });

      expect(result).toMatchObject({
        accessToken: 'access-token',
        isNewUser: true,
        user: {
          id: 1,
          name: 'Grace',
          email: 'g@test.com',
          pictureUrl: 'https://pics.test/grace-new.jpg',
        },
      });
      const user = await users.findByCognitoId('google-sub-1');
      expect(user).toMatchObject({ email: 'g@test.com', name: 'Grace' });
    });

    it('signs in an already registered federated user and refreshes the picture', async () => {
      await users.create(
        User.create({
          email: 'g@test.com',
          name: 'Grace Hopper',
          cognitoId: 'google-sub-1',
          pictureUrl: 'https://pics.test/grace-old.jpg',
        }),
      );
      const useCase = new GoogleSignInUseCase(provider, users);

      const result = await useCase.execute({ code: 'code-1' });

      expect(result.isNewUser).toBe(false);
      expect(result.user).toEqual({
        id: 1,
        name: 'Grace Hopper',
        email: 'g@test.com',
        pictureUrl: 'https://pics.test/grace-new.jpg',
        groups: [],
      });
      expect(users.users).toHaveLength(1);
      expect(users.users[0].pictureUrl).toBe('https://pics.test/grace-new.jpg');
    });

    it('replaces the email fallback name once the provider sends a real name', async () => {
      await users.create(
        User.create({ email: 'g@test.com', name: 'g@test.com', cognitoId: 'google-sub-1' }),
      );
      const useCase = new GoogleSignInUseCase(provider, users);

      const result = await useCase.execute({ code: 'code-1' });

      expect(result.user.name).toBe('Grace');
      expect(users.users[0].name).toBe('Grace');
    });

    it('rejects an email owned by a password account and removes the federated user', async () => {
      await users.create(
        User.create({ email: 'g@test.com', name: 'Grace', cognitoId: 'native-sub' }),
      );
      const useCase = new GoogleSignInUseCase(provider, users);

      await expect(useCase.execute({ code: 'code-1' })).rejects.toBeInstanceOf(
        FederatedEmailConflictError,
      );
      expect(provider.records.some((r) => r.email === 'google_123')).toBe(false);
    });

    it('rejects an invalid authorization code', async () => {
      const useCase = new GoogleSignInUseCase(provider, users);

      await expect(useCase.execute({ code: 'unknown' })).rejects.toBeInstanceOf(
        InvalidAuthorizationCodeError,
      );
    });

    it('fails without removing the federated user when persistence fails', async () => {
      users.failCreate = true;
      const useCase = new GoogleSignInUseCase(provider, users);

      await expect(useCase.execute({ code: 'code-1' })).rejects.toBeInstanceOf(AuthInternalError);
      expect(provider.records.some((r) => r.email === 'google_123')).toBe(true);
    });
  });

  describe('LoginUseCase', () => {
    it('returns tokens for a confirmed account', async () => {
      provider.seed({ email: 'a@test.com', status: 'CONFIRMED', password: 'Secret1!' });
      const useCase = new LoginUseCase(provider, users);

      const tokens = await useCase.execute({ email: 'a@test.com', password: 'Secret1!' });

      expect(tokens.accessToken).toBe('access-token');
    });

    it('returns the local user with its groups', async () => {
      provider.seed({ email: 'a@test.com', status: 'CONFIRMED', password: 'Secret1!' });
      provider.groups = ['@admin'];
      await users.create(User.create({ email: 'a@test.com', name: 'Alice', cognitoId: 'sub-a' }));
      const useCase = new LoginUseCase(provider, users);

      const result = await useCase.execute({ email: 'a@test.com', password: 'Secret1!' });

      expect(result).not.toHaveProperty('groups');
      expect(result.user).toEqual({
        id: 1,
        name: 'Alice',
        email: 'a@test.com',
        pictureUrl: null,
        groups: ['@admin'],
      });
    });

    it('falls back to the email when the account has no local record', async () => {
      provider.seed({ email: 'a@test.com', status: 'CONFIRMED', password: 'Secret1!' });
      const useCase = new LoginUseCase(provider, users);

      const result = await useCase.execute({ email: 'a@test.com', password: 'Secret1!' });

      expect(result.user).toMatchObject({ name: 'a@test.com', email: 'a@test.com', groups: [] });
    });

    it('rejects an unconfirmed account', async () => {
      provider.seed({ email: 'a@test.com', status: 'UNCONFIRMED' });
      const useCase = new LoginUseCase(provider, users);

      await expect(useCase.execute({ email: 'a@test.com', password: 'x' })).rejects.toBeInstanceOf(
        AccountNotConfirmedError,
      );
    });

    it('completes the FORCE_CHANGE_PASSWORD challenge when a new password is supplied', async () => {
      provider.seed({ email: 'a@test.com', status: 'FORCE_CHANGE_PASSWORD' });
      const useCase = new LoginUseCase(provider, users);

      const tokens = await useCase.execute({
        email: 'a@test.com',
        password: 'Temp1234!',
        newPassword: 'NewSecret1!',
      });

      expect(tokens.idToken).toBe('id-token');
    });

    it('rejects FORCE_CHANGE_PASSWORD without a new password', async () => {
      provider.seed({ email: 'a@test.com', status: 'FORCE_CHANGE_PASSWORD' });
      const useCase = new LoginUseCase(provider, users);

      await expect(
        useCase.execute({ email: 'a@test.com', password: 'Temp1234!' }),
      ).rejects.toBeInstanceOf(NewPasswordRequiredError);
    });
  });

  describe('RefreshTokenUseCase', () => {
    it('returns new tokens and keeps the refresh token when none is rotated', async () => {
      provider.seed({ email: 'a@test.com' });
      const useCase = new RefreshTokenUseCase(provider);

      const tokens = await useCase.execute({ email: 'a@test.com', refreshToken: 'rt-1' });

      expect(tokens.accessToken).toBe('access-token');
      expect(tokens.refreshToken).toBe('rt-1');
    });

    it('rejects a revoked refresh token', async () => {
      provider.seed({ email: 'a@test.com' });
      provider.revokedTokens.add('rt-1');
      const useCase = new RefreshTokenUseCase(provider);

      await expect(
        useCase.execute({ email: 'a@test.com', refreshToken: 'rt-1' }),
      ).rejects.toBeInstanceOf(SessionExpiredError);
    });
  });

  describe('LogoutUseCase', () => {
    it('revokes the refresh token so it can no longer be used', async () => {
      provider.seed({ email: 'a@test.com' });
      const logout = new LogoutUseCase(provider);
      const refresh = new RefreshTokenUseCase(provider);

      const result = await logout.execute({ refreshToken: 'rt-1' });

      expect(result.message).toContain('Logged out');
      await expect(
        refresh.execute({ email: 'a@test.com', refreshToken: 'rt-1' }),
      ).rejects.toBeInstanceOf(SessionExpiredError);
    });
  });

  describe('ConfirmSignUpUseCase', () => {
    it('confirms the account with the correct code', async () => {
      provider.seed({ email: 'a@test.com', status: 'UNCONFIRMED', confirmationCode: '123456' });
      const useCase = new ConfirmSignUpUseCase(provider);

      const result = await useCase.execute({ email: 'a@test.com', code: '123456' });

      expect(result.message).toContain('confirmed');
    });

    it('rejects a wrong code', async () => {
      provider.seed({ email: 'a@test.com', status: 'UNCONFIRMED', confirmationCode: '123456' });
      const useCase = new ConfirmSignUpUseCase(provider);

      await expect(useCase.execute({ email: 'a@test.com', code: '000000' })).rejects.toBeInstanceOf(
        InvalidCodeError,
      );
    });
  });

  describe('ForgotPasswordUseCase', () => {
    it('always returns a generic message', async () => {
      const useCase = new ForgotPasswordUseCase(provider);

      const result = await useCase.execute({ email: 'unknown@test.com' });

      expect(result.message).toContain('If this email is registered');
    });
  });

  describe('ResetPasswordUseCase', () => {
    it('resets the password with a valid code', async () => {
      const record = provider.seed({ email: 'a@test.com' });
      record.resetCode = '654321';
      const useCase = new ResetPasswordUseCase(provider);

      const result = await useCase.execute({
        email: 'a@test.com',
        code: '654321',
        newPassword: 'NewSecret1!',
      });

      expect(result.message).toContain('reset successfully');
    });

    it('rejects an invalid code', async () => {
      provider.seed({ email: 'a@test.com' });
      const useCase = new ResetPasswordUseCase(provider);

      await expect(
        useCase.execute({ email: 'a@test.com', code: 'bad', newPassword: 'x' }),
      ).rejects.toBeInstanceOf(InvalidCodeError);
    });
  });
});
