import { Controller, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PaginateProductsDto } from '../../products/http/dto/paginate-products.dto';
import { CurrentUserId } from '../../users/http/decorators/current-user-id.decorator';
import { AddFavoriteUseCase } from '../application/use-cases/add-favorite.usecase';
import { ListFavoritesUseCase } from '../application/use-cases/list-favorites.usecase';
import { RemoveFavoriteUseCase } from '../application/use-cases/remove-favorite.usecase';
import {
  AddFavoriteRoute,
  FavoritesTag,
  ListFavoritesRoute,
  RemoveFavoriteRoute,
} from './decorators/favorites-routes.decorator';

@FavoritesTag()
@Controller('favorites')
export class FavoritesController {
  constructor(
    private readonly addFavorite: AddFavoriteUseCase,
    private readonly removeFavorite: RemoveFavoriteUseCase,
    private readonly listFavorites: ListFavoritesUseCase,
  ) {}

  @AddFavoriteRoute()
  add(@CurrentUserId() userId: number, @Param('productId', ParseIntPipe) productId: number) {
    return this.addFavorite.execute(userId, productId);
  }

  @RemoveFavoriteRoute()
  remove(@CurrentUserId() userId: number, @Param('productId', ParseIntPipe) productId: number) {
    return this.removeFavorite.execute(userId, productId);
  }

  @ListFavoritesRoute()
  list(@CurrentUserId() userId: number, @Query() dto: PaginateProductsDto) {
    return this.listFavorites.execute(userId, dto);
  }
}
