import { Inject, Injectable, Logger } from '@nestjs/common';
import { AI_AGENT, type IAiAgent } from '../../../ai/domain/ports/ai-agent.port';
import type { Product } from '../../domain/entities/product.entity';
import { ProductImage } from '../../domain/entities/product-image.entity';
import { ProductVideo } from '../../domain/entities/product-video.entity';
import { ProductNotFoundError } from '../../domain/errors/product.error';
import {
  FILE_STORAGE,
  type IFileStorage,
  type UploadableFile,
} from '../../domain/ports/file-storage.port';
import { type IProductRepository, PRODUCT_REPOSITORY } from '../../domain/ports/product.repository';
import { toAgentItem, toAgentItemChanges } from '../agent-item.mapper';
import { ProductPresenter } from '../product.presenter';
import type { ProductOutput, UpdateProductInput } from '../dto/product.dto';

// Applies partial field changes to a product and optionally uploads new image
// and video files, appending them to the aggregate.
@Injectable()
export class UpdateProductUseCase {
  private readonly logger = new Logger(UpdateProductUseCase.name);

  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(FILE_STORAGE)
    private readonly fileStorage: IFileStorage,
    private readonly presenter: ProductPresenter,
    @Inject(AI_AGENT)
    private readonly aiAgent: IAiAgent,
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
    void this.syncWithAgent(saved, input);
    return this.presenter.toOutput(saved);
  }

  // Best effort: a failure here must not roll back the update. Products the agent
  // doesn't know yet (e.g. created before the integration) are created in full.
  private async syncWithAgent(product: Product, input: UpdateProductInput): Promise<void> {
    const changes = toAgentItemChanges(input);
    if (Object.keys(changes).length === 0) return;

    try {
      const updated = await this.aiAgent.updateItem(product.codigoIdentificacao, changes);
      if (!updated) {
        await this.aiAgent.createItem(toAgentItem(product, input));
      }
    } catch (error) {
      this.logger.error(
        `Failed to sync product ${product.codigoIdentificacao} with the AI agent`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
