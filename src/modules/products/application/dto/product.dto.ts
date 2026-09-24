import type { ProductCategory, ProductStatus } from '../../domain/entities/product.entity';

// Application-layer input/output contracts. Pure TypeScript: no framework or
// validation decorators (those live in the http/ DTOs).

export interface CreateProductInput {
  readonly cor: string;
  readonly marca: string;
  readonly descricao: string;
  readonly preco: number;
  readonly category: ProductCategory;
  readonly size: string;
}

export interface UpdateProductInput {
  readonly cor?: string;
  readonly marca?: string;
  readonly descricao?: string;
  readonly preco?: number;
  readonly category?: ProductCategory;
  readonly size?: string;
}

export interface GeneratePresignedUrlInput {
  readonly fileName: string;
  readonly fileType: string;
  readonly productId?: string;
}

export interface RegisterMediaInput {
  readonly productId: string;
  readonly key: string;
}

export interface PaginateInput {
  readonly page: number;
  readonly limit: number;
}

export interface FilterProductsInput extends PaginateInput {
  readonly category?: ProductCategory;
  readonly size?: string;
  readonly cor?: string;
  readonly marca?: string;
  readonly precoMin?: number;
  readonly precoMax?: number;
}

export interface DashboardInput {
  readonly startDate?: string;
  readonly endDate?: string;
  readonly category?: ProductCategory;
  readonly size?: string;
  readonly marca?: string;
  readonly cor?: string;
  readonly status?: ProductStatus;
}

export interface MediaOutput {
  id: number;
  urlS3: string;
}

export interface ProductOutput {
  id: number;
  codigoIdentificacao: string;
  cor: string;
  marca: string;
  descricao: string;
  preco: number;
  category: string;
  size: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  imageUrls: string[];
  images: MediaOutput[];
  videos: MediaOutput[];
}

export interface PresignedUrlOutput {
  url: string;
  key: string;
}
