import { Favorite } from '../../../domain/entities/favorite.entity';
import { FavoriteSchema } from './favorite.schema';

export function toDomain(schema: FavoriteSchema): Favorite {
  return Favorite.restore({
    id: schema.id,
    user_id: schema.userId,
    product_id: schema.productId,
    created_at: schema.createdAt,
  });
}

export function toPersistence(entity: Favorite): Partial<FavoriteSchema> {
  return {
    userId: entity.userId,
    productId: entity.productId,
  };
}
