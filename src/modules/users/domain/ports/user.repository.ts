import type { User } from '../entities/user.entity';

// Injection token for the user repository port.
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

// Port abstracting user persistence. The application layer depends on this
// interface only; the concrete TypeORM repository lives in infra.
export interface IUserRepository {
  create(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findByCognitoId(cognitoId: string): Promise<User | null>;
}
