import type { Product, ProductCategory, ProductStatus } from '../entities/product.entity';
import type { ProductImage } from '../entities/product-image.entity';
import type { ProductVideo } from '../entities/product-video.entity';
import type { Page, PageQuery } from '../../../../shared/kernel/pagination';

// Injection token for the product repository port. Use cases depend on the
// interface only; the TypeORM implementation is bound in the module.
export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface PriceRange {
  readonly min?: number;
  readonly max?: number;
}

export interface ProductFilter extends PageQuery {
  readonly category?: ProductCategory;
  readonly size?: string;
  readonly cor?: string;
  readonly marca?: string;
  readonly price?: PriceRange;
  readonly status?: ProductStatus;
}

// Port for the persisted product catalog (domain/ports). The TypeORM
// implementation lives in infra and performs the manual Schema <-> Entity mapping.
export interface IProductRepository {
  create(product: Product): Promise<Product>;
  save(product: Product): Promise<Product>;
  softRemove(product: Product): Promise<void>;
  findById(id: number): Promise<Product | null>;
  findByCodigoIdentificacao(codigoIdentificacao: string): Promise<Product | null>;
  findPaginated(query: PageQuery): Promise<Page<Product>>;
  findAvailable(): Promise<Product[]>;
  findAvailablePaginatedByCategory(
    category: ProductCategory,
    query: PageQuery,
  ): Promise<Page<Product>>;
  findFiltered(filter: ProductFilter): Promise<Page<Product>>;
  addImages(product: Product, images: ProductImage[]): Promise<ProductImage[]>;
  addVideos(product: Product, videos: ProductVideo[]): Promise<ProductVideo[]>;
}
