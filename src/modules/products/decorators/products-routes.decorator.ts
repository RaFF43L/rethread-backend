import {
  UseInterceptors,
  applyDecorators,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { Public } from '../../../common/decorators/public.decorator';
import { ProductCategory, ProductStatus } from '../entities/product.entity';

const productSchema: SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 1 },
    codigoIdentificacao: {
      type: 'string',
      format: 'uuid',
      example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    },
    cor: { type: 'string', example: 'blue' },
    marca: { type: 'string', example: 'Nike' },
    category: {
      type: 'string',
      enum: Object.values(ProductCategory),
      example: ProductCategory.CALCA,
    },
    size: { type: 'string', example: 'M' },
    status: {
      type: 'string',
      enum: Object.values(ProductStatus),
      example: ProductStatus.AVAILABLE,
    },
    descricao: { type: 'string', example: 'A great shoe' },
    preco: { type: 'number', example: 199.99 },
    imageUrls: {
      type: 'array',
      items: { type: 'string', example: 'https://bucket.s3.amazonaws.com/products/uuid/photo.jpg' },
    },
    createdAt: { type: 'string', format: 'date-time', example: '2026-03-12T00:00:00.000Z' },
    updatedAt: { type: 'string', format: 'date-time', example: '2026-03-12T00:00:00.000Z' },
    deletedAt: { type: 'string', format: 'date-time', nullable: true, example: null },
  },
};

const paginatedProductSchema: SchemaObject = {
  type: 'object',
  properties: {
    data: { type: 'array', items: productSchema },
    total: { type: 'integer', example: 100 },
    page: { type: 'integer', example: 1 },
    limit: { type: 'integer', example: 20 },
  },
};

const errorSchema = (statusCode: number, message: string, error: string): SchemaObject => ({
  type: 'object',
  properties: {
    statusCode: { type: 'integer', example: statusCode },
    message: { type: 'string', example: message },
    error: { type: 'string', example: error },
  },
});

export const ProductsTag = () => applyDecorators(ApiTags('Products'));

export const CreateProductRoute = () =>
  applyDecorators(
    Post(),
    HttpCode(HttpStatus.CREATED),
    UseInterceptors(FilesInterceptor('images', 10)),
    ApiOperation({ summary: 'Create a new product' }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['cor', 'marca', 'descricao', 'preco', 'category', 'size', 'images'],
        properties: {
          cor: { type: 'string', example: 'blue' },
          marca: { type: 'string', example: 'Nike' },
          descricao: { type: 'string', example: 'A great shoe' },
          preco: { type: 'number', example: 199.99 },
          category: {
            type: 'string',
            enum: Object.values(ProductCategory),
            example: ProductCategory.CALCA,
          },
          size: { type: 'string', example: 'M' },
          images: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
          },
        },
      },
    }),
    ApiResponse({ status: 201, description: 'Product created.', schema: productSchema }),
    ApiResponse({
      status: 400,
      description: 'Image is required or invalid data.',
      schema: errorSchema(400, 'At least one product image is required.', 'Bad Request'),
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized.',
      schema: errorSchema(401, 'Unauthorized', 'Unauthorized'),
    }),
  );

export const SellProductRoute = () =>
  applyDecorators(
    Patch(':id/sell'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Mark a product as sold' }),
    ApiParam({ name: 'id', type: Number }),
    ApiResponse({ status: 200, description: 'Product marked as sold.', schema: productSchema }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized.',
      schema: errorSchema(401, 'Unauthorized', 'Unauthorized'),
    }),
    ApiResponse({
      status: 404,
      description: 'Product not found.',
      schema: errorSchema(404, 'Product not found.', 'Not Found'),
    }),
    ApiResponse({
      status: 409,
      description: 'Product already sold.',
      schema: errorSchema(409, 'Product is already sold.', 'Conflict'),
    }),
  );

