import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Between, ILike, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { CustomError } from '../../../common/errors/custom-error';
import { MulterFile, S3Service } from '../../../common/services/s3.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { FilterProductsDto } from '../dto/filter-products.dto';
import { PaginateProductsDto } from '../dto/paginate-products.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { ProductImage } from '../entities/product-image.entity';
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
    private readonly s3Service: S3Service,
  ) {}

  async create(dto: CreateProductDto, files: MulterFile[]): Promise<ProductResponseDto> {
    this.logger.log(`create() called — files: ${files?.length ?? 0}, dto: ${JSON.stringify(dto)}`);

    if (!files || files.length === 0) {
      throw new CustomError('At least one product image is required.', HttpStatus.BAD_REQUEST);
    }

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

    this.logger.log(`Saving product entity...`);
    const saved = await this.productRepository.save(product);
    this.logger.log(`Product saved with id=${saved.id}`);

    const images = await Promise.all(
      files.map(async (file) => {
        this.logger.log(`Uploading file: ${file.originalname}`);
        const urlS3 = await this.s3Service.uploadFile(file, `products/${codigoIdentificacao}`);
        this.logger.log(`Uploaded to S3: ${urlS3}`);
        return this.productImageRepository.save(
          this.productImageRepository.create({ product: saved, urlS3 }),
        );
      }),
    );

    saved.images = images;
    return this.attachImageUrls(saved);
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

  async remove(id: number): Promise<void> {
    const product = await this.findOneOrFail(id);
    await this.productRepository.softRemove(product);
  }

  async findById(id: number): Promise<ProductResponseDto> {
    const product = await this.findOneOrFail(id);
    return this.attachImageUrls(product);
  }

  async findByCodigoIdentificacao(codigoIdentificacao: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { codigoIdentificacao },
      relations: ['images'],
    });

    if (!product) {
      throw new CustomError('Product not found.', HttpStatus.NOT_FOUND);
    }

    return this.attachImageUrls(product);
  }

  async findPaginated(dto: PaginateProductsDto): Promise<PaginatedResult<ProductResponseDto>> {
    const { page, limit } = dto;

    const [products, total] = await this.productRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['images'],
    });

    const data = products.map((p) => this.attachImageUrls(p));

    return { data, total, page, limit };
  }

  async findGroupedByCategories(): Promise<
    { category: ProductCategory; products: ProductResponseDto[] }[]
  > {
    const products = await this.productRepository.find({
      where: { status: ProductStatus.AVAILABLE },
      order: { createdAt: 'DESC' },
      relations: ['images'],
    });

    return Object.values(ProductCategory).map((category) => ({
      category,
      products: products.filter((p) => p.category === category).map((p) => this.attachImageUrls(p)),
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
      relations: ['images'],
    });

    const data = products.map((p) => this.attachImageUrls(p));

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
      relations: ['images'],
    });

    const data = products.map((p) => this.attachImageUrls(p));

    return { data, total, page, limit };
  }

  private attachImageUrls(product: Product): ProductResponseDto {
    const imageUrls = (product.images ?? []).map((img) => this.s3Service.getPublicUrl(img.urlS3));
    return { ...product, imageUrls };
  }

  private async findOneOrFail(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['images'],
    });

    if (!product) {
      throw new CustomError('Product not found.', HttpStatus.NOT_FOUND);
    }

    return product;
  }
}
