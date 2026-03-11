import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('product_images')
export class ProductImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Product, (product) => product.images, { onDelete: 'CASCADE' })
  product!: Product;

  @Column({ name: 'url_s3' })
  urlS3!: string;
}
