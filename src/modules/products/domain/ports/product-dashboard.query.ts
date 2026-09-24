import type { ProductCategory, ProductStatus } from '../entities/product.entity';

// Injection token for the dashboard analytics query port.
export const PRODUCT_DASHBOARD_QUERY = Symbol('PRODUCT_DASHBOARD_QUERY');

export interface DashboardFilter {
  readonly startDate?: string;
  readonly endDate?: string;
  readonly category?: ProductCategory;
  readonly size?: string;
  readonly marca?: string;
  readonly cor?: string;
  readonly status?: ProductStatus;
}

export interface DashboardResult {
  total: number;
  available: number;
  sold: number;
  totalValue: number;
  availableValue: number;
  soldValue: number;
}

// Read-model port for aggregate dashboard metrics. Implemented in infra with a
// tuned SQL query; kept separate from the write repository (CQRS-ish split).
export interface IProductDashboardQuery {
  getDashboard(filter: DashboardFilter): Promise<DashboardResult>;
}
