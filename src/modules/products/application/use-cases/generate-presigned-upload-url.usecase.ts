import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FILE_STORAGE, type IFileStorage } from '../../domain/ports/file-storage.port';
import type { GeneratePresignedUrlInput, PresignedUrlOutput } from '../dto/product.dto';

// Produces a presigned S3 URL so the client can upload media directly, plus the
// object key to register afterwards.
@Injectable()
export class GeneratePresignedUploadUrlUseCase {
  constructor(
    @Inject(FILE_STORAGE)
    private readonly fileStorage: IFileStorage,
  ) {}

  async execute(input: GeneratePresignedUrlInput): Promise<PresignedUrlOutput> {
    const codigoIdentificacao = input.productId ?? randomUUID();
    const key = `products/${codigoIdentificacao}/${input.fileName}`;
    const url = await this.fileStorage.generatePresignedUploadUrl(key, input.fileType);
    return { url, key };
  }
}
