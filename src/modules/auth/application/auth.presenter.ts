import type { User } from '../../users/domain/entities/user.entity';
import type { AuthTokens } from '../domain/entities/auth-tokens.entity';
import type { AuthenticatedUserOutput, SessionTokensOutput } from './dto/auth.dto';

export function toSessionTokens({ groups: _groups, ...tokens }: AuthTokens): SessionTokensOutput {
  return tokens;
}

export function toAuthenticatedUser(user: User, groups: string[]): AuthenticatedUserOutput {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    pictureUrl: user.pictureUrl,
    groups,
  };
}
