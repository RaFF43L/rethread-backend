import { ProductsController } from '../http/products.controller';
import { ProductCategory } from '../domain/entities/product.entity';
import type { UploadableFile } from '../domain/ports/file-storage.port';

// The controller is a thin HTTP adapter: it must only translate the request and
// delegate to a single use case. These tests assert that wiring, mocking each
// use case (the collaborators at the controller boundary).
describe('ProductsController', () => {
  const createProduct = { execute: jest.fn() };
  const generatePresignedUploadUrl = { execute: jest.fn() };
  const registerProductImage = { execute: jest.fn() };
  const registerProductVideo = { execute: jest.fn() };
  const sellProduct = { execute: jest.fn() };
  const revertSale = { execute: jest.fn() };
  const updateProduct = { execute: jest.fn() };
  const removeProduct = { execute: jest.fn() };
  const findProductById = { execute: jest.fn() };
  const findProductByCodigo = { execute: jest.fn() };
  const findPaginatedProducts = { execute: jest.fn() };
  const findGroupedByCategories = { execute: jest.fn() };
  const findPaginatedByCategory = { execute: jest.fn() };
  const findFilteredProducts = { execute: jest.fn() };
  const getDashboard = { execute: jest.fn() };

  const controller = new ProductsController(
    createProduct as never,
    generatePresignedUploadUrl as never,
    registerProductImage as never,
    registerProductVideo as never,
    sellProduct as never,
    revertSale as never,
    updateProduct as never,
    removeProduct as never,
    findProductById as never,
    findProductByCodigo as never,
    findPaginatedProducts as never,
    findGroupedByCategories as never,
    findPaginatedByCategory as never,
    findFilteredProducts as never,
    getDashboard as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('delegates create to CreateProductUseCase', () => {
    const dto = {
      cor: 'blue',
      marca: 'Nike',
      descricao: 'A shoe',
      preco: 199.99,
      category: ProductCategory.CALCA,
      size: 'M',
    };
    void controller.create(dto);
    expect(createProduct.execute).toHaveBeenCalledWith(dto);
  });

  it('delegates presigned URL generation', () => {
    const dto = { fileName: 'a.jpg', fileType: 'image/jpeg' };
    void controller.generatePresignedUploadUrlHandler(dto);
    expect(generatePresignedUploadUrl.execute).toHaveBeenCalledWith(dto);
  });

  it('delegates image registration', () => {
    const dto = { productId: 'abc', key: 'products/a.jpg' };
    void controller.registerImage(dto);
    expect(registerProductImage.execute).toHaveBeenCalledWith(dto);
  });

  it('delegates video registration', () => {
    const dto = { productId: 'abc', key: 'products/a.mp4' };
    void controller.registerVideo(dto);
    expect(registerProductVideo.execute).toHaveBeenCalledWith(dto);
  });

  it('delegates sell with the parsed id', () => {
    void controller.sell(1);
    expect(sellProduct.execute).toHaveBeenCalledWith(1);
  });

  it('delegates revert with the parsed id', () => {
    void controller.revert(1);
    expect(revertSale.execute).toHaveBeenCalledWith(1);
  });

  it('delegates update with id, dto and split media files', () => {
    const dto = { preco: 10 };
    const images: UploadableFile[] = [
      { originalname: 'i.jpg', mimetype: 'image/jpeg', buffer: Buffer.from('i') },
    ];
    const videos: UploadableFile[] = [
      { originalname: 'v.mp4', mimetype: 'video/mp4', buffer: Buffer.from('v') },
    ];
    void controller.update(1, dto, { images, videos });
    expect(updateProduct.execute).toHaveBeenCalledWith(1, dto, images, videos);
  });

  it('defaults media arrays to empty when none provided', () => {
    void controller.update(1, {}, {});
    expect(updateProduct.execute).toHaveBeenCalledWith(1, {}, [], []);
  });

  it('delegates remove with the parsed id', () => {
    void controller.remove(1);
    expect(removeProduct.execute).toHaveBeenCalledWith(1);
  });

  it('delegates findFiltered with the query dto', () => {
    const dto = { size: 'M', page: 1, limit: 10 };
    void controller.findFiltered(dto);
    expect(findFilteredProducts.execute).toHaveBeenCalledWith(dto);
  });

  it('delegates dashboard with the query dto', () => {
    const dto = { category: ProductCategory.CALCA };
    void controller.dashboard(dto);
    expect(getDashboard.execute).toHaveBeenCalledWith(dto);
  });

  it('delegates grouped with no arguments', () => {
    void controller.grouped();
    expect(findGroupedByCategories.execute).toHaveBeenCalledWith();
  });

  it('delegates paginatedByCategory with category and dto', () => {
    const dto = { page: 1, limit: 10 };
    void controller.paginatedByCategory(ProductCategory.CALCA, dto);
    expect(findPaginatedByCategory.execute).toHaveBeenCalledWith(ProductCategory.CALCA, dto);
  });

  it('delegates findById with the parsed id', () => {
    void controller.findById(1);
    expect(findProductById.execute).toHaveBeenCalledWith(1);
  });

  it('delegates findByCodigoIdentificacao with the code', () => {
    void controller.findByCodigoIdentificacao('abc-123');
    expect(findProductByCodigo.execute).toHaveBeenCalledWith('abc-123');
  });

  it('delegates findPaginated with the query dto', () => {
    const dto = { page: 2, limit: 20 };
    void controller.findPaginated(dto);
    expect(findPaginatedProducts.execute).toHaveBeenCalledWith(dto);
  });
});
