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
    const product = await this.productRepository.findById(id);
    if (product === null) {
      throw new ProductNotFoundError();
    }
    if (!product.isSold) {
      throw new ProductNotSoldError();
    }

    product.markAsAvailable();
    const saved = await this.productRepository.save(product);
    return this.presenter.toOutput(saved);
  }
}
