import { Inject, Injectable } from '@nestjs/common';
import { ProductNotFoundError } from '../../domain/errors/product.error';
import { type IProductRepository, PRODUCT_REPOSITORY } from '../../domain/ports/product.repository';

// Soft-deletes a product after ensuring it exists.
@Injectable()
export class RemoveProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (product === null) {
      throw new ProductNotFoundError();
    }
    await this.productRepository.softRemove(product);
  }
}
