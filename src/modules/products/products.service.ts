import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { CustomError } from '../../common/errors/custom-error';
import { MulterFile, S3Service } from '../../common/services/s3.service';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginateProductsDto } from './dto/paginate-products.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { Product, ProductStatus } from './entities/product.entity';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly s3Service: S3Service,
  ) {}

  async create(dto: CreateProductDto, file: MulterFile): Promise<ProductResponseDto> {
    if (!file) {
      throw new CustomError('Product image is required.', HttpStatus.BAD_REQUEST);
    }

    const codigoIdentificacao = randomUUID();
    const urlS3 = await this.s3Service.uploadFile(file, `products/${codigoIdentificacao}`);

    const product = this.productRepository.create({
      cor: dto.cor,
      marca: dto.marca,
      descricao: dto.descricao,
      preco: dto.preco,
      codigoIdentificacao,
      urlS3,
      status: ProductStatus.AVAILABLE,
    });

    const saved = await this.productRepository.save(product);
    return this.attachImageUrl(saved);
  }

  async sell(id: number): Promise<Product> {
    const product = await this.findOneOrFail(id);

    if (product.status === ProductStatus.SOLD) {
      throw new CustomError('Product is already sold.', HttpStatus.CONFLICT);
    }

    product.status = ProductStatus.SOLD;

    return this.productRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOneOrFail(id);
    await this.productRepository.softRemove(product);
  }

  async findById(id: number): Promise<ProductResponseDto> {
    const product = await this.findOneOrFail(id);
    return this.attachImageUrl(product);
  }

  async findByCodigoIdentificacao(codigoIdentificacao: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({ where: { codigoIdentificacao } });

    if (!product) {
      throw new CustomError('Product not found.', HttpStatus.NOT_FOUND);
    }

    return this.attachImageUrl(product);
  }

  async findPaginated(dto: PaginateProductsDto): Promise<PaginatedResult<ProductResponseDto>> {
    const { page, limit } = dto;

    const [products, total] = await this.productRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const data = products.map((p) => this.attachImageUrl(p));

    return { data, total, page, limit };
  }

  private attachImageUrl(product: Product): ProductResponseDto {
    const imageUrl = this.s3Service.getPublicUrl(product.urlS3);
    return { ...product, imageUrl };
  }

  private async findOneOrFail(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new CustomError('Product not found.', HttpStatus.NOT_FOUND);
    }

    return product;
  }
}
