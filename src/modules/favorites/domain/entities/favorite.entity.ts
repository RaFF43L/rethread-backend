import { BaseEntity } from '../../../../shared/kernel/base-entity';

export interface FavoriteRow {
  id?: number;
  user_id: number;
  product_id: number;
  created_at?: Date;
}

interface CreateFavoriteProps {
  userId: number;
  productId: number;
}

export class Favorite extends BaseEntity {
  private constructor(
    public userId: number,
    public productId: number,
  ) {
    super();
  }

  static create(props: CreateFavoriteProps): Favorite {
    return new Favorite(props.userId, props.productId);
  }

  static restore(row: FavoriteRow): Favorite {
    return new Favorite(row.user_id, row.product_id).setId(row.id).setCreatedAt(row.created_at);
  }
}
