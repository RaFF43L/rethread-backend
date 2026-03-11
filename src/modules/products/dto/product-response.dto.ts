import { Product } from '../entities/product.entity';

export interface ProductResponseDto extends Product {
  imageUrls: string[];
}
