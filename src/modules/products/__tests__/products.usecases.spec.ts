import { CreateProductUseCase } from '../application/use-cases/create-product.usecase';
import { SellProductUseCase } from '../application/use-cases/sell-product.usecase';
import { RevertSaleUseCase } from '../application/use-cases/revert-sale.usecase';
import { UpdateProductUseCase } from '../application/use-cases/update-product.usecase';
import { RemoveProductUseCase } from '../application/use-cases/remove-product.usecase';
import { FindProductByIdUseCase } from '../application/use-cases/find-product-by-id.usecase';
import { FindProductByCodigoUseCase } from '../application/use-cases/find-product-by-codigo.usecase';
import { FindPaginatedProductsUseCase } from '../application/use-cases/find-paginated-products.usecase';
import { FindGroupedByCategoriesUseCase } from '../application/use-cases/find-grouped-by-categories.usecase';
import { FindPaginatedByCategoryUseCase } from '../application/use-cases/find-paginated-by-category.usecase';
import { FindFilteredProductsUseCase } from '../application/use-cases/find-filtered-products.usecase';
import { GeneratePresignedUploadUrlUseCase } from '../application/use-cases/generate-presigned-upload-url.usecase';
import { RegisterProductImageUseCase } from '../application/use-cases/register-product-image.usecase';
import { RegisterProductVideoUseCase } from '../application/use-cases/register-product-video.usecase';
import { ProductPresenter } from '../application/product.presenter';
import { ProductCategory, ProductStatus } from '../domain/entities/product.entity';
import {
  ProductAlreadySoldError,
  ProductNotFoundError,
  ProductNotSoldError,
} from '../domain/errors/product.error';
import type { UploadableFile } from '../domain/ports/file-storage.port';
import { FakeFileStorage } from './fake-file-storage';
import { FakeProductRepository } from './fake-product.repository';
import { buildProduct } from './product.builder';

const uploadable = (name: string): UploadableFile => ({
  originalname: name,
  mimetype: 'image/jpeg',
  buffer: Buffer.from(name),
});

