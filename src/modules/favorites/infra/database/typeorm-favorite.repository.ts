import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Page, PageQuery } from '../../../../shared/kernel/pagination';
import { Favorite } from '../../domain/entities/favorite.entity';
import { IFavoriteRepository } from '../../domain/ports/favorite.repository';
import { FavoriteSchema } from './typeorm/favorite.schema';
import { toDomain, toPersistence } from './typeorm/favorite.mapper';

@Injectable()
export class TypeOrmFavoriteRepository implements IFavoriteRepository {
  constructor(
    @InjectRepository(FavoriteSchema)
    private readonly favorites: Repository<FavoriteSchema>,
  ) {}

  async add(favorite: Favorite): Promise<void> {
    await this.favorites
      .createQueryBuilder()
      .insert()
      .values(toPersistence(favorite))
      .orIgnore()
      .execute();
  }

  async remove(userId: number, productId: number): Promise<void> {
    await this.favorites.delete({ userId, productId });
  }

  async findByUser(userId: number, query: PageQuery): Promise<Page<Favorite>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [rows, total] = await this.favorites
      .createQueryBuilder('favorite')
      .innerJoin('favorite.product', 'product', 'product.deletedAt IS NULL')
      .where('favorite.userId = :userId', { userId })
      .orderBy('favorite.createdAt', 'DESC')
      .addOrderBy('favorite.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data: rows.map(toDomain), total, page, limit };
  }
}
