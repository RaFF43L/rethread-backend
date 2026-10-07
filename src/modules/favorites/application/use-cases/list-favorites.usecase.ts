import { Inject, Injectable } from '@nestjs/common';
import type { Page, PageQuery } from '../../../../shared/kernel/pagination';
import type { ProductOutput } from '../../../products/application/dto/product.dto';
import { ProductPresenter } from '../../../products/application/product.presenter';
import type { Product } from '../../../products/domain/entities/product.entity';
import {
  type IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../products/domain/ports/product.repository';
import {
  FAVORITE_REPOSITORY,
  type IFavoriteRepository,
} from '../../domain/ports/favorite.repository';

@Injectable()
export class ListFavoritesUseCase {
  constructor(
    @Inject(FAVORITE_REPOSITORY)
    private readonly favoriteRepository: IFavoriteRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly presenter: ProductPresenter,
  ) {}

  async execute(userId: number, query: PageQuery): Promise<Page<ProductOutput>> {
    const page = await this.favoriteRepository.findByUser(userId, query);

    const products = await this.productRepository.findByIds(page.data.map((f) => f.productId));
    const byId = new Map(products.map((product) => [product.id, product]));
    const data = page.data
      .map((favorite) => byId.get(favorite.productId))
      .filter((product): product is Product => product !== undefined)
      .map((product) => this.presenter.toOutput(product));

    return { data, total: page.total, page: page.page, limit: page.limit };
  }
}
