import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('product_videos')
export class ProductVideo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  urlS3!: string;

  @ManyToOne(() => Product, (product) => product.videos, { onDelete: 'CASCADE' })
  product!: Product;
}
