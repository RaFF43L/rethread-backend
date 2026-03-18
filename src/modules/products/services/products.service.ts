import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Between, ILike, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { CustomError } from '../../../common/errors/custom-error';
import { MulterFile, S3Service } from '../../../common/services/s3.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { GeneratePresignedUrlDto } from '../dto/generate-presigned-url.dto';
import { RegisterProductImageDto } from '../dto/register-product-image.dto';
import { FilterProductsDto } from '../dto/filter-products.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { PaginateProductsDto } from '../dto/paginate-products.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { ProductImage } from '../entities/product-image.entity';
import { ProductVideo } from '../entities/product-video.entity';
import { Product, ProductCategory, ProductStatus } from '../entities/product.entity';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    @InjectRepository(ProductVideo)
    private readonly productVideoRepository: Repository<ProductVideo>,
    private readonly s3Service: S3Service,
  ) {}

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    const codigoIdentificacao = randomUUID();
    const product = this.productRepository.create({
      cor: dto.cor,
      marca: dto.marca,
      descricao: dto.descricao,
      preco: dto.preco,
      category: dto.category,
      size: dto.size,
      codigoIdentificacao,
      status: ProductStatus.AVAILABLE,
    });
    const saved = await this.productRepository.save(product);
    return this.attachMediaUrls(saved);
  }

  async generatePresignedUploadUrl(dto: GeneratePresignedUrlDto): Promise<{ url: string; key: string }> {
    const codigoIdentificacao = dto.productId ?? randomUUID();
    const key = `products/${codigoIdentificacao}/${dto.fileName}`;
    const url = await this.s3Service.generatePresignedUploadUrl(key, dto.fileType);
    return { url, key };
  }

  async registerImage(dto: RegisterProductImageDto) {
    const product = await this.productRepository.findOne({
      where: { codigoIdentificacao: dto.productId },
    });
    if (!product) {
      throw new CustomError('Product not found.', HttpStatus.NOT_FOUND);
    }
    const image = await this.productImageRepository.save(
      this.productImageRepository.create({ product, urlS3: dto.key }),
    );
    return {
      id: image.id,
      urlS3: this.s3Service.getPublicUrl(image.urlS3),
    };
  }

  async sell(id: number): Promise<Product> {
    const product = await this.findOneOrFail(id);

    if (product.status === ProductStatus.SOLD) {
      throw new CustomError('Product is already sold.', HttpStatus.CONFLICT);
    }

    product.status = ProductStatus.SOLD;

    return this.productRepository.save(product);
  }

  async revertSale(id: number): Promise<Product> {
    const product = await this.findOneOrFail(id);

    if (product.status !== ProductStatus.SOLD) {
      throw new CustomError('Product is not sold.', HttpStatus.CONFLICT);
    }

    product.status = ProductStatus.AVAILABLE;

    return this.productRepository.save(product);
  }

  async update(
    id: number,
    dto: UpdateProductDto,
    imageFiles: MulterFile[] = [],
    videoFiles: MulterFile[] = [],
  ): Promise<ProductResponseDto> {
    const product = await this.findOneOrFail(id);

    const fields = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    ) as Partial<Product>;
    Object.assign(product, fields);

    if (imageFiles.length) {
      const newImages = await Promise.all(
        imageFiles.map(async (file) => {
          const urlS3 = await this.s3Service.uploadFile(
            file,
            `products/${product.codigoIdentificacao}`,
          );
          return this.productImageRepository.save(
            this.productImageRepository.create({ product: { id } as Product, urlS3 }),
          );
        }),
      );
      product.images = [...(product.images ?? []), ...newImages];
    }

    if (videoFiles.length) {
      const newVideos = await Promise.all(
        videoFiles.map(async (file) => {
          const urlS3 = await this.s3Service.uploadFile(
            file,
            `products/${product.codigoIdentificacao}`,
          );
          return this.productVideoRepository.save(
            this.productVideoRepository.create({ product: { id } as Product, urlS3 }),
          );
        }),
      );
      product.videos = [...(product.videos ?? []), ...newVideos];
    }

    const saved = await this.productRepository.save(product);
    return this.attachMediaUrls(saved);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOneOrFail(id);
    await this.productRepository.softRemove(product);
  }

  async findById(id: number): Promise<ProductResponseDto> {
    const product = await this.findOneOrFail(id);
    return this.attachMediaUrls(product);
  }

  async findByCodigoIdentificacao(codigoIdentificacao: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { codigoIdentificacao },
      relations: ['images', 'videos'],
    });

    if (!product) {
      throw new CustomError('Product not found.', HttpStatus.NOT_FOUND);
    }

    return this.attachMediaUrls(product);
  }

  async findPaginated(dto: PaginateProductsDto): Promise<PaginatedResult<ProductResponseDto>> {
    const { page, limit } = dto;

    const [products, total] = await this.productRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { status: 'ASC', createdAt: 'DESC' },
      relations: ['images', 'videos'],
    });

    const data = products.map((p) => this.attachMediaUrls(p));

    return { data, total, page, limit };
  }

  async findGroupedByCategories(): Promise<
    { category: ProductCategory; products: ProductResponseDto[] }[]
  > {
    const products = await this.productRepository.find({
      where: { status: ProductStatus.AVAILABLE },
      order: { createdAt: 'DESC' },
      relations: ['images', 'videos'],
    });

    return Object.values(ProductCategory).map((category) => ({
      category,
      products: products.filter((p) => p.category === category).map((p) => this.attachMediaUrls(p)),
    }));
  }

  async findPaginatedByCategory(
    category: ProductCategory,
    dto: PaginateProductsDto,
  ): Promise<PaginatedResult<ProductResponseDto>> {
    const { page, limit } = dto;

    const [products, total] = await this.productRepository.findAndCount({
      where: { category, status: ProductStatus.AVAILABLE },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['images', 'videos'],
    });

    const data = products.map((p) => this.attachMediaUrls(p));

    return { data, total, page, limit };
  }

  async findFiltered(dto: FilterProductsDto): Promise<PaginatedResult<ProductResponseDto>> {
    const { page, limit, size, cor, marca, precoMin, precoMax, category } = dto;

    const priceWhere =
      precoMin !== undefined && precoMax !== undefined
        ? Between(precoMin, precoMax)
        : precoMin !== undefined
          ? MoreThanOrEqual(precoMin)
          : precoMax !== undefined
            ? LessThanOrEqual(precoMax)
            : undefined;

    const where = {
      status: ProductStatus.AVAILABLE,
      ...(category !== undefined && { category }),
      ...(size !== undefined && { size }),
      ...(cor !== undefined && { cor: ILike(`%${cor}%`) }),
      ...(marca !== undefined && { marca: ILike(`%${marca}%`) }),
      ...(priceWhere !== undefined && { preco: priceWhere }),
    };

    const [products, total] = await this.productRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['images', 'videos'],
    });

    const data = products.map((p) => this.attachMediaUrls(p));

    return { data, total, page, limit };
  }

  private attachMediaUrls(product: Product): ProductResponseDto {
    const imageUrls = (product.images ?? []).map((img) => this.s3Service.getPublicUrl(img.urlS3));
    const images = (product.images ?? []).map((img) => ({
      id: img.id,
      urlS3: this.s3Service.getPublicUrl(img.urlS3),
    }));
    const videos = (product.videos ?? []).map((vid) => ({
      id: vid.id,
      urlS3: this.s3Service.getPublicUrl(vid.urlS3),
    }));
    return { ...product, imageUrls, images, videos };
  }

  private async findOneOrFail(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['images', 'videos'],
    });

    if (!product) {
      throw new CustomError('Product not found.', HttpStatus.NOT_FOUND);
    }

    return product;
  }
}
