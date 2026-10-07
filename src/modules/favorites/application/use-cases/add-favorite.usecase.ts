import { Inject, Injectable } from '@nestjs/common';
import { ProductNotFoundError } from '../../../products/domain/errors/product.error';
import {
  type IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../products/domain/ports/product.repository';
import { Favorite } from '../../domain/entities/favorite.entity';
import {
  FAVORITE_REPOSITORY,
  type IFavoriteRepository,
} from '../../domain/ports/favorite.repository';

@Injectable()
export class AddFavoriteUseCase {
  constructor(
    @Inject(FAVORITE_REPOSITORY)
    private readonly favoriteRepository: IFavoriteRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(userId: number, productId: number): Promise<void> {
    if ((await this.productRepository.findById(productId)) === null) {
      throw new ProductNotFoundError();
    }
    await this.favoriteRepository.add(Favorite.create({ userId, productId }));
  }
}
