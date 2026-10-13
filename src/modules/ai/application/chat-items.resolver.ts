import { Inject, Injectable } from '@nestjs/common';
import type { ProductOutput } from '../../products/application/dto/product.dto';
import { ProductPresenter } from '../../products/application/product.presenter';
import {
  type IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../products/domain/ports/product.repository';

/**
 * Turns the SKUs the agent recommends into product cards: in the order given,
 * without duplicates, dropping SKUs that are not (or no longer) in the catalog.
 */
@Injectable()
export class ChatItemsResolver {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly presenter: ProductPresenter,
  ) {}

  async resolve(skus: readonly string[]): Promise<ProductOutput[]> {
    const uniqueSkus = [...new Set(skus)];
    if (uniqueSkus.length === 0) return [];

    const products = await this.productRepository.findByCodigosIdentificacao(uniqueSkus);
    const bySku = new Map(products.map((product) => [product.codigoIdentificacao, product]));
    return uniqueSkus.flatMap((sku) => {
      const product = bySku.get(sku);
      return product ? [this.presenter.toOutput(product)] : [];
    });
  }
}
