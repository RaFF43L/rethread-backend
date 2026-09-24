import { Product, ProductCategory, ProductStatus } from '../domain/entities/product.entity';
import { ProductImage } from '../domain/entities/product-image.entity';

interface BuildProductOptions {
  id?: number;
  codigoIdentificacao?: string;
  cor?: string;
  marca?: string;
  descricao?: string;
  preco?: number;
  category?: ProductCategory;
  size?: string;
  status?: ProductStatus;
  imageKeys?: string[];
}

// Builds a fully-restored Product aggregate for tests, mirroring what the infra
// mapper would produce from persistence.
export function buildProduct(options: BuildProductOptions = {}): Product {
  const images = (options.imageKeys ?? ['products/default.jpg']).map((key, index) =>
    ProductImage.restore({ id: index + 1, url_s3: key }),
  );

  return Product.restore({
    id: options.id ?? 1,
    codigo_identificacao: options.codigoIdentificacao ?? 'codigo-uuid',
    cor: options.cor ?? 'blue',
    marca: options.marca ?? 'Nike',
    descricao: options.descricao ?? 'A shoe',
    preco: options.preco ?? 199.99,
    category: options.category ?? ProductCategory.CALCA,
    size: options.size ?? 'M',
    status: options.status ?? ProductStatus.AVAILABLE,
    images,
    videos: [],
    created_at: new Date('2024-01-01T00:00:00.000Z'),
    updated_at: new Date('2024-01-01T00:00:00.000Z'),
    deleted_at: null,
  });
}
