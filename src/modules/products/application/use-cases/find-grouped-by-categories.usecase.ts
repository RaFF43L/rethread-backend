import { Inject, Injectable } from '@nestjs/common';
import { ProductCategory } from '../../domain/entities/product.entity';
import { type IProductRepository, PRODUCT_REPOSITORY } from '../../domain/ports/product.repository';
import { ProductPresenter } from '../product.presenter';
import type { ProductOutput } from '../dto/product.dto';

export interface CategoryGroup {
  category: ProductCategory;
  products: ProductOutput[];
}

// Returns available products grouped by every known category.
@Injectable()
export class FindGroupedByCategoriesUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly presenter: ProductPresenter,
  ) {}

  async execute(): Promise<CategoryGroup[]> {
    const products = await this.productRepository.findAvailable();

    return Object.values(ProductCategory).map((category) => ({
      category,
      products: products
        .filter((product) => product.category === category)
        .map((product) => this.presenter.toOutput(product)),
    }));
  }
}
