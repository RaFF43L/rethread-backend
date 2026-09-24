import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Product } from '../../domain/entities/product.entity';
import { type IProductRepository, PRODUCT_REPOSITORY } from '../../domain/ports/product.repository';
import { ProductPresenter } from '../product.presenter';
import type { CreateProductInput, ProductOutput } from '../dto/product.dto';

// Creates a new product with a generated public identifier (UUID) and the
// default AVAILABLE status.
@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly presenter: ProductPresenter,
  ) {}

  async execute(input: CreateProductInput): Promise<ProductOutput> {
    const product = Product.create({
      codigoIdentificacao: randomUUID(),
      cor: input.cor,
      marca: input.marca,
      descricao: input.descricao,
      preco: input.preco,
      category: input.category,
      size: input.size,
    });

    const saved = await this.productRepository.create(product);
    return this.presenter.toOutput(saved);
  }
}
