import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { AddFavoriteUseCase } from './application/use-cases/add-favorite.usecase';
import { ListFavoritesUseCase } from './application/use-cases/list-favorites.usecase';
import { RemoveFavoriteUseCase } from './application/use-cases/remove-favorite.usecase';
import { FAVORITE_REPOSITORY } from './domain/ports/favorite.repository';
import { FavoritesController } from './http/favorites.controller';
import { TypeOrmFavoriteRepository } from './infra/database/typeorm-favorite.repository';
import { FavoriteSchema } from './infra/database/typeorm/favorite.schema';

@Module({
  imports: [TypeOrmModule.forFeature([FavoriteSchema]), ProductsModule, UsersModule],
  controllers: [FavoritesController],
  providers: [
    AddFavoriteUseCase,
    RemoveFavoriteUseCase,
    ListFavoritesUseCase,
    { provide: FAVORITE_REPOSITORY, useClass: TypeOrmFavoriteRepository },
  ],
})
export class FavoritesModule {}
