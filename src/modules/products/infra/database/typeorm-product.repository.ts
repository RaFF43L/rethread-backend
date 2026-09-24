import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import type { Page, PageQuery } from '../../../../shared/kernel/pagination';
import { Product, ProductCategory, ProductStatus } from '../../domain/entities/product.entity';
import { ProductImage } from '../../domain/entities/product-image.entity';
import { ProductVideo } from '../../domain/entities/product-video.entity';
import { IProductRepository, ProductFilter } from '../../domain/ports/product.repository';
import { ProductImageSchema } from './typeorm/product-image.schema';
import { ProductSchema } from './typeorm/product.schema';
import { ProductVideoSchema } from './typeorm/product-video.schema';
import { imageToDomain, toDomain, toPersistence, videoToDomain } from './typeorm/product.mapper';

const MEDIA_RELATIONS = ['images', 'videos'];

// TypeORM implementation of the product repository port. It never exposes the
// schema outside infra: every method returns domain entities via the mapper.
@Injectable()
export class TypeOrmProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(ProductSchema)
    private readonly products: Repository<ProductSchema>,
    @InjectRepository(ProductImageSchema)
    private readonly images: Repository<ProductImageSchema>,
    @InjectRepository(ProductVideoSchema)
    private readonly videos: Repository<ProductVideoSchema>,
  ) {}

  async create(product: Product): Promise<Product> {
    const row = this.products.create(toPersistence(product));
    const saved = await this.products.save(row);
    return toDomain(saved);
  }

  async save(product: Product): Promise<Product> {
    const row = await this.products.findOne({
      where: { id: product.id },
      relations: MEDIA_RELATIONS,
    });
    if (row === null) {
      // Fall back to a create-style save when the row is not yet persisted.
      const created = this.products.create(toPersistence(product));
      return toDomain(await this.products.save(created));
    }
    this.products.merge(row, toPersistence(product));
    const saved = await this.products.save(row);
    return toDomain(await this.reloadWithMedia(saved.id));
  }

  async softRemove(product: Product): Promise<void> {
    await this.products.softDelete({ id: product.id });
  }

  async findById(id: number): Promise<Product | null> {
    const row = await this.products.findOne({ where: { id }, relations: MEDIA_RELATIONS });
    return row === null ? null : toDomain(row);
  }

  async findByCodigoIdentificacao(codigoIdentificacao: string): Promise<Product | null> {
    const row = await this.products.findOne({
      where: { codigoIdentificacao },
      relations: MEDIA_RELATIONS,
    });
    return row === null ? null : toDomain(row);
  }

  async findPaginated(query: PageQuery): Promise<Page<Product>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [rows, total] = await this.products.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { status: 'ASC', createdAt: 'DESC' },
      relations: MEDIA_RELATIONS,
    });

    return { data: rows.map(toDomain), total, page, limit };
  }

  async findAvailable(): Promise<Product[]> {
    const rows = await this.products.find({
      where: { status: ProductStatus.AVAILABLE },
      order: { createdAt: 'DESC' },
      relations: MEDIA_RELATIONS,
    });
    return rows.map(toDomain);
  }

  async findAvailablePaginatedByCategory(
    category: ProductCategory,
    query: PageQuery,
  ): Promise<Page<Product>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [rows, total] = await this.products.findAndCount({
      where: { category, status: ProductStatus.AVAILABLE },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: MEDIA_RELATIONS,
    });

    return { data: rows.map(toDomain), total, page, limit };
  }

  async findFiltered(filter: ProductFilter): Promise<Page<Product>> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const { min, max } = filter.price ?? {};

    const priceWhere =
      min !== undefined && max !== undefined
        ? Between(min, max)
        : min !== undefined
          ? MoreThanOrEqual(min)
          : max !== undefined
            ? LessThanOrEqual(max)
            : undefined;

    const where = {
      status: ProductStatus.AVAILABLE,
      ...(filter.category !== undefined && { category: filter.category }),
      ...(filter.size !== undefined && { size: filter.size }),
      ...(filter.cor !== undefined && { cor: ILike(`%${filter.cor}%`) }),
      ...(filter.marca !== undefined && { marca: ILike(`%${filter.marca}%`) }),
      ...(priceWhere !== undefined && { preco: priceWhere }),
    };

    const [rows, total] = await this.products.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: MEDIA_RELATIONS,
    });

    return { data: rows.map(toDomain), total, page, limit };
  }

  async addImages(product: Product, images: ProductImage[]): Promise<ProductImage[]> {
    const saved = await this.images.save(
      images.map((image) =>
        this.images.create({ product: { id: product.id } as ProductSchema, urlS3: image.urlS3 }),
      ),
    );
    const domainImages = saved.map(imageToDomain);
    product.addImages(domainImages);
    return domainImages;
  }

  async addVideos(product: Product, videos: ProductVideo[]): Promise<ProductVideo[]> {
    const saved = await this.videos.save(
      videos.map((video) =>
        this.videos.create({ product: { id: product.id } as ProductSchema, urlS3: video.urlS3 }),
      ),
    );
    const domainVideos = saved.map(videoToDomain);
    product.addVideos(domainVideos);
    return domainVideos;
  }

  private async reloadWithMedia(id: number): Promise<ProductSchema> {
    const row = await this.products.findOne({ where: { id }, relations: MEDIA_RELATIONS });
    // Guaranteed to exist: caller just saved it.
    return row as ProductSchema;
  }
}
