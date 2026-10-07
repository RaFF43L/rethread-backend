import type { Page, PageQuery } from '../../../../shared/kernel/pagination';
import type { Favorite } from '../entities/favorite.entity';

export const FAVORITE_REPOSITORY = Symbol('FAVORITE_REPOSITORY');

export interface IFavoriteRepository {
  // Idempotent: adding an existing favorite is a no-op.
  add(favorite: Favorite): Promise<void>;
  remove(userId: number, productId: number): Promise<void>;
  // Newest first; favorites of soft-deleted products are excluded.
  findByUser(userId: number, query: PageQuery): Promise<Page<Favorite>>;
}