describe('Products use cases', () => {
  let repository: FakeProductRepository;
  let storage: FakeFileStorage;
  let presenter: ProductPresenter;

  const setup = (seed = buildProduct()) => {
    repository = new FakeProductRepository([seed]);
    storage = new FakeFileStorage();
    presenter = new ProductPresenter(storage);
    return seed;
  };

  describe('CreateProductUseCase', () => {
    it('creates an available product and resolves image URLs (none yet)', async () => {
      repository = new FakeProductRepository();
      storage = new FakeFileStorage();
      presenter = new ProductPresenter(storage);
      const useCase = new CreateProductUseCase(repository, presenter);

      const result = await useCase.execute({
        cor: 'blue',
        marca: 'Nike',
        descricao: 'A shoe',
        preco: 199.99,
        category: ProductCategory.CALCA,
        size: 'M',
      });

      expect(result.id).toBeDefined();
      expect(result.status).toBe(ProductStatus.AVAILABLE);
      expect(result.codigoIdentificacao).toEqual(expect.any(String));
      expect(result.imageUrls).toEqual([]);
      await expect(repository.findById(result.id)).resolves.not.toBeNull();
    });
  });

  describe('SellProductUseCase', () => {
    it('marks an available product as sold', async () => {
      setup();
      const useCase = new SellProductUseCase(repository, presenter);

      const result = await useCase.execute(1);

      expect(result.status).toBe(ProductStatus.SOLD);
    });

    it('rejects when the product is already sold', async () => {
      setup(buildProduct({ status: ProductStatus.SOLD }));
      const useCase = new SellProductUseCase(repository, presenter);

      await expect(useCase.execute(1)).rejects.toBeInstanceOf(ProductAlreadySoldError);
    });

    it('rejects when the product does not exist', async () => {
      setup();
      const useCase = new SellProductUseCase(repository, presenter);

      await expect(useCase.execute(999)).rejects.toBeInstanceOf(ProductNotFoundError);
    });
  });

  describe('RevertSaleUseCase', () => {
    it('reverts a sold product back to available', async () => {
      setup(buildProduct({ status: ProductStatus.SOLD }));
      const useCase = new RevertSaleUseCase(repository, presenter);

      const result = await useCase.execute(1);

      expect(result.status).toBe(ProductStatus.AVAILABLE);
    });

    it('rejects when the product is not sold', async () => {
      setup();
      const useCase = new RevertSaleUseCase(repository, presenter);

      await expect(useCase.execute(1)).rejects.toBeInstanceOf(ProductNotSoldError);
    });

    it('rejects when the product does not exist', async () => {
      setup();
      const useCase = new RevertSaleUseCase(repository, presenter);

      await expect(useCase.execute(999)).rejects.toBeInstanceOf(ProductNotFoundError);
    });
  });

  describe('UpdateProductUseCase', () => {
    it('applies only the provided fields', async () => {
      setup();
      const useCase = new UpdateProductUseCase(repository, storage, presenter);

      const result = await useCase.execute(1, { preco: 249.99, size: 'G' });

      expect(result.preco).toBe(249.99);
      expect(result.size).toBe('G');
      expect(result.cor).toBe('blue');
    });

    it('uploads new images and appends them to the product', async () => {
      setup(buildProduct({ imageKeys: [] }));
      const useCase = new UpdateProductUseCase(repository, storage, presenter);

      const result = await useCase.execute(1, {}, [uploadable('new1.jpg'), uploadable('new2.jpg')]);

      expect(storage.uploaded).toHaveLength(2);
      expect(result.images).toHaveLength(2);
      expect(result.imageUrls[0]).toContain(FakeFileStorage.BASE_URL);
    });

    it('rejects when the product does not exist', async () => {
      setup();
      const useCase = new UpdateProductUseCase(repository, storage, presenter);

      await expect(useCase.execute(999, { preco: 10 })).rejects.toBeInstanceOf(
        ProductNotFoundError,
      );
    });
  });

  describe('RemoveProductUseCase', () => {
    it('soft-removes an existing product', async () => {
      setup();
      const useCase = new RemoveProductUseCase(repository);

      await expect(useCase.execute(1)).resolves.toBeUndefined();
      await expect(repository.findById(1)).resolves.toBeNull();
    });

    it('rejects when the product does not exist', async () => {
      setup();
      const useCase = new RemoveProductUseCase(repository);

      await expect(useCase.execute(999)).rejects.toBeInstanceOf(ProductNotFoundError);
    });
  });

  describe('FindProductByIdUseCase', () => {
    it('returns a product with resolved image URLs', async () => {
      setup(buildProduct({ imageKeys: ['products/img.jpg'] }));
      const useCase = new FindProductByIdUseCase(repository, presenter);

      const result = await useCase.execute(1);

      expect(result.imageUrls).toEqual([`${FakeFileStorage.BASE_URL}products/img.jpg`]);
    });

    it('rejects when the product does not exist', async () => {
      setup();
      const useCase = new FindProductByIdUseCase(repository, presenter);

      await expect(useCase.execute(999)).rejects.toBeInstanceOf(ProductNotFoundError);
    });
  });

  describe('FindProductByCodigoUseCase', () => {
    it('returns a product by its public identifier', async () => {
      setup(buildProduct({ codigoIdentificacao: 'abc-123', imageKeys: ['products/img.jpg'] }));
      const useCase = new FindProductByCodigoUseCase(repository, presenter);

      const result = await useCase.execute('abc-123');

      expect(result.codigoIdentificacao).toBe('abc-123');
      expect(result.imageUrls).toEqual([`${FakeFileStorage.BASE_URL}products/img.jpg`]);
    });

    it('rejects when the product does not exist', async () => {
      setup();
      const useCase = new FindProductByCodigoUseCase(repository, presenter);

      await expect(useCase.execute('missing')).rejects.toBeInstanceOf(ProductNotFoundError);
    });
  });

  describe('FindPaginatedProductsUseCase', () => {
    it('returns paginated products with resolved image URLs', async () => {
      repository = new FakeProductRepository([
        buildProduct({ id: 1, imageKeys: ['products/1.jpg'] }),
        buildProduct({ id: 2, imageKeys: ['products/2.jpg'] }),
      ]);
      storage = new FakeFileStorage();
      presenter = new ProductPresenter(storage);
      const useCase = new FindPaginatedProductsUseCase(repository, presenter);

      const result = await useCase.execute({ page: 1, limit: 10 });

      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.data[0].imageUrls).toEqual([`${FakeFileStorage.BASE_URL}products/1.jpg`]);
    });
  });

  describe('FindGroupedByCategoriesUseCase', () => {
    it('groups available products by every known category', async () => {
      repository = new FakeProductRepository([
        buildProduct({ id: 1, category: ProductCategory.CALCA }),
        buildProduct({ id: 2, category: ProductCategory.BLUSA }),
      ]);
      storage = new FakeFileStorage();
      presenter = new ProductPresenter(storage);
      const useCase = new FindGroupedByCategoriesUseCase(repository, presenter);

      const result = await useCase.execute();

      expect(result).toHaveLength(Object.values(ProductCategory).length);
      expect(result.find((g) => g.category === ProductCategory.CALCA)?.products).toHaveLength(1);
      expect(result.find((g) => g.category === ProductCategory.BLUSA)?.products).toHaveLength(1);
    });
  });

  describe('FindPaginatedByCategoryUseCase', () => {
    it('returns available products for a category', async () => {
      repository = new FakeProductRepository([
        buildProduct({ id: 1, category: ProductCategory.CALCA }),
        buildProduct({ id: 2, category: ProductCategory.BLUSA }),
      ]);
      storage = new FakeFileStorage();
      presenter = new ProductPresenter(storage);
      const useCase = new FindPaginatedByCategoryUseCase(repository, presenter);

      const result = await useCase.execute(ProductCategory.CALCA, { page: 1, limit: 10 });

      expect(result.total).toBe(1);
      expect(result.data[0].category).toBe(ProductCategory.CALCA);
    });
  });

  describe('FindFilteredProductsUseCase', () => {
    it('filters by size and color', async () => {
      repository = new FakeProductRepository([
        buildProduct({ id: 1, size: 'M', cor: 'blue' }),
        buildProduct({ id: 2, size: 'G', cor: 'red' }),
      ]);
      storage = new FakeFileStorage();
      presenter = new ProductPresenter(storage);
      const useCase = new FindFilteredProductsUseCase(repository, presenter);

      const result = await useCase.execute({ size: 'M', cor: 'blue', page: 1, limit: 10 });

      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe(1);
    });

    it('applies a price range filter', async () => {
      repository = new FakeProductRepository([
        buildProduct({ id: 1, preco: 100 }),
        buildProduct({ id: 2, preco: 300 }),
      ]);
      storage = new FakeFileStorage();
      presenter = new ProductPresenter(storage);
      const useCase = new FindFilteredProductsUseCase(repository, presenter);

      const result = await useCase.execute({ precoMin: 50, precoMax: 200, page: 1, limit: 10 });

      expect(result.total).toBe(1);
      expect(result.data[0].preco).toBe(100);
    });
  });

  describe('GeneratePresignedUploadUrlUseCase', () => {
    it('returns a presigned URL and the object key', async () => {
      storage = new FakeFileStorage();
      const useCase = new GeneratePresignedUploadUrlUseCase(storage);

      const result = await useCase.execute({
        fileName: 'photo.jpg',
        fileType: 'image/jpeg',
        productId: 'abc-123',
      });

      expect(result.key).toBe('products/abc-123/photo.jpg');
      expect(result.url).toContain('upload/products/abc-123/photo.jpg');
    });
  });

  describe('RegisterProductImageUseCase', () => {
    it('registers an uploaded image against a product', async () => {
      setup(buildProduct({ codigoIdentificacao: 'abc-123', imageKeys: [] }));
      const useCase = new RegisterProductImageUseCase(repository, presenter);

      const result = await useCase.execute({ productId: 'abc-123', key: 'products/new.jpg' });

      expect(result.urlS3).toBe(`${FakeFileStorage.BASE_URL}products/new.jpg`);
      expect(result.id).toBeDefined();
    });

    it('rejects when the product does not exist', async () => {
      setup();
      const useCase = new RegisterProductImageUseCase(repository, presenter);

      await expect(
        useCase.execute({ productId: 'missing', key: 'products/new.jpg' }),
      ).rejects.toBeInstanceOf(ProductNotFoundError);
    });
  });

  describe('RegisterProductVideoUseCase', () => {
    it('registers an uploaded video against a product', async () => {
      setup(buildProduct({ codigoIdentificacao: 'abc-123' }));
      const useCase = new RegisterProductVideoUseCase(repository, presenter);

      const result = await useCase.execute({ productId: 'abc-123', key: 'products/clip.mp4' });

      expect(result.urlS3).toBe(`${FakeFileStorage.BASE_URL}products/clip.mp4`);
    });

    it('rejects when the product does not exist', async () => {
      setup();
      const useCase = new RegisterProductVideoUseCase(repository, presenter);

      await expect(
        useCase.execute({ productId: 'missing', key: 'products/clip.mp4' }),
      ).rejects.toBeInstanceOf(ProductNotFoundError);
    });
  });
});
