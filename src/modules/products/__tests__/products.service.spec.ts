import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomError } from '../../../common/errors/custom-error';
import { MulterFile, S3Service } from '../../../common/services/s3.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { FilterProductsDto } from '../dto/filter-products.dto';
import { PaginateProductsDto } from '../dto/paginate-products.dto';
import { ProductImage } from '../entities/product-image.entity';
import { Product, ProductCategory, ProductStatus } from '../entities/product.entity';
import { ProductsService } from '../services/products.service';

const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  softRemove: jest.fn(),
};

const mockImageRepository = {
  create: jest.fn(),
  save: jest.fn(),
};

const mockS3Service = {
  uploadFile: jest.fn(),
  getPublicUrl: jest.fn(),
};

const mockFiles: MulterFile[] = [
  { originalname: 'shoe1.jpg', mimetype: 'image/jpeg', buffer: Buffer.from('fake-image-1') },
  { originalname: 'shoe2.jpg', mimetype: 'image/jpeg', buffer: Buffer.from('fake-image-2') },
];

const makeImage = (overrides: Partial<ProductImage> = {}): ProductImage =>
  ({ id: 1, urlS3: 'products/img.jpg', product: {} as Product, ...overrides }) as ProductImage;

const makeProduct = (overrides: Partial<Product> = {}): Product =>
  ({
    id: 1,
    codigoIdentificacao: 'codigo-uuid',
    cor: 'blue',
    marca: 'Nike',
    images: [makeImage()],
    status: ProductStatus.AVAILABLE,
    category: ProductCategory.CALCA,
    size: 'M',
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
        { provide: getRepositoryToken(ProductImage), useValue: mockImageRepository },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('create', () => {
    it('should upload images to S3 and return the saved product', async () => {
      const dto: CreateProductDto = {
        cor: 'blue',
        marca: 'Nike',
        descricao: 'A shoe',
        preco: 199.99,
        category: ProductCategory.CALCA,
        size: 'M',
      };
      const s3Key = 'products/uuid-generated.jpg';
      const publicUrl =
        'https://rethread-prod.s3.us-east-1.amazonaws.com/products/uuid-generated.jpg';
      const product = makeProduct();
      const image = makeImage({ urlS3: s3Key });

      mockS3Service.uploadFile.mockResolvedValue(s3Key);
      mockS3Service.getPublicUrl.mockReturnValue(publicUrl);
      mockRepository.create.mockReturnValue(product);
      mockRepository.save.mockResolvedValue(product);
      mockImageRepository.create.mockReturnValue(image);
      mockImageRepository.save.mockResolvedValue(image);

      const result = await service.create(dto, mockFiles);

      expect(mockS3Service.uploadFile).toHaveBeenCalledTimes(mockFiles.length);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cor: 'blue',
          status: ProductStatus.AVAILABLE,
          category: ProductCategory.CALCA,
          size: 'M',
        }),
      );
      expect(result.imageUrls).toEqual([publicUrl, publicUrl]);
    });

    it('should throw CustomError with BAD_REQUEST when no files are provided', async () => {
      const dto: CreateProductDto = {
        cor: 'blue',
        marca: 'Nike',
        descricao: 'A shoe',
        preco: 199.99,
        category: ProductCategory.CALCA,
        size: 'M',
      };

      await expect(service.create(dto, [])).rejects.toThrow(CustomError);
      await expect(service.create(dto, [])).rejects.toMatchObject({
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

  describe('revertSale', () => {
    it('should revert a sold product back to available', async () => {
      const sold = makeProduct({ status: ProductStatus.SOLD });
      const available = makeProduct({ status: ProductStatus.AVAILABLE });

      mockRepository.findOne.mockResolvedValue(sold);
      mockRepository.save.mockResolvedValue(available);

      const result = await service.revertSale(1);

      expect(result.status).toBe(ProductStatus.AVAILABLE);
    });

    it('should throw CustomError with CONFLICT if product is not sold', async () => {
      mockRepository.findOne.mockResolvedValue(makeProduct({ status: ProductStatus.AVAILABLE }));

      await expect(service.revertSale(1)).rejects.toThrow(CustomError);
      await expect(service.revertSale(1)).rejects.toMatchObject({ status: HttpStatus.CONFLICT });
    });

    it('should throw CustomError with NOT_FOUND if product does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.revertSale(999)).rejects.toThrow(CustomError);
      await expect(service.revertSale(999)).rejects.toMatchObject({
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
    it('should return a product with imageUrls', async () => {
      const product = makeProduct();
      const publicUrl = 'https://rethread-prod.s3.us-east-1.amazonaws.com/products/img.jpg';
      mockRepository.findOne.mockResolvedValue(product);
      mockS3Service.getPublicUrl.mockReturnValue(publicUrl);

      const result = await service.findById(1);

      expect(result.imageUrls).toEqual([publicUrl]);
      expect(mockS3Service.getPublicUrl).toHaveBeenCalledWith(product.images[0].urlS3);
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
    it('should return a product with imageUrls', async () => {
      const product = makeProduct();
      const publicUrl = 'https://rethread-prod.s3.us-east-1.amazonaws.com/products/img.jpg';
      mockRepository.findOne.mockResolvedValue(product);
      mockS3Service.getPublicUrl.mockReturnValue(publicUrl);

      const result = await service.findByCodigoIdentificacao(product.codigoIdentificacao);

      expect(result.imageUrls).toEqual([publicUrl]);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { codigoIdentificacao: product.codigoIdentificacao },
        relations: ['images'],
      });
    });

    it('should throw CustomError with NOT_FOUND if product does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findByCodigoIdentificacao('non-existent-uuid')).rejects.toThrow(
        CustomError,
      );
      await expect(service.findByCodigoIdentificacao('non-existent-uuid')).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });
  });

  describe('findPaginated', () => {
    it('should return paginated products with imageUrls', async () => {
      const products = [makeProduct({ id: 1 }), makeProduct({ id: 2 })];
      const publicUrl = 'https://rethread-prod.s3.us-east-1.amazonaws.com/products/img.jpg';
      mockRepository.findAndCount.mockResolvedValue([products, 2]);
      mockS3Service.getPublicUrl.mockReturnValue(publicUrl);

      const dto: PaginateProductsDto = { page: 1, limit: 10 };
      const result = await service.findPaginated(dto);

      expect(result.data[0].imageUrls).toEqual([publicUrl]);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
        relations: ['images'],
      });
    });

    it('should calculate correct skip for page 2', async () => {
      mockRepository.findAndCount.mockResolvedValue([[] as Product[], 0] as const);

      await service.findPaginated({ page: 2, limit: 20 });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20 }),
      );
    });
  });

  describe('findGroupedByCategories', () => {
    it('should return products grouped by all categories', async () => {
      const products = [
        makeProduct({ id: 1, category: ProductCategory.CALCA }),
        makeProduct({ id: 2, category: ProductCategory.BLUSA }),
      ];
      const publicUrl = 'https://rethread-prod.s3.us-east-1.amazonaws.com/products/img.jpg';
      mockRepository.find.mockResolvedValue(products);
      mockS3Service.getPublicUrl.mockReturnValue(publicUrl);

      const result = await service.findGroupedByCategories();

      expect(result).toHaveLength(Object.values(ProductCategory).length);
      const calcas = result.find((g) => g.category === ProductCategory.CALCA);
      expect(calcas?.products).toHaveLength(1);
      const blusas = result.find((g) => g.category === ProductCategory.BLUSA);
      expect(blusas?.products).toHaveLength(1);
    });
  });

  describe('findPaginatedByCategory', () => {
    it('should return paginated products for a category', async () => {
      const products = [makeProduct({ category: ProductCategory.CALCA })];
      const publicUrl = 'https://rethread-prod.s3.us-east-1.amazonaws.com/products/img.jpg';
      mockRepository.findAndCount.mockResolvedValue([products, 1]);
      mockS3Service.getPublicUrl.mockReturnValue(publicUrl);

      const result = await service.findPaginatedByCategory(ProductCategory.CALCA, {
        page: 1,
        limit: 10,
      });

      expect(result.total).toBe(1);
      expect(result.data[0].imageUrls).toEqual([publicUrl]);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category: ProductCategory.CALCA, status: ProductStatus.AVAILABLE },
        }),
      );
    });
  });

  describe('findFiltered', () => {
    it('should filter by size and cor', async () => {
      const products: Product[] = [makeProduct({ size: 'M', cor: 'blue' })];
      const publicUrl = 'https://rethread-prod.s3.us-east-1.amazonaws.com/products/img.jpg';
      mockRepository.findAndCount.mockResolvedValue([products, 1] as [Product[], number]);
      mockS3Service.getPublicUrl.mockReturnValue(publicUrl);

      const dto: FilterProductsDto = { size: 'M', cor: 'blue', page: 1, limit: 10 };
      const result = await service.findFiltered(dto);

      expect(result.total).toBe(1);
      expect(result.data[0].imageUrls).toEqual([publicUrl]);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({ size: 'M', status: ProductStatus.AVAILABLE }),
        }),
      );
    });

    it('should filter by category and size combined', async () => {
      mockRepository.findAndCount.mockResolvedValue([[] as Product[], 0] as [Product[], number]);

      await service.findFiltered({
        category: ProductCategory.CALCA,
        size: 'M',
        page: 1,
        limit: 10,
      });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({
            category: ProductCategory.CALCA,
            size: 'M',
            status: ProductStatus.AVAILABLE,
          }),
        }),
      );
    });

    it('should apply price range filter with Between', async () => {
      mockRepository.findAndCount.mockResolvedValue([[] as Product[], 0] as [Product[], number]);

      await service.findFiltered({ precoMin: 50, precoMax: 200, page: 1, limit: 10 });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({ preco: expect.anything() }),
        }),
      );
    });
  });
});
