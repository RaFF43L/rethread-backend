import { Inject, Injectable } from '@nestjs/common';
import { ProductImage } from '../../domain/entities/product-image.entity';
import { ProductVideo } from '../../domain/entities/product-video.entity';
import { ProductNotFoundError } from '../../domain/errors/product.error';
import {
  FILE_STORAGE,
  type IFileStorage,
  type UploadableFile,
} from '../../domain/ports/file-storage.port';
import { type IProductRepository, PRODUCT_REPOSITORY } from '../../domain/ports/product.repository';
import { ProductPresenter } from '../product.presenter';
import type { ProductOutput, UpdateProductInput } from '../dto/product.dto';

// Applies partial field changes to a product and optionally uploads new image
// and video files, appending them to the aggregate.
@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(FILE_STORAGE)
    private readonly fileStorage: IFileStorage,
    private readonly presenter: ProductPresenter,
  ) {}

  async execute(
    id: number,
    input: UpdateProductInput,
    imageFiles: UploadableFile[] = [],
    videoFiles: UploadableFile[] = [],
  ): Promise<ProductOutput> {
    const product = await this.productRepository.findById(id);
    if (product === null) {
      throw new ProductNotFoundError();
    }

    product.applyChanges(input);

    const folder = `products/${product.codigoIdentificacao}`;

    if (imageFiles.length > 0) {
      const keys = await Promise.all(
        imageFiles.map((file) => this.fileStorage.uploadFile(file, folder)),
      );
      await this.productRepository.addImages(
        product,
        keys.map((key) => ProductImage.create(key)),
      );
    }

    if (videoFiles.length > 0) {
      const keys = await Promise.all(
        videoFiles.map((file) => this.fileStorage.uploadFile(file, folder)),
      );
      await this.productRepository.addVideos(
        product,
        keys.map((key) => ProductVideo.create(key)),
      );
    }

    const saved = await this.productRepository.save(product);
    return this.presenter.toOutput(saved);
  }
}
