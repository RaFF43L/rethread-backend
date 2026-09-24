import { AppError } from '../../../../shared/kernel/app-error';

// Business errors for the product catalog. Mapped to HTTP by the shared
// AppErrorFilter through statusCode/code, so use cases stay HTTP-agnostic.

// 404: no product matches the given identifier.
export class ProductNotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'PRODUCT_NOT_FOUND';

  constructor() {
    super('Product not found.');
  }
}

// 409: attempted to sell a product that is already sold.
export class ProductAlreadySoldError extends AppError {
  readonly statusCode = 409;
  readonly code = 'PRODUCT_ALREADY_SOLD';

  constructor() {
    super('Product is already sold.');
  }
}

// 409: attempted to revert a sale on a product that is not sold.
export class ProductNotSoldError extends AppError {
  readonly statusCode = 409;
  readonly code = 'PRODUCT_NOT_SOLD';

  constructor() {
    super('Product is not sold.');
  }
}
