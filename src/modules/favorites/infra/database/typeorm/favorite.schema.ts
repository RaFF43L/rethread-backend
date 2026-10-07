import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ProductSchema } from '../../../../products/infra/database/typeorm/product.schema';
import { UserSchema } from '../../../../users/infra/database/typeorm/user.schema';

@Entity('favorites')
@Unique('UQ_favorites_user_product', ['userId', 'productId'])
export class FavoriteSchema {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'PK_favorites' })
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ name: 'product_id' })
  productId!: number;

  @ManyToOne(() => UserSchema, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_favorites_user' })
  user!: UserSchema;

  @ManyToOne(() => ProductSchema, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id', foreignKeyConstraintName: 'FK_favorites_product' })
  product!: ProductSchema;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
