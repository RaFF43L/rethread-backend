import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { IS_ANY_AUTHENTICATED_KEY } from '../decorators/any-authenticated.decorator';
import type { AuthenticatedRequest } from '../decorators/current-user.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import {
  IDENTITY_PROVIDER,
  type IIdentityProvider,
} from '../../modules/auth/domain/ports/identity-provider.port';

const ADMIN_GROUP = '@admin';

@Injectable()
export class CognitoAuthGuard implements CanActivate {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly issuer: string;
  private readonly clientId: string;

  constructor(
    private readonly reflector: Reflector,
    config: ConfigService,
    @Inject(IDENTITY_PROVIDER)
    private readonly identityProvider: IIdentityProvider,
  ) {
    const region = config.getOrThrow<string>('AWS_REGION');
    const userPoolId = config.getOrThrow<string>('COGNITO_USER_POOL_ID');
    this.clientId = config.getOrThrow<string>('COGNITO_CLIENT_ID');
    this.issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    this.jwks = createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`));
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException();

    // 1. Signature, issuer and expiration (local, cheap).
    let providerId: string;
    let groups: string[];
    try {
      const { payload } = await jwtVerify(token, this.jwks, { issuer: this.issuer });
      if (
        payload.token_use !== 'access' ||
        payload.client_id !== this.clientId ||
        typeof payload.sub !== 'string'
      ) {
        throw new Error('Not an access token for this client');
      }
      providerId = payload.sub;
      groups = Array.isArray(payload['cognito:groups']) ? payload['cognito:groups'] : [];
    } catch {
      throw new UnauthorizedException();
    }

    // Protected routes are admin-only by default: self-registered users (e.g.
    // Google sign-in) must opt in route by route via @AnyAuthenticated().
    const isAnyAuthenticated = this.reflector.getAllAndOverride<boolean>(IS_ANY_AUTHENTICATED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!isAnyAuthenticated && !groups.includes(ADMIN_GROUP)) {
      throw new ForbiddenException();
    }

    // 2. Revocation: a valid signature is not enough after logout (refresh
    // token revoked) or global sign-out, so ask Cognito.
    if (!(await this.identityProvider.isAccessTokenActive(token))) {
      throw new UnauthorizedException();
    }

    request.user = { providerId, groups };
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const auth = request.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return undefined;
    return auth.slice(7);
  }
}
