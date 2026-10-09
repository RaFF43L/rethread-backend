import { Inject, Injectable } from '@nestjs/common';
import { ProductAlreadySoldError, ProductNotFoundError } from '../../domain/errors/product.error';
import { type IProductRepository, PRODUCT_REPOSITORY } from '../../domain/ports/product.repository';
import { ProductPresenter } from '../product.presenter';
import type { ProductOutput } from '../dto/product.dto';

// Marks an available product as sold. Rejects when it is already sold.
@Injectable()
export class SellProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly presenter: ProductPresenter,
  ) {}

  async execute(id: number): Promise<ProductOutput> {
    const saved = await this.productRepository.updateWithLock(id, (product) => {
      if (product.isSold) {
        throw new ProductAlreadySoldError();
      }
      product.markAsSold();
    });
    if (saved === null) {
      throw new ProductNotFoundError();
    }
    return this.presenter.toOutput(saved);
  }
}
