import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomError } from '../../../common/errors/custom-error';
import { MulterFile, S3Service } from '../../../common/services/s3.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { PaginateProductsDto } from '../dto/paginate-products.dto';
import { Product, ProductStatus } from '../entities/product.entity';
import { ProductsService } from '../products.service';

const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  softRemove: jest.fn(),
};

const mockS3Service = {
  uploadFile: jest.fn(),
  getPublicUrl: jest.fn(),
};

const mockFile: MulterFile = {
  originalname: 'shoe.jpg',
  mimetype: 'image/jpeg',
  buffer: Buffer.from('fake-image'),
};

const makeProduct = (overrides: Partial<Product> = {}): Product =>
  ({
    id: 1,
    codigoIdentificacao: 'codigo-uuid',
    cor: 'blue',
    marca: 'Nike',
    urlS3: 'https://s3.example.com/img.jpg',
    status: ProductStatus.AVAILABLE,
    descricao: 'A shoe',
    preco: 199.99,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }) as Product;

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: mockRepository },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('create', () => {
    it('should upload image to S3 and return the saved product', async () => {
      const dto: CreateProductDto = {
        cor: 'blue',
        marca: 'Nike',
        descricao: 'A shoe',
        preco: 199.99,
      };
      const s3Key = 'products/uuid-generated.jpg';
      const publicUrl = 'https://rethread-prod.s3.us-east-1.amazonaws.com/products/uuid-generated.jpg';
      const product = makeProduct();

      mockS3Service.uploadFile.mockResolvedValue(s3Key);
      mockS3Service.getPublicUrl.mockReturnValue(publicUrl);
      mockRepository.create.mockReturnValue(product);
      mockRepository.save.mockResolvedValue(product);

      const result = await service.create(dto, mockFile);

      expect(mockS3Service.uploadFile).toHaveBeenCalledWith(
        mockFile,
        expect.stringMatching(/^products\/.+/),
      );
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ cor: 'blue', urlS3: s3Key, status: ProductStatus.AVAILABLE }),
      );
      expect(result).toEqual({ ...product, imageUrl: publicUrl });
    });

    it('should throw CustomError with BAD_REQUEST when no file is provided', async () => {
      const dto: CreateProductDto = {
        cor: 'blue',
        marca: 'Nike',
        descricao: 'A shoe',
        preco: 199.99,
      };

      await expect(service.create(dto, null as unknown as MulterFile)).rejects.toThrow(CustomError);
      await expect(service.create(dto, null as unknown as MulterFile)).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
    });
  });

  describe('sell', () => {
    it('should mark product as sold', async () => {
      const product = makeProduct();
      const sold = makeProduct({ status: ProductStatus.SOLD });

      mockRepository.findOne.mockResolvedValue(product);
      mockRepository.save.mockResolvedValue(sold);

      const result = await service.sell(1);

      expect(result.status).toBe(ProductStatus.SOLD);
    });

    it('should throw CustomError with CONFLICT if product is already sold', async () => {
      mockRepository.findOne.mockResolvedValue(makeProduct({ status: ProductStatus.SOLD }));

      await expect(service.sell(1)).rejects.toThrow(CustomError);
      await expect(service.sell(1)).rejects.toMatchObject({ status: HttpStatus.CONFLICT });
    });

    it('should throw CustomError with NOT_FOUND if product does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.sell(999)).rejects.toThrow(CustomError);
      await expect(service.sell(999)).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });
  });

  describe('remove', () => {
    it('should soft remove a product', async () => {
      const product = makeProduct();
      mockRepository.findOne.mockResolvedValue(product);
      mockRepository.softRemove.mockResolvedValue(product);

      await expect(service.remove(1)).resolves.toBeUndefined();
      expect(mockRepository.softRemove).toHaveBeenCalledWith(product);
    });

    it('should throw CustomError with NOT_FOUND if product does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(CustomError);
      await expect(service.remove(999)).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });
  });

  describe('findById', () => {
    it('should return a product with imageUrl', async () => {
      const product = makeProduct();
      const publicUrl = 'https://rethread-prod.s3.us-east-1.amazonaws.com/products/img.jpg';
      mockRepository.findOne.mockResolvedValue(product);
      mockS3Service.getPublicUrl.mockReturnValue(publicUrl);

      const result = await service.findById(1);

      expect(result).toEqual({ ...product, imageUrl: publicUrl });
      expect(mockS3Service.getPublicUrl).toHaveBeenCalledWith(product.urlS3);
    });

    it('should throw CustomError with NOT_FOUND if product does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(CustomError);
      await expect(service.findById(999)).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });
  });

  describe('findByCodigoIdentificacao', () => {
    it('should return a product with imageUrl', async () => {
      const product = makeProduct();
      const publicUrl = 'https://rethread-prod.s3.us-east-1.amazonaws.com/products/img.jpg';
      mockRepository.findOne.mockResolvedValue(product);
      mockS3Service.getPublicUrl.mockReturnValue(publicUrl);

      const result = await service.findByCodigoIdentificacao(product.codigoIdentificacao);

      expect(result).toEqual({ ...product, imageUrl: publicUrl });
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { codigoIdentificacao: product.codigoIdentificacao },
      });
    });

    it('should throw CustomError with NOT_FOUND if product does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findByCodigoIdentificacao('non-existent-uuid')).rejects.toThrow(CustomError);
      await expect(service.findByCodigoIdentificacao('non-existent-uuid')).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });
  });

  describe('findPaginated', () => {
    it('should return paginated products with imageUrl', async () => {
      const products = [makeProduct({ id: 1 }), makeProduct({ id: 2 })];
      const publicUrl = 'https://rethread-prod.s3.us-east-1.amazonaws.com/products/img.jpg';
      mockRepository.findAndCount.mockResolvedValue([products, 2]);
      mockS3Service.getPublicUrl.mockReturnValue(publicUrl);

      const dto: PaginateProductsDto = { page: 1, limit: 10 };
      const result = await service.findPaginated(dto);

      expect(result.data).toEqual(products.map((p) => ({ ...p, imageUrl: publicUrl })));
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });

    it('should calculate correct skip for page 2', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findPaginated({ page: 2, limit: 20 });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20 }),
      );
    });
  });
});
