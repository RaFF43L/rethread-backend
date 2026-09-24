import { User } from '../../users/domain/entities/user.entity';
import type { IUserRepository } from '../../users/domain/ports/user.repository';

// In-memory fake for the user persistence boundary used by auth use cases.
export class FakeUserRepository implements IUserRepository {
  readonly users: User[] = [];
  private sequence = 0;
  failCreate = false;

  create(user: User): Promise<User> {
    if (this.failCreate) {
      return Promise.reject(new Error('db failure'));
    }
    this.sequence += 1;
    user.setId(this.sequence);
    this.users.push(user);
    return Promise.resolve(user);
  }

  findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(this.users.find((u) => u.email === email) ?? null);
  }

  findByCognitoId(cognitoId: string): Promise<User | null> {
    return Promise.resolve(this.users.find((u) => u.cognitoId === cognitoId) ?? null);
  }
}
