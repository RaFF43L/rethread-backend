import { applyDecorators, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnyAuthenticated } from '../../../../common/decorators/any-authenticated.decorator';

const badRequest = ApiResponse({ status: 400, description: 'Invalid payload.' });
const unauthorized = ApiResponse({ status: 401, description: 'Unauthorized.' });
const gatewayError = ApiResponse({
  status: 502,
  description: 'Payment provider rejected the request.',
});

export const PaymentsTag = () =>
  applyDecorators(ApiTags('Payments'), ApiBearerAuth(), AnyAuthenticated());

export const CreateCustomerRoute = () =>
  applyDecorators(
    Post('customers'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({ summary: 'Register a customer in the payment provider' }),
    ApiResponse({ status: 201, description: 'Customer created.' }),
    badRequest,
    unauthorized,
    gatewayError,
  );

export const CreatePixChargeRoute = () =>
  applyDecorators(
    Post('pix'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({ summary: 'Create a PIX QR code charge' }),
    ApiResponse({ status: 201, description: 'PIX charge created (brCode + QR code image).' }),
    badRequest,
    unauthorized,
    gatewayError,
  );
