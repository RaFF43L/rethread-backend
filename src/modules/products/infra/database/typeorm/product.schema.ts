import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductCategory, ProductStatus } from '../../../domain/entities/product.entity';
import { ProductImageSchema } from './product-image.schema';
import { ProductVideoSchema } from './product-video.schema';

@Entity('products')
export class ProductSchema {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'codigo_identificacao', type: 'uuid', unique: true })
  codigoIdentificacao!: string;

  @Column()
  cor!: string;

  @Column()
  marca!: string;

  @OneToMany(() => ProductImageSchema, (image) => image.product, {
    cascade: ['insert', 'update'],
  })
  images!: ProductImageSchema[];

  @OneToMany(() => ProductVideoSchema, (video) => video.product, {
    cascade: ['insert', 'update'],
  })
  videos!: ProductVideoSchema[];

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
