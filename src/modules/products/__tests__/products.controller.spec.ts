import { Test, TestingModule } from '@nestjs/testing';
import { MulterFile } from '../../../common/services/s3.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { FilterProductsDto } from '../dto/filter-products.dto';
import { PaginateProductsDto } from '../dto/paginate-products.dto';
import { Product, ProductCategory, ProductStatus } from '../entities/product.entity';
import { ProductsController } from '../products.controller';
import { PaginatedResult, ProductsService } from '../products.service';

const mockProductsService = {
  create: jest.fn(),
  sell: jest.fn(),
  revertSale: jest.fn(),
  remove: jest.fn(),
  findById: jest.fn(),
  findByCodigoIdentificacao: jest.fn(),
  findPaginated: jest.fn(),
  findGroupedByCategories: jest.fn(),
  findPaginatedByCategory: jest.fn(),
  findFiltered: jest.fn(),
};

const makeProduct = (overrides: Partial<Product> = {}): Product =>
  ({
    id: 1,
    codigoIdentificacao: 'codigo-uuid',
    cor: 'blue',
    marca: 'Nike',
    images: [],
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

describe('ProductsController', () => {
  let controller: ProductsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: mockProductsService }],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  describe('create', () => {
    it('should call productsService.create with the dto and files', async () => {
      const dto: CreateProductDto = {
        cor: 'blue',
        marca: 'Nike',
        descricao: 'A shoe',
        preco: 199.99,
        category: ProductCategory.CALCA,
        size: 'M',
      };
      const files: MulterFile[] = [
        { originalname: 'shoe.jpg', mimetype: 'image/jpeg', buffer: Buffer.from('fake-image') },
      ];
      const product = makeProduct();
      mockProductsService.create.mockResolvedValue(product);

      const result = await controller.create(dto, files);

      expect(result).toEqual(product);
      expect(mockProductsService.create).toHaveBeenCalledWith(dto, files);
    });
  });

  describe('sell', () => {
    it('should call productsService.sell with the id', async () => {
      const product = makeProduct({ status: ProductStatus.SOLD });
      mockProductsService.sell.mockResolvedValue(product);

      const result = await controller.sell(1);

      expect(result).toEqual(product);
      expect(mockProductsService.sell).toHaveBeenCalledWith(1);
    });
  });

  describe('revertSale', () => {
    it('should call productsService.revertSale with the id', async () => {
      const product = makeProduct({ status: ProductStatus.AVAILABLE });
      mockProductsService.revertSale.mockResolvedValue(product);

      const result = await controller.revertSale(1);

      expect(result).toEqual(product);
      expect(mockProductsService.revertSale).toHaveBeenCalledWith(1);
    });
  });

  describe('remove', () => {
    it('should call productsService.remove with the id', async () => {
      mockProductsService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(mockProductsService.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('findById', () => {
    it('should call productsService.findById with the id', async () => {
      const product = makeProduct();
      mockProductsService.findById.mockResolvedValue(product);

      const result = await controller.findById(1);

      expect(result).toEqual(product);
      expect(mockProductsService.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('findByCodigoIdentificacao', () => {
    it('should call productsService.findByCodigoIdentificacao with the uuid', async () => {
      const product = makeProduct();
      mockProductsService.findByCodigoIdentificacao.mockResolvedValue(product);

      const result = await controller.findByCodigoIdentificacao(product.codigoIdentificacao);

      expect(result).toEqual(product);
      expect(mockProductsService.findByCodigoIdentificacao).toHaveBeenCalledWith(
        product.codigoIdentificacao,
      );
    });
  });

  describe('findPaginated', () => {
    it('should call productsService.findPaginated with the dto', async () => {
      const dto: PaginateProductsDto = { page: 1, limit: 20 };
      const paginated: PaginatedResult<Product> = { data: [], total: 0, page: 1, limit: 20 };
      mockProductsService.findPaginated.mockResolvedValue(paginated);

      const result = await controller.findPaginated(dto);

      expect(result).toEqual(paginated);
      expect(mockProductsService.findPaginated).toHaveBeenCalledWith(dto);
    });
  });

  describe('findGroupedByCategories', () => {
    it('should call productsService.findGroupedByCategories', async () => {
      const grouped = [{ category: ProductCategory.CALCA, products: [] }];
      mockProductsService.findGroupedByCategories.mockResolvedValue(grouped);

      const result = await controller.findGroupedByCategories();

      expect(result).toEqual(grouped);
      expect(mockProductsService.findGroupedByCategories).toHaveBeenCalled();
    });
  });

  describe('findPaginatedByCategory', () => {
    it('should call productsService.findPaginatedByCategory with category and dto', async () => {
      const dto: PaginateProductsDto = { page: 1, limit: 20 };
      const paginated: PaginatedResult<Product> = { data: [], total: 0, page: 1, limit: 20 };
      mockProductsService.findPaginatedByCategory.mockResolvedValue(paginated);

      const result = await controller.findPaginatedByCategory(ProductCategory.CALCA, dto);

      expect(result).toEqual(paginated);
      expect(mockProductsService.findPaginatedByCategory).toHaveBeenCalledWith(
        ProductCategory.CALCA,
        dto,
      );
    });
  });

  describe('findFiltered', () => {
    it('should call productsService.findFiltered with the dto', async () => {
      const dto: FilterProductsDto = { size: 'M', cor: 'blue', page: 1, limit: 20 };
      const paginated: PaginatedResult<Product> = { data: [], total: 0, page: 1, limit: 20 };
      mockProductsService.findFiltered.mockResolvedValue(paginated);

      const result = await controller.findFiltered(dto);

      expect(result).toEqual(paginated);
      expect(mockProductsService.findFiltered).toHaveBeenCalledWith(dto);
    });
  });
});
