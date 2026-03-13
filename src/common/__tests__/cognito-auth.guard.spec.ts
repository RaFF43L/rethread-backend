import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
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
    };
    return values[key];
  }),
};

const makeContext = (token?: string, isPublic?: boolean): ExecutionContext => {
  mockReflector.getAllAndOverride.mockReturnValue(isPublic ?? false);
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
    guard = new CognitoAuthGuard(
      mockReflector as unknown as Reflector,
      mockConfig as unknown as ConfigService,
    );
  });

  it('should allow public routes without a token', async () => {
    const ctx = makeContext(undefined, true);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(jwtVerify).not.toHaveBeenCalled();
  });

  it('should allow requests with a valid token', async () => {
    (jwtVerify as jest.Mock).mockResolvedValue({ payload: { sub: 'user-id' } });
    const ctx = makeContext('valid.jwt.token');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(jwtVerify).toHaveBeenCalledWith('valid.jwt.token', 'mock-jwks', expect.any(Object));
  });

  it('should throw UnauthorizedException when no token is provided', async () => {
    const ctx = makeContext(undefined);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when token verification fails', async () => {
    (jwtVerify as jest.Mock).mockRejectedValue(new Error('invalid token'));
    const ctx = makeContext('bad.jwt.token');
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it(`should use '${IS_PUBLIC_KEY}' as the metadata key`, () => {
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });
});
