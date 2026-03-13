import { Injectable } from '@nestjs/common';
import { DashboardFilterDto } from '../dto/dashboard-filter.dto';
import { DashboardResult, ProductsSql } from '../sql/products.sql';

export type { DashboardResult };

@Injectable()
export class ProductsDashboardService {
  constructor(private readonly productsSql: ProductsSql) {}

  getDashboard(dto: DashboardFilterDto): Promise<DashboardResult> {
    return this.productsSql.getDashboard(dto);
  }
}
