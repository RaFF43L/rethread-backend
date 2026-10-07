import type { Page, PageQuery } from '../../../shared/kernel/pagination';
import { Favorite } from '../domain/entities/favorite.entity';
import type { IFavoriteRepository } from '../domain/ports/favorite.repository';

export class FakeFavoriteRepository implements IFavoriteRepository {
  readonly favorites: Favorite[] = [];
  private sequence = 0;

  add(favorite: Favorite): Promise<void> {
    const exists = this.favorites.some(
      (f) => f.userId === favorite.userId && f.productId === favorite.productId,
    );
    if (!exists) {
      this.sequence += 1;
      // Monotonic timestamps keep the newest-first ordering deterministic.
      favorite.setId(this.sequence).setCreatedAt(new Date(this.sequence * 1000));
      this.favorites.push(favorite);
    }
    return Promise.resolve();
  }

  remove(userId: number, productId: number): Promise<void> {
    const index = this.favorites.findIndex((f) => f.userId === userId && f.productId === productId);
    if (index >= 0) this.favorites.splice(index, 1);
    return Promise.resolve();
  }

  findByUser(userId: number, query: PageQuery): Promise<Page<Favorite>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const owned = this.favorites
      .filter((f) => f.userId === userId)
      .sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
    const start = (page - 1) * limit;
    return Promise.resolve({
      data: owned.slice(start, start + limit),
      total: owned.length,
      page,
      limit,
    });
  }
}
