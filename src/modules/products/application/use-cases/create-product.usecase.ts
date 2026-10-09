import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AI_AGENT, type IAiAgent } from '../../../ai/domain/ports/ai-agent.port';
import { Product } from '../../domain/entities/product.entity';
import { type IProductRepository, PRODUCT_REPOSITORY } from '../../domain/ports/product.repository';
import { FILE_STORAGE, type IFileStorage } from '../../domain/ports/file-storage.port';
import { toAgentItem } from '../agent-item.mapper';
import { ProductPresenter } from '../product.presenter';
import type { CreateProductInput, CreateProductResult } from '../dto/product.dto';

// Creates a new product with a generated public identifier (UUID) and the
// default AVAILABLE status. When the client also sends fileName/fileType, a
// presigned S3 URL is returned alongside the product so the client can upload
// the media directly — the media is only linked to the product afterwards via
// register-image/register-video, once the upload actually happened.
@Injectable()
export class CreateProductUseCase {
  private readonly logger = new Logger(CreateProductUseCase.name);

  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly presenter: ProductPresenter,
    @Inject(FILE_STORAGE)
    private readonly fileStorage: IFileStorage,
    @Inject(AI_AGENT)
    private readonly aiAgent: IAiAgent,
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
    void this.publishToAgent(saved, input);

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

  // Best effort: a failure here must not roll back the product creation.
  private async publishToAgent(product: Product, input: CreateProductInput): Promise<void> {
    try {
      await this.aiAgent.createItem(toAgentItem(product, input));
    } catch (error) {
      this.logger.error(
        `Failed to publish product ${product.codigoIdentificacao} to the AI agent`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
