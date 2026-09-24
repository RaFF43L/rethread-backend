import { Inject, Injectable } from '@nestjs/common';
import {
  type DashboardResult,
  type IProductDashboardQuery,
  PRODUCT_DASHBOARD_QUERY,
} from '../../domain/ports/product-dashboard.query';
import type { DashboardInput } from '../dto/product.dto';

// Returns aggregate dashboard metrics for the product catalog.
@Injectable()
export class GetDashboardUseCase {
  constructor(
    @Inject(PRODUCT_DASHBOARD_QUERY)
    private readonly dashboardQuery: IProductDashboardQuery,
  ) {}

  execute(input: DashboardInput): Promise<DashboardResult> {
    return this.dashboardQuery.getDashboard(input);
  }
}
