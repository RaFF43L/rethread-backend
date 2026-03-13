import { Test, TestingModule } from '@nestjs/testing';
import { ProductCategory, ProductStatus } from '../entities/product.entity';
import { DashboardFilterDto } from '../dto/dashboard-filter.dto';
import { DashboardResult, ProductsDashboardService } from '../services/products-dashboard.service';
import { ProductsSql } from '../sql/products.sql';

const mockDashboardResult: DashboardResult = {
  total: 3,
  available: 2,
  sold: 1,
  totalValue: 300,
  availableValue: 200,
  soldValue: 100,
};

const mockProductsSql = {
  getDashboard: jest.fn(),
};

describe('ProductsDashboardService', () => {
  let service: ProductsDashboardService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockProductsSql.getDashboard.mockResolvedValue(mockDashboardResult);

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsDashboardService, { provide: ProductsSql, useValue: mockProductsSql }],
    }).compile();

    service = module.get<ProductsDashboardService>(ProductsDashboardService);
  });

  describe('getDashboard', () => {
    it('should delegate to ProductsSql and return the result', async () => {
      const dto: DashboardFilterDto = { category: ProductCategory.CALCA, size: 'M' };

      const result = await service.getDashboard(dto);

      expect(mockProductsSql.getDashboard).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockDashboardResult);
    });

    it('should return zero values when no products match', async () => {
      const empty: DashboardResult = {
        total: 0,
        available: 0,
        sold: 0,
        totalValue: 0,
        availableValue: 0,
        soldValue: 0,
      };
      mockProductsSql.getDashboard.mockResolvedValue(empty);

      const result = await service.getDashboard({});

      expect(result.total).toBe(0);
      expect(result.totalValue).toBe(0);
    });

    it('should pass all filters to ProductsSql', async () => {
      const dto: DashboardFilterDto = {
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        category: ProductCategory.BLUSA,
        size: 'G',
        marca: 'Zara',
        cor: 'red',
        status: ProductStatus.SOLD,
      };

      await service.getDashboard(dto);

      expect(mockProductsSql.getDashboard).toHaveBeenCalledWith(dto);
    });
  });
});
