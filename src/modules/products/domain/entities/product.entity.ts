import { BaseEntity } from '../../../../shared/kernel/base-entity';
import { ProductImage } from './product-image.entity';
import { ProductVideo } from './product-video.entity';

export enum ProductStatus {
  AVAILABLE = 'available',
  SOLD = 'sold',
}

export enum ProductCategory {
  CALCA = 'calca',
  BLUSA = 'blusa',
  CAMISETA = 'camiseta',
  SHORT = 'short',
  VESTIDO = 'vestido',
}

// Raw shape coming from persistence (snake_case), consumed only by restore().
// Keeps domain and schema decoupled: the Schema -> Entity mapping lives in infra.
export interface ProductRow {
  id?: number;
  codigo_identificacao: string;
  cor: string;
  marca: string;
  descricao: string;
  preco: number;
  category: ProductCategory;
  size: string;
  status: ProductStatus;
  images?: ProductImage[];
  videos?: ProductVideo[];
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

interface CreateProductProps {
  codigoIdentificacao: string;
  cor: string;
  marca: string;
  descricao: string;
  preco: number;
  category: ProductCategory;
  size: string;
}

interface UpdatableProductProps {
  cor?: string;
  marca?: string;
  descricao?: string;
  preco?: number;
  category?: ProductCategory;
  size?: string;
}

// Aggregate root for the product catalog. The domain entity never knows about
// TypeORM; persistence rebuilds it through restore() in the infra mapper.
export class Product extends BaseEntity {
  private constructor(
    public codigoIdentificacao: string,
    public cor: string,
    public marca: string,
    public descricao: string,
    public preco: number,
    public category: ProductCategory,
    public size: string,
    public status: ProductStatus = ProductStatus.AVAILABLE,
    public images: ProductImage[] = [],
    public videos: ProductVideo[] = [],
  ) {
    super();
  }

  static create(props: CreateProductProps): Product {
    return new Product(
      props.codigoIdentificacao,
      props.cor,
      props.marca,
      props.descricao,
      props.preco,
      props.category,
      props.size,
      ProductStatus.AVAILABLE,
    );
  }

  static restore(row: ProductRow): Product {
    return new Product(
      row.codigo_identificacao,
      row.cor,
      row.marca,
      row.descricao,
      Number(row.preco),
      row.category,
      row.size,
      row.status,
      row.images ?? [],
      row.videos ?? [],
    )
      .setId(row.id)
      .setCreatedAt(row.created_at)
      .setUpdatedAt(row.updated_at)
      .setDeletedAt(row.deleted_at ?? null);
  }

  applyChanges(props: UpdatableProductProps): this {
    if (props.cor !== undefined) this.cor = props.cor;
    if (props.marca !== undefined) this.marca = props.marca;
    if (props.descricao !== undefined) this.descricao = props.descricao;
    if (props.preco !== undefined) this.preco = props.preco;
    if (props.category !== undefined) this.category = props.category;
    if (props.size !== undefined) this.size = props.size;
    return this;
  }

  markAsSold(): this {
    this.status = ProductStatus.SOLD;
    return this;
  }

  markAsAvailable(): this {
    this.status = ProductStatus.AVAILABLE;
    return this;
  }

  get isSold(): boolean {
    return this.status === ProductStatus.SOLD;
  }

  addImages(images: ProductImage[]): this {
    this.images = [...this.images, ...images];
    return this;
  }

  addVideos(videos: ProductVideo[]): this {
    this.videos = [...this.videos, ...videos];
    return this;
  }
}
