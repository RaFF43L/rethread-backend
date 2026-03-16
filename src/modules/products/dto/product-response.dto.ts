import { Product } from '../entities/product.entity';
import { ProductImageResponseDto } from './product-image-response.dto';
import { ProductVideoResponseDto } from './product-video-response.dto';

export interface ProductResponseDto {
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
  images: ProductImageResponseDto[];
  videos: ProductVideoResponseDto[];
}
