import { User } from '../../../domain/entities/user.entity';
import { UserSchema } from './user.schema';

// Manual Schema <-> Entity mapping (architecture rule).
export function toDomain(schema: UserSchema): User {
  return User.restore({
    id: schema.id,
    email: schema.email,
    name: schema.name,
    cognito_id: schema.cognitoId,
    picture_url: schema.pictureUrl,
    created_at: schema.createdAt,
    updated_at: schema.updatedAt,
  });
}

export function toPersistence(entity: User): Partial<UserSchema> {
  return {
    email: entity.email,
    name: entity.name,
    cognitoId: entity.cognitoId,
    pictureUrl: entity.pictureUrl,
  };
}
