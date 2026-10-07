import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { CognitoAuthGuard } from '../guards/cognito-auth.guard';

jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn().mockReturnValue('mock-jwks'),
  jwtVerify: jest.fn(),
}));

import { jwtVerify } from 'jose';

const mockReflector = {
  getAllAndOverride: jest.fn(),
};

const mockConfig = {
  getOrThrow: jest.fn((key: string) => {
    const values: Record<string, string> = {
      AWS_REGION: 'us-east-1',
      COGNITO_USER_POOL_ID: 'us-east-1_TestPool',
      COGNITO_CLIENT_ID: 'test-client',
    };
    return values[key];
  }),
};

const mockIdentityProvider = {
  isAccessTokenActive: jest.fn(),
};

const accessPayload = {
  sub: 'user-id',
  token_use: 'access',
  client_id: 'test-client',
  'cognito:groups': ['@admin'],
};

const makeContext = (
  token?: string,
  isPublic?: boolean,
  isAnyAuthenticated?: boolean,
): ExecutionContext => {
  mockReflector.getAllAndOverride.mockImplementation((key: string) =>
    key === IS_PUBLIC_KEY ? (isPublic ?? false) : (isAnyAuthenticated ?? false),
  );
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { authorization: token ? `Bearer ${token}` : undefined },
      }),
    }),
  } as unknown as ExecutionContext;
};

describe('CognitoAuthGuard', () => {
  let guard: CognitoAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIdentityProvider.isAccessTokenActive.mockResolvedValue(true);
    guard = new CognitoAuthGuard(
      mockReflector as unknown as Reflector,
      mockConfig as unknown as ConfigService,
      mockIdentityProvider as never,
    );
  });

  it('should allow public routes without a token', async () => {
    const ctx = makeContext(undefined, true);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(jwtVerify).not.toHaveBeenCalled();
  });

  it('should allow requests with a valid, active access token', async () => {
    (jwtVerify as jest.Mock).mockResolvedValue({ payload: accessPayload });
    const ctx = makeContext('valid.jwt.token');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(jwtVerify).toHaveBeenCalledWith('valid.jwt.token', 'mock-jwks', expect.any(Object));
    expect(mockIdentityProvider.isAccessTokenActive).toHaveBeenCalledWith('valid.jwt.token');
  });

  it('should throw UnauthorizedException when no token is provided', async () => {
    const ctx = makeContext(undefined);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when token verification fails', async () => {
    (jwtVerify as jest.Mock).mockRejectedValue(new Error('invalid token'));
    const ctx = makeContext('bad.jwt.token');
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    expect(mockIdentityProvider.isAccessTokenActive).not.toHaveBeenCalled();
  });

  it('should reject an id token used as bearer', async () => {
    (jwtVerify as jest.Mock).mockResolvedValue({ payload: { ...accessPayload, token_use: 'id' } });
    const ctx = makeContext('id.jwt.token');
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should reject a token issued to another client', async () => {
    (jwtVerify as jest.Mock).mockResolvedValue({
      payload: { ...accessPayload, client_id: 'other-client' },
    });
    const ctx = makeContext('other.jwt.token');
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should forbid a signed-in user outside the admin group', async () => {
    (jwtVerify as jest.Mock).mockResolvedValue({
      payload: { ...accessPayload, 'cognito:groups': ['us-east-1_TestPool_Google'] },
    });
    const ctx = makeContext('user.jwt.token');
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should forbid a token without groups', async () => {
    const { 'cognito:groups': _groups, ...withoutGroups } = accessPayload;
    (jwtVerify as jest.Mock).mockResolvedValue({ payload: withoutGroups });
    const ctx = makeContext('user.jwt.token');
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should allow a non-admin user on @AnyAuthenticated routes', async () => {
    (jwtVerify as jest.Mock).mockResolvedValue({
      payload: { ...accessPayload, 'cognito:groups': [] },
    });
    const ctx = makeContext('user.jwt.token', false, true);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('should reject a revoked access token (after logout)', async () => {
    (jwtVerify as jest.Mock).mockResolvedValue({ payload: accessPayload });
    mockIdentityProvider.isAccessTokenActive.mockResolvedValue(false);
    const ctx = makeContext('revoked.jwt.token');
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it(`should use '${IS_PUBLIC_KEY}' as the metadata key`, () => {
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });
});
