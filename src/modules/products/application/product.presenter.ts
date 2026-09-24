import { Injectable } from '@nestjs/common';
import type { Product } from '../domain/entities/product.entity';
import { FILE_STORAGE, type IFileStorage } from '../domain/ports/file-storage.port';
import { Inject } from '@nestjs/common';
import type { MediaOutput, ProductOutput } from './dto/product.dto';

// Translates a Product aggregate into the API response shape, resolving S3
// object keys into public URLs. Centralizes the presentation concern so use
// cases return domain entities and the controller stays thin.
@Injectable()
export class ProductPresenter {
  constructor(
    @Inject(FILE_STORAGE)
    private readonly fileStorage: IFileStorage,
  ) {}

  toOutput(product: Product): ProductOutput {
    const images: MediaOutput[] = (product.images ?? []).map((img) => ({
      id: img.id as number,
      urlS3: this.fileStorage.getPublicUrl(img.urlS3),
    }));
    const videos: MediaOutput[] = (product.videos ?? []).map((vid) => ({
      id: vid.id as number,
      urlS3: this.fileStorage.getPublicUrl(vid.urlS3),
    }));
    const imageUrls = images.map((img) => img.urlS3);

    return {
      id: product.id as number,
      codigoIdentificacao: product.codigoIdentificacao,
      cor: product.cor,
      marca: product.marca,
      descricao: product.descricao,
      preco: product.preco,
      category: product.category,
      size: product.size,
      status: product.status,
      createdAt: product.createdAt as Date,
      updatedAt: product.updatedAt as Date,
      deletedAt: product.deletedAt ?? null,
      imageUrls,
      images,
      videos,
    };
  }

  toMediaOutput(id: number, key: string): MediaOutput {
    return { id, urlS3: this.fileStorage.getPublicUrl(key) };
  }
}
