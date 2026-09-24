import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DashboardFilter,
  DashboardResult,
  IProductDashboardQuery,
} from '../../domain/ports/product-dashboard.query';
import { ProductSchema } from './typeorm/product.schema';

// Read-model implementation for the products dashboard. Uses a single tuned SQL
// query with FILTER aggregates so counts and value sums come back in one round trip.
@Injectable()
export class TypeOrmProductDashboardQuery implements IProductDashboardQuery {
  constructor(
    @InjectRepository(ProductSchema)
    private readonly repository: Repository<ProductSchema>,
  ) {}

  async getDashboard(filter: DashboardFilter): Promise<DashboardResult> {
    const params: unknown[] = [];
    const conditions: string[] = ['"deleted_at" IS NULL'];

    const bind = (value: unknown): string => {
      params.push(value);
      return `$${params.length}`;
    };

    if (filter.startDate) conditions.push(`"created_at" >= ${bind(filter.startDate)}`);
    if (filter.endDate) conditions.push(`"created_at" <= ${bind(`${filter.endDate} 23:59:59`)}`);
    if (filter.category) conditions.push(`"category" = ${bind(filter.category)}`);
    if (filter.size) conditions.push(`"size" = ${bind(filter.size)}`);
    if (filter.marca) conditions.push(`"marca" ILIKE ${bind(`%${filter.marca}%`)}`);
    if (filter.cor) conditions.push(`"cor" ILIKE ${bind(`%${filter.cor}%`)}`);
    if (filter.status) conditions.push(`"status" = ${bind(filter.status)}`);

    const sql = `
      SELECT
        COUNT(*)::int                                                             AS "total",
        COUNT(*) FILTER (WHERE "status" = 'available')::int                      AS "available",
        COUNT(*) FILTER (WHERE "status" = 'sold')::int                           AS "sold",
        COALESCE(SUM("preco"), 0)::float                                         AS "totalValue",
        COALESCE(SUM("preco") FILTER (WHERE "status" = 'available'), 0)::float   AS "availableValue",
        COALESCE(SUM("preco") FILTER (WHERE "status" = 'sold'), 0)::float        AS "soldValue"
      FROM products
      WHERE ${conditions.join(' AND ')}
    `;

    const [row] = await this.repository.manager.query<DashboardResult[]>(sql, params);

    return (
      row ?? { total: 0, available: 0, sold: 0, totalValue: 0, availableValue: 0, soldValue: 0 }
    );
  }
}
