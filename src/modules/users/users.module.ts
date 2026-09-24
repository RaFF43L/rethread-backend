import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSchema } from './infra/database/typeorm/user.schema';
import { USER_REPOSITORY } from './domain/ports/user.repository';
import { TypeOrmUserRepository } from './infra/database/typeorm-user.repository';

// Composition root for the users module: binds the user repository port to its
// TypeORM implementation and exports it for consumers (e.g. auth).
@Module({
  imports: [TypeOrmModule.forFeature([UserSchema])],
  providers: [{ provide: USER_REPOSITORY, useClass: TypeOrmUserRepository }],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
