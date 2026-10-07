import { ProductPresenter } from '../../products/application/product.presenter';
import { ProductNotFoundError } from '../../products/domain/errors/product.error';
import { FakeFileStorage } from '../../products/__tests__/fake-file-storage';
import { FakeProductRepository } from '../../products/__tests__/fake-product.repository';
import { buildProduct } from '../../products/__tests__/product.builder';
import { AddFavoriteUseCase } from '../application/use-cases/add-favorite.usecase';
import { ListFavoritesUseCase } from '../application/use-cases/list-favorites.usecase';
import { RemoveFavoriteUseCase } from '../application/use-cases/remove-favorite.usecase';
import { FakeFavoriteRepository } from './fake-favorite.repository';

const ALICE = 1;
const BOB = 2;

describe('Favorites use cases', () => {
  let favorites: FakeFavoriteRepository;
  let add: AddFavoriteUseCase;
  let remove: RemoveFavoriteUseCase;
  let list: ListFavoritesUseCase;

  beforeEach(() => {
    favorites = new FakeFavoriteRepository();
    const products = new FakeProductRepository([
      buildProduct({ id: 1 }),
      buildProduct({ id: 2, codigoIdentificacao: 'codigo-2' }),
      buildProduct({ id: 3, codigoIdentificacao: 'codigo-3' }),
    ]);
    const presenter = new ProductPresenter(new FakeFileStorage());
    add = new AddFavoriteUseCase(favorites, products);
    remove = new RemoveFavoriteUseCase(favorites);
    list = new ListFavoritesUseCase(favorites, products, presenter);
  });

  describe('AddFavoriteUseCase', () => {
    it('favorites a product for the user', async () => {
      await add.execute(ALICE, 1);
      expect(favorites.favorites).toHaveLength(1);
      expect(favorites.favorites[0]).toMatchObject({ userId: ALICE, productId: 1 });
    });

    it('is idempotent', async () => {
      await add.execute(ALICE, 1);
      await add.execute(ALICE, 1);
      expect(favorites.favorites).toHaveLength(1);
    });

    it('throws ProductNotFoundError for an unknown product', async () => {
      await expect(add.execute(ALICE, 99)).rejects.toBeInstanceOf(ProductNotFoundError);
    });
  });

  describe('RemoveFavoriteUseCase', () => {
    it('removes only the given product from the user favorites', async () => {
      await add.execute(ALICE, 1);
      await add.execute(ALICE, 2);
      await remove.execute(ALICE, 1);
      expect(favorites.favorites.map((f) => f.productId)).toEqual([2]);
    });

    it('is a no-op when the product is not favorited', async () => {
      await expect(remove.execute(ALICE, 1)).resolves.toBeUndefined();
    });

    it('does not touch other users favorites', async () => {
      await add.execute(BOB, 1);
      await remove.execute(ALICE, 1);
      expect(favorites.favorites).toHaveLength(1);
    });
  });

  describe('ListFavoritesUseCase', () => {
    it('lists the user favorite products newest first', async () => {
      await add.execute(ALICE, 1);
      await add.execute(ALICE, 3);
      await add.execute(BOB, 2);

      const result = await list.execute(ALICE, { page: 1, limit: 20 });

      expect(result.total).toBe(2);
      expect(result.data.map((p) => p.id)).toEqual([3, 1]);
      expect(result.data[0].imageUrls).toEqual(expect.any(Array));
    });

    it('paginates', async () => {
      await add.execute(ALICE, 1);
      await add.execute(ALICE, 2);
      await add.execute(ALICE, 3);

      const result = await list.execute(ALICE, { page: 2, limit: 2 });

      expect(result).toMatchObject({ total: 3, page: 2, limit: 2 });
      expect(result.data.map((p) => p.id)).toEqual([1]);
    });

    it('returns an empty page when the user has no favorites', async () => {
      const result = await list.execute(ALICE, { page: 1, limit: 20 });
      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20 });
    });
  });
});
