import { Inject, Injectable } from '@nestjs/common';
import { ProductCategory } from '../../domain/entities/product.entity';
import type { Page } from '../../../../shared/kernel/pagination';
import { type IProductRepository, PRODUCT_REPOSITORY } from '../../domain/ports/product.repository';
import { ProductPresenter } from '../product.presenter';
import type { PaginateInput, ProductOutput } from '../dto/product.dto';

// Lists available products for a given category, paginated.
@Injectable()
export class FindPaginatedByCategoryUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly presenter: ProductPresenter,
  ) {}

  async execute(category: ProductCategory, input: PaginateInput): Promise<Page<ProductOutput>> {
    const page = await this.productRepository.findAvailablePaginatedByCategory(category, input);
    return {
      data: page.data.map((product) => this.presenter.toOutput(product)),
      total: page.total,
      page: page.page,
      limit: page.limit,
    };
  }
}
