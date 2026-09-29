import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Product } from '../../domain/entities/product.entity';
import { type IProductRepository, PRODUCT_REPOSITORY } from '../../domain/ports/product.repository';
import { FILE_STORAGE, type IFileStorage } from '../../domain/ports/file-storage.port';
import { ProductPresenter } from '../product.presenter';
import type { CreateProductInput, CreateProductResult } from '../dto/product.dto';

// Creates a new product with a generated public identifier (UUID) and the
// default AVAILABLE status. When the client also sends fileName/fileType, a
// presigned S3 URL is returned alongside the product so the client can upload
// the media directly — the media is only linked to the product afterwards via
// register-image/register-video, once the upload actually happened.
@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly presenter: ProductPresenter,
    @Inject(FILE_STORAGE)
    private readonly fileStorage: IFileStorage,
  ) {}

  async execute(input: CreateProductInput): Promise<CreateProductResult> {
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

    const presignedUrls = input.media?.length
      ? await Promise.all(
          input.media.map(async (media) => {
            const key = `products/${saved.codigoIdentificacao}/${media.fileName}`;
            const url = await this.fileStorage.generatePresignedUploadUrl(key, media.fileType);
            return { key, url };
          }),
        )
      : undefined;

    return { product: this.presenter.toOutput(saved), presignedUrls };
  }
}
