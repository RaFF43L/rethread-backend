import { Inject, Injectable } from '@nestjs/common';
import { ProductNotFoundError, ProductNotSoldError } from '../../domain/errors/product.error';
import { type IProductRepository, PRODUCT_REPOSITORY } from '../../domain/ports/product.repository';
import { ProductPresenter } from '../product.presenter';
import type { ProductOutput } from '../dto/product.dto';

// Reverts a sold product back to available. Rejects when it is not sold.
@Injectable()
export class RevertSaleUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly presenter: ProductPresenter,
  ) {}

  async execute(id: number): Promise<ProductOutput> {
    const saved = await this.productRepository.updateWithLock(id, (product) => {
      if (!product.isSold) {
        throw new ProductNotSoldError();
      }
      product.markAsAvailable();
    });
    if (saved === null) {
      throw new ProductNotFoundError();
    }
    return this.presenter.toOutput(saved);
  }
}
