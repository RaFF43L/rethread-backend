import { Inject, Injectable } from '@nestjs/common';
import type { Page } from '../../../../shared/kernel/pagination';
import { type IProductRepository, PRODUCT_REPOSITORY } from '../../domain/ports/product.repository';
import { ProductPresenter } from '../product.presenter';
import type { PaginateInput, ProductOutput } from '../dto/product.dto';

// Lists products with pagination, ordered by status then creation date.
@Injectable()
export class FindPaginatedProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly presenter: ProductPresenter,
  ) {}

  async execute(input: PaginateInput): Promise<Page<ProductOutput>> {
    const page = await this.productRepository.findPaginated(input);
    return {
      data: page.data.map((product) => this.presenter.toOutput(product)),
      total: page.total,
      page: page.page,
      limit: page.limit,
    };
  }
}
