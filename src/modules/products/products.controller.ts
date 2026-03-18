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
import type { MulterFile } from '../../common/services/s3.service';
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
import { ProductCategory } from './entities/product.entity';
import { ProductsDashboardService } from './services/products-dashboard.service';
import { ProductsService } from './services/products.service';

@ProductsTag()
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productsDashboardService: ProductsDashboardService,
  ) {}

  @Post('presigned-upload-url')
  generatePresignedUploadUrl(@Body() dto: GeneratePresignedUrlDto) {
    return this.productsService.generatePresignedUploadUrl(dto);
  }

  @Post('register-image')
  registerImage(@Body() dto: RegisterProductImageDto) {
    return this.productsService.registerImage(dto);
  }

  @Post('register-video')
  registerVideo(@Body() dto: RegisterProductVideoDto) {
    return this.productsService.registerVideo(dto);
  }

  @CreateProductRoute()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @SellProductRoute()
  sell(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.sell(id);
  }

  @RevertSaleProductRoute()
  revertSale(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.revertSale(id);
  }

  @UpdateProductRoute()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() files: { images?: MulterFile[]; videos?: MulterFile[] },
  ) {
    return this.productsService.update(id, dto, files.images ?? [], files.videos ?? []);
  }

  @RemoveProductRoute()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }

  @FindFilteredRoute()
  findFiltered(@Query() dto: FilterProductsDto) {
    return this.productsService.findFiltered(dto);
  }

  @GetDashboardRoute()
  getDashboard(@Query() dto: DashboardFilterDto) {
    return this.productsDashboardService.getDashboard(dto);
  }

  @FindGroupedByCategoriesRoute()
  findGroupedByCategories() {
    return this.productsService.findGroupedByCategories();
  }

  @FindPaginatedByCategoryRoute()
  findPaginatedByCategory(
    @Param('category', new ParseEnumPipe(ProductCategory)) category: ProductCategory,
    @Query() dto: PaginateProductsDto,
  ) {
    return this.productsService.findPaginatedByCategory(category, dto);
  }

  @FindByIdRoute()
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findById(id);
  }

  @FindByCodigoIdentificacaoRoute()
  findByCodigoIdentificacao(@Param('codigoIdentificacao') codigoIdentificacao: string) {
    return this.productsService.findByCodigoIdentificacao(codigoIdentificacao);
  }

  @FindPaginatedRoute()
  findPaginated(@Query() dto: PaginateProductsDto) {
    return this.productsService.findPaginated(dto);
  }
}
