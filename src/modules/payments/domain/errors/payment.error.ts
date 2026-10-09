import { AppError } from '../../../../shared/kernel/app-error';

export class PaymentGatewayError extends AppError {
  readonly statusCode = 502;
  readonly code = 'PAYMENT_GATEWAY_ERROR';
  constructor(reason: string) {
    super('Payment provider rejected the request.', { reason });
  }
}
