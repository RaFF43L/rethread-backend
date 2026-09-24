import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ProductSchema } from './product.schema';

@Entity('product_images')
export class ProductImageSchema {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => ProductSchema, (product) => product.images, { onDelete: 'CASCADE' })
  product!: ProductSchema;

  @Column({ name: 'url_s3' })
  urlS3!: string;
}
