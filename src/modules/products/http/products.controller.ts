import {
  Body,
  Controller,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Query,
  UploadedFiles,
} from '@nestjs/common';
import type { UploadableFile } from '../domain/ports/file-storage.port';
import { ProductCategory } from '../domain/entities/product.entity';
import { CreateProductUseCase } from '../application/use-cases/create-product.usecase';
import { GeneratePresignedUploadUrlUseCase } from '../application/use-cases/generate-presigned-upload-url.usecase';
import { RegisterProductImageUseCase } from '../application/use-cases/register-product-image.usecase';
import { RegisterProductVideoUseCase } from '../application/use-cases/register-product-video.usecase';
import { SellProductUseCase } from '../application/use-cases/sell-product.usecase';
import { RevertSaleUseCase } from '../application/use-cases/revert-sale.usecase';
import { UpdateProductUseCase } from '../application/use-cases/update-product.usecase';
import { RemoveProductUseCase } from '../application/use-cases/remove-product.usecase';
import { FindProductByIdUseCase } from '../application/use-cases/find-product-by-id.usecase';
import { FindProductByCodigoUseCase } from '../application/use-cases/find-product-by-codigo.usecase';
import { FindPaginatedProductsUseCase } from '../application/use-cases/find-paginated-products.usecase';
import { FindGroupedByCategoriesUseCase } from '../application/use-cases/find-grouped-by-categories.usecase';
import { FindPaginatedByCategoryUseCase } from '../application/use-cases/find-paginated-by-category.usecase';
import { FindFilteredProductsUseCase } from '../application/use-cases/find-filtered-products.usecase';
import { GetDashboardUseCase } from '../application/use-cases/get-dashboard.usecase';
import { CreateProductDto } from './dto/create-product.dto';
import { GeneratePresignedUrlDto } from './dto/generate-presigned-url.dto';
import { RegisterProductImageDto } from './dto/register-product-image.dto';
import { RegisterProductVideoDto } from './dto/register-product-video.dto';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductsDto } from './dto/filter-products.dto';
import { PaginateProductsDto } from './dto/paginate-products.dto';
import {
  CreateProductRoute,
  FindByCodigoIdentificacaoRoute,
  FindByIdRoute,
  FindFilteredRoute,
  FindGroupedByCategoriesRoute,
  FindPaginatedByCategoryRoute,
  FindPaginatedRoute,
  GetDashboardRoute,
  ProductsTag,
  RemoveProductRoute,
  RevertSaleProductRoute,
  SellProductRoute,
  UpdateProductRoute,
} from './decorators/products-routes.decorator';

// Thin HTTP adapter. Controllers only translate the request into application
// inputs and delegate to a single use case; no business logic lives here.
@ProductsTag()
@Controller('products')
export class ProductsController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly generatePresignedUploadUrl: GeneratePresignedUploadUrlUseCase,
    private readonly registerProductImage: RegisterProductImageUseCase,
    private readonly registerProductVideo: RegisterProductVideoUseCase,
    private readonly sellProduct: SellProductUseCase,
    private readonly revertSale: RevertSaleUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly removeProduct: RemoveProductUseCase,
    private readonly findProductById: FindProductByIdUseCase,
    private readonly findProductByCodigo: FindProductByCodigoUseCase,
    private readonly findPaginatedProducts: FindPaginatedProductsUseCase,
    private readonly findGroupedByCategories: FindGroupedByCategoriesUseCase,
    private readonly findPaginatedByCategory: FindPaginatedByCategoryUseCase,
    private readonly findFilteredProducts: FindFilteredProductsUseCase,
    private readonly getDashboard: GetDashboardUseCase,
  ) {}

  @Post('presigned-upload-url')
  generatePresignedUploadUrlHandler(@Body() dto: GeneratePresignedUrlDto) {
    return this.generatePresignedUploadUrl.execute(dto);
  }

  @Post('register-image')
  registerImage(@Body() dto: RegisterProductImageDto) {
    return this.registerProductImage.execute(dto);
  }

  @Post('register-video')
  registerVideo(@Body() dto: RegisterProductVideoDto) {
    return this.registerProductVideo.execute(dto);
  }

  @CreateProductRoute()
  create(@Body() dto: CreateProductDto) {
    return this.createProduct.execute(dto);
  }

  @SellProductRoute()
  sell(@Param('id', ParseIntPipe) id: number) {
    return this.sellProduct.execute(id);
  }

  @RevertSaleProductRoute()
  revert(@Param('id', ParseIntPipe) id: number) {
    return this.revertSale.execute(id);
  }

  @UpdateProductRoute()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() files: { images?: UploadableFile[]; videos?: UploadableFile[] },
  ) {
    return this.updateProduct.execute(id, dto, files.images ?? [], files.videos ?? []);
  }

  @RemoveProductRoute()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.removeProduct.execute(id);
  }

  @FindFilteredRoute()
  findFiltered(@Query() dto: FilterProductsDto) {
    return this.findFilteredProducts.execute(dto);
  }

  @GetDashboardRoute()
  dashboard(@Query() dto: DashboardFilterDto) {
    return this.getDashboard.execute(dto);
  }

  @FindGroupedByCategoriesRoute()
  grouped() {
    return this.findGroupedByCategories.execute();
  }

  @FindPaginatedByCategoryRoute()
  paginatedByCategory(
    @Param('category', new ParseEnumPipe(ProductCategory)) category: ProductCategory,
    @Query() dto: PaginateProductsDto,
  ) {
    return this.findPaginatedByCategory.execute(category, dto);
  }

  @FindByIdRoute()
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.findProductById.execute(id);
  }

  @FindByCodigoIdentificacaoRoute()
  findByCodigoIdentificacao(@Param('codigoIdentificacao') codigoIdentificacao: string) {
    return this.findProductByCodigo.execute(codigoIdentificacao);
  }

  @FindPaginatedRoute()
  findPaginated(@Query() dto: PaginateProductsDto) {
    return this.findPaginatedProducts.execute(dto);
  }
}
