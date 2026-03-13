import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardFilterDto } from '../dto/dashboard-filter.dto';
import { Product } from '../entities/product.entity';

export interface DashboardResult {
  total: number;
  available: number;
  sold: number;
  totalValue: number;
  availableValue: number;
  soldValue: number;
}

@Injectable()
export class ProductsSql {
  constructor(
    @InjectRepository(Product)
    private readonly repository: Repository<Product>,
  ) {}

  async getDashboard(dto: DashboardFilterDto): Promise<DashboardResult> {
    const params: unknown[] = [];
    const conditions: string[] = ['"deleted_at" IS NULL'];

    const bind = (value: unknown): string => {
      params.push(value);
      return `$${params.length}`;
    };

    if (dto.startDate) conditions.push(`"created_at" >= ${bind(dto.startDate)}`);
    if (dto.endDate) conditions.push(`"created_at" <= ${bind(`${dto.endDate} 23:59:59`)}`);
    if (dto.category) conditions.push(`"category" = ${bind(dto.category)}`);
    if (dto.size) conditions.push(`"size" = ${bind(dto.size)}`);
    if (dto.marca) conditions.push(`"marca" ILIKE ${bind(`%${dto.marca}%`)}`);
    if (dto.cor) conditions.push(`"cor" ILIKE ${bind(`%${dto.cor}%`)}`);
    if (dto.status) conditions.push(`"status" = ${bind(dto.status)}`);

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
