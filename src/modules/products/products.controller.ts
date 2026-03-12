import {
  Body,
  Controller,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
  UploadedFiles,
} from '@nestjs/common';
import type { MulterFile } from '../../common/services/s3.service';
import { CreateProductDto } from './dto/create-product.dto';
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
  ProductsTag,
  RemoveProductRoute,
  RevertSaleProductRoute,
  SellProductRoute,
} from './decorators/products-routes.decorator';
import { ProductsService } from './products.service';
import { ProductCategory } from './entities/product.entity';

@ProductsTag()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @CreateProductRoute()
  create(@Body() dto: CreateProductDto, @UploadedFiles() files: MulterFile[]) {
    return this.productsService.create(dto, files);
  }

  @SellProductRoute()
  sell(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.sell(id);
  }

  @RevertSaleProductRoute()
  revertSale(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.revertSale(id);
  }

  @RemoveProductRoute()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }

  @FindFilteredRoute()
  findFiltered(@Query() dto: FilterProductsDto) {
    return this.productsService.findFiltered(dto);
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
