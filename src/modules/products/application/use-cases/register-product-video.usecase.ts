import { Inject, Injectable } from '@nestjs/common';
import { ProductVideo } from '../../domain/entities/product-video.entity';
import { ProductNotFoundError } from '../../domain/errors/product.error';
import { type IProductRepository, PRODUCT_REPOSITORY } from '../../domain/ports/product.repository';
import { ProductPresenter } from '../product.presenter';
import type { MediaOutput, RegisterMediaInput } from '../dto/product.dto';

// Registers a previously uploaded video (by S3 key) against a product resolved
// through its public identifier.
@Injectable()
export class RegisterProductVideoUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly presenter: ProductPresenter,
  ) {}

  async execute(input: RegisterMediaInput): Promise<MediaOutput> {
    const product = await this.productRepository.findByCodigoIdentificacao(input.productId);
    if (product === null) {
      throw new ProductNotFoundError();
    }

    const [video] = await this.productRepository.addVideos(product, [
      ProductVideo.create(input.key),
    ]);

    return this.presenter.toMediaOutput(video.id as number, video.urlS3);
  }
}
