import { applyDecorators, Delete, Get, HttpCode, HttpStatus, Put } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AnyAuthenticated } from '../../../../common/decorators/any-authenticated.decorator';

const unauthorized = ApiResponse({ status: 401, description: 'Unauthorized.' });
const userNotFound = ApiResponse({ status: 404, description: 'User not found.' });

export const FavoritesTag = () =>
  applyDecorators(ApiTags('Favorites'), ApiBearerAuth(), AnyAuthenticated());

export const AddFavoriteRoute = () =>
  applyDecorators(
    Put(':productId'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({ summary: 'Add a product to the current user favorites (idempotent)' }),
    ApiParam({ name: 'productId', type: Number }),
    ApiResponse({ status: 204, description: 'Product favorited.' }),
    unauthorized,
    ApiResponse({ status: 404, description: 'Product or user not found.' }),
  );

export const RemoveFavoriteRoute = () =>
  applyDecorators(
    Delete(':productId'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({ summary: 'Remove a product from the current user favorites (idempotent)' }),
    ApiParam({ name: 'productId', type: Number }),
    ApiResponse({ status: 204, description: 'Product unfavorited.' }),
    unauthorized,
    userNotFound,
  );

export const ListFavoritesRoute = () =>
  applyDecorators(
    Get(),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'List the current user favorite products, newest first' }),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 20 }),
    ApiResponse({ status: 200, description: 'Paginated list of favorite products.' }),
    unauthorized,
    userNotFound,
  );
