import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { S3Module } from '../../common/services/s3.module';
import { ProductSchema } from './infra/database/typeorm/product.schema';
import { ProductImageSchema } from './infra/database/typeorm/product-image.schema';
import { ProductVideoSchema } from './infra/database/typeorm/product-video.schema';
import { PRODUCT_REPOSITORY } from './domain/ports/product.repository';
import { PRODUCT_DASHBOARD_QUERY } from './domain/ports/product-dashboard.query';
import { FILE_STORAGE } from './domain/ports/file-storage.port';
import { TypeOrmProductRepository } from './infra/database/typeorm-product.repository';
import { TypeOrmProductDashboardQuery } from './infra/database/typeorm-product-dashboard.query';
import { S3FileStorageAdapter } from './infra/storage/s3-file-storage.adapter';
import { ProductPresenter } from './application/product.presenter';
import { CreateProductUseCase } from './application/use-cases/create-product.usecase';
import { GeneratePresignedUploadUrlUseCase } from './application/use-cases/generate-presigned-upload-url.usecase';
import { RegisterProductImageUseCase } from './application/use-cases/register-product-image.usecase';
import { RegisterProductVideoUseCase } from './application/use-cases/register-product-video.usecase';
import { SellProductUseCase } from './application/use-cases/sell-product.usecase';
import { RevertSaleUseCase } from './application/use-cases/revert-sale.usecase';
import { UpdateProductUseCase } from './application/use-cases/update-product.usecase';
import { RemoveProductUseCase } from './application/use-cases/remove-product.usecase';
import { FindProductByIdUseCase } from './application/use-cases/find-product-by-id.usecase';
import { FindProductByCodigoUseCase } from './application/use-cases/find-product-by-codigo.usecase';
import { FindPaginatedProductsUseCase } from './application/use-cases/find-paginated-products.usecase';
import { FindGroupedByCategoriesUseCase } from './application/use-cases/find-grouped-by-categories.usecase';
import { FindPaginatedByCategoryUseCase } from './application/use-cases/find-paginated-by-category.usecase';
import { FindFilteredProductsUseCase } from './application/use-cases/find-filtered-products.usecase';
import { GetDashboardUseCase } from './application/use-cases/get-dashboard.usecase';
import { ProductsController } from './http/products.controller';

const useCases = [
  CreateProductUseCase,
  GeneratePresignedUploadUrlUseCase,
  RegisterProductImageUseCase,
  RegisterProductVideoUseCase,
  SellProductUseCase,
  RevertSaleUseCase,
  UpdateProductUseCase,
  RemoveProductUseCase,
  FindProductByIdUseCase,
  FindProductByCodigoUseCase,
  FindPaginatedProductsUseCase,
  FindGroupedByCategoriesUseCase,
  FindPaginatedByCategoryUseCase,
  FindFilteredProductsUseCase,
  GetDashboardUseCase,
];

// Composition root for the products module: binds the domain ports to their
// infra implementations and registers all application use cases.
@Module({
  imports: [
    TypeOrmModule.forFeature([ProductSchema, ProductImageSchema, ProductVideoSchema]),
    S3Module,
  ],
  controllers: [ProductsController],
  providers: [
    ...useCases,
    ProductPresenter,
    { provide: PRODUCT_REPOSITORY, useClass: TypeOrmProductRepository },
    { provide: PRODUCT_DASHBOARD_QUERY, useClass: TypeOrmProductDashboardQuery },
    { provide: FILE_STORAGE, useClass: S3FileStorageAdapter },
  ],
})
export class ProductsModule {}
