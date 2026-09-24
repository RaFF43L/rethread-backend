import { Product, ProductCategory, ProductStatus } from '../domain/entities/product.entity';
import { ProductImage } from '../domain/entities/product-image.entity';

describe('Product entity', () => {
  it('create defaults to AVAILABLE with empty media', () => {
    const product = Product.create({
      codigoIdentificacao: 'uuid',
      cor: 'blue',
      marca: 'Nike',
      descricao: 'A shoe',
      preco: 199.99,
      category: ProductCategory.CALCA,
      size: 'M',
    });

    expect(product.status).toBe(ProductStatus.AVAILABLE);
    expect(product.isSold).toBe(false);
    expect(product.images).toEqual([]);
    expect(product.videos).toEqual([]);
  });

  it('restore rebuilds the aggregate from a persistence row', () => {
    const created = new Date('2024-01-01T00:00:00.000Z');
    const product = Product.restore({
      id: 7,
      codigo_identificacao: 'uuid',
      cor: 'blue',
      marca: 'Nike',
      descricao: 'A shoe',
      preco: 199.99,
      category: ProductCategory.CALCA,
      size: 'M',
      status: ProductStatus.SOLD,
      images: [ProductImage.restore({ id: 1, url_s3: 'products/a.jpg' })],
      videos: [],
      created_at: created,
      updated_at: created,
      deleted_at: null,
    });

    expect(product.id).toBe(7);
    expect(product.isSold).toBe(true);
    expect(product.images).toHaveLength(1);
    expect(product.createdAt).toBe(created);
  });

  it('applyChanges only mutates provided fields', () => {
    const product = Product.create({
      codigoIdentificacao: 'uuid',
      cor: 'blue',
      marca: 'Nike',
      descricao: 'A shoe',
      preco: 199.99,
      category: ProductCategory.CALCA,
      size: 'M',
    });

    product.applyChanges({ preco: 249.99, size: 'G' });

    expect(product.preco).toBe(249.99);
    expect(product.size).toBe('G');
    expect(product.cor).toBe('blue');
  });

  it('markAsSold and markAsAvailable toggle the status', () => {
    const product = Product.create({
      codigoIdentificacao: 'uuid',
      cor: 'blue',
      marca: 'Nike',
      descricao: 'A shoe',
      preco: 199.99,
      category: ProductCategory.CALCA,
      size: 'M',
    });

    product.markAsSold();
    expect(product.isSold).toBe(true);

    product.markAsAvailable();
    expect(product.isSold).toBe(false);
  });

  it('addImages and addVideos append media immutably', () => {
    const product = Product.create({
      codigoIdentificacao: 'uuid',
      cor: 'blue',
      marca: 'Nike',
      descricao: 'A shoe',
      preco: 199.99,
      category: ProductCategory.CALCA,
      size: 'M',
    });

    product.addImages([ProductImage.create('products/a.jpg')]);
    product.addImages([ProductImage.create('products/b.jpg')]);

    expect(product.images).toHaveLength(2);
    expect(product.images.map((i) => i.urlS3)).toEqual(['products/a.jpg', 'products/b.jpg']);
  });
});
