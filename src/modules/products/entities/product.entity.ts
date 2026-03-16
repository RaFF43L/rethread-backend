import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
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

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'codigo_identificacao', type: 'uuid', unique: true })
  codigoIdentificacao!: string;

  @Column()
  cor!: string;

  @Column()
  marca!: string;

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: ['insert', 'update'] })
  images!: ProductImage[];

  @OneToMany(() => ProductVideo, (video) => video.product, { cascade: ['insert', 'update'] })
  videos!: ProductVideo[];

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.AVAILABLE })
  status!: ProductStatus;

  @Column({ type: 'enum', enum: ProductCategory })
  category!: ProductCategory;

  @Column()
  size!: string;

  @Column({ type: 'text' })
  descricao!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  preco!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date | null;
}
