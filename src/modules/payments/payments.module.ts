import { Module } from '@nestjs/common';
import { CreateCustomerUseCase } from './application/use-cases/create-customer.usecase';
import { CreatePixChargeUseCase } from './application/use-cases/create-pix-charge.usecase';
import { PAYMENT_GATEWAY } from './domain/ports/payment-gateway.port';
import { PaymentsController } from './http/payments.controller';
import { AbacatePayPaymentGateway } from './infra/gateway/abacatepay-payment-gateway.adapter';

@Module({
  controllers: [PaymentsController],
  providers: [
    CreateCustomerUseCase,
    CreatePixChargeUseCase,
    { provide: PAYMENT_GATEWAY, useClass: AbacatePayPaymentGateway },
  ],
})
export class PaymentsModule {}