export const RevertSaleProductRoute = () =>
  applyDecorators(
    Patch(':id/revert-sale'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Revert a product sale back to available' }),
    ApiParam({ name: 'id', type: Number }),
    ApiResponse({ status: 200, description: 'Product sale reverted.', schema: productSchema }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized.',
      schema: errorSchema(401, 'Unauthorized', 'Unauthorized'),
    }),
    ApiResponse({
      status: 404,
      description: 'Product not found.',
      schema: errorSchema(404, 'Product not found.', 'Not Found'),
    }),
    ApiResponse({
      status: 409,
      description: 'Product is not sold.',
      schema: errorSchema(409, 'Product is not sold.', 'Conflict'),
    }),
  );

export const RemoveProductRoute = () =>
  applyDecorators(
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({ summary: 'Soft delete a product' }),
    ApiParam({ name: 'id', type: Number }),
    ApiResponse({ status: 204, description: 'Product deleted.' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized.',
      schema: errorSchema(401, 'Unauthorized', 'Unauthorized'),
    }),
    ApiResponse({
      status: 404,
      description: 'Product not found.',
      schema: errorSchema(404, 'Product not found.', 'Not Found'),
    }),
  );

export const FindByIdRoute = () =>
  applyDecorators(
    Get(':id'),
    HttpCode(HttpStatus.OK),
    Public(),
    ApiOperation({ summary: 'Get a product by id' }),
    ApiParam({ name: 'id', type: Number }),
    ApiResponse({ status: 200, description: 'Product found.', schema: productSchema }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized.',
      schema: errorSchema(401, 'Unauthorized', 'Unauthorized'),
    }),
    ApiResponse({
      status: 404,
      description: 'Product not found.',
      schema: errorSchema(404, 'Product not found.', 'Not Found'),
    }),
  );

export const FindByCodigoIdentificacaoRoute = () =>
  applyDecorators(
    Get('codigo/:codigoIdentificacao'),
    HttpCode(HttpStatus.OK),
    Public(),
    ApiOperation({ summary: 'Get a product by codigoIdentificacao (UUID)' }),
    ApiParam({ name: 'codigoIdentificacao', type: String }),
    ApiResponse({ status: 200, description: 'Product found.', schema: productSchema }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized.',
      schema: errorSchema(401, 'Unauthorized', 'Unauthorized'),
    }),
    ApiResponse({
      status: 404,
      description: 'Product not found.',
      schema: errorSchema(404, 'Product not found.', 'Not Found'),
    }),
  );

export const FindPaginatedRoute = () =>
  applyDecorators(
    Get(),
    HttpCode(HttpStatus.OK),
    Public(),
    ApiOperation({ summary: 'List products with pagination' }),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 20 }),
    ApiResponse({
      status: 200,
      description: 'Paginated list of products.',
      schema: paginatedProductSchema,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized.',
      schema: errorSchema(401, 'Unauthorized', 'Unauthorized'),
    }),
  );

export const FindGroupedByCategoriesRoute = () =>
  applyDecorators(
    Get('categories'),
    HttpCode(HttpStatus.OK),
    Public(),
    ApiOperation({ summary: 'List available products grouped by category' }),
    ApiResponse({
      status: 200,
      description: 'Products grouped by category.',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              enum: Object.values(ProductCategory),
              example: ProductCategory.CALCA,
            },
            products: { type: 'array', items: productSchema },
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized.',
      schema: errorSchema(401, 'Unauthorized', 'Unauthorized'),
    }),
  );

export const FindPaginatedByCategoryRoute = () =>
  applyDecorators(
    Get('categories/:category'),
    HttpCode(HttpStatus.OK),
    Public(),
    ApiOperation({ summary: 'List available products paginated by category' }),
    ApiParam({ name: 'category', enum: ProductCategory }),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 20 }),
    ApiResponse({
      status: 200,
      description: 'Paginated products for the given category.',
      schema: paginatedProductSchema,
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid category.',
      schema: errorSchema(
        400,
        'Validation failed (enum value calca|blusa|camiseta|short|vestido expected)',
        'Bad Request',
      ),
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized.',
      schema: errorSchema(401, 'Unauthorized', 'Unauthorized'),
    }),
  );

