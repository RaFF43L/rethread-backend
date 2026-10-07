import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  IDENTITY_PROVIDER,
  type IIdentityProvider,
} from '../../domain/ports/identity-provider.port';
import type { AuthorizationUrlOutput } from '../dto/auth.dto';

@Injectable()
export class GetGoogleAuthorizationUrlUseCase {
  constructor(
    @Inject(IDENTITY_PROVIDER)
    private readonly identityProvider: IIdentityProvider,
  ) {}

  execute(): AuthorizationUrlOutput {
    const state = randomBytes(32).toString('base64url');
    return { url: this.identityProvider.getFederatedAuthorizationUrl('Google', state), state };
  }
}
