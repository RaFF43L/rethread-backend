import { FavoritesController } from '../http/favorites.controller';

describe('FavoritesController', () => {
  const addFavorite = { execute: jest.fn() };
  const removeFavorite = { execute: jest.fn() };
  const listFavorites = { execute: jest.fn() };

  const controller = new FavoritesController(
    addFavorite as never,
    removeFavorite as never,
    listFavorites as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('delegates add with the current user id and product id', () => {
    void controller.add(1, 7);
    expect(addFavorite.execute).toHaveBeenCalledWith(1, 7);
  });

  it('delegates remove with the current user id and product id', () => {
    void controller.remove(1, 7);
    expect(removeFavorite.execute).toHaveBeenCalledWith(1, 7);
  });

  it('delegates list with the current user id and pagination', () => {
    const dto = { page: 2, limit: 10 };
    void controller.list(1, dto);
    expect(listFavorites.execute).toHaveBeenCalledWith(1, dto);
  });
});
