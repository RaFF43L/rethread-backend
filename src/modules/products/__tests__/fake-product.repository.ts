import { Product, ProductStatus } from '../domain/entities/product.entity';
import { ProductImage } from '../domain/entities/product-image.entity';
import { ProductVideo } from '../domain/entities/product-video.entity';
import type { IProductRepository, ProductFilter } from '../domain/ports/product.repository';
import type { ProductCategory } from '../domain/entities/product.entity';
import type { Page, PageQuery } from '../../../shared/kernel/pagination';

// In-memory fake standing in for the persistence boundary. Behaves like the
// real repository through its contract so use cases can be tested end to end
// without TypeORM.
export class FakeProductRepository implements IProductRepository {
  private readonly products: Product[] = [];
  private sequence = 0;
  private mediaSequence = 0;

  constructor(seed: Product[] = []) {
    for (const product of seed) {
      this.persist(product);
    }
  }

  create(product: Product): Promise<Product> {
    return Promise.resolve(this.persist(product));
  }

  save(product: Product): Promise<Product> {
    return Promise.resolve(product);
  }

  softRemove(product: Product): Promise<void> {
    const index = this.products.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      this.products.splice(index, 1);
    }
    return Promise.resolve();
  }

  findById(id: number): Promise<Product | null> {
    return Promise.resolve(this.products.find((p) => p.id === id) ?? null);
  }

  findByCodigoIdentificacao(codigoIdentificacao: string): Promise<Product | null> {
    return Promise.resolve(
      this.products.find((p) => p.codigoIdentificacao === codigoIdentificacao) ?? null,
    );
  }

  findPaginated(query: PageQuery): Promise<Page<Product>> {
    return Promise.resolve(this.paginate(this.products, query));
  }

  findAvailable(): Promise<Product[]> {
    return Promise.resolve(this.products.filter((p) => p.status === ProductStatus.AVAILABLE));
  }

  findAvailablePaginatedByCategory(
    category: ProductCategory,
    query: PageQuery,
  ): Promise<Page<Product>> {
    const filtered = this.products.filter(
      (p) => p.category === category && p.status === ProductStatus.AVAILABLE,
    );
    return Promise.resolve(this.paginate(filtered, query));
  }

  findFiltered(filter: ProductFilter): Promise<Page<Product>> {
    const filtered = this.products.filter((p) => {
      if (p.status !== ProductStatus.AVAILABLE) return false;
      if (filter.category !== undefined && p.category !== filter.category) return false;
      if (filter.size !== undefined && p.size !== filter.size) return false;
      if (filter.cor !== undefined && p.cor !== filter.cor) return false;
      if (filter.marca !== undefined && p.marca !== filter.marca) return false;
      if (filter.price?.min !== undefined && p.preco < filter.price.min) return false;
      if (filter.price?.max !== undefined && p.preco > filter.price.max) return false;
      return true;
    });
    return Promise.resolve(this.paginate(filtered, filter));
  }

  addImages(product: Product, images: ProductImage[]): Promise<ProductImage[]> {
    const persisted = images.map((image) => {
      this.mediaSequence += 1;
      return ProductImage.restore({ id: this.mediaSequence, url_s3: image.urlS3 });
    });
    product.addImages(persisted);
    return Promise.resolve(persisted);
  }

  addVideos(product: Product, videos: ProductVideo[]): Promise<ProductVideo[]> {
    const persisted = videos.map((video) => {
      this.mediaSequence += 1;
      return ProductVideo.restore({ id: this.mediaSequence, url_s3: video.urlS3 });
    });
    product.addVideos(persisted);
    return Promise.resolve(persisted);
  }

  private paginate(source: Product[], query: PageQuery): Page<Product> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const start = (page - 1) * limit;
    return {
      data: source.slice(start, start + limit),
      total: source.length,
      page,
      limit,
    };
  }

  private persist(product: Product): Product {
    this.sequence += 1;
    product.setId(product.id ?? this.sequence);
    product.setCreatedAt(product.createdAt ?? new Date());
    product.setUpdatedAt(product.updatedAt ?? new Date());
    this.products.push(product);
    return product;
  }
}
