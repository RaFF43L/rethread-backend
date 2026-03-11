import { Body, Controller, Param, ParseIntPipe, Query, UploadedFiles } from '@nestjs/common';
import type { MulterFile } from '../../common/services/s3.service';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginateProductsDto } from './dto/paginate-products.dto';
import {
  CreateProductRoute,
  FindByCodigoIdentificacaoRoute,
  FindByIdRoute,
  FindPaginatedRoute,
  ProductsTag,
  RemoveProductRoute,
  SellProductRoute,
} from './decorators/products-routes.decorator';
import { ProductsService } from './products.service';

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

  @RemoveProductRoute()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
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
