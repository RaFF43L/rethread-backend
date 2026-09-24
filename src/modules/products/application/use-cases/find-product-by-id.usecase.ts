import { Inject, Injectable } from '@nestjs/common';
import { ProductNotFoundError } from '../../domain/errors/product.error';
import { type IProductRepository, PRODUCT_REPOSITORY } from '../../domain/ports/product.repository';
import { ProductPresenter } from '../product.presenter';
import type { ProductOutput } from '../dto/product.dto';

// Fetches a single product by its numeric id.
@Injectable()
export class FindProductByIdUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly presenter: ProductPresenter,
  ) {}

  async execute(id: number): Promise<ProductOutput> {
    const product = await this.productRepository.findById(id);
    if (product === null) {
      throw new ProductNotFoundError();
    }
    return this.presenter.toOutput(product);
  }
}
