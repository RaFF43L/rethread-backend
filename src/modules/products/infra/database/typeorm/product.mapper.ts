import { Product } from '../../../domain/entities/product.entity';
import { ProductImage } from '../../../domain/entities/product-image.entity';
import { ProductVideo } from '../../../domain/entities/product-video.entity';
import { ProductSchema } from './product.schema';
import { ProductImageSchema } from './product-image.schema';
import { ProductVideoSchema } from './product-video.schema';

// Manual Schema <-> Entity mapping (architecture rule): the domain entity never
// knows about TypeORM and the schema never leaks into domain/application.
export function toDomain(schema: ProductSchema): Product {
  return Product.restore({
    id: schema.id,
    codigo_identificacao: schema.codigoIdentificacao,
    cor: schema.cor,
    marca: schema.marca,
    descricao: schema.descricao,
    preco: schema.preco,
    category: schema.category,
    size: schema.size,
    status: schema.status,
    images: (schema.images ?? []).map(imageToDomain),
    videos: (schema.videos ?? []).map(videoToDomain),
    created_at: schema.createdAt,
    updated_at: schema.updatedAt,
    deleted_at: schema.deletedAt ?? null,
  });
}

export function imageToDomain(schema: ProductImageSchema): ProductImage {
  return ProductImage.restore({ id: schema.id, url_s3: schema.urlS3 });
}

export function videoToDomain(schema: ProductVideoSchema): ProductVideo {
  return ProductVideo.restore({ id: schema.id, url_s3: schema.urlS3 });
}

export function toPersistence(entity: Product): Partial<ProductSchema> {
  return {
    codigoIdentificacao: entity.codigoIdentificacao,
    cor: entity.cor,
    marca: entity.marca,
    descricao: entity.descricao,
    preco: entity.preco,
    category: entity.category,
    size: entity.size,
    status: entity.status,
  };
}
