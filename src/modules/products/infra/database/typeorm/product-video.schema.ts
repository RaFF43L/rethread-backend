import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ProductSchema } from './product.schema';

@Entity('product_videos')
export class ProductVideoSchema {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'url_s3' })
  urlS3!: string;

  @ManyToOne(() => ProductSchema, (product) => product.videos, { onDelete: 'CASCADE' })
  product!: ProductSchema;
}
