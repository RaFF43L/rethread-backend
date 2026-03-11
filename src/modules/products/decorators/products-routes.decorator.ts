import {
  UseInterceptors,
  applyDecorators,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

export const ProductsTag = () => applyDecorators(ApiTags('Products'));

export const CreateProductRoute = () =>
  applyDecorators(
    Post(),
    HttpCode(HttpStatus.CREATED),
    UseInterceptors(FileInterceptor('image')),
    ApiOperation({ summary: 'Create a new product' }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['cor', 'marca', 'descricao', 'preco', 'image'],
        properties: {
          cor: { type: 'string', example: 'blue' },
          marca: { type: 'string', example: 'Nike' },
          descricao: { type: 'string', example: 'A great shoe' },
          preco: { type: 'number', example: 199.99 },
          image: { type: 'string', format: 'binary' },
        },
      },
    }),
    ApiResponse({ status: 201, description: 'Product created.' }),
    ApiResponse({ status: 400, description: 'Image is required or invalid data.' }),
  );

export const SellProductRoute = () =>
  applyDecorators(
    Patch(':id/sell'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Mark a product as sold' }),
    ApiParam({ name: 'id', type: Number }),
    ApiResponse({ status: 200, description: 'Product marked as sold.' }),
    ApiResponse({ status: 404, description: 'Product not found.' }),
    ApiResponse({ status: 409, description: 'Product already sold.' }),
  );

export const RemoveProductRoute = () =>
  applyDecorators(
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({ summary: 'Soft delete a product' }),
    ApiParam({ name: 'id', type: Number }),
    ApiResponse({ status: 204, description: 'Product deleted.' }),
    ApiResponse({ status: 404, description: 'Product not found.' }),
  );

export const FindByIdRoute = () =>
  applyDecorators(
    Get(':id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Get a product by id' }),
    ApiParam({ name: 'id', type: Number }),
    ApiResponse({ status: 200, description: 'Product found.' }),
    ApiResponse({ status: 404, description: 'Product not found.' }),
  );

export const FindByCodigoIdentificacaoRoute = () =>
  applyDecorators(
    Get('codigo/:codigoIdentificacao'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Get a product by codigoIdentificacao (UUID)' }),
    ApiParam({ name: 'codigoIdentificacao', type: String }),
    ApiResponse({ status: 200, description: 'Product found.' }),
    ApiResponse({ status: 404, description: 'Product not found.' }),
  );

export const FindPaginatedRoute = () =>
  applyDecorators(
    Get(),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'List products with pagination' }),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 20 }),
    ApiResponse({ status: 200, description: 'Paginated list of products.' }),
  );
