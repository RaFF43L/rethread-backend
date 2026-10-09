import { Inject, Injectable } from '@nestjs/common';
import {
  type IPaymentGateway,
  PAYMENT_GATEWAY,
  type PaymentCustomer,
  type PaymentCustomerInput,
} from '../../domain/ports/payment-gateway.port';

@Injectable()
export class CreateCustomerUseCase {
  constructor(
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: IPaymentGateway,
  ) {}

  execute(input: PaymentCustomerInput): Promise<PaymentCustomer> {
    return this.paymentGateway.createCustomer(input);
  }
}
