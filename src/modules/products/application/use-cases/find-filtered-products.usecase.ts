import { Inject, Injectable } from '@nestjs/common';
import type { Page } from '../../../../shared/kernel/pagination';
import {
  type IProductRepository,
  PRODUCT_REPOSITORY,
  type ProductFilter,
} from '../../domain/ports/product.repository';
import { ProductPresenter } from '../product.presenter';
import type { FilterProductsInput, ProductOutput } from '../dto/product.dto';

// Filters available products by category, size, color, brand and price range.
@Injectable()
export class FindFilteredProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly presenter: ProductPresenter,
  ) {}

  async execute(input: FilterProductsInput): Promise<Page<ProductOutput>> {
    const filter: ProductFilter = {
      page: input.page,
      limit: input.limit,
      category: input.category,
      size: input.size,
      cor: input.cor,
      marca: input.marca,
      price:
        input.precoMin !== undefined || input.precoMax !== undefined
          ? { min: input.precoMin, max: input.precoMax }
          : undefined,
    };

    const page = await this.productRepository.findFiltered(filter);
    return {
      data: page.data.map((product) => this.presenter.toOutput(product)),
      total: page.total,
      page: page.page,
      limit: page.limit,
    };
  }
}