export const FindFilteredRoute = () =>
  applyDecorators(
    Get('filter'),
    HttpCode(HttpStatus.OK),
    Public(),
    ApiOperation({
      summary: 'Filter available products by category, size, color, brand and price range',
    }),
    ApiQuery({ name: 'category', required: false, enum: ProductCategory }),
    ApiQuery({ name: 'size', required: false, type: String, example: 'M' }),
    ApiQuery({ name: 'cor', required: false, type: String, example: 'blue' }),
    ApiQuery({ name: 'marca', required: false, type: String, example: 'Nike' }),
    ApiQuery({ name: 'precoMin', required: false, type: Number, example: 50 }),
    ApiQuery({ name: 'precoMax', required: false, type: Number, example: 500 }),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 20 }),
    ApiResponse({
      status: 200,
      description: 'Filtered paginated products.',
      schema: paginatedProductSchema,
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid query parameters.',
      schema: errorSchema(400, 'precoMin must not be less than 0', 'Bad Request'),
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized.',
      schema: errorSchema(401, 'Unauthorized', 'Unauthorized'),
    }),
  );

export const UpdateProductRoute = () =>
  applyDecorators(
    Put(':id'),
    HttpCode(HttpStatus.OK),
    UseInterceptors(FilesInterceptor('images', 10)),
    ApiOperation({ summary: 'Update product fields and/or add new images' }),
    ApiConsumes('multipart/form-data'),
    ApiParam({ name: 'id', type: Number }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          cor: { type: 'string', example: 'red' },
          marca: { type: 'string', example: 'Adidas' },
          descricao: { type: 'string', example: 'An updated description' },
          preco: { type: 'number', example: 249.99 },
          category: { type: 'string', enum: Object.values(ProductCategory), example: ProductCategory.BLUSA },
          size: { type: 'string', example: 'G' },
          images: { type: 'array', items: { type: 'string', format: 'binary' } },
        },
      },
    }),
    ApiResponse({ status: 200, description: 'Product updated.', schema: productSchema }),
    ApiResponse({
      status: 400,
      description: 'Invalid data.',
      schema: errorSchema(400, 'preco must be a positive number', 'Bad Request'),
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized.',
      schema: errorSchema(401, 'Unauthorized', 'Unauthorized'),
    }),
    ApiResponse({
      status: 404,
      description: 'Product not found.',
      schema: errorSchema(404, 'Product not found.', 'Not Found'),
    }),
  );

export const GetDashboardRoute = () =>
  applyDecorators(
    Get('dashboard'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Get dashboard summary: totals, availability counts and price aggregates',
    }),
    ApiQuery({ name: 'startDate', required: false, type: String, example: '2026-01-01' }),
    ApiQuery({ name: 'endDate', required: false, type: String, example: '2026-12-31' }),
    ApiQuery({ name: 'category', required: false, enum: ProductCategory }),
    ApiQuery({ name: 'size', required: false, type: String, example: 'M' }),
    ApiQuery({ name: 'marca', required: false, type: String, example: 'Nike' }),
    ApiQuery({ name: 'cor', required: false, type: String, example: 'blue' }),
    ApiQuery({ name: 'status', required: false, enum: ProductStatus }),
    ApiResponse({
      status: 200,
      description: 'Dashboard aggregated data.',
      schema: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 50 },
          available: { type: 'integer', example: 35 },
          sold: { type: 'integer', example: 15 },
          totalValue: { type: 'number', example: 4999.5 },
          availableValue: { type: 'number', example: 3499.5 },
          soldValue: { type: 'number', example: 1500 },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized.',
      schema: errorSchema(401, 'Unauthorized', 'Unauthorized'),
    }),
  );
