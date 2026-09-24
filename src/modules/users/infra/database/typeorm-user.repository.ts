import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/ports/user.repository';
import { UserSchema } from './typeorm/user.schema';
import { toDomain, toPersistence } from './typeorm/user.mapper';

// TypeORM implementation of the user repository port. Returns domain entities
// via the mapper; never leaks the schema outside infra.
@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserSchema)
    private readonly users: Repository<UserSchema>,
  ) {}

  async create(user: User): Promise<User> {
    const row = this.users.create(toPersistence(user));
    const saved = await this.users.save(row);
    return toDomain(saved);
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.users.findOne({ where: { email } });
    return row === null ? null : toDomain(row);
  }

  async findByCognitoId(cognitoId: string): Promise<User | null> {
    const row = await this.users.findOne({ where: { cognitoId } });
    return row === null ? null : toDomain(row);
  }
}
