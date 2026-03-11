import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProductStatus {
  AVAILABLE = 'available',
  SOLD = 'sold',
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

  @Column({ name: 'url_s3' })
  urlS3!: string;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.AVAILABLE })
  status!: ProductStatus;

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
